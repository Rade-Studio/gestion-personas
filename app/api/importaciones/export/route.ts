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

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()

    // Hoja única: Personas
    const worksheet = workbook.addWorksheet('Personas')

    // Define columns - solo los campos especificados
    worksheet.columns = [
      { header: 'Nombres', key: 'nombres', width: 20 },
      { header: 'Apellidos', key: 'apellidos', width: 20 },
      { header: 'Cedula', key: 'cedula', width: 20 },
      { header: 'Celular', key: 'celular', width: 18 },
      { header: 'Direccion', key: 'direccion', width: 30 },
      { header: 'Nombre del barrio', key: 'barrio_nombre', width: 30 },
      { header: 'Nombre del puesto de votacion', key: 'puesto_nombre', width: 40 },
      { header: 'Mesa', key: 'mesa', width: 20 },
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
        cedula: persona.numero_documento || '',
        celular: persona.numero_celular || '',
        direccion: persona.direccion || '',
        barrio_nombre: persona.barrios?.nombre || '',
        puesto_nombre: persona.puestos_votacion?.nombre || '',
        mesa: persona.mesa_votacion || '',
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

