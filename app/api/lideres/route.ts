import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoordinadorOrAdmin, getCurrentProfile, requireConsultorOrAdmin, generateSystemEmail } from '@/lib/auth/helpers'
import { liderSchema } from '@/features/lideres/validations/lider'

export async function GET(request: NextRequest) {
  try {
    // Permitir GET a consultores también
    let profile
    try {
      profile = await requireCoordinadorOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }
    const supabase = await createClient()

    let query = supabase
      .from('profiles')
      .select(`
        *,
        candidato:candidatos(id, nombre_completo),
        puesto_votacion:puestos_votacion(id, nombre, codigo),
        barrio:barrios(id, codigo, nombre)
      `)
      .eq('role', 'lider')

    // Coordinadores solo ven sus líderes, admins ven todos
    if (profile.role === 'coordinador') {
      query = query.eq('coordinador_id', profile.id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

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
    // Consultores no pueden crear
    const profile = await requireCoordinadorOrAdmin()
    if (profile.role === 'consultor') {
      return NextResponse.json(
        { error: 'No autorizado: los consultores no pueden crear registros' },
        { status: 403 }
      )
    }
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

    // Email y contraseña automáticos basados en número de documento
    const email = generateSystemEmail(validatedData.numero_documento)
    const password = validatedData.numero_documento

    // Get candidato_id: coordinadores heredan su candidato, admins pueden especificar o usar default
    let candidatoId = validatedData.candidato_id?.trim() || null
    if (profile.role === 'coordinador') {
      // Coordinadores: heredar candidato del coordinador
      candidatoId = profile.candidato_id || null
    } else if (!candidatoId) {
      // Admins: usar candidato por defecto si no se especifica
      const { data: defaultCandidato } = await supabase
        .from('candidatos')
        .select('id')
        .eq('es_por_defecto', true)
        .single()
      
      if (defaultCandidato) {
        candidatoId = defaultCandidato.id
      }
    }

    // Determine coordinador_id
    let coordinadorId = profile.role === 'coordinador' ? profile.id : null
    // Admins can specify coordinador_id from the form
    if (profile.role === 'admin' && validatedData.coordinador_id?.trim()) {
      coordinadorId = validatedData.coordinador_id.trim()
    }

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
    const { data: newProfile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
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
        candidato_id: candidatoId,
        coordinador_id: coordinadorId,
        puesto_votacion_id: validatedData.puesto_votacion_id || null,
        mesa_votacion: validatedData.mesa_votacion || null,
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
        data: newProfile,
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

