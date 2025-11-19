import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()
    const supabase = await createClient()

    let personasQuery = supabase
      .from('personas')
      .select('id', { count: 'exact', head: true })

    // If lider, only count own personas
    if (profile.role === 'lider') {
      personasQuery = personasQuery.eq('registrado_por', profile.id)
    }

    const { count: totalPersonas } = await personasQuery

    // Count confirmed votes
    let confirmedCountQuery = supabase
      .from('voto_confirmaciones')
      .select('persona_id', { count: 'exact', head: true })
      .eq('reversado', false)

    if (profile.role === 'lider') {
      // Get persona IDs for this lider
      const { data: personaIds } = await supabase
        .from('personas')
        .select('id')
        .eq('registrado_por', profile.id)

      if (personaIds && personaIds.length > 0) {
        confirmedCountQuery = confirmedCountQuery.in(
          'persona_id',
          personaIds.map((p) => p.id)
        )
      } else {
        return NextResponse.json({
          total_registradas: 0,
          total_confirmadas: 0,
          total_no_confirmadas: 0,
        })
      }
    } else {
      // For admin, count all non-reversed confirmations
      // We need to join with personas to ensure we're counting correctly
      const { data: allPersonas } = await supabase
        .from('personas')
        .select('id')

      if (allPersonas && allPersonas.length > 0) {
        confirmedCountQuery = confirmedCountQuery.in(
          'persona_id',
          allPersonas.map((p) => p.id)
        )
      }
    }

    const { count: totalConfirmadas } = await confirmedCountQuery

    const totalNoConfirmadas = (totalPersonas || 0) - (totalConfirmadas || 0)

    return NextResponse.json({
      total_registradas: totalPersonas || 0,
      total_confirmadas: totalConfirmadas || 0,
      total_no_confirmadas: totalNoConfirmadas,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

