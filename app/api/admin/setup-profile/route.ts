import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/helpers'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const body = await request.json()
    const { role, nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, telefono } = body

    // Verificar si el perfil ya existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      // Actualizar perfil existente - NO permitir cambiar el rol
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          // No actualizar el rol, mantener el existente
          nombres: nombres || existingProfile.nombres,
          apellidos: apellidos || existingProfile.apellidos,
          tipo_documento: tipo_documento || existingProfile.tipo_documento,
          numero_documento: numero_documento || existingProfile.numero_documento,
          fecha_nacimiento: fecha_nacimiento || existingProfile.fecha_nacimiento,
          telefono: telefono || existingProfile.telefono,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Error al actualizar perfil: ' + updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ data: updatedProfile, message: 'Perfil actualizado' })
    } else {
      // Crear nuevo perfil
      if (!nombres || !apellidos || !tipo_documento || !numero_documento) {
        return NextResponse.json(
          { error: 'Faltan datos requeridos para crear el perfil' },
          { status: 400 }
        )
      }

      // Solo permitir establecer rol al crear perfil, pero por defecto es 'lider'
      // El rol solo puede ser establecido por un admin al crear líderes
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          nombres,
          apellidos,
          tipo_documento,
          numero_documento,
          fecha_nacimiento: fecha_nacimiento || null,
          telefono: telefono || null,
          role: 'lider', // Siempre 'lider' por defecto, solo admins pueden crear otros admins
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Error al crear perfil: ' + createError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ data: newProfile, message: 'Perfil creado' }, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

