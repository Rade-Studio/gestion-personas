import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Personas')

    // Define columns
    worksheet.columns = [
      { header: 'Nombres', key: 'nombres', width: 20 },
      { header: 'Apellidos', key: 'apellidos', width: 20 },
      { header: 'Tipo de Documento', key: 'tipo_documento', width: 18 },
      { header: 'Número de Documento', key: 'numero_documento', width: 20 },
      { header: 'Fecha de Nacimiento', key: 'fecha_nacimiento', width: 20 },
      { header: 'Número de Celular', key: 'numero_celular', width: 18 },
      { header: 'Dirección', key: 'direccion', width: 30 },
      { header: 'Barrio', key: 'barrio', width: 20 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Puesto de Votación', key: 'puesto_votacion', width: 20 },
      { header: 'Mesa de Votación', key: 'mesa_votacion', width: 20 },
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }

    // Add example row with instructions
    worksheet.addRow({
      nombres: 'Ejemplo: Juan',
      apellidos: 'Ejemplo: Pérez',
      tipo_documento: 'CC',
      numero_documento: 'Ejemplo: 1234567890',
      fecha_nacimiento: 'Ejemplo: 1990-01-15',
      numero_celular: 'Ejemplo: 3001234567',
      direccion: 'Ejemplo: Calle 123 #45-67',
      barrio: 'Ejemplo: Centro',
      departamento: 'Ejemplo: Cundinamarca',
      municipio: 'Ejemplo: Bogotá',
      puesto_votacion: 'Ejemplo: 001',
      mesa_votacion: 'Ejemplo: 01',
    })

    // Add instructions row
    worksheet.addRow({
      nombres: 'NOTA: Los campos marcados con * son obligatorios',
      apellidos: '',
      tipo_documento: 'Tipos: CC, CE, Pasaporte, TI, Otro',
      numero_documento: '',
      fecha_nacimiento: 'Formato: YYYY-MM-DD',
      numero_celular: '',
      direccion: '',
      barrio: '',
      departamento: '',
      municipio: '',
      puesto_votacion: '',
      mesa_votacion: '',
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
    const filename = `plantilla-personas-${timestamp}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al generar plantilla' },
      { status: 500 }
    )
  }
}

