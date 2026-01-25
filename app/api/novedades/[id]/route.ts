import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireLiderOrAdmin()
    const { id } = await params

    const novedad = await prisma.novedad.findUnique({
      where: { id },
      include: {
        persona: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            numeroDocumento: true,
          },
        },
        creadaPor: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            numeroDocumento: true,
          },
        },
        resueltaPor: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            numeroDocumento: true,
          },
        },
      },
    })

    if (!novedad) {
      return NextResponse.json(
        { error: 'Novedad no encontrada' },
        { status: 404 }
      )
    }

    const response = {
      id: novedad.id,
      observacion: novedad.observacion,
      resuelta: novedad.resuelta,
      resuelta_at: novedad.resueltaAt?.toISOString(),
      persona_id: novedad.personaId,
      persona: {
        id: novedad.persona.id,
        nombres: novedad.persona.nombres,
        apellidos: novedad.persona.apellidos,
        numero_documento: novedad.persona.numeroDocumento,
      },
      creada_por: novedad.creadaPorId,
      creada_por_profile: {
        id: novedad.creadaPor.id,
        nombres: novedad.creadaPor.nombres,
        apellidos: novedad.creadaPor.apellidos,
        numero_documento: novedad.creadaPor.numeroDocumento,
      },
      resuelta_por: novedad.resueltaPorId,
      resuelta_por_profile: novedad.resueltaPor
        ? {
            id: novedad.resueltaPor.id,
            nombres: novedad.resueltaPor.nombres,
            apellidos: novedad.resueltaPor.apellidos,
            numero_documento: novedad.resueltaPor.numeroDocumento,
          }
        : null,
      created_at: novedad.createdAt.toISOString(),
      updated_at: novedad.updatedAt.toISOString(),
    }

    return NextResponse.json({ data: response })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
