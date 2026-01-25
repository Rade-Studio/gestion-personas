import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCoordinadorOrAdmin, requireConsultorOrAdmin } from '@/lib/auth/helpers'
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    let profile
    try {
      profile = await requireCoordinadorOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }

    const where: Record<string, unknown> = { role: 'lider' }

    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const data = await prisma.profile.findMany({
      where,
      include: {
        candidato: { select: { id: true, nombreCompleto: true } },
        puestoVotacion: { select: { id: true, nombre: true, codigo: true } },
        barrio: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

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

    data.forEach((lider) => {
      worksheet.addRow({
        nombres: lider.nombres || '',
        apellidos: lider.apellidos || '',
        cedula: lider.numeroDocumento || '',
        celular: lider.telefono || '',
        direccion: lider.direccion || '',
        barrio_nombre: lider.barrio?.nombre || '',
        puesto_nombre: lider.puestoVotacion?.nombre || '',
        mesa: lider.mesaVotacion || '',
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
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al exportar datos'
    return NextResponse.json(
      { error: errorMessage },
      {
        status: errorMessage.includes('No autorizado')
          ? 403
          : errorMessage.includes('No autenticado')
            ? 401
            : 500,
      }
    )
  }
}
