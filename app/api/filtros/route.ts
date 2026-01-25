import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCoordinadorOrAdmin, generateSystemEmail } from '@/lib/auth/helpers'
import { hashPassword } from '@/lib/auth/auth'
import { filtroSchema } from '@/features/filtros/validations/filtro'
import type { DocumentoTipo, UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const profile = await requireCoordinadorOrAdmin()
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role') as 'validador' | 'confirmador' | null

    const where: Record<string, unknown> = {
      role: roleFilter ? roleFilter : { in: ['validador', 'confirmador'] },
    }

    // Coordinadores solo ven filtros de su jerarquía
    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const filtros = await prisma.profile.findMany({
      where,
      include: {
        candidato: { select: { id: true, nombreCompleto: true } },
        coordinador: { select: { id: true, nombres: true, apellidos: true, numeroDocumento: true } },
        barrio: { select: { id: true, codigo: true, nombre: true } },
        puestoVotacion: { select: { id: true, codigo: true, nombre: true } },
        filtrosAsignados: {
          include: {
            lider: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                numeroDocumento: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const filtrosTransformed = filtros.map((filtro) => ({
      id: filtro.id,
      nombres: filtro.nombres,
      apellidos: filtro.apellidos,
      tipo_documento: filtro.tipoDocumento,
      numero_documento: filtro.numeroDocumento,
      fecha_nacimiento: filtro.fechaNacimiento?.toISOString().split('T')[0],
      telefono: filtro.telefono,
      direccion: filtro.direccion,
      barrio_id: filtro.barrioId,
      barrio: filtro.barrio,
      role: filtro.role,
      departamento: filtro.departamento,
      municipio: filtro.municipio,
      zona: filtro.zona,
      candidato_id: filtro.candidatoId,
      candidato: filtro.candidato
        ? { id: filtro.candidato.id, nombre_completo: filtro.candidato.nombreCompleto }
        : null,
      coordinador_id: filtro.coordinadorId,
      coordinador: filtro.coordinador
        ? {
            id: filtro.coordinador.id,
            nombres: filtro.coordinador.nombres,
            apellidos: filtro.coordinador.apellidos,
            numero_documento: filtro.coordinador.numeroDocumento,
          }
        : null,
      puesto_votacion_id: filtro.puestoVotacionId,
      puesto_votacion: filtro.puestoVotacion,
      mesa_votacion: filtro.mesaVotacion,
      created_at: filtro.createdAt.toISOString(),
      updated_at: filtro.updatedAt.toISOString(),
      lideres_asignados: filtro.filtrosAsignados.map((fa) => ({
        id: fa.lider.id,
        nombres: fa.lider.nombres,
        apellidos: fa.lider.apellidos,
        numero_documento: fa.lider.numeroDocumento,
      })),
      lideres_count: filtro.filtrosAsignados.length,
    }))

    return NextResponse.json({ data: filtrosTransformed })
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
    const profile = await requireCoordinadorOrAdmin()

    const body = await request.json()
    const validatedData = filtroSchema.parse(body)

    // Verificar que el número de documento no exista
    const existing = await prisma.profile.findUnique({
      where: { numeroDocumento: validatedData.numero_documento },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este número de documento' },
        { status: 400 }
      )
    }

    // Determinar el coordinador
    let coordinadorId = validatedData.coordinador_id
    if (profile.role === 'coordinador') {
      coordinadorId = profile.id
    }

    // Verificar que el coordinador exista
    const coordinador = await prisma.profile.findFirst({
      where: { id: coordinadorId, role: 'coordinador' },
    })

    if (!coordinador) {
      return NextResponse.json(
        { error: 'El coordinador especificado no existe' },
        { status: 400 }
      )
    }

    // Verificar que los líderes pertenezcan al coordinador
    const lideres = await prisma.profile.findMany({
      where: {
        id: { in: validatedData.lideres_ids },
        role: 'lider',
        coordinadorId: coordinadorId,
      },
    })

    if (lideres.length !== validatedData.lideres_ids.length) {
      return NextResponse.json(
        { error: 'Algunos líderes no existen o no pertenecen al coordinador especificado' },
        { status: 400 }
      )
    }

    // Email y contraseña automáticos
    const email = generateSystemEmail(validatedData.numero_documento)
    const passwordHash = await hashPassword(validatedData.numero_documento)

    // Obtener candidato del coordinador si no se especifica
    let candidatoId = validatedData.candidato_id?.trim() || null
    if (!candidatoId && coordinador.candidatoId) {
      candidatoId = coordinador.candidatoId
    }

    // Crear el filtro (validador o confirmador)
    const filtro = await prisma.profile.create({
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
        direccion: null,
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        zona: validatedData.zona || null,
        barrioId: validatedData.barrio_id || null,
        puestoVotacionId: validatedData.puesto_votacion_id || null,
        mesaVotacion: validatedData.mesa_votacion || null,
        candidatoId,
        coordinadorId,
        role: validatedData.role as UserRole,
      },
    })

    // Crear las relaciones con los líderes
    await prisma.filtroLider.createMany({
      data: validatedData.lideres_ids.map((liderId) => ({
        filtroId: filtro.id,
        liderId,
      })),
    })

    // Obtener el filtro con sus relaciones
    const filtroCompleto = await prisma.profile.findUnique({
      where: { id: filtro.id },
      include: {
        candidato: { select: { id: true, nombreCompleto: true } },
        coordinador: { select: { id: true, nombres: true, apellidos: true, numeroDocumento: true } },
        barrio: { select: { id: true, codigo: true, nombre: true } },
        puestoVotacion: { select: { id: true, codigo: true, nombre: true } },
        filtrosAsignados: {
          include: {
            lider: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                numeroDocumento: true,
              },
            },
          },
        },
      },
    })

    const response = {
      id: filtroCompleto!.id,
      nombres: filtroCompleto!.nombres,
      apellidos: filtroCompleto!.apellidos,
      tipo_documento: filtroCompleto!.tipoDocumento,
      numero_documento: filtroCompleto!.numeroDocumento,
      fecha_nacimiento: filtroCompleto!.fechaNacimiento?.toISOString().split('T')[0],
      telefono: filtroCompleto!.telefono,
      direccion: filtroCompleto!.direccion,
      barrio_id: filtroCompleto!.barrioId,
      barrio: filtroCompleto!.barrio,
      role: filtroCompleto!.role,
      departamento: filtroCompleto!.departamento,
      municipio: filtroCompleto!.municipio,
      zona: filtroCompleto!.zona,
      candidato_id: filtroCompleto!.candidatoId,
      candidato: filtroCompleto!.candidato
        ? { id: filtroCompleto!.candidato.id, nombre_completo: filtroCompleto!.candidato.nombreCompleto }
        : null,
      coordinador_id: filtroCompleto!.coordinadorId,
      coordinador: filtroCompleto!.coordinador
        ? {
            id: filtroCompleto!.coordinador.id,
            nombres: filtroCompleto!.coordinador.nombres,
            apellidos: filtroCompleto!.coordinador.apellidos,
            numero_documento: filtroCompleto!.coordinador.numeroDocumento,
          }
        : null,
      puesto_votacion_id: filtroCompleto!.puestoVotacionId,
      puesto_votacion: filtroCompleto!.puestoVotacion,
      mesa_votacion: filtroCompleto!.mesaVotacion,
      created_at: filtroCompleto!.createdAt.toISOString(),
      updated_at: filtroCompleto!.updatedAt.toISOString(),
      lideres_asignados: filtroCompleto!.filtrosAsignados.map((fa) => ({
        id: fa.lider.id,
        nombres: fa.lider.nombres,
        apellidos: fa.lider.apellidos,
        numero_documento: fa.lider.numeroDocumento,
      })),
      lideres_count: filtroCompleto!.filtrosAsignados.length,
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
