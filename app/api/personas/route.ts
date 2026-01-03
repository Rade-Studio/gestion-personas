import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile, requireCoordinadorOrAdmin, requireConsultorOrAdmin } from '@/lib/auth/helpers'
import { personaSchema } from '@/features/personas/validations/persona'
import {
  isDocumentValidationEnabled,
  checkDocumentExists,
  createPerson,
  getDocumentInfo,
} from '@/lib/pocketbase/client'

export async function GET(request: NextRequest) {
  try {
    // Permitir GET a consultores también
    let profile
    try {
      profile = await requireLiderOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }
    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const puestoVotacion = searchParams.get('puesto_votacion')
    const numeroDocumento = searchParams.get('numero_documento')
    const liderId = searchParams.get('lider_id')
    const coordinadorId = searchParams.get('coordinador_id')
    const estado = searchParams.get('estado')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('personas')
      .select('*, voto_confirmaciones(*), profiles!personas_registrado_por_fkey(nombres, apellidos, coordinador_id), barrios(id, codigo, nombre), puestos_votacion(id, codigo, nombre, direccion)', {
        count: 'exact',
      })

    // Apply filters based on role
    if (profile.role === 'admin' && coordinadorId) {
      // Admin filtra por coordinador: traer personas del coordinador y sus líderes
      const { data: lideresDelCoordinador } = await supabase
        .from('profiles')
        .select('id')
        .eq('coordinador_id', coordinadorId)
        .eq('role', 'lider')
      
      const liderIds = lideresDelCoordinador?.map(l => l.id) || []
      liderIds.push(coordinadorId) // Incluir el coordinador mismo
      
      if (liderIds.length > 0) {
        query = query.in('registrado_por', liderIds)
      } else {
        // Si no hay líderes, solo mostrar personas del coordinador
        query = query.eq('registrado_por', coordinadorId)
      }
    } else if (profile.role === 'admin' && liderId) {
      // Admin puede filtrar por cualquier líder
      query = query.eq('registrado_por', liderId)
    } else if (profile.role === 'coordinador') {
      // Coordinador solo ve personas de sus líderes y propias
      // RLS ya filtra esto, pero podemos optimizar con un filtro adicional
      if (liderId) {
        // Verificar que el líder pertenece al coordinador
        const { data: lider } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', liderId)
          .eq('coordinador_id', profile.id)
          .single()
        
        if (lider) {
          query = query.eq('registrado_por', liderId)
        } else {
          // Si el líder no pertenece al coordinador, no mostrar resultados
          return NextResponse.json({
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          })
        }
      }
      // Si no hay filtro de líder, RLS mostrará todas las personas del coordinador y sus líderes
    } else if (profile.role === 'lider') {
      // Líder solo ve sus propias personas (RLS ya lo maneja)
    }

    if (puestoVotacion) {
      // Puede ser código o ID, intentar ambos
      const puestoId = parseInt(puestoVotacion)
      if (!isNaN(puestoId)) {
        query = query.eq('puesto_votacion_id', puestoId)
      } else {
        // Si es código, buscar el ID primero
        const { data: puesto } = await supabase
          .from('puestos_votacion')
          .select('id')
          .eq('codigo', puestoVotacion)
          .single()
        if (puesto) {
          query = query.eq('puesto_votacion_id', puesto.id)
        }
      }
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

      const { voto_confirmaciones, puestos_votacion, ...personaData } = persona
      return {
        ...personaData,
        puesto_votacion: puestos_votacion || persona.puesto_votacion,
        confirmacion: confirmacion || undefined,
      }
    })

    // Filter by estado (missing_data/pendiente/confirmado) if provided
    const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'
    
    if (estado === 'missing_data') {
      transformedData = transformedData.filter((persona: any) => {
        const puestoVotacion = persona.puesto_votacion?.nombre || persona.puesto_votacion
        const faltaPuestoOMesa = !puestoVotacion || !persona.mesa_votacion
        const faltaFechaExpedicion = fechaExpedicionRequired && !persona.fecha_expedicion
        return faltaPuestoOMesa || faltaFechaExpedicion
      })
    } else if (estado === 'confirmed') {
      transformedData = transformedData.filter((persona: any) => {
        const puestoVotacion = persona.puesto_votacion?.nombre || persona.puesto_votacion
        return puestoVotacion && persona.mesa_votacion && 
        (!fechaExpedicionRequired || persona.fecha_expedicion) &&
        persona.confirmacion && !persona.confirmacion.reversado
      })
    } else if (estado === 'pending') {
      transformedData = transformedData.filter((persona: any) => {
        const puestoVotacion = persona.puesto_votacion?.nombre || persona.puesto_votacion
        return puestoVotacion && persona.mesa_votacion &&
        (!fechaExpedicionRequired || persona.fecha_expedicion) &&
        (!persona.confirmacion || persona.confirmacion.reversado)
      })
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
    // Líderes, coordinadores y admins pueden crear personas
    const profile = await requireLiderOrAdmin()
    const supabase = await createClient()

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

    // Check if numero_documento already exists in Supabase
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

    // Validar en PocketBase si está habilitado
    if (isDocumentValidationEnabled()) {
      const documentInfo = await getDocumentInfo(validatedData.numero_documento)
      if (documentInfo) {
        // Construir mensaje de error con información del representante
        let errorMessage = 'Ya existe una persona con este número de documento en el sistema externo'
        if (documentInfo.place) {
          errorMessage += ` registrado en el representante "${documentInfo.place}"`
        } else {
          errorMessage += ` (sin representante asignado)`
        }

        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('personas')
      .insert({
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
        registrado_por: profile.id,
        es_importado: false,
      })
      .select('*, barrios(id, codigo, nombre), puestos_votacion(id, codigo, nombre, direccion)')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Sincronizar con PocketBase si está habilitado
    if (isDocumentValidationEnabled() && data) {
      let candidatoNombre: string | null = null
      if (profile.candidato_id) {
        const { data: candidato } = await supabase
          .from('candidatos')
          .select('nombre_completo')
          .eq('id', profile.candidato_id)
          .single()
        candidatoNombre = candidato?.nombre_completo || null
      }

      await createPerson({
        document_number: validatedData.numero_documento,
        place: candidatoNombre,
        leader_id: profile.id,
      })
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

