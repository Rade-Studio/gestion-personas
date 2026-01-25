import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireLiderOrAdmin()

    // Bloquear consultores de reversar confirmaciones
    if (profile.role === 'consultor') {
      return NextResponse.json(
        { error: 'No autorizado: los consultores no pueden reversar confirmaciones' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Get confirmacion with persona
    const confirmacion = await prisma.votoConfirmacion.findUnique({
      where: { id },
      include: {
        persona: {
          select: { registradoPorId: true },
        },
      },
    })

    if (!confirmacion) {
      return NextResponse.json({ error: 'Confirmación no encontrada' }, { status: 404 })
    }

    // Check permissions
    if (profile.role === 'lider' && confirmacion.persona.registradoPorId !== profile.id) {
      return NextResponse.json(
        { error: 'Sin permisos para reversar esta confirmación' },
        { status: 403 }
      )
    }

    if (confirmacion.reversado) {
      return NextResponse.json(
        { error: 'Esta confirmación ya fue reversada' },
        { status: 400 }
      )
    }

    // Update confirmacion
    const updatedConfirmacion = await prisma.votoConfirmacion.update({
      where: { id },
      data: {
        reversado: true,
        reversadoPorId: profile.id,
        reversadoAt: new Date(),
      },
    })

    // Transform to match expected format
    const response = {
      id: updatedConfirmacion.id,
      persona_id: updatedConfirmacion.personaId,
      imagen_url: updatedConfirmacion.imagenUrl,
      imagen_path: updatedConfirmacion.imagenPath,
      confirmado_por: updatedConfirmacion.confirmadoPorId,
      confirmado_at: updatedConfirmacion.confirmadoAt.toISOString(),
      reversado: updatedConfirmacion.reversado,
      reversado_por: updatedConfirmacion.reversadoPorId,
      reversado_at: updatedConfirmacion.reversadoAt?.toISOString(),
      created_at: updatedConfirmacion.createdAt.toISOString(),
      updated_at: updatedConfirmacion.updatedAt.toISOString(),
    }

    return NextResponse.json({ data: response })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
