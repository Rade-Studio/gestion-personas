import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCoordinadorOrAdmin, requireConsultorOrAdmin } from '@/lib/auth/helpers'

export async function GET() {
  try {
    // Permitir acceso a coordinadores, admins y consultores
    let profile
    try {
      profile = await requireCoordinadorOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }

    // Obtener líderes según el rol
    const lideresWhere: Record<string, unknown> = { role: 'lider' }

    // Coordinadores solo ven sus líderes
    if (profile.role === 'coordinador') {
      lideresWhere.coordinadorId = profile.id
    }

    const lideres = await prisma.profile.findMany({
      where: lideresWhere,
      select: { id: true, nombres: true, apellidos: true },
    })

    if (lideres.length === 0) {
      return NextResponse.json([])
    }

    // Obtener todas las personas
    const personas = await prisma.persona.findMany({
      select: { id: true, registradoPorId: true },
    })

    // Obtener IDs de personas confirmadas (no reversadas)
    const confirmaciones = await prisma.votoConfirmacion.findMany({
      where: { reversado: false },
      select: { personaId: true },
    })

    const personasConfirmadasIds = new Set(confirmaciones.map((c) => c.personaId))

    // Calcular estadísticas por líder
    const stats = lideres.map((lider) => {
      const personasDelLider = personas.filter((p) => p.registradoPorId === lider.id)

      const confirmadas = personasDelLider.filter((p) =>
        personasConfirmadasIds.has(p.id)
      ).length

      const pendientes = personasDelLider.length - confirmadas

      return {
        lider: `${lider.nombres} ${lider.apellidos}`,
        confirmados: confirmadas,
        pendientes: pendientes,
      }
    })

    return NextResponse.json(stats)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
