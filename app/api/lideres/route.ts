import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'
import { liderSchema } from '@/features/lideres/validations/lider'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const body = await request.json()
    const validatedData = liderSchema.parse(body)

    // Check if numero_documento already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('numero_documento', validatedData.numero_documento)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este número de documento' },
        { status: 400 }
      )
    }

    // Generate default email if not provided
    const email = validatedData.email?.trim() || `${validatedData.numero_documento}@sistema.local`
    const password = validatedData.password?.trim() || `Lider${validatedData.numero_documento.slice(-4)}`

    // Create auth user using admin client
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Error al crear usuario: ' + (authError?.message || 'Error desconocido') },
        { status: 500 }
      )
    }

    // Create profile using admin client to bypass RLS
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        tipo_documento: validatedData.tipo_documento,
        numero_documento: validatedData.numero_documento,
        fecha_nacimiento: validatedData.fecha_nacimiento || null,
        telefono: validatedData.telefono || null,
        role: 'lider',
      })
      .select()
      .single()

    if (profileError) {
      // Try to delete auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        data: profile,
        credentials: {
          email,
          password,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

