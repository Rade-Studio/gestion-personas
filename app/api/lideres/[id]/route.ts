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

    const where: Record<string, unknown> = { id, role: 'lider' }
    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const data = await prisma.profile.findFirst({
      where,
      include: {
        puestoVotacion: { select: { id: true, nombre: true, codigo: true } },
        barrio: { select: { id: true, codigo: true, nombre: true } },
      },
    })

    if (!data) {
      return NextResponse.json({ error: 'Líder no encontrado' }, { status: 404 })
    }

    // Transform to match expected format
    const response = {
      id: data.id,
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipo_documento: data.tipoDocumento,
      numero_documento: data.numeroDocumento,
      fecha_nacimiento: data.fechaNacimiento?.toISOString().split('T')[0],
      telefono: data.telefono,
      direccion: data.direccion,
      barrio_id: data.barrioId,
      barrio: data.barrio,
      role: data.role,
      departamento: data.departamento,
      municipio: data.municipio,
      zona: data.zona,
      candidato_id: data.candidatoId,
      coordinador_id: data.coordinadorId,
      puesto_votacion_id: data.puestoVotacionId,
      puesto_votacion: data.puestoVotacion,
      mesa_votacion: data.mesaVotacion,
      created_at: data.createdAt.toISOString(),
      updated_at: data.updatedAt.toISOString(),
    }

    return NextResponse.json({ data: response })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
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

    const body = await request.json()
    const validatedData = liderSchema.parse(body)

    // Check if lider exists and belongs to coordinador if applicable
    const where: Record<string, unknown> = { id, role: 'lider' }
    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const existing = await prisma.profile.findFirst({
      where,
      select: { id: true, numeroDocumento: true, coordinadorId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Líder no encontrado' }, { status: 404 })
    }

    // Check if numero_documento already exists (excluding current record)
    if (validatedData.numero_documento !== existing.numeroDocumento) {
      const duplicate = await prisma.profile.findFirst({
        where: {
          numeroDocumento: validatedData.numero_documento,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este número de documento' },
          { status: 400 }
        )
      }
    }

    // Determine candidato_id
    let candidatoId = validatedData.candidato_id?.trim() || null
    if (profile.role === 'coordinador') {
      candidatoId = profile.candidato_id || null
    } else if (profile.role === 'admin' && validatedData.coordinador_id?.trim()) {
      const coordinador = await prisma.profile.findFirst({
        where: {
          id: validatedData.coordinador_id.trim(),
          role: 'coordinador',
        },
        select: { candidatoId: true },
      })

      if (coordinador?.candidatoId && !candidatoId) {
        candidatoId = coordinador.candidatoId
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
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
      puestoVotacionId: validatedData.puesto_votacion_id || null,
      mesaVotacion: validatedData.mesa_votacion || null,
    }

    // Update email and password if numero_documento changed
    if (validatedData.numero_documento !== existing.numeroDocumento) {
      updateData.email = generateSystemEmail(validatedData.numero_documento)
      updateData.passwordHash = await hashPassword(validatedData.numero_documento)
    }

    // Solo admins pueden cambiar el coordinador_id
    if (profile.role === 'admin' && validatedData.coordinador_id !== undefined) {
      updateData.coordinadorId = validatedData.coordinador_id?.trim() || null
    }

    const data = await prisma.profile.update({
      where: { id },
      data: updateData,
    })

    // Transform to match expected format
    const response = {
      id: data.id,
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipo_documento: data.tipoDocumento,
      numero_documento: data.numeroDocumento,
      fecha_nacimiento: data.fechaNacimiento?.toISOString().split('T')[0],
      telefono: data.telefono,
      direccion: data.direccion,
      barrio_id: data.barrioId,
      role: data.role,
      departamento: data.departamento,
      municipio: data.municipio,
      zona: data.zona,
      candidato_id: data.candidatoId,
      coordinador_id: data.coordinadorId,
      puesto_votacion_id: data.puestoVotacionId,
      mesa_votacion: data.mesaVotacion,
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
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
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

    // Check if lider exists and belongs to coordinador if applicable
    const where: Record<string, unknown> = { id, role: 'lider' }
    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const existing = await prisma.profile.findFirst({
      where,
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Líder no encontrado' }, { status: 404 })
    }

    // Check if lider has registered personas
    const personasCount = await prisma.persona.count({
      where: { registradoPorId: id },
    })

    if (personasCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el líder porque tiene personas registradas' },
        { status: 400 }
      )
    }

    // Delete profile
    await prisma.profile.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
