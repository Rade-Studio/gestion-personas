import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'
import ExcelJS from 'exceljs'
import { personaSchema } from '@/features/personas/validations/persona'
import {
  isDocumentValidationEnabled,
  checkDocumentExists,
  createPerson,
  getDocumentInfo,
} from '@/lib/pocketbase/client'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()
    const supabase = await createClient()

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      )
    }

    // Validate file type
    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls')
    ) {
      return NextResponse.json(
        { error: 'El archivo debe ser un Excel (.xlsx o .xls)' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    // Buscar la hoja "Personas" (segunda hoja)
    let worksheet = workbook.getWorksheet('Personas')
    if (!worksheet) {
      // Si no existe la hoja "Personas", intentar con la segunda hoja
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

    let rows: any[] = []
    const errors: Array<{ row: number; error: string }> = []

    // Helper function to format date from Excel
    const formatDate = (value: any): string => {
      if (!value) return ''
      
      // If it's already a string, try to parse it
      if (typeof value === 'string') {
        // Try to parse common date formats
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        return value
      }
      
      // If it's a Date object
      if (value instanceof Date) {
        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, '0')
        const day = String(value.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      // If it's a number (Excel date serial number)
      if (typeof value === 'number') {
        // Excel dates are serial numbers where 1 = January 1, 1900
        const excelEpoch = new Date(1899, 11, 30) // December 30, 1899
        const date = new Date(excelEpoch.getTime() + value * 86400000)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      return ''
    }

    // Helper function to normalize tipo_documento
    const normalizeTipoDocumento = (value: string): string => {
      if (!value) return 'CC'
      const normalized = value.trim()
      // Normalizar variaciones comunes
      const tipoMap: Record<string, string> = {
        'CC': 'CC',
        'C.C': 'CC',
        'C.C.': 'CC',
        'Cedula': 'CC',
        'Cédula': 'CC',
        'Cedula de Ciudadania': 'CC',
        'Cédula de Ciudadanía': 'CC',
        'CE': 'CE',
        'C.E': 'CE',
        'C.E.': 'CE',
        'Cedula de Extranjeria': 'CE',
        'Cédula de Extranjería': 'CE',
        'Pasaporte': 'Pasaporte',
        'TI': 'TI',
        'T.I': 'TI',
        'T.I.': 'TI',
        'Tarjeta de Identidad': 'TI',
        'Otro': 'Otro',
      }
      return tipoMap[normalized] || normalized
    }

    // Skip header row (row 1) and process data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header

      const rowData: any = {}
      row.eachCell((cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value?.toString() || ''
        const cellValue = cell.value
        
        // Map headers to fields
        if (header.includes('Nombres')) {
          rowData.nombres = cellValue?.toString() || ''
        }
        if (header.includes('Apellidos')) {
          rowData.apellidos = cellValue?.toString() || ''
        }
        if (header.includes('Tipo de Documento')) {
          const tipoDoc = cellValue?.toString() || 'CC'
          rowData.tipo_documento = normalizeTipoDocumento(tipoDoc)
        }
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
        if (header.includes('Departamento')) {
          rowData.departamento = cellValue?.toString() || ''
        }
        if (header.includes('Municipio')) {
          rowData.municipio = cellValue?.toString() || ''
        }
        if (header.includes('Código Puesto') || header.includes('Puesto de Votación')) {
          rowData.puesto_codigo = cellValue?.toString()?.trim() || ''
        }
        if (header.includes('Mesa de Votación')) {
          rowData.mesa_votacion = cellValue?.toString() || ''
        }
      })

      // Validate row data
      try {
        personaSchema.parse(rowData)
        
        // Validar fecha_expedicion si es requerida
        const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'
        if (fechaExpedicionRequired && (!rowData.fecha_expedicion || rowData.fecha_expedicion.trim() === '')) {
          errors.push({
            row: rowNumber,
            error: 'La fecha de expedición es obligatoria',
          })
          return // Skip this row
        }
        
        rows.push(rowData)
      } catch (error: any) {
        // Mejorar mensajes de error de validación
        let errorMessage = 'Datos inválidos'
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((e: any) => {
            // Mensajes más descriptivos
            if (e.path && e.path.includes('tipo_documento')) {
              return `Tipo de documento inválido: "${rowData.tipo_documento || 'vacío'}". Debe ser: CC, CE, Pasaporte, TI u Otro`
            }
            if (e.path && e.path.includes('fecha_nacimiento')) {
              return `Fecha de nacimiento inválida: "${rowData.fecha_nacimiento || 'vacío'}". Debe estar en formato YYYY-MM-DD y ser una fecha válida no futura`
            }
            if (e.path && e.path.includes('fecha_expedicion')) {
              return `Fecha de expedición inválida: "${rowData.fecha_expedicion || 'vacío'}". Debe estar en formato YYYY-MM-DD y ser una fecha válida no futura`
            }
            if (e.path && e.path.includes('nombres')) {
              return 'Los nombres son obligatorios'
            }
            if (e.path && e.path.includes('apellidos')) {
              return 'Los apellidos son obligatorios'
            }
            if (e.path && e.path.includes('numero_documento')) {
              return 'El número de documento es obligatorio'
            }
            return e.message || 'Campo inválido'
          })
          errorMessage = errorMessages.join('. ')
        }
        errors.push({
          row: rowNumber,
          error: errorMessage,
        })
      }
    })

    // Check for duplicate documentos in file (solo numero_documento porque la BD tiene restricción única en ese campo)
    const documentosInFile = rows.map((r) => r.numero_documento)
    const duplicatesInFile = new Set<string>()
    const seenInFile = new Map<string, number>() // numero_documento -> primera fila donde aparece
    
    rows.forEach((r, index) => {
      const rowNumber = index + 2 // +2 porque index es 0-based y rowNumber es 1-based + header
      if (seenInFile.has(r.numero_documento)) {
        duplicatesInFile.add(r.numero_documento)
      } else {
        seenInFile.set(r.numero_documento, rowNumber)
      }
    })
    
    if (duplicatesInFile.size > 0) {
      const duplicateRows: Array<{ row: number; numero_documento: string; primeraAparicion: number }> = []
      rows.forEach((r, index) => {
        const rowNumber = index + 2
        if (duplicatesInFile.has(r.numero_documento)) {
          const primeraAparicion = seenInFile.get(r.numero_documento)!
          duplicateRows.push({
            row: rowNumber,
            numero_documento: r.numero_documento,
            primeraAparicion: primeraAparicion
          })
        }
      })
      
      // Agregar estos errores a la lista de errores en lugar de retornar inmediatamente
      duplicateRows.forEach((dup) => {
        errors.push({
          row: dup.row,
          error: `Número de documento "${dup.numero_documento}" duplicado en el archivo (primera aparición en fila ${dup.primeraAparicion})`,
        })
      })
      
      // Remover las filas duplicadas (mantener solo la primera aparición)
      const duplicateRowsSet = new Set(duplicateRows.map(d => d.row))
      rows = rows.filter((_, index) => {
        const rowNumber = index + 2
        return !duplicateRowsSet.has(rowNumber) || seenInFile.get(rows[index].numero_documento) === rowNumber
      })
    }

    // Check for duplicates in database
    // Validar considerando tipo_documento + numero_documento + registrado_por
    // Si es del mismo líder → actualizar, si es de otro líder → error
    const numerosDocumento = [...new Set(rows.map((r) => r.numero_documento))]
    
    // Obtener todas las personas que coinciden con alguno de los números de documento a importar
    const { data: existingPersonas, error: existingError } = await supabase
      .from('personas')
      .select('id, tipo_documento, numero_documento, registrado_por')
      .in('numero_documento', numerosDocumento)
    
    if (existingError) {
      return NextResponse.json(
        { error: 'Error al verificar duplicados en la base de datos' },
        { status: 500 }
      )
    }

    // Verificar duplicados considerando tipo_documento + numero_documento + registrado_por
    // Los admins pueden actualizar cualquier persona, los líderes solo las suyas
    const duplicateErrors: Array<{ row: number; error: string }> = []
    const currentLiderId = profile.id
    const isAdmin = profile.role === 'admin'
    
    rows.forEach((row, index) => {
      const rowNumber = index + 2 // +2 porque index es 0-based y rowNumber es 1-based + header
      // Buscar si existe una persona con el mismo tipo_documento + numero_documento
      const existingPersona = existingPersonas?.find(
        (p) => p.tipo_documento === row.tipo_documento &&
               p.numero_documento === row.numero_documento
      )
      
      if (existingPersona) {
        // Si es admin, puede actualizar cualquier persona (no hay error)
        // Si es líder y la persona es de otro líder → error
        if (!isAdmin && existingPersona.registrado_por !== currentLiderId) {
          duplicateErrors.push({
            row: rowNumber,
            error: `Ya existe una persona con tipo de documento "${row.tipo_documento}" y número "${row.numero_documento}" registrada por otro líder`,
          })
        }
        // Si existe y es del mismo líder o es admin → se actualizará más adelante (no hacer nada aquí)
      }
    })
    
    // Si hay errores de duplicados, agregarlos a la lista de errores
    if (duplicateErrors.length > 0) {
      errors.push(...duplicateErrors)
      // Remover las filas con errores de duplicados de la lista de filas válidas
      const duplicateRowsSet = new Set(duplicateErrors.map(e => e.row))
      rows = rows.filter((_, index) => !duplicateRowsSet.has(index + 2))
    }
    
    // Crear un mapa usando tipo_documento + numero_documento como clave
    const existingDocumentosMap = new Map(
      existingPersonas?.map((p) => [`${p.tipo_documento}-${p.numero_documento}`, { id: p.id, registrado_por: p.registrado_por, tipo_documento: p.tipo_documento, numero_documento: p.numero_documento }]) || []
    )

    // Obtener mapeo de códigos a IDs para barrios y puestos
    const { data: barriosData } = await supabase
      .from('barrios')
      .select('id, codigo')
    
    const { data: puestosData } = await supabase
      .from('puestos_votacion')
      .select('id, codigo')
    
    const barriosMap = new Map(barriosData?.map(b => [b.codigo, b.id]) || [])
    const puestosMap = new Map(puestosData?.map(p => [p.codigo, p.id]) || [])

    // Validar y convertir códigos a IDs
    rows.forEach((row, index) => {
      const rowNumber = index + 2
      
      // Validar código de barrio
      if (row.barrio_codigo && row.barrio_codigo.trim() !== '') {
        const barrioId = barriosMap.get(row.barrio_codigo.trim())
        if (!barrioId) {
          errors.push({
            row: rowNumber,
            error: `Código de barrio "${row.barrio_codigo}" no existe. Debe usar un código válido de la hoja de instrucciones.`,
          })
        } else {
          row.barrio_id = barrioId
        }
      }
      delete row.barrio_codigo
      
      // Validar código de puesto de votación
      if (row.puesto_codigo && row.puesto_codigo.trim() !== '') {
        const puestoId = puestosMap.get(row.puesto_codigo.trim())
        if (!puestoId) {
          errors.push({
            row: rowNumber,
            error: `Código de puesto de votación "${row.puesto_codigo}" no existe. Debe usar un código válido de la hoja de instrucciones.`,
          })
        } else {
          row.puesto_votacion_id = puestoId
        }
      }
      delete row.puesto_codigo
    })

    // Remover filas con errores de códigos
    const codigoErrorRows = new Set(errors.filter(e => e.error.includes('Código')).map(e => e.row))
    rows = rows.filter((_, index) => !codigoErrorRows.has(index + 2))

    // Separate rows into new and existing
    // Nueva: no existe en la BD
    // Existente: existe con el mismo tipo_documento + numero_documento
    //   - Si es admin: puede actualizar cualquier persona existente
    //   - Si es líder: solo puede actualizar las que registró él mismo
    const newRows = rows.filter((r) => {
      const key = `${r.tipo_documento}-${r.numero_documento}`
      const existing = existingDocumentosMap.get(key)
      // Es nueva si no existe
      return !existing
    })
    
    const existingRows = rows.filter((r) => {
      const key = `${r.tipo_documento}-${r.numero_documento}`
      const existing = existingDocumentosMap.get(key)
      // Existe si está en el mapa
      // Si es admin, puede actualizar cualquier persona existente
      // Si es líder, solo puede actualizar las que registró él mismo
      return existing && (isAdmin || existing.registrado_por === currentLiderId)
    })

    // Validar en PocketBase para filas nuevas si está habilitado
    let finalNewRows = newRows
    if (isDocumentValidationEnabled() && newRows.length > 0) {
      const pocketBaseErrors: Array<{ row: number; error: string }> = []
      const validNewRows: typeof newRows = []

      for (const row of newRows) {
        const rowNumber = rows.findIndex(
          (r) =>
            r.tipo_documento === row.tipo_documento &&
            r.numero_documento === row.numero_documento
        ) + 2

        const documentInfo = await getDocumentInfo(row.numero_documento)
        if (documentInfo) {
          // Construir mensaje de error con información del representante
          let errorMessage = `Ya existe una persona con número de documento "${row.numero_documento}" en el sistema externo`
          if (documentInfo.place) {
            errorMessage += ` registrado en el representante "${documentInfo.place}"`
          } else {
            errorMessage += ` (sin representante asignado)`
          }

          pocketBaseErrors.push({
            row: rowNumber,
            error: errorMessage,
          })
        } else {
          validNewRows.push(row)
        }
      }

      // Agregar errores de PocketBase a la lista de errores
      if (pocketBaseErrors.length > 0) {
        errors.push(...pocketBaseErrors)
      }

      // Usar solo las filas válidas para insertar
      finalNewRows = validNewRows
    }

    // Check which existing personas have confirmations
    const existingPersonaIds = existingRows
      .map((r) => {
        const key = `${r.tipo_documento}-${r.numero_documento}`
        const existing = existingDocumentosMap.get(key)
        return existing?.id
      })
      .filter((id): id is string => id !== undefined)
    
    const { data: confirmaciones } = await supabase
      .from('voto_confirmaciones')
      .select('persona_id')
      .in('persona_id', existingPersonaIds.length > 0 ? existingPersonaIds : [''])
      .eq('reversado', false)

    const personasConConfirmacion = new Set(
      confirmaciones?.map((c) => c.persona_id) || []
    )

    // Filter existing rows: only update those without confirmation
    const rowsToUpdate = existingRows.filter((r) => {
      const key = `${r.tipo_documento}-${r.numero_documento}`
      const existing = existingDocumentosMap.get(key)
      const personaId = existing?.id
      return personaId && !personasConConfirmacion.has(personaId)
    })

    const rowsToSkip = existingRows.filter((r) => {
      const key = `${r.tipo_documento}-${r.numero_documento}`
      const existing = existingDocumentosMap.get(key)
      const personaId = existing?.id
      return personaId && personasConConfirmacion.has(personaId)
    })

    // NO retornar error aquí - permitir que el proceso continúe normalmente
    // Si hay filas existentes del mismo líder sin confirmación, estarán en rowsToUpdate y se actualizarán
    // Si todas tienen confirmación, estarán en rowsToSkip y se mostrará en el resultado final
    // El proceso continuará normalmente y retornará el resultado apropiado al final

    // Create importacion record
    const { data: importacion, error: importacionError } = await supabase
      .from('importaciones')
      .insert({
        usuario_id: profile.id,
        total_registros: finalNewRows.length + existingRows.length,
        registros_exitosos: 0,
        registros_fallidos: errors.length + rowsToSkip.length,
        archivo_nombre: file.name,
        errores: errors.length > 0 ? errors : null,
      })
      .select()
      .single()

    if (importacionError) {
      return NextResponse.json(
        { error: 'Error al crear registro de importación' },
        { status: 500 }
      )
    }

    let insertCount = 0
    let updateCount = 0
    let insertErrors: any[] = []
    let updateErrors: any[] = []

    // Obtener nombre completo del candidato para PocketBase
    let candidatoNombre: string | null = null
    if (isDocumentValidationEnabled() && profile.candidato_id) {
      const { data: candidato } = await supabase
        .from('candidatos')
        .select('nombre_completo')
        .eq('id', profile.candidato_id)
        .single()
      candidatoNombre = candidato?.nombre_completo || null
    }

    // Insert new personas
    if (finalNewRows.length > 0) {
      const personasToInsert = finalNewRows.map((row) => {
        // Ensure fecha_nacimiento is in correct format (YYYY-MM-DD) or null
        let fechaNacimiento = null
        if (row.fecha_nacimiento && row.fecha_nacimiento.trim()) {
          // Validate and format date string
          const dateStr = row.fecha_nacimiento.trim()
          // Check if it's already in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            fechaNacimiento = dateStr
          } else {
            // Try to parse and reformat
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              fechaNacimiento = `${year}-${month}-${day}`
            }
          }
        }

        // Ensure fecha_expedicion is in correct format (YYYY-MM-DD) or null
        let fechaExpedicion = null
        if (row.fecha_expedicion && row.fecha_expedicion.trim()) {
          // Validate and format date string
          const dateStr = row.fecha_expedicion.trim()
          // Check if it's already in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            fechaExpedicion = dateStr
          } else {
            // Try to parse and reformat
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              fechaExpedicion = `${year}-${month}-${day}`
            }
          }
        }
        
        return {
          nombres: row.nombres,
          apellidos: row.apellidos,
          tipo_documento: row.tipo_documento,
          numero_documento: row.numero_documento,
          fecha_nacimiento: fechaNacimiento,
          fecha_expedicion: fechaExpedicion,
          profesion: row.profesion || null,
          numero_celular: row.numero_celular || null,
          direccion: row.direccion || null,
          barrio_id: row.barrio_id || null,
          departamento: row.departamento || null,
          municipio: row.municipio || null,
          puesto_votacion_id: row.puesto_votacion_id || null,
          mesa_votacion: row.mesa_votacion || null,
          registrado_por: profile.id,
          es_importado: true,
          importacion_id: importacion.id,
        }
      })

      // Insertar en lotes para mejor manejo de errores
      const batchSize = 100
      for (let i = 0; i < personasToInsert.length; i += batchSize) {
        const batch = personasToInsert.slice(i, i + batchSize)
        const { error: insertError, data: insertedData } = await supabase
          .from('personas')
          .insert(batch)
          .select('id, numero_documento, tipo_documento')

        if (insertError) {
          // Si hay error de clave duplicada, intentar insertar uno por uno para identificar el problema exacto
          if (insertError.code === '23505' || insertError.message.includes('duplicate key') || insertError.message.includes('unique constraint')) {
            // Error de clave única violada - insertar uno por uno para identificar exactamente qué fila causa el problema
            for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
              const persona = batch[batchIndex]
              const originalRowIndex = i + batchIndex
              const originalRow = finalNewRows[originalRowIndex]
              
              // Intentar insertar individualmente para identificar el problema exacto
              const { error: singleError } = await supabase
                .from('personas')
                .insert([persona])
              
              if (singleError) {
                let errorMessage = `Ya existe una persona con número de documento "${persona.numero_documento}" en la base de datos`
                if (singleError.message && !singleError.message.includes('duplicate') && !singleError.message.includes('unique')) {
                  errorMessage = `Error al insertar: ${singleError.message}`
                }
                insertErrors.push({
                  row: originalRowIndex + 2, // +2 para compensar header y 0-based index
                  numero_documento: originalRow?.numero_documento || persona.numero_documento,
                  error: errorMessage,
                })
              } else {
                insertCount++
                // Sincronizar con PocketBase si está habilitado
                if (isDocumentValidationEnabled()) {
                  await createPerson({
                    document_number: persona.numero_documento,
                    place: candidatoNombre,
                    leader_id: profile.id,
                  })
                }
              }
            }
          } else {
            // Otro tipo de error - agregar error para todo el lote
            batch.forEach((persona, batchIndex) => {
              const originalRowIndex = i + batchIndex
              const originalRow = finalNewRows[originalRowIndex]
              if (originalRow) {
                insertErrors.push({
                  row: originalRowIndex + 2,
                  numero_documento: originalRow.numero_documento,
                  error: `Error al insertar: ${insertError.message || 'Error desconocido'}`,
                })
              }
            })
          }
        } else {
          insertCount += batch.length
          // Sincronizar con PocketBase si está habilitado
          if (isDocumentValidationEnabled() && insertedData) {
            for (const inserted of insertedData) {
              await createPerson({
                document_number: inserted.numero_documento,
                place: candidatoNombre,
                leader_id: profile.id,
              })
            }
          }
        }
      }
    }

    // Update existing personas (puesto_votacion, mesa_votacion, departamento, municipio, and only if no confirmation)
    if (rowsToUpdate.length > 0) {
      for (const row of rowsToUpdate) {
        const key = `${row.tipo_documento}-${row.numero_documento}`
        const existing = existingDocumentosMap.get(key)
        const personaId = existing?.id
        if (!personaId) continue

        const { error: updateError } = await supabase
          .from('personas')
          .update({
            barrio_id: row.barrio_id || null,
            puesto_votacion_id: row.puesto_votacion_id || null,
            mesa_votacion: row.mesa_votacion || null,
            departamento: row.departamento || null,
            municipio: row.municipio || null,
          })
          .eq('id', personaId)

        if (updateError) {
          let errorMessage = updateError.message
          if (updateError.code === '23505' || updateError.message.includes('duplicate key') || updateError.message.includes('unique constraint')) {
            errorMessage = `Ya existe una persona con número de documento "${row.numero_documento}" en la base de datos`
          } else if (updateError.message) {
            errorMessage = `Error al actualizar: ${updateError.message}`
          } else {
            errorMessage = 'Error desconocido al actualizar'
          }
          
          // Encontrar el número de fila original buscando en todas las filas procesadas
          const originalRowIndex = rows.findIndex((r) => 
            r.tipo_documento === row.tipo_documento && 
            r.numero_documento === row.numero_documento
          )
          
          updateErrors.push({
            row: originalRowIndex >= 0 ? originalRowIndex + 2 : 'N/A',
            numero_documento: row.numero_documento,
            error: errorMessage,
          })
        } else {
          updateCount++
        }
      }
    }

    // Update importacion with success count
    const totalExitosos = insertCount + updateCount
    const totalFallidos = errors.length + rowsToSkip.length + insertErrors.length + updateErrors.length

    await supabase
      .from('importaciones')
      .update({
        registros_exitosos: totalExitosos,
        registros_fallidos: totalFallidos,
        errores: errors.length > 0 || insertErrors.length > 0 || updateErrors.length > 0
          ? [...errors, ...insertErrors, ...updateErrors]
          : null,
      })
      .eq('id', importacion.id)

    // Prepare detailed error information con mejor formato
    const erroresDetallados = [
      ...errors.map((e) => ({ ...e, tipo: 'validación' })),
      ...insertErrors.map((e: any) => ({
        row: e.row || 'N/A',
        numero_documento: e.numero_documento || 'N/A',
        error: e.error || 'Error desconocido',
        tipo: 'inserción',
      })),
      ...updateErrors.map((e: any) => ({
        row: e.row || 'N/A',
        numero_documento: e.numero_documento || 'N/A',
        error: e.error || 'Error desconocido',
        tipo: 'actualización',
      })),
    ]

    // Get documentos of skipped rows
    const documentosOmitidos = rowsToSkip.map((r) => r.numero_documento)

    return NextResponse.json({
      registros_exitosos: totalExitosos,
      registros_actualizados: updateCount,
      registros_creados: insertCount,
      registros_omitidos: rowsToSkip.length,
      documentos_omitidos: documentosOmitidos,
      registros_fallidos: totalFallidos,
      errores: erroresDetallados.length > 0 ? erroresDetallados : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

