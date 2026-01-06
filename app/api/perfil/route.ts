import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'
import { liderSchema } from '@/features/lideres/validations/lider'

export async function PUT(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()
    const supabase = await createClient()

    const body = await request.json()
    const validatedData = liderSchema.parse(body)

    // Check if numero_documento already exists (excluding current user)
    if (validatedData.numero_documento !== profile.numero_documento) {
      const { data: duplicate } = await supabase
        .from('profiles')
        .select('id')
        .eq('numero_documento', validatedData.numero_documento)
        .neq('id', profile.id)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este número de documento' },
          { status: 400 }
        )
      }
    }

    // Update profile (user can only update their own profile)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        tipo_documento: validatedData.tipo_documento,
        numero_documento: validatedData.numero_documento,
        fecha_nacimiento: validatedData.fecha_nacimiento || null,
        telefono: validatedData.telefono || null,
        direccion: validatedData.direccion || null,
        barrio_id: validatedData.barrio_id || null,
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        zona: validatedData.zona || null,
        puesto_votacion_id: validatedData.puesto_votacion_id || null,
        mesa_votacion: validatedData.mesa_votacion || null,
      })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

