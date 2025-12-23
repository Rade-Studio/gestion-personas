import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'
import { personaSchema } from '@/features/personas/validations/persona'
import { isDocumentValidationEnabled, deletePerson } from '@/lib/pocketbase/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireLiderOrAdmin()
    const { id } = await params
    const supabase = await createClient()

    let query = supabase
      .from('personas')
      .select('*, voto_confirmaciones(*), profiles!personas_registrado_por_fkey(nombres, apellidos), barrios(id, codigo, nombre), puestos_votacion(id, codigo, nombre, direccion)')
      .eq('id', id)

    // If lider, only allow access to own personas
    if (profile.role === 'lider') {
      query = query.eq('registrado_por', profile.id)
    }

    const { data, error } = await query.single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    // Transform data: convert voto_confirmaciones array to confirmacion object
    const confirmaciones = data.voto_confirmaciones || []
    const confirmacion = confirmaciones
      .filter((c: any) => !c.reversado)
      .sort((a: any, b: any) => 
        new Date(b.confirmado_at).getTime() - new Date(a.confirmado_at).getTime()
      )[0] || confirmaciones
      .sort((a: any, b: any) => 
        new Date(b.confirmado_at).getTime() - new Date(a.confirmado_at).getTime()
      )[0]

    const { voto_confirmaciones, ...personaData } = data
    const transformedData = {
      ...personaData,
      confirmacion: confirmacion || undefined,
    }

    return NextResponse.json({ data: transformedData })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireLiderOrAdmin()
    const { id } = await params
    const supabase = await createClient()

    // Check if persona exists and user has permission
    let personaQuery = supabase
      .from('personas')
      .select('id, numero_documento, registrado_por')
      .eq('id', id)

    if (profile.role === 'lider') {
      personaQuery = personaQuery.eq('registrado_por', profile.id)
    }

    const { data: existingPersona, error: personaError } = await personaQuery.single()

    if (personaError || !existingPersona) {
      return NextResponse.json(
        { error: 'Persona no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = personaSchema.parse(body)

    // Validar fecha_expedicion si es requerida
    const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'
    if (fechaExpedicionRequired && (!validatedData.fecha_expedicion || validatedData.fecha_expedicion.trim() === '')) {
      return NextResponse.json(
        { error: 'La fecha de expedición es obligatoria' },
        { status: 400 }
      )
    }

    // Check if numero_documento already exists (excluding current record)
    if (validatedData.numero_documento !== existingPersona.numero_documento) {
      const { data: duplicate } = await supabase
        .from('personas')
        .select('id')
        .eq('numero_documento', validatedData.numero_documento)
        .neq('id', id)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe una persona con este número de documento' },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('personas')
      .update({
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        tipo_documento: validatedData.tipo_documento,
        numero_documento: validatedData.numero_documento,
        fecha_nacimiento: validatedData.fecha_nacimiento || null,
        fecha_expedicion: validatedData.fecha_expedicion || null,
        profesion: validatedData.profesion || null,
        numero_celular: validatedData.numero_celular || null,
        direccion: validatedData.direccion || null,
        barrio_id: validatedData.barrio_id || null,
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        puesto_votacion_id: validatedData.puesto_votacion_id || null,
        mesa_votacion: validatedData.mesa_votacion || null,
      })
      .eq('id', id)
      .select('*, barrios(id, codigo, nombre), puestos_votacion(id, codigo, nombre, direccion)')
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireLiderOrAdmin()
    const { id } = await params
    const supabase = await createClient()

    // Check if persona exists and user has permission
    let personaQuery = supabase
      .from('personas')
      .select('id, numero_documento, registrado_por')
      .eq('id', id)

    if (profile.role === 'lider') {
      personaQuery = personaQuery.eq('registrado_por', profile.id)
    }

    const { data: existingPersona, error: personaError } = await personaQuery.single()

    if (personaError || !existingPersona) {
      return NextResponse.json(
        { error: 'Persona no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Eliminar también de PocketBase si está habilitado
    if (isDocumentValidationEnabled() && existingPersona.numero_documento) {
      await deletePerson(existingPersona.numero_documento)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

