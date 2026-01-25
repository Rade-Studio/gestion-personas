import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'

export async function GET() {
  try {
    const profile = await requireLiderOrAdmin()

    // Build where clause based on role
    let personaWhere: Record<string, unknown> = {}

    if (profile.role === 'lider') {
      personaWhere = { registradoPorId: profile.id }
    } else if (profile.role === 'coordinador') {
      // Coordinadores see personas from their leaders and own
      const lideres = await prisma.profile.findMany({
        where: {
          coordinadorId: profile.id,
          role: 'lider',
        },
        select: { id: true },
      })

      const liderIds = lideres.map((l) => l.id)
      liderIds.push(profile.id) // Include coordinador's own personas

      personaWhere = { registradoPorId: { in: liderIds } }
    }
    // For admin and consultor, no filter (see all)

    // Count total personas
    const totalPersonas = await prisma.persona.count({ where: personaWhere })

    if (totalPersonas === 0) {
      return NextResponse.json({
        total_registradas: 0,
        total_confirmadas: 0,
        total_no_confirmadas: 0,
      })
    }

    // Get persona IDs for confirmed count
    const personas = await prisma.persona.findMany({
      where: personaWhere,
      select: { id: true },
    })

    const personaIds = personas.map((p) => p.id)

    // Count confirmed votes (non-reversed)
    const totalConfirmadas = await prisma.votoConfirmacion.count({
      where: {
        personaId: { in: personaIds },
        reversado: false,
      },
    })

    const totalNoConfirmadas = totalPersonas - totalConfirmadas

    return NextResponse.json({
      total_registradas: totalPersonas,
      total_confirmadas: totalConfirmadas,
      total_no_confirmadas: totalNoConfirmadas,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
