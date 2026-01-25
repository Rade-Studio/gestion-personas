import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, requireConsultorOrAdmin, generateSystemEmail } from '@/lib/auth/helpers'
import { hashPassword } from '@/lib/auth/auth'
import { coordinadorSchema } from '@/features/coordinadores/validations/coordinador'
import type { DocumentoTipo } from '@prisma/client'

export async function GET() {
  try {
    // Permitir GET a consultores también
    try {
      await requireAdmin()
    } catch {
      await requireConsultorOrAdmin()
    }

    const coordinadores = await prisma.profile.findMany({
      where: { role: 'coordinador' },
      include: {
        candidato: { select: { id: true, nombreCompleto: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Obtener conteo de líderes para cada coordinador
    const coordinadoresConLideres = await Promise.all(
      coordinadores.map(async (coordinador) => {
        const lideresCount = await prisma.profile.count({
          where: {
            coordinadorId: coordinador.id,
            role: 'lider',
          },
        })

        return {
          id: coordinador.id,
          nombres: coordinador.nombres,
          apellidos: coordinador.apellidos,
          tipo_documento: coordinador.tipoDocumento,
          numero_documento: coordinador.numeroDocumento,
          fecha_nacimiento: coordinador.fechaNacimiento?.toISOString().split('T')[0],
          telefono: coordinador.telefono,
          role: coordinador.role,
          departamento: coordinador.departamento,
          municipio: coordinador.municipio,
          zona: coordinador.zona,
          candidato_id: coordinador.candidatoId,
          candidato: coordinador.candidato
            ? { id: coordinador.candidato.id, nombre_completo: coordinador.candidato.nombreCompleto }
            : null,
          created_at: coordinador.createdAt.toISOString(),
          updated_at: coordinador.updatedAt.toISOString(),
          lideres_count: lideresCount,
        }
      })
    )

    return NextResponse.json({ data: coordinadoresConLideres })
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
    await requireAdmin()

    const body = await request.json()
    const validatedData = coordinadorSchema.parse(body)

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

    // Get default candidate if candidato_id not provided
    let candidatoId = validatedData.candidato_id?.trim() || null
    if (!candidatoId) {
      const defaultCandidato = await prisma.candidato.findFirst({
        where: { esPorDefecto: true },
        select: { id: true },
      })

      if (defaultCandidato) {
        candidatoId = defaultCandidato.id
      }
    }

    // Create profile with password hash
    const profile = await prisma.profile.create({
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
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        zona: validatedData.zona || null,
        candidatoId,
        role: 'coordinador',
      },
    })

    // Transform to match expected format
    const response = {
      id: profile.id,
      nombres: profile.nombres,
      apellidos: profile.apellidos,
      tipo_documento: profile.tipoDocumento,
      numero_documento: profile.numeroDocumento,
      fecha_nacimiento: profile.fechaNacimiento?.toISOString().split('T')[0],
      telefono: profile.telefono,
      role: profile.role,
      departamento: profile.departamento,
      municipio: profile.municipio,
      zona: profile.zona,
      candidato_id: profile.candidatoId,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    }

    return NextResponse.json({ data: response }, { status: 201 })
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
