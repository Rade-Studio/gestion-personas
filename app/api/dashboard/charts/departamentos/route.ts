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

    // Obtener personas agrupadas por departamento y municipio
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('departamento, municipio')

    if (personasError) {
      throw new Error('Error al obtener personas: ' + personasError.message)
    }

    if (!personas || personas.length === 0) {
      return NextResponse.json([])
    }

    // Agrupar por departamento y municipio
    const agrupacion = new Map<string, number>()

    personas.forEach((persona) => {
      const dept = persona.departamento || 'Sin departamento'
      const muni = persona.municipio || 'Sin municipio'
      const key = `${dept}|${muni}`

      agrupacion.set(key, (agrupacion.get(key) || 0) + 1)
    })

    // Convertir a array de objetos
    const stats = Array.from(agrupacion.entries()).map(([key, cantidad]) => {
      const [departamento, municipio] = key.split('|')
      return {
        departamento,
        municipio,
        cantidad,
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

