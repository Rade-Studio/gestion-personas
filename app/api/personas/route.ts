import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin, requireConsultorOrAdmin } from '@/lib/auth/helpers'
import { personaSchema } from '@/features/personas/validations/persona'
import {
  isDocumentValidationEnabled,
  checkDocumentExists,
  createPerson,
  getDocumentInfo,
} from '@/lib/pocketbase/client'
import type { DocumentoTipo } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Permitir GET a consultores también
    let profile
    try {
      profile = await requireLiderOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }

    const searchParams = request.nextUrl.searchParams
    const puestoVotacionArray = searchParams.getAll('puesto_votacion')
    const barrioIdArray = searchParams.getAll('barrio_id')
    const numeroDocumento = searchParams.get('numero_documento')
    const liderId = searchParams.get('lider_id')
    const coordinadorId = searchParams.get('coordinador_id')
    const estado = searchParams.get('estado')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    // Apply filters based on role
    if (profile.role === 'admin' && coordinadorId) {
      // Admin filtra por coordinador: traer personas del coordinador y sus líderes
      const lideresDelCoordinador = await prisma.profile.findMany({
        where: {
          coordinadorId: coordinadorId,
          role: 'lider',
        },
        select: { id: true },
      })

      const liderIds = lideresDelCoordinador.map((l) => l.id)
      liderIds.push(coordinadorId) // Incluir el coordinador mismo

      where.registradoPorId = { in: liderIds }
    } else if (profile.role === 'admin' && liderId) {
      where.registradoPorId = liderId
    } else if (profile.role === 'coordinador') {
      if (liderId) {
        // Verificar que el líder pertenece al coordinador
        const lider = await prisma.profile.findFirst({
          where: {
            id: liderId,
            coordinadorId: profile.id,
          },
        })

        if (lider) {
          where.registradoPorId = liderId
        } else {
          return NextResponse.json({
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          })
        }
      } else {
        // Sin filtro de líder, mostrar todas las personas del coordinador y sus líderes
        const lideresDelCoordinador = await prisma.profile.findMany({
          where: {
            coordinadorId: profile.id,
            role: 'lider',
          },
          select: { id: true },
        })

        const liderIds = lideresDelCoordinador.map((l) => l.id)
        liderIds.push(profile.id)

        where.registradoPorId = { in: liderIds }
      }
    } else if (profile.role === 'lider') {
      where.registradoPorId = profile.id
    }

    // Handle multiple puesto_votacion filters
    if (puestoVotacionArray.length > 0) {
      const puestoIds = puestoVotacionArray
        .map((pv) => parseInt(pv))
        .filter((id) => !isNaN(id))

      if (puestoIds.length > 0) {
        where.puestoVotacionId = { in: puestoIds }
      }
    }

    // Handle multiple barrio_id filters
    if (barrioIdArray.length > 0) {
      const barrioIds = barrioIdArray.map((bid) => parseInt(bid)).filter((id) => !isNaN(id))

      if (barrioIds.length > 0) {
        where.barrioId = { in: barrioIds }
      }
    }

    if (numeroDocumento) {
      where.numeroDocumento = { contains: numeroDocumento, mode: 'insensitive' }
    }

    // If filtering by estado, we need to get all matching records first, then filter in memory
    const shouldFilterInMemory =
      estado === 'confirmed' || estado === 'pending' || estado === 'missing_data'
    const queryLimit = shouldFilterInMemory ? 10000 : limit
    const queryOffset = shouldFilterInMemory ? 0 : offset

    const [data, count] = await Promise.all([
      prisma.persona.findMany({
        where,
        include: {
          confirmaciones: true,
          registradoPor: {
            select: { nombres: true, apellidos: true, coordinadorId: true },
          },
          barrio: { select: { id: true, codigo: true, nombre: true } },
          puestoVotacion: { select: { id: true, codigo: true, nombre: true, direccion: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: queryOffset,
        take: queryLimit,
      }),
      prisma.persona.count({ where }),
    ])

    // Transform data
    const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'

    let transformedData = data.map((persona) => {
      const confirmaciones = persona.confirmaciones || []
      const confirmacion =
        confirmaciones
          .filter((c) => !c.reversado)
          .sort((a, b) => b.confirmadoAt.getTime() - a.confirmadoAt.getTime())[0] ||
        confirmaciones.sort((a, b) => b.confirmadoAt.getTime() - a.confirmadoAt.getTime())[0]

      return {
        id: persona.id,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        tipo_documento: persona.tipoDocumento,
        numero_documento: persona.numeroDocumento,
        fecha_nacimiento: persona.fechaNacimiento?.toISOString().split('T')[0],
        fecha_expedicion: persona.fechaExpedicion?.toISOString().split('T')[0],
        profesion: persona.profesion,
        edad: persona.edad,
        numero_celular: persona.numeroCelular,
        direccion: persona.direccion,
        barrio_id: persona.barrioId,
        barrios: persona.barrio,
        departamento: persona.departamento,
        municipio: persona.municipio,
        puesto_votacion_id: persona.puestoVotacionId,
        puesto_votacion: persona.puestoVotacion,
        mesa_votacion: persona.mesaVotacion,
        registrado_por: persona.registradoPorId,
        profiles: persona.registradoPor,
        es_importado: persona.esImportado,
        importacion_id: persona.importacionId,
        created_at: persona.createdAt.toISOString(),
        updated_at: persona.updatedAt.toISOString(),
        confirmacion: confirmacion
          ? {
              id: confirmacion.id,
              persona_id: confirmacion.personaId,
              imagen_url: confirmacion.imagenUrl,
              imagen_path: confirmacion.imagenPath,
              confirmado_por: confirmacion.confirmadoPorId,
              confirmado_at: confirmacion.confirmadoAt.toISOString(),
              reversado: confirmacion.reversado,
              reversado_por: confirmacion.reversadoPorId,
              reversado_at: confirmacion.reversadoAt?.toISOString(),
            }
          : undefined,
      }
    })

    // Filter by estado if provided
    if (estado === 'missing_data') {
      transformedData = transformedData.filter((persona) => {
        const puestoVotacion = persona.puesto_votacion?.nombre
        const faltaPuestoOMesa = !puestoVotacion || !persona.mesa_votacion
        const faltaFechaExpedicion = fechaExpedicionRequired && !persona.fecha_expedicion
        return faltaPuestoOMesa || faltaFechaExpedicion
      })
    } else if (estado === 'confirmed') {
      transformedData = transformedData.filter((persona) => {
        const puestoVotacion = persona.puesto_votacion?.nombre
        return (
          puestoVotacion &&
          persona.mesa_votacion &&
          (!fechaExpedicionRequired || persona.fecha_expedicion) &&
          persona.confirmacion &&
          !persona.confirmacion.reversado
        )
      })
    } else if (estado === 'pending') {
      transformedData = transformedData.filter((persona) => {
        const puestoVotacion = persona.puesto_votacion?.nombre
        return (
          puestoVotacion &&
          persona.mesa_votacion &&
          (!fechaExpedicionRequired || persona.fecha_expedicion) &&
          (!persona.confirmacion || persona.confirmacion.reversado)
        )
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
        total: shouldFilterInMemory ? totalFiltered : count,
        totalPages: Math.ceil((shouldFilterInMemory ? totalFiltered : count) / limit),
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Líderes, coordinadores y admins pueden crear personas
    const profile = await requireLiderOrAdmin()

    const body = await request.json()
    const validatedData = personaSchema.parse(body)

    // Validar fecha_expedicion si es requerida
    const fechaExpedicionRequired = process.env.FECHA_EXPEDICION_REQUIRED === 'true'
    if (
      fechaExpedicionRequired &&
      (!validatedData.fecha_expedicion || validatedData.fecha_expedicion.trim() === '')
    ) {
      return NextResponse.json(
        { error: 'La fecha de expedición es obligatoria' },
        { status: 400 }
      )
    }

    // Determinar el registrado_por final
    let registradoPor = profile.id
    let liderProfile = profile

    // Si es coordinador y envía registrado_por, validar que el líder pertenezca al coordinador
    if (profile.role === 'coordinador' && validatedData.registrado_por) {
      const lider = await prisma.profile.findFirst({
        where: {
          id: validatedData.registrado_por,
          coordinadorId: profile.id,
          role: 'lider',
        },
      })

      if (!lider) {
        return NextResponse.json(
          { error: 'El líder seleccionado no pertenece a este coordinador' },
          { status: 400 }
        )
      }

      registradoPor = lider.id
      liderProfile = {
        ...profile,
        id: lider.id,
        candidato_id: lider.candidatoId || undefined,
      }
    }

    // Check if numero_documento already exists
    const existing = await prisma.persona.findUnique({
      where: { numeroDocumento: validatedData.numero_documento },
    })

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
        let errorMessage =
          'Ya existe una persona con este número de documento en el sistema externo'
        if (documentInfo.place) {
          errorMessage += ` registrado en el representante "${documentInfo.place}"`
        } else {
          errorMessage += ` (sin representante asignado)`
        }

        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }
    }

    const data = await prisma.persona.create({
      data: {
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        tipoDocumento: validatedData.tipo_documento as DocumentoTipo,
        numeroDocumento: validatedData.numero_documento,
        fechaNacimiento: validatedData.fecha_nacimiento
          ? new Date(validatedData.fecha_nacimiento)
          : null,
        fechaExpedicion: validatedData.fecha_expedicion
          ? new Date(validatedData.fecha_expedicion)
          : null,
        profesion: validatedData.profesion || null,
        numeroCelular: validatedData.numero_celular || null,
        direccion: validatedData.direccion || null,
        barrioId: validatedData.barrio_id || null,
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        puestoVotacionId: validatedData.puesto_votacion_id || null,
        mesaVotacion: validatedData.mesa_votacion || null,
        registradoPorId: registradoPor,
        esImportado: false,
      },
      include: {
        barrio: { select: { id: true, codigo: true, nombre: true } },
        puestoVotacion: { select: { id: true, codigo: true, nombre: true, direccion: true } },
      },
    })

    // Sincronizar con PocketBase si está habilitado
    if (isDocumentValidationEnabled() && data) {
      let candidatoNombre: string | null = null
      if (liderProfile.candidato_id) {
        const candidato = await prisma.candidato.findUnique({
          where: { id: liderProfile.candidato_id },
          select: { nombreCompleto: true },
        })
        candidatoNombre = candidato?.nombreCompleto || null
      }

      await createPerson({
        document_number: validatedData.numero_documento,
        place: candidatoNombre,
        leader_id: registradoPor,
      })
    }

    // Transform to match expected format
    const response = {
      id: data.id,
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipo_documento: data.tipoDocumento,
      numero_documento: data.numeroDocumento,
      fecha_nacimiento: data.fechaNacimiento?.toISOString().split('T')[0],
      fecha_expedicion: data.fechaExpedicion?.toISOString().split('T')[0],
      profesion: data.profesion,
      edad: data.edad,
      numero_celular: data.numeroCelular,
      direccion: data.direccion,
      barrio_id: data.barrioId,
      barrios: data.barrio,
      departamento: data.departamento,
      municipio: data.municipio,
      puesto_votacion_id: data.puestoVotacionId,
      puestos_votacion: data.puestoVotacion,
      mesa_votacion: data.mesaVotacion,
      registrado_por: data.registradoPorId,
      es_importado: data.esImportado,
      created_at: data.createdAt.toISOString(),
      updated_at: data.updatedAt.toISOString(),
    }

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { errors: unknown }
      return NextResponse.json(
        { error: 'Datos inválidos', details: zodError.errors },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
