import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'
import ExcelJS from 'exceljs'
import { personaSchema } from '@/features/personas/validations/persona'
import {
  isDocumentValidationEnabled,
  createPerson,
  getDocumentInfo,
} from '@/lib/pocketbase/client'
import type { DocumentoTipo } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const liderId = formData.get('lider_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'El archivo debe ser un Excel (.xlsx o .xls)' },
        { status: 400 }
      )
    }

    // Determinar el registrado_por final
    let registradoPor = profile.id
    let liderProfile: { id: string; candidato_id?: string } = { id: profile.id, candidato_id: profile.candidato_id }

    // Si es coordinador y envía lider_id, validar que el líder pertenezca al coordinador
    if (profile.role === 'coordinador' && liderId) {
      const lider = await prisma.profile.findFirst({
        where: {
          id: liderId,
          coordinadorId: profile.id,
          role: 'lider',
        },
      })

      if (!lider) {
        return NextResponse.json(
          { error: 'El líder seleccionado no pertenece a este coordinador' },
          { status: 400 }
        )
      }

      registradoPor = lider.id
      liderProfile = { id: lider.id, candidato_id: lider.candidatoId || undefined }
    }

    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    let worksheet = workbook.getWorksheet('Personas')
    if (!worksheet) {
      if (workbook.worksheets.length > 1) {
        worksheet = workbook.worksheets[1]
      } else if (workbook.worksheets.length > 0) {
        worksheet = workbook.worksheets[0]
      } else {
        return NextResponse.json(
          { error: 'El archivo Excel no contiene hojas' },
          { status: 400 }
        )
      }
    }

    let rows: Record<string, unknown>[] = []
    const errors: Array<{ row: number; error: string }> = []

    // Helper function to format date from Excel
    const formatDate = (value: unknown): string => {
      if (!value) return ''

      if (typeof value === 'string') {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        return value
      }

      if (value instanceof Date) {
        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, '0')
        const day = String(value.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      if (typeof value === 'number') {
        const excelEpoch = new Date(1899, 11, 30)
        const date = new Date(excelEpoch.getTime() + value * 86400000)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      return ''
    }

    const useDefaultLocation = process.env.NEXT_PUBLIC_USE_DEFAULT_LOCATION === 'true'
    const defaultDepartamento = process.env.NEXT_PUBLIC_DEFAULT_DEPARTAMENTO || 'Atlántico'
    const defaultMunicipio = process.env.NEXT_PUBLIC_DEFAULT_MUNICIPIO || 'Soledad'
    const tipoDocumentoFijo = 'CC'

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      const rowData: Record<string, unknown> = {}
      row.eachCell((cell, colNumber) => {
        const header = worksheet!.getRow(1).getCell(colNumber).value?.toString() || ''
        const cellValue = cell.value

        if (header.includes('Nombres')) {
          rowData.nombres = cellValue?.toString() || ''
        }
        if (header.includes('Apellidos')) {
          rowData.apellidos = cellValue?.toString() || ''
        }
        rowData.tipo_documento = tipoDocumentoFijo

        if (header.includes('Número de Documento')) {
          rowData.numero_documento = cellValue?.toString() || ''
        }
        if (header.includes('Fecha de Nacimiento')) {
          rowData.fecha_nacimiento = formatDate(cellValue)
        }
        if (header.includes('Fecha de Expedición')) {
          rowData.fecha_expedicion = formatDate(cellValue)
        }
        if (header.includes('Profesión') || header.includes('Profesion')) {
          rowData.profesion = cellValue?.toString() || ''
        }
        if (header.includes('Número de Celular')) {
          rowData.numero_celular = cellValue?.toString() || ''
        }
        if (header.includes('Dirección')) {
          rowData.direccion = cellValue?.toString() || ''
        }
        if (header.includes('Código Barrio') || header.includes('Barrio')) {
          rowData.barrio_codigo = cellValue?.toString()?.trim() || ''
        }
        if (!useDefaultLocation) {
          if (header.includes('Departamento')) {
            rowData.departamento = cellValue?.toString() || ''
          }
          if (header.includes('Municipio')) {
            rowData.municipio = cellValue?.toString() || ''
          }
        }
        if (header.includes('Código Puesto') || header.includes('Puesto de Votación')) {
          rowData.puesto_codigo = cellValue?.toString()?.trim() || ''
        }
        if (header.includes('Mesa de Votación')) {
          rowData.mesa_votacion = cellValue?.toString() || ''
        }
      })

      rowData.tipo_documento = tipoDocumentoFijo
      if (useDefaultLocation) {
        rowData.departamento = defaultDepartamento
        rowData.municipio = defaultMunicipio
      }

      // Validación manual más detallada antes de Zod
      const validationErrors: string[] = []
      
      // Validar campos obligatorios
      if (!rowData.nombres || (typeof rowData.nombres === 'string' && rowData.nombres.trim() === '')) {
        validationErrors.push('Campo "Nombres" es obligatorio')
      }
      if (!rowData.apellidos || (typeof rowData.apellidos === 'string' && rowData.apellidos.trim() === '')) {
        validationErrors.push('Campo "Apellidos" es obligatorio')
      }
      if (!rowData.numero_documento || (typeof rowData.numero_documento === 'string' && rowData.numero_documento.trim() === '')) {
        validationErrors.push('Campo "Número de Documento" es obligatorio')
      }
      
      // Validar formato de fechas si están presentes
      const fechaNacStr = rowData.fecha_nacimiento as string | undefined
      if (fechaNacStr && fechaNacStr.trim() !== '') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacStr.trim())) {
          validationErrors.push(`Campo "Fecha de Nacimiento" tiene formato inválido: "${fechaNacStr}" (debe ser YYYY-MM-DD)`)
        } else {
          const date = new Date(fechaNacStr)
          if (isNaN(date.getTime())) {
            validationErrors.push(`Campo "Fecha de Nacimiento" es una fecha inválida: "${fechaNacStr}"`)
          }
        }
      }
      
      const fechaExpStr = rowData.fecha_expedicion as string | undefined
      if (fechaExpStr && fechaExpStr.trim() !== '') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaExpStr.trim())) {
          validationErrors.push(`Campo "Fecha de Expedición" tiene formato inválido: "${fechaExpStr}" (debe ser YYYY-MM-DD)`)
        } else {
          const date = new Date(fechaExpStr)
          if (isNaN(date.getTime())) {
            validationErrors.push(`Campo "Fecha de Expedición" es una fecha inválida: "${fechaExpStr}"`)
          }
        }
      }
      
      // Validar fecha de expedición requerida
      const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'
      if (fechaExpedicionRequired && (!fechaExpStr || fechaExpStr.trim() === '')) {
        validationErrors.push('Campo "Fecha de Expedición" es obligatorio')
      }
      
      // Si hay errores de validación manual, agregar y continuar
      if (validationErrors.length > 0) {
        errors.push({
          row: rowNumber,
          error: validationErrors.join(' | '),
        })
        return
      }

      try {
        personaSchema.parse(rowData)
        rows.push(rowData)
      } catch (error: unknown) {
        let errorMessage = 'Datos inválidos'
        if (error && typeof error === 'object' && 'errors' in error) {
          const zodError = error as { errors: Array<{ path: (string | number)[]; message: string }> }
          const errorMessages = zodError.errors.map((e) => {
            const fieldPath = e.path.join('.')
            const fieldNames: Record<string, string> = {
              'nombres': 'Nombres',
              'apellidos': 'Apellidos',
              'tipo_documento': 'Tipo de Documento',
              'numero_documento': 'Número de Documento',
              'fecha_nacimiento': 'Fecha de Nacimiento',
              'fecha_expedicion': 'Fecha de Expedición',
              'profesion': 'Profesión',
              'numero_celular': 'Número de Celular',
              'direccion': 'Dirección',
              'departamento': 'Departamento',
              'municipio': 'Municipio',
              'barrio_id': 'Barrio',
              'puesto_votacion_id': 'Puesto de Votación',
              'mesa_votacion': 'Mesa de Votación',
            }
            const fieldName = fieldNames[fieldPath] || fieldPath
            return `Campo "${fieldName}": ${e.message}`
          })
          errorMessage = errorMessages.join(' | ')
        }
        errors.push({ row: rowNumber, error: errorMessage })
      }
    })

    // Check for duplicate documentos in file
    const documentosInFile = rows.map((r) => r.numero_documento as string)
    const duplicatesInFile = new Set<string>()
    const seenInFile = new Map<string, number>()

    rows.forEach((r, index) => {
      const rowNumber = index + 2
      const doc = r.numero_documento as string
      if (seenInFile.has(doc)) {
        duplicatesInFile.add(doc)
      } else {
        seenInFile.set(doc, rowNumber)
      }
    })

    if (duplicatesInFile.size > 0) {
      const duplicateRows: Array<{
        row: number
        numero_documento: string
        primeraAparicion: number
      }> = []
      rows.forEach((r, index) => {
        const rowNumber = index + 2
        const doc = r.numero_documento as string
        if (duplicatesInFile.has(doc)) {
          const primeraAparicion = seenInFile.get(doc)!
          duplicateRows.push({ row: rowNumber, numero_documento: doc, primeraAparicion })
        }
      })

      duplicateRows.forEach((dup) => {
        errors.push({
          row: dup.row,
          error: `Número de documento "${dup.numero_documento}" duplicado en el archivo (primera aparición en fila ${dup.primeraAparicion})`,
        })
      })

      const duplicateRowsSet = new Set(duplicateRows.map((d) => d.row))
      rows = rows.filter((_, index) => {
        const rowNumber = index + 2
        const doc = rows[index].numero_documento as string
        return !duplicateRowsSet.has(rowNumber) || seenInFile.get(doc) === rowNumber
      })
    }

    // Check for duplicates in database
    const numerosDocumento = [...new Set(rows.map((r) => r.numero_documento as string))]

    const existingPersonas = await prisma.persona.findMany({
      where: { numeroDocumento: { in: numerosDocumento } },
      select: {
        id: true,
        tipoDocumento: true,
        numeroDocumento: true,
        registradoPorId: true,
      },
    })

    const duplicateErrors: Array<{ row: number; error: string }> = []
    const currentLiderId = registradoPor
    const isAdmin = profile.role === 'admin'

    rows.forEach((row, index) => {
      const rowNumber = index + 2
      const existingPersona = existingPersonas.find(
        (p) =>
          p.tipoDocumento === row.tipo_documento &&
          p.numeroDocumento === row.numero_documento
      )

      if (existingPersona) {
        if (!isAdmin && existingPersona.registradoPorId !== currentLiderId) {
          duplicateErrors.push({
            row: rowNumber,
            error: `Ya existe una persona con tipo de documento "${row.tipo_documento}" y número "${row.numero_documento}" registrada por otro líder`,
          })
        }
      }
    })

    if (duplicateErrors.length > 0) {
      errors.push(...duplicateErrors)
      const duplicateRowsSet = new Set(duplicateErrors.map((e) => e.row))
      rows = rows.filter((_, index) => !duplicateRowsSet.has(index + 2))
    }

    const existingDocumentosMap = new Map(
      existingPersonas.map((p) => [
        `${p.tipoDocumento}-${p.numeroDocumento}`,
        { id: p.id, registrado_por: p.registradoPorId },
      ])
    )

    // Obtener mapeo de códigos a IDs para barrios y puestos
    const [barriosData, puestosData] = await Promise.all([
      prisma.barrio.findMany({ select: { id: true, codigo: true } }),
      prisma.puestoVotacion.findMany({ select: { id: true, codigo: true } }),
    ])

    const barriosMap = new Map(barriosData.map((b) => [b.codigo, b.id]))
    const puestosMap = new Map(puestosData.map((p) => [p.codigo, p.id]))

    // Validar y convertir códigos a IDs
    rows.forEach((row, index) => {
      const rowNumber = index + 2
      const barrioCodigo = row.barrio_codigo as string | undefined

      if (barrioCodigo && barrioCodigo.trim() !== '') {
        const barrioId = barriosMap.get(barrioCodigo.trim())
        if (!barrioId) {
          errors.push({
            row: rowNumber,
            error: `Código de barrio "${barrioCodigo}" no existe.`,
          })
        } else {
          row.barrio_id = barrioId
        }
      }
      delete row.barrio_codigo

      const puestoCodigo = row.puesto_codigo as string | undefined
      if (puestoCodigo && puestoCodigo.trim() !== '') {
        const puestoId = puestosMap.get(puestoCodigo.trim())
        if (!puestoId) {
          errors.push({
            row: rowNumber,
            error: `Código de puesto de votación "${puestoCodigo}" no existe.`,
          })
        } else {
          row.puesto_votacion_id = puestoId
        }
      }
      delete row.puesto_codigo
    })

    // Remover filas con errores de códigos
    const codigoErrorRows = new Set(
      errors.filter((e) => e.error.includes('Código')).map((e) => e.row)
    )
    rows = rows.filter((_, index) => !codigoErrorRows.has(index + 2))

    // Separate rows into new and existing
    const newRows = rows.filter((r) => {
      const key = `${r.tipo_documento}-${r.numero_documento}`
      return !existingDocumentosMap.has(key)
    })

    const existingRows = rows.filter((r) => {
      const key = `${r.tipo_documento}-${r.numero_documento}`
      const existing = existingDocumentosMap.get(key)
      return existing && (isAdmin || existing.registrado_por === currentLiderId)
    })

    // Validar en PocketBase para filas nuevas si está habilitado
    let finalNewRows = newRows
    if (isDocumentValidationEnabled() && newRows.length > 0) {
      const pocketBaseErrors: Array<{ row: number; error: string }> = []
      const validNewRows: typeof newRows = []

      for (const row of newRows) {
        const rowNumber =
          rows.findIndex(
            (r) =>
              r.tipo_documento === row.tipo_documento &&
              r.numero_documento === row.numero_documento
          ) + 2

        const documentInfo = await getDocumentInfo(row.numero_documento as string)
        if (documentInfo) {
          let errorMessage = `Ya existe una persona con número de documento "${row.numero_documento}" en el sistema externo`
          if (documentInfo.place) {
            errorMessage += ` registrado en el representante "${documentInfo.place}"`
          }

          pocketBaseErrors.push({ row: rowNumber, error: errorMessage })
        } else {
          validNewRows.push(row)
        }
      }

      if (pocketBaseErrors.length > 0) {
        errors.push(...pocketBaseErrors)
      }

      finalNewRows = validNewRows
    }

    // Check which existing personas have confirmations
    const existingPersonaIds = existingRows
      .map((r) => {
        const key = `${r.tipo_documento}-${r.numero_documento}`
        return existingDocumentosMap.get(key)?.id
      })
      .filter((id): id is string => id !== undefined)

    const confirmaciones =
      existingPersonaIds.length > 0
        ? await prisma.votoConfirmacion.findMany({
            where: {
              personaId: { in: existingPersonaIds },
              reversado: false,
            },
            select: { personaId: true },
          })
        : []

    const personasConConfirmacion = new Set(confirmaciones.map((c) => c.personaId))

    const rowsToUpdate = existingRows.filter((r) => {
      const key = `${r.tipo_documento}-${r.numero_documento}`
      const personaId = existingDocumentosMap.get(key)?.id
      return personaId && !personasConConfirmacion.has(personaId)
    })

    const rowsToSkip = existingRows.filter((r) => {
      const key = `${r.tipo_documento}-${r.numero_documento}`
      const personaId = existingDocumentosMap.get(key)?.id
      return personaId && personasConConfirmacion.has(personaId)
    })

    // Create importacion record
    const importacion = await prisma.importacion.create({
      data: {
        usuarioId: profile.id,
        totalRegistros: finalNewRows.length + existingRows.length,
        registrosExitosos: 0,
        registrosFallidos: errors.length + rowsToSkip.length,
        archivoNombre: file.name,
        errores: errors.length > 0 ? errors : undefined,
      },
    })

    let insertCount = 0
    let updateCount = 0
    const insertErrors: Array<{ row: number; numero_documento: string; error: string }> = []
    const updateErrors: Array<{ row: number | string; numero_documento: string; error: string }> =
      []

    // Obtener nombre completo del candidato para PocketBase
    let candidatoNombre: string | null = null
    if (isDocumentValidationEnabled() && liderProfile.candidato_id) {
      const candidato = await prisma.candidato.findUnique({
        where: { id: liderProfile.candidato_id },
        select: { nombreCompleto: true },
      })
      candidatoNombre = candidato?.nombreCompleto || null
    }

    // Insert new personas
    if (finalNewRows.length > 0) {
      for (let i = 0; i < finalNewRows.length; i++) {
        const row = finalNewRows[i]
        const originalRowIndex = rows.findIndex(
          (r) =>
            r.tipo_documento === row.tipo_documento &&
            r.numero_documento === row.numero_documento
        )

        // Ensure dates are in correct format
        let fechaNacimiento = null
        const fechaNacStr = row.fecha_nacimiento as string | undefined
        if (fechaNacStr && fechaNacStr.trim()) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNacStr.trim())) {
            fechaNacimiento = new Date(fechaNacStr)
          }
        }

        let fechaExpedicion = null
        const fechaExpStr = row.fecha_expedicion as string | undefined
        if (fechaExpStr && fechaExpStr.trim()) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(fechaExpStr.trim())) {
            fechaExpedicion = new Date(fechaExpStr)
          }
        }

        try {
          await prisma.persona.create({
            data: {
              nombres: row.nombres as string,
              apellidos: row.apellidos as string,
              tipoDocumento: row.tipo_documento as DocumentoTipo,
              numeroDocumento: row.numero_documento as string,
              fechaNacimiento,
              fechaExpedicion,
              profesion: (row.profesion as string) || null,
              numeroCelular: (row.numero_celular as string) || null,
              direccion: (row.direccion as string) || null,
              barrioId: (row.barrio_id as number) || null,
              departamento: (row.departamento as string) || null,
              municipio: (row.municipio as string) || null,
              puestoVotacionId: (row.puesto_votacion_id as number) || null,
              mesaVotacion: (row.mesa_votacion as string) || null,
              registradoPorId: registradoPor,
              esImportado: true,
              importacionId: importacion.id,
            },
          })

          insertCount++

          // Sincronizar con PocketBase si está habilitado
          if (isDocumentValidationEnabled()) {
            await createPerson({
              document_number: row.numero_documento as string,
              place: candidatoNombre,
              leader_id: registradoPor,
            })
          }
        } catch (error) {
          insertErrors.push({
            row: originalRowIndex + 2,
            numero_documento: row.numero_documento as string,
            error:
              error instanceof Error
                ? error.message
                : 'Error al insertar',
          })
        }
      }
    }

    // Update existing personas
    if (rowsToUpdate.length > 0) {
      for (const row of rowsToUpdate) {
        const key = `${row.tipo_documento}-${row.numero_documento}`
        const personaId = existingDocumentosMap.get(key)?.id
        if (!personaId) continue

        try {
          await prisma.persona.update({
            where: { id: personaId },
            data: {
              barrioId: (row.barrio_id as number) || null,
              puestoVotacionId: (row.puesto_votacion_id as number) || null,
              mesaVotacion: (row.mesa_votacion as string) || null,
              departamento: (row.departamento as string) || null,
              municipio: (row.municipio as string) || null,
            },
          })
          updateCount++
        } catch (error) {
          const originalRowIndex = rows.findIndex(
            (r) =>
              r.tipo_documento === row.tipo_documento &&
              r.numero_documento === row.numero_documento
          )

          updateErrors.push({
            row: originalRowIndex >= 0 ? originalRowIndex + 2 : 'N/A',
            numero_documento: row.numero_documento as string,
            error: error instanceof Error ? error.message : 'Error al actualizar',
          })
        }
      }
    }

    // Update importacion with success count
    const totalExitosos = insertCount + updateCount
    const totalFallidos =
      errors.length + rowsToSkip.length + insertErrors.length + updateErrors.length

    await prisma.importacion.update({
      where: { id: importacion.id },
      data: {
        registrosExitosos: totalExitosos,
        registrosFallidos: totalFallidos,
        errores:
          errors.length > 0 || insertErrors.length > 0 || updateErrors.length > 0
            ? [...errors, ...insertErrors, ...updateErrors]
            : undefined,
      },
    })

    const erroresDetallados = [
      ...errors.map((e) => ({ ...e, tipo: 'validación' })),
      ...insertErrors.map((e) => ({ ...e, tipo: 'inserción' })),
      ...updateErrors.map((e) => ({ ...e, tipo: 'actualización' })),
    ]

    const documentosOmitidos = rowsToSkip.map((r) => r.numero_documento as string)

    return NextResponse.json({
      registros_exitosos: totalExitosos,
      registros_actualizados: updateCount,
      registros_creados: insertCount,
      registros_omitidos: rowsToSkip.length,
      documentos_omitidos: documentosOmitidos,
      registros_fallidos: totalFallidos,
      errores: erroresDetallados.length > 0 ? erroresDetallados : undefined,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
