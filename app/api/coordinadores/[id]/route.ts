import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, requireConsultorOrAdmin, generateSystemEmail } from '@/lib/auth/helpers'
import { hashPassword } from '@/lib/auth/auth'
import { coordinadorSchema } from '@/features/coordinadores/validations/coordinador'
import type { DocumentoTipo } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Permitir GET a consultores también
    try {
      await requireAdmin()
    } catch {
      await requireConsultorOrAdmin()
    }
    const { id } = await params

    const data = await prisma.profile.findFirst({
      where: { id, role: 'coordinador' },
      include: {
        candidato: { select: { id: true, nombreCompleto: true } },
      },
    })

    if (!data) {
      return NextResponse.json({ error: 'Coordinador no encontrado' }, { status: 404 })
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
      role: data.role,
      departamento: data.departamento,
      municipio: data.municipio,
      zona: data.zona,
      candidato_id: data.candidatoId,
      candidato: data.candidato
        ? { id: data.candidato.id, nombre_completo: data.candidato.nombreCompleto }
        : null,
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
    // Solo admins pueden modificar coordinadores
    await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const validatedData = coordinadorSchema.parse(body)

    // Check if coordinador exists
    const existing = await prisma.profile.findFirst({
      where: { id, role: 'coordinador' },
      select: { id: true, numeroDocumento: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Coordinador no encontrado' }, { status: 404 })
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
      departamento: validatedData.departamento || null,
      municipio: validatedData.municipio || null,
      zona: validatedData.zona || null,
      candidatoId: validatedData.candidato_id?.trim() || null,
    }

    // Update email and password if numero_documento changed
    if (validatedData.numero_documento !== existing.numeroDocumento) {
      updateData.email = generateSystemEmail(validatedData.numero_documento)
      updateData.passwordHash = await hashPassword(validatedData.numero_documento)
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
      role: data.role,
      departamento: data.departamento,
      municipio: data.municipio,
      zona: data.zona,
      candidato_id: data.candidatoId,
      created_at: data.createdAt.toISOString(),
      updated_at: data.updatedAt.toISOString(),
    }

    return NextResponse.json({ data: response })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Solo admins pueden eliminar coordinadores
    await requireAdmin()
    const { id } = await params

    // Check if coordinador exists
    const existing = await prisma.profile.findFirst({
      where: { id, role: 'coordinador' },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Coordinador no encontrado' }, { status: 404 })
    }

    // Check if coordinador has registered personas
    const personasCount = await prisma.persona.count({
      where: { registradoPorId: id },
    })

    if (personasCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el coordinador porque tiene personas registradas' },
        { status: 400 }
      )
    }

    // Check if coordinador has leaders
    const lideresCount = await prisma.profile.count({
      where: { coordinadorId: id },
    })

    if (lideresCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el coordinador porque tiene líderes asignados' },
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
