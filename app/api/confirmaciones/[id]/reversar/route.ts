import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireLiderOrAdmin()
    const { id } = await params
    const supabase = await createClient()

    // Get confirmacion
    const { data: confirmacion, error: confirmacionError } = await supabase
      .from('voto_confirmaciones')
      .select('*, personas(registrado_por)')
      .eq('id', id)
      .single()

    if (confirmacionError || !confirmacion) {
      return NextResponse.json(
        { error: 'Confirmación no encontrada' },
        { status: 404 }
      )
    }

    // Check permissions
    const persona = confirmacion.personas as any
    if (profile.role === 'lider' && persona.registrado_por !== profile.id) {
      return NextResponse.json(
        { error: 'Sin permisos para reversar esta confirmación' },
        { status: 403 }
      )
    }

    if (confirmacion.reversado) {
      return NextResponse.json(
        { error: 'Esta confirmación ya fue reversada' },
        { status: 400 }
      )
    }

    // Update confirmacion
    const { data: updatedConfirmacion, error: updateError } = await supabase
      .from('voto_confirmaciones')
      .update({
        reversado: true,
        reversado_por: profile.id,
        reversado_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al reversar confirmación: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedConfirmacion })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

