import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCanCreateNovedad, canFiltroAccessPersona } from '@/lib/auth/helpers'
import { crearNovedadSchema } from '@/features/novedades/validations/novedad'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireCanCreateNovedad()

    const body = await request.json()
    const validatedData = crearNovedadSchema.parse(body)

    // Verificar que la persona exista
    const persona = await prisma.persona.findUnique({
      where: { id: validatedData.persona_id },
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

    // Verificar permisos según el rol
    const hasAccess = await verifyAccessToPersona(profile, persona)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tiene permiso para crear novedades en esta persona' },
        { status: 403 }
      )
    }

    // Verificar si ya tiene una novedad activa
    const novedadActiva = await prisma.novedad.findFirst({
      where: {
        personaId: validatedData.persona_id,
        resuelta: false,
      },
    })

    if (novedadActiva) {
      return NextResponse.json(
        { error: 'La persona ya tiene una novedad activa sin resolver' },
        { status: 400 }
      )
    }

    // Guardar el estado anterior antes de cambiar a CON_NOVEDAD
    const estadoAnterior = persona.estado

    // Crear la novedad y actualizar el estado de la persona
    const [novedad] = await prisma.$transaction([
      prisma.novedad.create({
        data: {
          personaId: validatedData.persona_id,
          observacion: validatedData.observacion,
          creadaPorId: profile.id,
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
        },
      }),
      prisma.persona.update({
        where: { id: validatedData.persona_id },
        data: {
          estadoAnterior: estadoAnterior,
          estado: 'CON_NOVEDAD',
        },
      }),
    ])

    const response = {
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
      created_at: novedad.createdAt.toISOString(),
      updated_at: novedad.updatedAt.toISOString(),
    }

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { errors: unknown }
      return NextResponse.json(
        { error: 'Datos inválidos', details: zodError.errors },
        { status: 400 }
      )
    }

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

interface PersonaWithRegistrador {
  id: string
  registradoPorId: string
  registradoPor: {
    id: string
    coordinadorId: string | null
  }
}

async function verifyAccessToPersona(
  profile: ProfileWithLideres,
  persona: PersonaWithRegistrador
): Promise<boolean> {
  // Admin tiene acceso a todo
  if (profile.role === 'admin') {
    return true
  }

  // Líder solo puede crear novedades en personas que registró
  if (profile.role === 'lider') {
    return persona.registradoPorId === profile.id
  }

  // Coordinador puede crear novedades en personas de sus líderes
  if (profile.role === 'coordinador') {
    return persona.registradoPor.coordinadorId === profile.id
  }

  // Validador y Confirmador solo pueden crear novedades en personas de sus líderes asignados
  if (profile.role === 'validador' || profile.role === 'confirmador') {
    return await canFiltroAccessPersona(profile.id, persona.id)
  }

  return false
}
