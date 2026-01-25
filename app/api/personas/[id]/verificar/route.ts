import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireValidadorOrAdmin, canFiltroAccessPersona } from '@/lib/auth/helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const profile = await requireValidadorOrAdmin()
    const { id } = await params

    const persona = await prisma.persona.findUnique({
      where: { id },
      include: {
        registradoPor: { select: { id: true, coordinadorId: true } },
      },
    })

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (profile.role === 'validador') {
      const hasAccess = await canFiltroAccessPersona(profile.id, id)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tiene permiso para verificar esta persona' },
          { status: 403 }
        )
      }
    }

    // Verificar que la persona esté en un estado válido para verificar
    const estadosPermitidos = ['DATOS_PENDIENTES', 'CON_NOVEDAD']
    if (!estadosPermitidos.includes(persona.estado)) {
      return NextResponse.json(
        { error: `No se puede verificar una persona en estado ${persona.estado}` },
        { status: 400 }
      )
    }

    // Si tiene novedad activa, no se puede verificar
    if (persona.estado === 'CON_NOVEDAD') {
      const novedadActiva = await prisma.novedad.findFirst({
        where: { personaId: id, resuelta: false },
      })
      if (novedadActiva) {
        return NextResponse.json(
          { error: 'No se puede verificar una persona con novedad activa sin resolver' },
          { status: 400 }
        )
      }
    }

    // Actualizar el estado
    const personaActualizada = await prisma.persona.update({
      where: { id },
      data: {
        estado: 'VERIFICADO',
        estadoAnterior: persona.estado,
        validadoPorId: profile.id,
        validadoAt: new Date(),
      },
      include: {
        validadoPor: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            numeroDocumento: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: {
        id: personaActualizada.id,
        estado: personaActualizada.estado,
        estado_anterior: personaActualizada.estadoAnterior,
        validado_por: personaActualizada.validadoPorId,
        validado_at: personaActualizada.validadoAt?.toISOString(),
        validado_por_profile: personaActualizada.validadoPor
          ? {
              id: personaActualizada.validadoPor.id,
              nombres: personaActualizada.validadoPor.nombres,
              apellidos: personaActualizada.validadoPor.apellidos,
              numero_documento: personaActualizada.validadoPor.numeroDocumento,
            }
          : null,
      },
      message: 'Persona verificada correctamente',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
