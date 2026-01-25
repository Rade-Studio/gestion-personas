import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, requireConsultorOrAdmin } from '@/lib/auth/helpers'

export async function GET() {
  try {
    // Permitir acceso a admins y consultores
    try {
      await requireAdmin()
    } catch {
      await requireConsultorOrAdmin()
    }

    // Obtener todas las personas
    const personas = await prisma.persona.findMany({
      select: { id: true, registradoPorId: true },
    })

    if (personas.length === 0) {
      return NextResponse.json([])
    }

    // Obtener todos los perfiles (líderes y coordinadores) con su candidato_id
    const perfiles = await prisma.profile.findMany({
      where: { role: { in: ['lider', 'coordinador'] } },
      select: { id: true, candidatoId: true },
    })

    // Crear mapa de registrado_por -> candidato_id
    const perfilCandidatoMap = new Map<string, string | null>()
    perfiles.forEach((perfil) => {
      perfilCandidatoMap.set(perfil.id, perfil.candidatoId)
    })

    // Obtener todas las confirmaciones no reversadas
    const confirmaciones = await prisma.votoConfirmacion.findMany({
      where: { reversado: false },
      select: { personaId: true },
    })

    const personasConfirmadasIds = new Set(confirmaciones.map((c) => c.personaId))

    // Agrupar personas por candidato_id
    const candidatoStats = new Map<string, { confirmadas: number; pendientes: number }>()

    personas.forEach((persona) => {
      const candidatoId = perfilCandidatoMap.get(persona.registradoPorId)

      // Si no tiene candidato asignado, usar "Sin representante"
      const key = candidatoId || 'sin_representante'

      if (!candidatoStats.has(key)) {
        candidatoStats.set(key, { confirmadas: 0, pendientes: 0 })
      }

      const stats = candidatoStats.get(key)!
      if (personasConfirmadasIds.has(persona.id)) {
        stats.confirmadas++
      } else {
        stats.pendientes++
      }
    })

    // Obtener nombres de candidatos
    const candidatoIds = Array.from(candidatoStats.keys()).filter(
      (id) => id !== 'sin_representante'
    )
    const candidatos = await prisma.candidato.findMany({
      where: { id: { in: candidatoIds } },
      select: { id: true, nombreCompleto: true },
    })

    const candidatoNombreMap = new Map<string, string>()
    candidatos.forEach((candidato) => {
      candidatoNombreMap.set(candidato.id, candidato.nombreCompleto)
    })

    // Convertir a array de objetos
    const stats = Array.from(candidatoStats.entries()).map(([candidatoId, stat]) => {
      const nombre =
        candidatoId === 'sin_representante'
          ? 'Sin representante'
          : candidatoNombreMap.get(candidatoId) || 'Representante desconocido'

      return {
        representante: nombre,
        confirmadas: stat.confirmadas,
        pendientes: stat.pendientes,
      }
    })

    // Ordenar por nombre del representante
    stats.sort((a, b) => a.representante.localeCompare(b.representante))

    return NextResponse.json(stats)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
