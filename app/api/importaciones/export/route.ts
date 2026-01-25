import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()

    const searchParams = request.nextUrl.searchParams
    const puestoVotacionArray = searchParams.getAll('puesto_votacion')
    const barrioIdArray = searchParams.getAll('barrio_id')
    const numeroDocumento = searchParams.get('numero_documento')
    const liderId = searchParams.get('lider_id')
    const coordinadorId = searchParams.get('coordinador_id')
    const estado = searchParams.get('estado')

    // Build where clause
    const where: Record<string, unknown> = {}

    // Apply filters based on role
    if (profile.role === 'admin' && coordinadorId) {
      const lideresDelCoordinador = await prisma.profile.findMany({
        where: { coordinadorId: coordinadorId, role: 'lider' },
        select: { id: true },
      })

      const liderIds = lideresDelCoordinador.map((l) => l.id)
      liderIds.push(coordinadorId)

      where.registradoPorId = { in: liderIds }
    } else if (profile.role === 'admin' && liderId) {
      where.registradoPorId = liderId
    } else if (profile.role === 'coordinador') {
      if (liderId) {
        const lider = await prisma.profile.findFirst({
          where: { id: liderId, coordinadorId: profile.id },
        })

        if (!lider) {
          // Return empty Excel
          const workbook = new ExcelJS.Workbook()
          const worksheet = workbook.addWorksheet('Personas')
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
          worksheet.getRow(1).font = { bold: true }
          worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
          }
          const buffer = await workbook.xlsx.writeBuffer()
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': 'attachment; filename="personas-exportadas.xlsx"',
            },
          })
        }
        where.registradoPorId = liderId
      } else {
        const lideresDelCoordinador = await prisma.profile.findMany({
          where: { coordinadorId: profile.id, role: 'lider' },
          select: { id: true },
        })

        const liderIds = lideresDelCoordinador.map((l) => l.id)
        liderIds.push(profile.id)

        where.registradoPorId = { in: liderIds }
      }
    } else if (profile.role === 'lider') {
      where.registradoPorId = profile.id
    }

    // Handle multiple puesto_votacion filters
    if (puestoVotacionArray.length > 0) {
      const puestoIds = puestoVotacionArray
        .map((pv) => parseInt(pv))
        .filter((id) => !isNaN(id))
      if (puestoIds.length > 0) {
        where.puestoVotacionId = { in: puestoIds }
      }
    }

    // Handle multiple barrio_id filters
    if (barrioIdArray.length > 0) {
      const barrioIds = barrioIdArray.map((bid) => parseInt(bid)).filter((id) => !isNaN(id))
      if (barrioIds.length > 0) {
        where.barrioId = { in: barrioIds }
      }
    }

    if (numeroDocumento) {
      where.numeroDocumento = { contains: numeroDocumento, mode: 'insensitive' }
    }

    // Get all records (no pagination limit for export)
    const data = await prisma.persona.findMany({
      where,
      include: {
        confirmaciones: true,
        barrio: { select: { id: true, codigo: true, nombre: true } },
        puestoVotacion: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform data
    const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'

    let transformedData = data.map((persona) => {
      const confirmaciones = persona.confirmaciones || []
      const confirmacion =
        confirmaciones
          .filter((c) => !c.reversado)
          .sort((a, b) => b.confirmadoAt.getTime() - a.confirmadoAt.getTime())[0] ||
        confirmaciones.sort((a, b) => b.confirmadoAt.getTime() - a.confirmadoAt.getTime())[0]

      return {
        id: persona.id,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        numero_documento: persona.numeroDocumento,
        numero_celular: persona.numeroCelular,
        direccion: persona.direccion,
        barrio: persona.barrio,
        puesto_votacion: persona.puestoVotacion,
        puesto_votacion_id: persona.puestoVotacionId,
        mesa_votacion: persona.mesaVotacion,
        fecha_expedicion: persona.fechaExpedicion,
        confirmacion: confirmacion
          ? {
              id: confirmacion.id,
              reversado: confirmacion.reversado,
            }
          : undefined,
      }
    })

    // Filter by estado if provided
    if (estado === 'missing_data') {
      transformedData = transformedData.filter((persona) => {
        const faltaPuestoOMesa = !persona.puesto_votacion_id || !persona.mesa_votacion
        const faltaFechaExpedicion = fechaExpedicionRequired && !persona.fecha_expedicion
        return faltaPuestoOMesa || faltaFechaExpedicion
      })
    } else if (estado === 'confirmed') {
      transformedData = transformedData.filter(
        (persona) =>
          persona.puesto_votacion_id &&
          persona.mesa_votacion &&
          (!fechaExpedicionRequired || persona.fecha_expedicion) &&
          persona.confirmacion &&
          !persona.confirmacion.reversado
      )
    } else if (estado === 'pending') {
      transformedData = transformedData.filter(
        (persona) =>
          persona.puesto_votacion_id &&
          persona.mesa_votacion &&
          (!fechaExpedicionRequired || persona.fecha_expedicion) &&
          (!persona.confirmacion || persona.confirmacion.reversado)
      )
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Personas')

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

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }
    worksheet.getRow(1).height = 25

    transformedData.forEach((persona) => {
      worksheet.addRow({
        nombres: persona.nombres || '',
        apellidos: persona.apellidos || '',
        cedula: persona.numero_documento || '',
        celular: persona.numero_celular || '',
        direccion: persona.direccion || '',
        barrio_nombre: persona.barrio?.nombre || '',
        puesto_nombre: persona.puesto_votacion?.nombre || '',
        mesa: persona.mesa_votacion || '',
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
    const filename = `personas-exportadas-${timestamp}.xlsx`

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
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
