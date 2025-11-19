import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'
import { personaSchema } from '@/features/personas/validations/persona'

export async function GET(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()
    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const puestoVotacion = searchParams.get('puesto_votacion')
    const numeroDocumento = searchParams.get('numero_documento')
    const liderId = searchParams.get('lider_id')
    const estado = searchParams.get('estado')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('personas')
      .select('*, voto_confirmaciones(*), profiles!personas_registrado_por_fkey(nombres, apellidos)', {
        count: 'exact',
      })

    // Apply filters based on role
    // Los líderes pueden ver todas las personas, solo los admins pueden filtrar por líder específico
    if (profile.role === 'admin' && liderId) {
      query = query.eq('registrado_por', liderId)
    }

    if (puestoVotacion) {
      query = query.eq('puesto_votacion', puestoVotacion)
    }

    if (numeroDocumento) {
      query = query.ilike('numero_documento', `%${numeroDocumento}%`)
    }

    // If filtering by estado, we need to get all matching records first, then filter in memory
    // This is because estado is determined by the confirmacion relationship and missing_data
    const shouldFilterInMemory = estado === 'confirmed' || estado === 'pending' || estado === 'missing_data'
    const queryLimit = shouldFilterInMemory ? 10000 : limit
    const queryOffset = shouldFilterInMemory ? 0 : offset

    query = query.order('created_at', { ascending: false })
      .range(queryOffset, queryOffset + queryLimit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform data: convert voto_confirmaciones array to confirmacion object
    let transformedData = (data || []).map((persona: any) => {
      const confirmaciones = persona.voto_confirmaciones || []
      // Get the most recent non-reversed confirmation, or the most recent one
      const confirmacion = confirmaciones
        .filter((c: any) => !c.reversado)
        .sort((a: any, b: any) => 
          new Date(b.confirmado_at).getTime() - new Date(a.confirmado_at).getTime()
        )[0] || confirmaciones
        .sort((a: any, b: any) => 
          new Date(b.confirmado_at).getTime() - new Date(a.confirmado_at).getTime()
        )[0]

      const { voto_confirmaciones, ...personaData } = persona
      return {
        ...personaData,
        confirmacion: confirmacion || undefined,
      }
    })

    // Filter by estado (missing_data/pendiente/confirmado) if provided
    if (estado === 'missing_data') {
      transformedData = transformedData.filter((persona: any) => 
        !persona.puesto_votacion || !persona.mesa_votacion
      )
    } else if (estado === 'confirmed') {
      transformedData = transformedData.filter((persona: any) => 
        persona.puesto_votacion && persona.mesa_votacion && 
        persona.confirmacion && !persona.confirmacion.reversado
      )
    } else if (estado === 'pending') {
      transformedData = transformedData.filter((persona: any) => 
        persona.puesto_votacion && persona.mesa_votacion &&
        (!persona.confirmacion || persona.confirmacion.reversado)
      )
    }

    // Apply pagination if we filtered in memory
    const totalFiltered = transformedData.length
    const paginatedData = shouldFilterInMemory
      ? transformedData.slice(offset, offset + limit)
      : transformedData

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: shouldFilterInMemory ? totalFiltered : (count || 0),
        totalPages: Math.ceil((shouldFilterInMemory ? totalFiltered : (count || 0)) / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()
    const supabase = await createClient()

    const body = await request.json()
    const validatedData = personaSchema.parse(body)

    // Check if numero_documento already exists
    const { data: existing } = await supabase
      .from('personas')
      .select('id')
      .eq('numero_documento', validatedData.numero_documento)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una persona con este número de documento' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('personas')
      .insert({
        ...validatedData,
        fecha_nacimiento: validatedData.fecha_nacimiento || null,
        numero_celular: validatedData.numero_celular || null,
        direccion: validatedData.direccion || null,
        barrio: validatedData.barrio || null,
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        puesto_votacion: validatedData.puesto_votacion || null,
        mesa_votacion: validatedData.mesa_votacion || null,
        registrado_por: profile.id,
        es_importado: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
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

