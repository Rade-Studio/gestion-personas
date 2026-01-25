import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'

export async function GET() {
  try {
    await requireLiderOrAdmin()

    // Obtener barrios y puestos de votación
    const [barrios, puestos] = await Promise.all([
      prisma.barrio.findMany({
        select: { codigo: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.puestoVotacion.findMany({
        select: { codigo: true, nombre: true, direccion: true },
        orderBy: { nombre: 'asc' },
      }),
    ])

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

    const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'
    const useDefaultLocation = process.env.NEXT_PUBLIC_USE_DEFAULT_LOCATION === 'true'
    instruccionesSheet.getCell('A4').value = '1. Los campos marcados con * son obligatorios'
    instruccionesSheet.getCell('A5').value =
      '2. El formato de fechas debe ser YYYY-MM-DD (ejemplo: 1990-01-15)'
    instruccionesSheet.getCell('A6').value = fechaExpedicionRequired
      ? '3. La fecha de expedición es obligatoria'
      : '3. La fecha de expedición es opcional'
    instruccionesSheet.getCell('A7').value =
      '4. El tipo de documento es fijo en CC para todas las personas'
    if (useDefaultLocation) {
      instruccionesSheet.getCell('A8').value =
        '5. Departamento y Municipio se asignarán automáticamente según la configuración'
      instruccionesSheet.getCell('A9').value =
        '6. Para Barrio y Puesto de Votación debe usar el CÓDIGO correspondiente (ver tablas abajo)'
      instruccionesSheet.getCell('A10').value =
        '7. Si no conoce el código, puede dejar el campo vacío'
    } else {
      instruccionesSheet.getCell('A8').value =
        '5. Para Barrio y Puesto de Votación debe usar el CÓDIGO correspondiente (ver tablas abajo)'
      instruccionesSheet.getCell('A9').value =
        '6. Si no conoce el código, puede dejar el campo vacío'
    }

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

    // Define columns según configuración
    const columns: { header: string; key: string; width: number }[] = [
      { header: 'Nombres *', key: 'nombres', width: 20 },
      { header: 'Apellidos *', key: 'apellidos', width: 20 },
    ]

    // Solo agregar tipo de documento si no está activo default_location
    if (!useDefaultLocation) {
      columns.push({ header: 'Tipo de Documento *', key: 'tipo_documento', width: 18 })
    }

    columns.push(
      { header: 'Número de Documento *', key: 'numero_documento', width: 20 },
      { header: 'Fecha de Nacimiento', key: 'fecha_nacimiento', width: 20 },
      { header: 'Fecha de Expedición', key: 'fecha_expedicion', width: 20 },
      { header: 'Profesión', key: 'profesion', width: 20 },
      { header: 'Número de Celular', key: 'numero_celular', width: 18 },
      { header: 'Dirección', key: 'direccion', width: 30 },
      { header: 'Código Barrio', key: 'barrio_id', width: 15 }
    )

    // Solo agregar departamento y municipio si no está activo default_location
    if (!useDefaultLocation) {
      columns.push(
        { header: 'Departamento', key: 'departamento', width: 20 },
        { header: 'Municipio', key: 'municipio', width: 20 }
      )
    }

    columns.push(
      { header: 'Código Puesto de Votación', key: 'puesto_votacion_id', width: 25 },
      { header: 'Mesa de Votación', key: 'mesa_votacion', width: 20 }
    )

    worksheet.columns = columns

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }
    worksheet.getRow(1).height = 25

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
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al generar plantilla'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
