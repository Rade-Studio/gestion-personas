import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { numero_documento } = body

    if (!numero_documento) {
      return NextResponse.json(
        { error: 'Número de documento requerido' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Buscar el perfil por número de documento
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('numero_documento')
      .eq('numero_documento', numero_documento)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Construir el email automático
    const email = `${numero_documento}@sistema.local`

    return NextResponse.json({ email })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: 500 }
    )
  }
}

