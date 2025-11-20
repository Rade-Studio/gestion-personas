import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Obtener todos los líderes con sus personas registradas
    const { data: lideres, error: lideresError } = await supabase
      .from('profiles')
      .select('id, nombres, apellidos')
      .eq('role', 'lider')

    if (lideresError) {
      throw new Error('Error al obtener líderes: ' + lideresError.message)
    }

    if (!lideres || lideres.length === 0) {
      return NextResponse.json([])
    }

    // Obtener todas las personas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, registrado_por')

    if (personasError) {
      throw new Error('Error al obtener personas: ' + personasError.message)
    }

    // Obtener IDs de personas confirmadas (no reversadas)
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

    // Calcular estadísticas por líder
    const stats = lideres.map((lider) => {
      const personasDelLider = personas?.filter(
        (p) => p.registrado_por === lider.id
      ) || []

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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

