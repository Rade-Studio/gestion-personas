import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoordinadorOrAdmin, getCurrentProfile, requireConsultorOrAdmin } from '@/lib/auth/helpers'
import { liderSchema } from '@/features/lideres/validations/lider'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Permitir GET a consultores también
    let profile
    try {
      profile = await requireCoordinadorOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }
    const { id } = await params
    const supabase = await createClient()

    let query = supabase
      .from('profiles')
      .select(`
        *,
        puesto_votacion:puestos_votacion(id, nombre, codigo)
      `)
      .eq('id', id)
      .eq('role', 'lider')

    // Coordinadores solo pueden ver sus propios líderes
    if (profile.role === 'coordinador') {
      query = query.eq('coordinador_id', profile.id)
    }

    const { data, error } = await query.single()

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
    // Consultores no pueden modificar
    const profile = await requireCoordinadorOrAdmin()
    if (profile.role === 'consultor') {
      return NextResponse.json(
        { error: 'No autorizado: los consultores no pueden modificar registros' },
        { status: 403 }
      )
    }
    const { id } = await params
    const supabase = await createClient()

    const body = await request.json()
    const validatedData = liderSchema.parse(body)

    // Check if lider exists and belongs to coordinador if applicable
    let query = supabase
      .from('profiles')
      .select('id, numero_documento, coordinador_id')
      .eq('id', id)
      .eq('role', 'lider')

    if (profile.role === 'coordinador') {
      query = query.eq('coordinador_id', profile.id)
    }

    const { data: existing, error: existingError } = await query.single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Líder no encontrado' },
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

      // Si cambió el número de documento, actualizar email y contraseña
      const adminClient = createAdminClient()
      const newEmail = generateSystemEmail(validatedData.numero_documento)
      const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(id, {
        email: newEmail,
        password: validatedData.numero_documento,
      })

      if (updateAuthError) {
        return NextResponse.json(
          { error: 'Error al actualizar credenciales: ' + updateAuthError.message },
          { status: 500 }
        )
      }
    }

    // Determine candidato_id: coordinadores mantienen el candidato del coordinador
    let candidatoId = validatedData.candidato_id?.trim() || null
    if (profile.role === 'coordinador') {
      // Coordinadores: mantener el candidato del coordinador
      candidatoId = profile.candidato_id || null
    } else if (profile.role === 'admin' && validatedData.coordinador_id?.trim()) {
      // Si admin asigna un coordinador, heredar su candidato
      const { data: coordinador } = await supabase
        .from('profiles')
        .select('candidato_id')
        .eq('id', validatedData.coordinador_id.trim())
        .eq('role', 'coordinador')
        .single()
      
      if (coordinador?.candidato_id && !candidatoId) {
        candidatoId = coordinador.candidato_id
      }
    }

    // Update profile
    const updateData: any = {
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
      puesto_votacion_id: validatedData.puesto_votacion_id || null,
      mesa_votacion: validatedData.mesa_votacion || null,
    }

    // Solo admins pueden cambiar el coordinador_id
    if (profile.role === 'admin' && validatedData.coordinador_id !== undefined) {
      updateData.coordinador_id = validatedData.coordinador_id?.trim() || null
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
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
    // Consultores no pueden eliminar
    const profile = await requireCoordinadorOrAdmin()
    if (profile.role === 'consultor') {
      return NextResponse.json(
        { error: 'No autorizado: los consultores no pueden eliminar registros' },
        { status: 403 }
      )
    }
    const { id } = await params
    const supabase = await createClient()

    // Check if lider exists and belongs to coordinador if applicable
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'lider')

    if (profile.role === 'coordinador') {
      query = query.eq('coordinador_id', profile.id)
    }

    const { data: existing, error: existingError } = await query.single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Líder no encontrado' },
        { status: 404 }
      )
    }

    // Check if lider has registered personas
    const { data: personas } = await supabase
      .from('personas')
      .select('id')
      .eq('registrado_por', id)
      .limit(1)

    if (personas && personas.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el líder porque tiene personas registradas' },
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

