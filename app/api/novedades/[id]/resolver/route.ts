import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCanCreateNovedad, canFiltroAccessPersona } from '@/lib/auth/helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const profile = await requireCanCreateNovedad()
    const { id } = await params

    const novedad = await prisma.novedad.findUnique({
      where: { id },
      include: {
        persona: {
          include: {
            registradoPor: { select: { id: true, coordinadorId: true } },
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

    if (novedad.resuelta) {
      return NextResponse.json(
        { error: 'La novedad ya fue resuelta' },
        { status: 400 }
      )
    }

    // Verificar permisos
    const hasAccess = await verifyAccessToNovedad(profile, novedad)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tiene permiso para resolver esta novedad' },
        { status: 403 }
      )
    }

    // Obtener el estado anterior de la persona (antes de CON_NOVEDAD)
    const estadoAnterior = novedad.persona.estadoAnterior || 'DATOS_PENDIENTES'

    // Resolver la novedad y restaurar el estado de la persona
    const [novedadActualizada] = await prisma.$transaction([
      prisma.novedad.update({
        where: { id },
        data: {
          resuelta: true,
          resueltaAt: new Date(),
          resueltaPorId: profile.id,
        },
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
      }),
      prisma.persona.update({
        where: { id: novedad.personaId },
        data: {
          estado: estadoAnterior,
          estadoAnterior: null,
        },
      }),
    ])

    const response = {
      id: novedadActualizada.id,
      observacion: novedadActualizada.observacion,
      resuelta: novedadActualizada.resuelta,
      resuelta_at: novedadActualizada.resueltaAt?.toISOString(),
      persona_id: novedadActualizada.personaId,
      creada_por: novedadActualizada.creadaPorId,
      creada_por_profile: {
        id: novedadActualizada.creadaPor.id,
        nombres: novedadActualizada.creadaPor.nombres,
        apellidos: novedadActualizada.creadaPor.apellidos,
        numero_documento: novedadActualizada.creadaPor.numeroDocumento,
      },
      resuelta_por: novedadActualizada.resueltaPorId,
      resuelta_por_profile: novedadActualizada.resueltaPor
        ? {
            id: novedadActualizada.resueltaPor.id,
            nombres: novedadActualizada.resueltaPor.nombres,
            apellidos: novedadActualizada.resueltaPor.apellidos,
            numero_documento: novedadActualizada.resueltaPor.numeroDocumento,
          }
        : null,
      created_at: novedadActualizada.createdAt.toISOString(),
      updated_at: novedadActualizada.updatedAt.toISOString(),
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

interface ProfileWithLideres {
  id: string
  role: string
  coordinador_id?: string
  lideres_asignados_ids: string[]
}

interface NovedadWithPersona {
  id: string
  personaId: string
  persona: {
    id: string
    registradoPorId: string
    registradoPor: {
      id: string
      coordinadorId: string | null
    }
  }
}

async function verifyAccessToNovedad(
  profile: ProfileWithLideres,
  novedad: NovedadWithPersona
): Promise<boolean> {
  // Admin tiene acceso a todo
  if (profile.role === 'admin') {
    return true
  }

  // Líder solo puede resolver novedades en personas que registró
  if (profile.role === 'lider') {
    return novedad.persona.registradoPorId === profile.id
  }

  // Coordinador puede resolver novedades en personas de sus líderes
  if (profile.role === 'coordinador') {
    return novedad.persona.registradoPor.coordinadorId === profile.id
  }

  // Validador y Confirmador solo pueden resolver novedades en personas de sus líderes asignados
  if (profile.role === 'validador' || profile.role === 'confirmador') {
    return await canFiltroAccessPersona(profile.id, novedad.persona.id)
  }

  return false
}
