import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireCoordinadorOrAdmin, requireConsultorOrAdmin } from '@/lib/auth/helpers'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    let profile
    try {
      profile = await requireCoordinadorOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }
    const supabase = await createClient()

    let query = supabase
      .from('profiles')
      .select(`
        *,
        candidato:candidatos(id, nombre_completo),
        puesto_votacion:puestos_votacion(id, nombre, codigo),
        barrio:barrios(id, codigo, nombre)
      `)
      .eq('role', 'lider')

    if (profile.role === 'coordinador') {
      query = query.eq('coordinador_id', profile.id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Líderes')

    worksheet.columns = [
      { header: 'Nombres', key: 'nombres', width: 20 },
      { header: 'Apellidos', key: 'apellidos', width: 20 },
      { header: 'Cedula', key: 'cedula', width: 20 },
      { header: 'Celular', key: 'celular', width: 18 },
      { header: 'Direccion', key: 'direccion', width: 30 },
      { header: 'Nombre del barrio', key: 'barrio_nombre', width: 30 },
      { header: 'Nombre del puesto de votación', key: 'puesto_nombre', width: 40 },
      { header: 'Mesa', key: 'mesa', width: 20 },
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }
    worksheet.getRow(1).height = 25

    ;(data || []).forEach((lider: any) => {
      worksheet.addRow({
        nombres: lider.nombres || '',
        apellidos: lider.apellidos || '',
        cedula: lider.numero_documento || '',
        celular: lider.telefono || '',
        direccion: lider.direccion || '',
        barrio_nombre: lider.barrio?.nombre || '',
        puesto_nombre: lider.puesto_votacion?.nombre || '',
        mesa: lider.mesa_votacion || '',
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()

    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`
    const filename = `lideres-exportados-${timestamp}.xlsx`

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
      { status: error.message?.includes('No autorizado') ? 403 : error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

