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
    const { searchParams } = new URL(request.url)
    const soloActivas = searchParams.get('activas') === 'true'

    const persona = await prisma.persona.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona no encontrada' },
        { status: 404 }
      )
    }

    const where: Record<string, unknown> = { personaId: id }
    if (soloActivas) {
      where.resuelta = false
    }

    const novedades = await prisma.novedad.findMany({
      where,
      include: {
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
      orderBy: { createdAt: 'desc' },
    })

    const response = novedades.map((novedad) => ({
      id: novedad.id,
      observacion: novedad.observacion,
      resuelta: novedad.resuelta,
      resuelta_at: novedad.resueltaAt?.toISOString(),
      persona_id: novedad.personaId,
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
    }))

    return NextResponse.json({ data: response })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
