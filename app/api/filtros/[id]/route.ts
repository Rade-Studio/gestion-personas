import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCoordinadorOrAdmin } from '@/lib/auth/helpers'
import { filtroUpdateSchema } from '@/features/filtros/validations/filtro'
import type { DocumentoTipo } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const profile = await requireCoordinadorOrAdmin()
    const { id } = await params

    const where: Record<string, unknown> = {
      id,
      role: { in: ['validador', 'confirmador'] },
    }

    // Coordinadores solo ven filtros de su jerarquía
    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const filtro = await prisma.profile.findFirst({
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
    })

    if (!filtro) {
      return NextResponse.json(
        { error: 'Filtro no encontrado' },
        { status: 404 }
      )
    }

    const response = {
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const profile = await requireCoordinadorOrAdmin()
    const { id } = await params

    const where: Record<string, unknown> = {
      id,
      role: { in: ['validador', 'confirmador'] },
    }

    // Coordinadores solo pueden editar filtros de su jerarquía
    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const existingFiltro = await prisma.profile.findFirst({ where })

    if (!existingFiltro) {
      return NextResponse.json(
        { error: 'Filtro no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = filtroUpdateSchema.parse(body)

    // Verificar unicidad de número de documento si se está cambiando
    if (validatedData.numero_documento && validatedData.numero_documento !== existingFiltro.numeroDocumento) {
      const duplicado = await prisma.profile.findUnique({
        where: { numeroDocumento: validatedData.numero_documento },
      })
      if (duplicado) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este número de documento' },
          { status: 400 }
        )
      }
    }

    // Solo admin puede cambiar coordinador
    let coordinadorId = existingFiltro.coordinadorId
    if (profile.role === 'admin' && validatedData.coordinador_id) {
      const coordinador = await prisma.profile.findFirst({
        where: { id: validatedData.coordinador_id, role: 'coordinador' },
      })
      if (!coordinador) {
        return NextResponse.json(
          { error: 'El coordinador especificado no existe' },
          { status: 400 }
        )
      }
      coordinadorId = validatedData.coordinador_id
    }

    // Si se actualizan los líderes, verificar que pertenezcan al coordinador
    if (validatedData.lideres_ids && validatedData.lideres_ids.length > 0) {
      const lideres = await prisma.profile.findMany({
        where: {
          id: { in: validatedData.lideres_ids },
          role: 'lider',
          coordinadorId: coordinadorId,
        },
      })

      if (lideres.length !== validatedData.lideres_ids.length) {
        return NextResponse.json(
          { error: 'Algunos líderes no existen o no pertenecen al coordinador' },
          { status: 400 }
        )
      }

      // Eliminar asignaciones anteriores y crear nuevas
      await prisma.filtroLider.deleteMany({
        where: { filtroId: id },
      })

      await prisma.filtroLider.createMany({
        data: validatedData.lideres_ids.map((liderId) => ({
          filtroId: id,
          liderId,
        })),
      })
    }

    // Actualizar el filtro
    const filtroActualizado = await prisma.profile.update({
      where: { id },
      data: {
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        tipoDocumento: validatedData.tipo_documento as DocumentoTipo | undefined,
        numeroDocumento: validatedData.numero_documento,
        fechaNacimiento: validatedData.fecha_nacimiento
          ? new Date(validatedData.fecha_nacimiento)
          : undefined,
        telefono: validatedData.telefono || null,
        departamento: validatedData.departamento || null,
        municipio: validatedData.municipio || null,
        zona: validatedData.zona || null,
        barrioId: validatedData.barrio_id,
        puestoVotacionId: validatedData.puesto_votacion_id,
        mesaVotacion: validatedData.mesa_votacion || null,
        candidatoId: validatedData.candidato_id?.trim() || undefined,
        coordinadorId,
      },
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
      id: filtroActualizado.id,
      nombres: filtroActualizado.nombres,
      apellidos: filtroActualizado.apellidos,
      tipo_documento: filtroActualizado.tipoDocumento,
      numero_documento: filtroActualizado.numeroDocumento,
      fecha_nacimiento: filtroActualizado.fechaNacimiento?.toISOString().split('T')[0],
      telefono: filtroActualizado.telefono,
      direccion: filtroActualizado.direccion,
      barrio_id: filtroActualizado.barrioId,
      barrio: filtroActualizado.barrio,
      role: filtroActualizado.role,
      departamento: filtroActualizado.departamento,
      municipio: filtroActualizado.municipio,
      zona: filtroActualizado.zona,
      candidato_id: filtroActualizado.candidatoId,
      candidato: filtroActualizado.candidato
        ? { id: filtroActualizado.candidato.id, nombre_completo: filtroActualizado.candidato.nombreCompleto }
        : null,
      coordinador_id: filtroActualizado.coordinadorId,
      coordinador: filtroActualizado.coordinador
        ? {
            id: filtroActualizado.coordinador.id,
            nombres: filtroActualizado.coordinador.nombres,
            apellidos: filtroActualizado.coordinador.apellidos,
            numero_documento: filtroActualizado.coordinador.numeroDocumento,
          }
        : null,
      puesto_votacion_id: filtroActualizado.puestoVotacionId,
      puesto_votacion: filtroActualizado.puestoVotacion,
      mesa_votacion: filtroActualizado.mesaVotacion,
      created_at: filtroActualizado.createdAt.toISOString(),
      updated_at: filtroActualizado.updatedAt.toISOString(),
      lideres_asignados: filtroActualizado.filtrosAsignados.map((fa) => ({
        id: fa.lider.id,
        nombres: fa.lider.nombres,
        apellidos: fa.lider.apellidos,
        numero_documento: fa.lider.numeroDocumento,
      })),
      lideres_count: filtroActualizado.filtrosAsignados.length,
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const profile = await requireCoordinadorOrAdmin()
    const { id } = await params

    const where: Record<string, unknown> = {
      id,
      role: { in: ['validador', 'confirmador'] },
    }

    // Coordinadores solo pueden eliminar filtros de su jerarquía
    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const filtro = await prisma.profile.findFirst({ where })

    if (!filtro) {
      return NextResponse.json(
        { error: 'Filtro no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el filtro ha validado o confirmado personas
    const personasValidadas = await prisma.persona.count({
      where: { validadoPorId: id },
    })

    const personasConfirmadas = await prisma.persona.count({
      where: { confirmadoEstadoPorId: id },
    })

    if (personasValidadas > 0 || personasConfirmadas > 0) {
      return NextResponse.json(
        { 
          error: `No se puede eliminar: el filtro ha ${personasValidadas > 0 ? `validado ${personasValidadas} personas` : ''}${personasValidadas > 0 && personasConfirmadas > 0 ? ' y ' : ''}${personasConfirmadas > 0 ? `confirmado ${personasConfirmadas} personas` : ''}` 
        },
        { status: 400 }
      )
    }

    // Eliminar asignaciones de líderes y luego el filtro
    await prisma.filtroLider.deleteMany({
      where: { filtroId: id },
    })

    await prisma.profile.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Filtro eliminado correctamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
