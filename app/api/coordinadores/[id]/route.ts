import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'
import { coordinadorSchema } from '@/features/coordinadores/validations/coordinador'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        candidato:candidatos(id, nombre_completo)
      `)
      .eq('id', id)
      .eq('role', 'coordinador')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createClient()

    const body = await request.json()
    const validatedData = coordinadorSchema.parse(body)

    // Check if coordinador exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, numero_documento')
      .eq('id', id)
      .eq('role', 'coordinador')
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Coordinador no encontrado' },
        { status: 404 }
      )
    }

    // Check if numero_documento already exists (excluding current record)
    if (validatedData.numero_documento !== existing.numero_documento) {
      const { data: duplicate } = await supabase
        .from('profiles')
        .select('id')
        .eq('numero_documento', validatedData.numero_documento)
        .neq('id', id)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este número de documento' },
          { status: 400 }
        )
      }
    }

    // Update password if provided
    if (validatedData.password?.trim()) {
      const adminClient = createAdminClient()
      const { error: passwordError } = await adminClient.auth.admin.updateUserById(id, {
        password: validatedData.password.trim(),
      })

      if (passwordError) {
        return NextResponse.json(
          { error: 'Error al actualizar contraseña: ' + passwordError.message },
          { status: 500 }
        )
      }
    }

    // Update profile
    const candidatoId = validatedData.candidato_id?.trim() || null
    const { data, error } = await supabase
      .from('profiles')
      .update({
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        tipo_documento: validatedData.tipo_documento,
        numero_documento: validatedData.numero_documento,
        fecha_nacimiento: validatedData.fecha_nacimiento || null,
        telefono: validatedData.telefono || null,
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        zona: validatedData.zona || null,
        candidato_id: candidatoId,
      })
      .eq('id', id)
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
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createClient()

    // Check if coordinador exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'coordinador')
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Coordinador no encontrado' },
        { status: 404 }
      )
    }

    // Check if coordinador has registered personas
    const { data: personas } = await supabase
      .from('personas')
      .select('id')
      .eq('registrado_por', id)
      .limit(1)

    if (personas && personas.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el coordinador porque tiene personas registradas' },
        { status: 400 }
      )
    }

    // Check if coordinador has leaders
    const { data: lideres } = await supabase
      .from('profiles')
      .select('id')
      .eq('coordinador_id', id)
      .limit(1)

    if (lideres && lideres.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el coordinador porque tiene líderes asignados' },
        { status: 400 }
      )
    }

    // Delete auth user (this will cascade delete profile due to foreign key)
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Error al eliminar usuario: ' + deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

