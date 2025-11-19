import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'
import ExcelJS from 'exceljs'
import { personaSchema } from '@/lib/validations/persona'

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

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return NextResponse.json(
        { error: 'El archivo Excel no contiene hojas' },
        { status: 400 }
      )
    }

    const rows: any[] = []
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
          rowData.tipo_documento = cellValue?.toString() || 'CC'
        }
        if (header.includes('Número de Documento')) {
          rowData.numero_documento = cellValue?.toString() || ''
        }
        if (header.includes('Fecha de Nacimiento')) {
          rowData.fecha_nacimiento = formatDate(cellValue)
        }
        if (header.includes('Número de Celular')) {
          rowData.numero_celular = cellValue?.toString() || ''
        }
        if (header.includes('Dirección')) {
          rowData.direccion = cellValue?.toString() || ''
        }
        if (header.includes('Barrio')) {
          rowData.barrio = cellValue?.toString() || ''
        }
        if (header.includes('Puesto de Votación')) {
          rowData.puesto_votacion = cellValue?.toString() || ''
        }
        if (header.includes('Mesa de Votación')) {
          rowData.mesa_votacion = cellValue?.toString() || ''
        }
      })

      // Validate row data
      try {
        personaSchema.parse(rowData)
        rows.push(rowData)
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          error: error.errors?.map((e: any) => e.message).join(', ') || 'Datos inválidos',
        })
      }
    })

    // Check for duplicate documentos in file
    const documentosInFile = rows.map((r) => r.numero_documento)
    const duplicatesInFile = documentosInFile.filter(
      (doc, index) => documentosInFile.indexOf(doc) !== index
    )
    if (duplicatesInFile.length > 0) {
      return NextResponse.json(
        {
          error: 'El archivo contiene números de documento duplicados',
          duplicates: duplicatesInFile,
        },
        { status: 400 }
      )
    }

    // Check for duplicates in database
    const documentos = rows.map((r) => r.numero_documento)
    const { data: existingPersonas } = await supabase
      .from('personas')
      .select('numero_documento')
      .in('numero_documento', documentos)

    const existingDocumentos = new Set(
      existingPersonas?.map((p) => p.numero_documento) || []
    )
    const newRows = rows.filter((r) => !existingDocumentos.has(r.numero_documento))

    if (newRows.length === 0) {
      return NextResponse.json(
        {
          error: 'Todas las personas ya existen en la base de datos',
          registros_exitosos: 0,
          registros_fallidos: rows.length,
          errores: errors,
        },
        { status: 400 }
      )
    }

    // Create importacion record
    const { data: importacion, error: importacionError } = await supabase
      .from('importaciones')
      .insert({
        usuario_id: profile.id,
        total_registros: rows.length,
        registros_exitosos: 0,
        registros_fallidos: errors.length + (rows.length - newRows.length),
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

    // Insert personas
    const personasToInsert = newRows.map((row) => {
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
      
      return {
        ...row,
        fecha_nacimiento: fechaNacimiento,
        numero_celular: row.numero_celular || null,
        direccion: row.direccion || null,
        barrio: row.barrio || null,
        registrado_por: profile.id,
        es_importado: true,
        importacion_id: importacion.id,
      }
    })

    const { error: insertError } = await supabase
      .from('personas')
      .insert(personasToInsert)

    if (insertError) {
      // Update importacion with error
      await supabase
        .from('importaciones')
        .update({
          registros_fallidos: rows.length,
          errores: [{ error: insertError.message }],
        })
        .eq('id', importacion.id)

      return NextResponse.json(
        { error: 'Error al insertar personas: ' + insertError.message },
        { status: 500 }
      )
    }

    // Update importacion with success count
    await supabase
      .from('importaciones')
      .update({
        registros_exitosos: newRows.length,
      })
      .eq('id', importacion.id)

    return NextResponse.json({
      registros_exitosos: newRows.length,
      registros_fallidos: errors.length + (rows.length - newRows.length),
      errores: errors,
      duplicados_en_bd: rows.length - newRows.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

