import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Obtener votos confirmados con información de departamento y municipio de la persona
    const { data: confirmaciones, error: confirmacionesError } = await supabase
      .from('voto_confirmaciones')
      .select('persona_id, personas(departamento, municipio)')
      .eq('reversado', false)

    if (confirmacionesError) {
      throw new Error('Error al obtener confirmaciones: ' + confirmacionesError.message)
    }

    if (!confirmaciones || confirmaciones.length === 0) {
      return NextResponse.json([])
    }

    // Agrupar por departamento y municipio
    const agrupacion = new Map<string, number>()

    confirmaciones.forEach((confirmacion: any) => {
      const persona = confirmacion.personas
      if (!persona) return

      const dept = persona.departamento || 'Sin departamento'
      const muni = persona.municipio || 'Sin municipio'
      const key = `${dept}|${muni}`

      agrupacion.set(key, (agrupacion.get(key) || 0) + 1)
    })

    // Convertir a array de objetos
    const stats = Array.from(agrupacion.entries()).map(([key, confirmados]) => {
      const [departamento, municipio] = key.split('|')
      return {
        departamento,
        municipio,
        confirmados,
      }
    })

    // Ordenar por departamento y luego por municipio
    stats.sort((a, b) => {
      if (a.departamento !== b.departamento) {
        return a.departamento.localeCompare(b.departamento)
      }
      return a.municipio.localeCompare(b.municipio)
    })

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

