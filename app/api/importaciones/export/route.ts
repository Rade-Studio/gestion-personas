import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()
    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const puestoVotacion = searchParams.get('puesto_votacion')
    const numeroDocumento = searchParams.get('numero_documento')
    const liderId = searchParams.get('lider_id')
    const estado = searchParams.get('estado')

    let query = supabase
      .from('personas')
      .select('*, voto_confirmaciones(*), barrios(id, codigo, nombre), puestos_votacion(id, codigo, nombre)', {
        count: 'exact',
      })

    // Apply filters based on role
    if (profile.role === 'admin' && liderId) {
      query = query.eq('registrado_por', liderId)
    }

    if (puestoVotacion) {
      query = query.eq('puesto_votacion', puestoVotacion)
    }

    if (numeroDocumento) {
      query = query.ilike('numero_documento', `%${numeroDocumento}%`)
    }

    // Get all records (no pagination limit for export)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform data: convert voto_confirmaciones array to confirmacion object
    let transformedData = (data || []).map((persona: any) => {
      const confirmaciones = persona.voto_confirmaciones || []
      const confirmacion = confirmaciones
        .filter((c: any) => !c.reversado)
        .sort((a: any, b: any) => 
          new Date(b.confirmado_at).getTime() - new Date(a.confirmado_at).getTime()
        )[0] || confirmaciones
        .sort((a: any, b: any) => 
          new Date(b.confirmado_at).getTime() - new Date(a.confirmado_at).getTime()
        )[0]

      const { voto_confirmaciones, ...personaData } = persona
      return {
        ...personaData,
        confirmacion: confirmacion || undefined,
      }
    })

    // Filter by estado (missing_data/pendiente/confirmado) if provided
    const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'
    
    if (estado === 'missing_data') {
      transformedData = transformedData.filter((persona: any) => {
        const faltaPuestoOMesa = !persona.puesto_votacion_id || !persona.mesa_votacion
        const faltaFechaExpedicion = fechaExpedicionRequired && !persona.fecha_expedicion
        return faltaPuestoOMesa || faltaFechaExpedicion
      })
    } else if (estado === 'confirmed') {
      transformedData = transformedData.filter((persona: any) => 
        persona.puesto_votacion_id && persona.mesa_votacion && 
        (!fechaExpedicionRequired || persona.fecha_expedicion) &&
        persona.confirmacion && !persona.confirmacion.reversado
      )
    } else if (estado === 'pending') {
      transformedData = transformedData.filter((persona: any) => 
        persona.puesto_votacion_id && persona.mesa_votacion &&
        (!fechaExpedicionRequired || persona.fecha_expedicion) &&
        (!persona.confirmacion || persona.confirmacion.reversado)
      )
    }

    // Obtener barrios y puestos de votación para la hoja de instrucciones
    const [barriosResult, puestosResult] = await Promise.all([
      supabase.from('barrios').select('codigo, nombre').order('nombre', { ascending: true }),
      supabase.from('puestos_votacion').select('codigo, nombre, direccion').order('nombre', { ascending: true }),
    ])

    const barrios = barriosResult.data || []
    const puestos = puestosResult.data || []

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()

    // Hoja 1: Instrucciones
    const instruccionesSheet = workbook.addWorksheet('Instrucciones')
    
    // Título
    instruccionesSheet.mergeCells('A1:D1')
    instruccionesSheet.getCell('A1').value = 'INSTRUCCIONES PARA IMPORTACIÓN DE PERSONAS'
    instruccionesSheet.getCell('A1').font = { bold: true, size: 14 }
    instruccionesSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    instruccionesSheet.getRow(1).height = 25

    // Instrucciones generales
    instruccionesSheet.getCell('A3').value = 'INSTRUCCIONES GENERALES:'
    instruccionesSheet.getCell('A3').font = { bold: true }
    instruccionesSheet.getRow(3).height = 20

    instruccionesSheet.getCell('A4').value = '1. Los campos marcados con * son obligatorios'
    instruccionesSheet.getCell('A5').value = '2. El formato de fechas debe ser YYYY-MM-DD (ejemplo: 1990-01-15)'
    instruccionesSheet.getCell('A6').value = fechaExpedicionRequired 
      ? '3. La fecha de expedición es obligatoria'
      : '3. La fecha de expedición es opcional'
    instruccionesSheet.getCell('A7').value = '4. Los tipos de documento válidos son: CC, CE, Pasaporte, TI, Otro'
    instruccionesSheet.getCell('A8').value = '5. Para Barrio y Puesto de Votación debe usar el CÓDIGO correspondiente (ver tablas abajo)'
    instruccionesSheet.getCell('A9').value = '6. Si no conoce el código, puede dejar el campo vacío'

    // Espacio
    instruccionesSheet.getRow(10).height = 10

    // Tabla de Barrios
    instruccionesSheet.getCell('A12').value = 'CÓDIGOS DE BARRIOS:'
    instruccionesSheet.getCell('A12').font = { bold: true, size: 12 }
    instruccionesSheet.getRow(12).height = 20

    instruccionesSheet.getCell('A13').value = 'Código'
    instruccionesSheet.getCell('B13').value = 'Nombre del Barrio'
    instruccionesSheet.getRow(13).font = { bold: true }
    instruccionesSheet.getRow(13).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }

    barrios.forEach((barrio, index) => {
      const row = 14 + index
      instruccionesSheet.getCell(`A${row}`).value = barrio.codigo
      instruccionesSheet.getCell(`B${row}`).value = barrio.nombre
    })

    instruccionesSheet.getColumn('A').width = 15
    instruccionesSheet.getColumn('B').width = 40

    // Espacio
    const lastBarrioRow = 14 + barrios.length
    instruccionesSheet.getRow(lastBarrioRow + 1).height = 10

    // Tabla de Puestos de Votación
    const puestosStartRow = lastBarrioRow + 3
    instruccionesSheet.getCell(`A${puestosStartRow}`).value = 'CÓDIGOS DE PUESTOS DE VOTACIÓN:'
    instruccionesSheet.getCell(`A${puestosStartRow}`).font = { bold: true, size: 12 }
    instruccionesSheet.getRow(puestosStartRow).height = 20

    instruccionesSheet.getCell(`A${puestosStartRow + 1}`).value = 'Código'
    instruccionesSheet.getCell(`B${puestosStartRow + 1}`).value = 'Nombre del Puesto'
    instruccionesSheet.getCell(`C${puestosStartRow + 1}`).value = 'Dirección'
    instruccionesSheet.getRow(puestosStartRow + 1).font = { bold: true }
    instruccionesSheet.getRow(puestosStartRow + 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }

    puestos.forEach((puesto, index) => {
      const row = puestosStartRow + 2 + index
      instruccionesSheet.getCell(`A${row}`).value = puesto.codigo
      instruccionesSheet.getCell(`B${row}`).value = puesto.nombre
      instruccionesSheet.getCell(`C${row}`).value = puesto.direccion || ''
    })

    instruccionesSheet.getColumn('C').width = 40

    // Hoja 2: Personas (solo títulos)
    const worksheet = workbook.addWorksheet('Personas')

    // Define columns
    worksheet.columns = [
      { header: 'Nombres *', key: 'nombres', width: 20 },
      { header: 'Apellidos *', key: 'apellidos', width: 20 },
      { header: 'Tipo de Documento *', key: 'tipo_documento', width: 18 },
      { header: 'Número de Documento *', key: 'numero_documento', width: 20 },
      { header: 'Fecha de Nacimiento', key: 'fecha_nacimiento', width: 20 },
      { header: 'Fecha de Expedición', key: 'fecha_expedicion', width: 20 },
      { header: 'Profesión', key: 'profesion', width: 20 },
      { header: 'Número de Celular', key: 'numero_celular', width: 18 },
      { header: 'Dirección', key: 'direccion', width: 30 },
      { header: 'Código Barrio', key: 'barrio_id', width: 15 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Código Puesto de Votación', key: 'puesto_votacion_id', width: 25 },
      { header: 'Mesa de Votación', key: 'mesa_votacion', width: 20 },
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }
    worksheet.getRow(1).height = 25

    // Add data rows
    transformedData.forEach((persona: any) => {
      worksheet.addRow({
        nombres: persona.nombres || '',
        apellidos: persona.apellidos || '',
        tipo_documento: persona.tipo_documento || '',
        numero_documento: persona.numero_documento || '',
        fecha_nacimiento: persona.fecha_nacimiento || '',
        fecha_expedicion: persona.fecha_expedicion || '',
        profesion: persona.profesion || '',
        numero_celular: persona.numero_celular || '',
        direccion: persona.direccion || '',
        barrio_id: persona.barrios?.codigo || '',
        departamento: persona.departamento || '',
        municipio: persona.municipio || '',
        puesto_votacion_id: persona.puestos_votacion?.codigo || '',
        mesa_votacion: persona.mesa_votacion || '',
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()

    // Generate timestamp for filename (DDMMYYYYHHMMSS)
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`
    const filename = `personas-exportadas-${timestamp}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al exportar datos' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

