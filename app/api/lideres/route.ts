import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  requireCoordinadorOrAdmin,
  requireConsultorOrAdmin,
  generateSystemEmail,
} from '@/lib/auth/helpers'
import { hashPassword } from '@/lib/auth/auth'
import { liderSchema } from '@/features/lideres/validations/lider'
import type { DocumentoTipo } from '@prisma/client'

export async function GET() {
  try {
    // Permitir GET a consultores también
    let profile
    try {
      profile = await requireCoordinadorOrAdmin()
    } catch {
      profile = await requireConsultorOrAdmin()
    }

    const where: Record<string, unknown> = { role: 'lider' }

    // Coordinadores solo ven sus líderes, admins ven todos
    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const data = await prisma.profile.findMany({
      where,
      include: {
        candidato: { select: { id: true, nombreCompleto: true } },
        puestoVotacion: { select: { id: true, nombre: true, codigo: true } },
        barrio: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to match expected format
    const transformedData = data.map((p) => ({
      id: p.id,
      nombres: p.nombres,
      apellidos: p.apellidos,
      tipo_documento: p.tipoDocumento,
      numero_documento: p.numeroDocumento,
      fecha_nacimiento: p.fechaNacimiento?.toISOString().split('T')[0],
      telefono: p.telefono,
      direccion: p.direccion,
      barrio_id: p.barrioId,
      barrio: p.barrio,
      role: p.role,
      departamento: p.departamento,
      municipio: p.municipio,
      zona: p.zona,
      candidato_id: p.candidatoId,
      candidato: p.candidato
        ? { id: p.candidato.id, nombre_completo: p.candidato.nombreCompleto }
        : null,
      coordinador_id: p.coordinadorId,
      puesto_votacion_id: p.puestoVotacionId,
      puesto_votacion: p.puestoVotacion,
      mesa_votacion: p.mesaVotacion,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
    }))

    return NextResponse.json({ data: transformedData })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
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

    const body = await request.json()
    const validatedData = liderSchema.parse(body)

    // Check if numero_documento already exists
    const existing = await prisma.profile.findUnique({
      where: { numeroDocumento: validatedData.numero_documento },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este número de documento' },
        { status: 400 }
      )
    }

    // Email y contraseña automáticos basados en número de documento
    const email = generateSystemEmail(validatedData.numero_documento)
    const passwordHash = await hashPassword(validatedData.numero_documento)

    // Get candidato_id: coordinadores heredan su candidato, admins pueden especificar o usar default
    let candidatoId = validatedData.candidato_id?.trim() || null
    if (profile.role === 'coordinador') {
      // Coordinadores: heredar candidato del coordinador
      candidatoId = profile.candidato_id || null
    } else if (!candidatoId) {
      // Admins: usar candidato por defecto si no se especifica
      const defaultCandidato = await prisma.candidato.findFirst({
        where: { esPorDefecto: true },
        select: { id: true },
      })

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

    // Create profile with password hash
    const newProfile = await prisma.profile.create({
      data: {
        email,
        passwordHash,
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        tipoDocumento: validatedData.tipo_documento as DocumentoTipo,
        numeroDocumento: validatedData.numero_documento,
        fechaNacimiento: validatedData.fecha_nacimiento
          ? new Date(validatedData.fecha_nacimiento)
          : null,
        telefono: validatedData.telefono || null,
        direccion: validatedData.direccion || null,
        barrioId: validatedData.barrio_id || null,
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        zona: validatedData.zona || null,
        candidatoId,
        coordinadorId,
        puestoVotacionId: validatedData.puesto_votacion_id || null,
        mesaVotacion: validatedData.mesa_votacion || null,
        role: 'lider',
      },
    })

    // Transform to match expected format
    const response = {
      id: newProfile.id,
      nombres: newProfile.nombres,
      apellidos: newProfile.apellidos,
      tipo_documento: newProfile.tipoDocumento,
      numero_documento: newProfile.numeroDocumento,
      fecha_nacimiento: newProfile.fechaNacimiento?.toISOString().split('T')[0],
      telefono: newProfile.telefono,
      direccion: newProfile.direccion,
      barrio_id: newProfile.barrioId,
      role: newProfile.role,
      departamento: newProfile.departamento,
      municipio: newProfile.municipio,
      zona: newProfile.zona,
      candidato_id: newProfile.candidatoId,
      coordinador_id: newProfile.coordinadorId,
      puesto_votacion_id: newProfile.puestoVotacionId,
      mesa_votacion: newProfile.mesaVotacion,
      created_at: newProfile.createdAt.toISOString(),
      updated_at: newProfile.updatedAt.toISOString(),
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
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
