import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdminOrCoordinador, getCurrentProfile } from '@/lib/auth/helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Coordinadores solo pueden ver sus propios líderes
    if (profile.role === 'coordinador' && profile.id !== id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Solo admins y coordinadores pueden acceder
    if (profile.role !== 'admin' && profile.role !== 'coordinador') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        candidato:candidatos(id, nombre_completo)
      `)
      .eq('coordinador_id', id)
      .eq('role', 'lider')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

