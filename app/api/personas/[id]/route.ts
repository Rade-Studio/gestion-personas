import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin, requireConsultorOrAdmin } from '@/lib/auth/helpers'
import { personaSchema } from '@/features/personas/validations/persona'
import { isDocumentValidationEnabled, deletePerson } from '@/lib/pocketbase/client'
import type { DocumentoTipo } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Permitir GET a consultores también
    let profile
    try {
      profile = await requireLiderOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }
    const { id } = await params

    const persona = await prisma.persona.findFirst({
      where: {
        id,
        ...(profile.role === 'lider' ? { registradoPorId: profile.id } : {}),
      },
      include: {
        confirmaciones: true,
        registradoPor: {
          select: { nombres: true, apellidos: true },
        },
        barrio: {
          select: { id: true, codigo: true, nombre: true },
        },
        puestoVotacion: {
          select: { id: true, codigo: true, nombre: true, direccion: true },
        },
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 })
    }

    // Transform data: convert confirmaciones array to confirmacion object
    const confirmaciones = persona.confirmaciones || []
    const confirmacion =
      confirmaciones
        .filter((c) => !c.reversado)
        .sort((a, b) => b.confirmadoAt.getTime() - a.confirmadoAt.getTime())[0] ||
      confirmaciones.sort((a, b) => b.confirmadoAt.getTime() - a.confirmadoAt.getTime())[0]

    // Transform to match expected format
    const transformedData = {
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
      barrio: persona.barrio,
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

    return NextResponse.json({ data: transformedData })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Consultores no pueden modificar
    const profile = await requireLiderOrAdmin()
    if (profile.role === 'consultor') {
      return NextResponse.json(
        { error: 'No autorizado: los consultores no pueden modificar registros' },
        { status: 403 }
      )
    }
    const { id } = await params

    // Check if persona exists and user has permission
    const existingPersona = await prisma.persona.findFirst({
      where: {
        id,
        ...(profile.role === 'lider' ? { registradoPorId: profile.id } : {}),
      },
      select: { id: true, numeroDocumento: true, registradoPorId: true },
    })

    if (!existingPersona) {
      return NextResponse.json(
        { error: 'Persona no encontrada o sin permisos' },
        { status: 404 }
      )
    }

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

    // Check if numero_documento already exists (excluding current record)
    if (validatedData.numero_documento !== existingPersona.numeroDocumento) {
      const duplicate = await prisma.persona.findFirst({
        where: {
          numeroDocumento: validatedData.numero_documento,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe una persona con este número de documento' },
          { status: 400 }
        )
      }
    }

    const data = await prisma.persona.update({
      where: { id },
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
      },
      include: {
        barrio: { select: { id: true, codigo: true, nombre: true } },
        puestoVotacion: { select: { id: true, codigo: true, nombre: true, direccion: true } },
      },
    })

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

    return NextResponse.json({ data: response })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: (error as { errors: unknown }).errors },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Consultores no pueden eliminar
    const profile = await requireLiderOrAdmin()
    if (profile.role === 'consultor') {
      return NextResponse.json(
        { error: 'No autorizado: los consultores no pueden eliminar registros' },
        { status: 403 }
      )
    }
    const { id } = await params

    // Check if persona exists and user has permission
    const existingPersona = await prisma.persona.findFirst({
      where: {
        id,
        ...(profile.role === 'lider' ? { registradoPorId: profile.id } : {}),
      },
      select: { id: true, numeroDocumento: true, registradoPorId: true },
    })

    if (!existingPersona) {
      return NextResponse.json(
        { error: 'Persona no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    await prisma.persona.delete({
      where: { id },
    })

    // Eliminar también de PocketBase si está habilitado
    if (isDocumentValidationEnabled() && existingPersona.numeroDocumento) {
      await deletePerson(existingPersona.numeroDocumento)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
