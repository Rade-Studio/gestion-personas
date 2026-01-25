import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCoordinadorOrAdmin, requireFiltroOrAdmin, canFiltroAccessPersona } from '@/lib/auth/helpers'
import type { PersonaEstado } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Mapa de reversión de estados (escalonada)
const REVERSION_MAP: Record<PersonaEstado, PersonaEstado> = {
  COMPLETADO: 'CONFIRMADO',
  CONFIRMADO: 'VERIFICADO',
  VERIFICADO: 'DATOS_PENDIENTES',
  CON_NOVEDAD: 'DATOS_PENDIENTES',
  DATOS_PENDIENTES: 'DATOS_PENDIENTES',
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Intentar primero como coordinador/admin, luego como filtro
    let profile
    try {
      profile = await requireCoordinadorOrAdmin()
    } catch {
      profile = await requireFiltroOrAdmin()
    }
    
    const { id } = await params

    const persona = await prisma.persona.findUnique({
      where: { id },
      include: {
        registradoPor: { select: { id: true, coordinadorId: true } },
        confirmaciones: {
          where: { reversado: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const hasAccess = await verifyReversarAccess(profile, persona)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tiene permiso para reversar el estado de esta persona' },
        { status: 403 }
      )
    }

    // No se puede reversar DATOS_PENDIENTES
    if (persona.estado === 'DATOS_PENDIENTES') {
      return NextResponse.json(
        { error: 'No se puede reversar una persona en estado DATOS_PENDIENTES' },
        { status: 400 }
      )
    }

    // Si el estado es CON_NOVEDAD y tiene novedad activa, no se puede reversar
    if (persona.estado === 'CON_NOVEDAD') {
      const novedadActiva = await prisma.novedad.findFirst({
        where: { personaId: id, resuelta: false },
      })
      if (novedadActiva) {
        return NextResponse.json(
          { error: 'No se puede reversar una persona con novedad activa. Resuelva la novedad primero.' },
          { status: 400 }
        )
      }
    }

    // Si el estado es COMPLETADO, también reversar la confirmación de voto
    if (persona.estado === 'COMPLETADO' && persona.confirmaciones.length > 0) {
      await prisma.votoConfirmacion.update({
        where: { id: persona.confirmaciones[0].id },
        data: {
          reversado: true,
          reversadoAt: new Date(),
          reversadoPorId: profile.id,
        },
      })
    }

    // Calcular el nuevo estado
    const nuevoEstado = REVERSION_MAP[persona.estado]

    // Limpiar campos de trazabilidad según el nuevo estado
    const updateData: Record<string, unknown> = {
      estado: nuevoEstado,
      estadoAnterior: persona.estado,
    }

    // Si reversamos desde VERIFICADO, limpiar campos de validación
    if (persona.estado === 'VERIFICADO') {
      updateData.validadoPorId = null
      updateData.validadoAt = null
    }

    // Si reversamos desde CONFIRMADO, limpiar campos de confirmación de estado
    if (persona.estado === 'CONFIRMADO') {
      updateData.confirmadoEstadoPorId = null
      updateData.confirmadoEstadoAt = null
    }

    // Actualizar el estado
    const personaActualizada = await prisma.persona.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      data: {
        id: personaActualizada.id,
        estado: personaActualizada.estado,
        estado_anterior: personaActualizada.estadoAnterior,
      },
      message: `Estado reversado de ${persona.estado} a ${nuevoEstado}`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}

interface ProfileWithRole {
  id: string
  role: string
}

interface PersonaWithRegistrador {
  id: string
  registradoPorId: string
  registradoPor: {
    id: string
    coordinadorId: string | null
  }
}

async function verifyReversarAccess(
  profile: ProfileWithRole,
  persona: PersonaWithRegistrador
): Promise<boolean> {
  // Admin tiene acceso a todo
  if (profile.role === 'admin') {
    return true
  }

  // Coordinador puede reversar personas de sus líderes
  if (profile.role === 'coordinador') {
    return persona.registradoPor.coordinadorId === profile.id
  }

  // Validador y Confirmador solo pueden reversar personas de sus líderes asignados
  if (profile.role === 'validador' || profile.role === 'confirmador') {
    return await canFiltroAccessPersona(profile.id, persona.id)
  }

  return false
}
