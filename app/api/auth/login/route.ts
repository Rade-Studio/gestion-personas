import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loginSchema } from '@/features/auth/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Determinar si es email o número de documento
    const isEmail = validatedData.email.includes('@')
    let emailToUse = validatedData.email

    // Si no es email, buscar el email asociado al número de documento
    if (!isEmail) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('numero_documento')
        .eq('numero_documento', validatedData.email)
        .single()

      if (!profile) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      // Construir el email automático
      emailToUse = `${validatedData.email}@sistema.local`
    }

    // Intentar login con el email encontrado o proporcionado
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: validatedData.password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: data.user })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: 500 }
    )
  }
}

