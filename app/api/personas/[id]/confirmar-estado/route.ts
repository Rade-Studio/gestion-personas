import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireConfirmadorOrAdmin, canFiltroAccessPersona } from '@/lib/auth/helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const profile = await requireConfirmadorOrAdmin()
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
    if (profile.role === 'confirmador') {
      const hasAccess = await canFiltroAccessPersona(profile.id, id)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tiene permiso para confirmar esta persona' },
          { status: 403 }
        )
      }
    }

    // Verificar que la persona esté en un estado válido para confirmar
    const estadosPermitidos = ['VERIFICADO', 'DATOS_PENDIENTES']
    if (!estadosPermitidos.includes(persona.estado)) {
      return NextResponse.json(
        { error: `No se puede confirmar una persona en estado ${persona.estado}` },
        { status: 400 }
      )
    }

    // Si tiene novedad activa, no se puede confirmar
    const novedadActiva = await prisma.novedad.findFirst({
      where: { personaId: id, resuelta: false },
    })
    if (novedadActiva) {
      return NextResponse.json(
        { error: 'No se puede confirmar una persona con novedad activa sin resolver' },
        { status: 400 }
      )
    }

    // Actualizar el estado
    const personaActualizada = await prisma.persona.update({
      where: { id },
      data: {
        estado: 'CONFIRMADO',
        estadoAnterior: persona.estado,
        confirmadoEstadoPorId: profile.id,
        confirmadoEstadoAt: new Date(),
      },
      include: {
        confirmadoEstadoPor: {
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
        confirmado_estado_por: personaActualizada.confirmadoEstadoPorId,
        confirmado_estado_at: personaActualizada.confirmadoEstadoAt?.toISOString(),
        confirmado_estado_por_profile: personaActualizada.confirmadoEstadoPor
          ? {
              id: personaActualizada.confirmadoEstadoPor.id,
              nombres: personaActualizada.confirmadoEstadoPor.nombres,
              apellidos: personaActualizada.confirmadoEstadoPor.apellidos,
              numero_documento: personaActualizada.confirmadoEstadoPor.numeroDocumento,
            }
          : null,
      },
      message: 'Persona confirmada correctamente',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
