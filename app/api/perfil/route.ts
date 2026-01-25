import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'
import { liderSchema } from '@/features/lideres/validations/lider'
import type { DocumentoTipo } from '@prisma/client'

export async function PUT(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()

    const body = await request.json()
    const validatedData = liderSchema.parse(body)

    // Check if numero_documento already exists (excluding current user)
    if (validatedData.numero_documento !== profile.numero_documento) {
      const duplicate = await prisma.profile.findFirst({
        where: {
          numeroDocumento: validatedData.numero_documento,
          id: { not: profile.id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este número de documento' },
          { status: 400 }
        )
      }
    }

    // Update profile (user can only update their own profile)
    const data = await prisma.profile.update({
      where: { id: profile.id },
      data: {
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
        puestoVotacionId: validatedData.puesto_votacion_id || null,
        mesaVotacion: validatedData.mesa_votacion || null,
      },
      include: {
        barrio: true,
        puestoVotacion: true,
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
      telefono: data.telefono,
      direccion: data.direccion,
      barrio_id: data.barrioId,
      barrio: data.barrio,
      role: data.role,
      departamento: data.departamento,
      municipio: data.municipio,
      zona: data.zona,
      puesto_votacion_id: data.puestoVotacionId,
      puesto_votacion: data.puestoVotacion,
      mesa_votacion: data.mesaVotacion,
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
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
