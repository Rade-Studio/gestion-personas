import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireConsultorOrAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    // Permitir acceso a admins y consultores
    try {
      await requireAdmin()
    } catch {
      await requireConsultorOrAdmin()
    }
    const supabase = await createClient()

    // Obtener todas las personas con información del que las registró
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, registrado_por')

    if (personasError) {
      throw new Error('Error al obtener personas: ' + personasError.message)
    }

    if (!personas || personas.length === 0) {
      return NextResponse.json([])
    }

    // Obtener todos los perfiles (líderes y coordinadores) con su candidato_id
    const { data: perfiles, error: perfilesError } = await supabase
      .from('profiles')
      .select('id, candidato_id')
      .in('role', ['lider', 'coordinador'])

    if (perfilesError) {
      throw new Error('Error al obtener perfiles: ' + perfilesError.message)
    }

    // Crear mapa de registrado_por -> candidato_id
    const perfilCandidatoMap = new Map<string, string | null>()
    perfiles?.forEach((perfil) => {
      perfilCandidatoMap.set(perfil.id, perfil.candidato_id || null)
    })

    // Obtener todas las confirmaciones no reversadas
    const { data: confirmaciones, error: confirmacionesError } = await supabase
      .from('voto_confirmaciones')
      .select('persona_id')
      .eq('reversado', false)

    if (confirmacionesError) {
      throw new Error('Error al obtener confirmaciones: ' + confirmacionesError.message)
    }

    const personasConfirmadasIds = new Set(
      confirmaciones?.map((c) => c.persona_id) || []
    )

    // Agrupar personas por candidato_id
    const candidatoStats = new Map<string, { confirmadas: number; pendientes: number }>()

    personas.forEach((persona) => {
      const candidatoId = perfilCandidatoMap.get(persona.registrado_por)
      
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
    const candidatoIds = Array.from(candidatoStats.keys()).filter(id => id !== 'sin_representante')
    const { data: candidatos } = await supabase
      .from('candidatos')
      .select('id, nombre_completo')
      .in('id', candidatoIds)

    const candidatoNombreMap = new Map<string, string>()
    candidatos?.forEach((candidato) => {
      candidatoNombreMap.set(candidato.id, candidato.nombre_completo)
    })

    // Convertir a array de objetos
    const stats = Array.from(candidatoStats.entries()).map(([candidatoId, stats]) => {
      const nombre = candidatoId === 'sin_representante' 
        ? 'Sin representante' 
        : candidatoNombreMap.get(candidatoId) || 'Representante desconocido'
      
      return {
        representante: nombre,
        confirmadas: stats.confirmadas,
        pendientes: stats.pendientes,
      }
    })

    // Ordenar por nombre del representante
    stats.sort((a, b) => a.representante.localeCompare(b.representante))

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

