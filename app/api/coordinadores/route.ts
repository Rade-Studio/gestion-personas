import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, requireConsultorOrAdmin, generateSystemEmail } from '@/lib/auth/helpers'
import { coordinadorSchema } from '@/features/coordinadores/validations/coordinador'

export async function GET(request: NextRequest) {
  try {
    // Permitir GET a consultores también
    try {
      await requireAdmin()
    } catch {
      await requireConsultorOrAdmin()
    }
    const supabase = await createClient()

    const { data: coordinadores, error } = await supabase
      .from('profiles')
      .select(`
        *,
        candidato:candidatos(id, nombre_completo)
      `)
      .eq('role', 'coordinador')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Obtener conteo de líderes para cada coordinador
    if (coordinadores && coordinadores.length > 0) {
      const coordinadoresConLideres = await Promise.all(
        coordinadores.map(async (coordinador) => {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('coordinador_id', coordinador.id)
            .eq('role', 'lider')
          
          return {
            ...coordinador,
            lideres_count: count || 0,
          }
        })
      )

      return NextResponse.json({ data: coordinadoresConLideres })
    }

    return NextResponse.json({ data: coordinadores || [] })
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
    const validatedData = coordinadorSchema.parse(body)

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

    // Get default candidate if candidato_id not provided
    let candidatoId = validatedData.candidato_id?.trim() || null
    if (!candidatoId) {
      const { data: defaultCandidato } = await supabase
        .from('candidatos')
        .select('id')
        .eq('es_por_defecto', true)
        .single()
      
      if (defaultCandidato) {
        candidatoId = defaultCandidato.id
      }
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
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        zona: validatedData.zona || null,
        candidato_id: candidatoId,
        role: 'coordinador',
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

