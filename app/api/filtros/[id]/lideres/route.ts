import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCoordinadorOrAdmin } from '@/lib/auth/helpers'
import { asignarLideresSchema } from '@/features/filtros/validations/filtro'

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

    if (profile.role === 'coordinador') {
      where.coordinadorId = profile.id
    }

    const filtro = await prisma.profile.findFirst({
      where,
      include: {
        filtrosAsignados: {
          include: {
            lider: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                numeroDocumento: true,
                telefono: true,
                barrio: { select: { id: true, codigo: true, nombre: true } },
                puestoVotacion: { select: { id: true, codigo: true, nombre: true } },
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

    const lideres = filtro.filtrosAsignados.map((fa) => ({
      id: fa.lider.id,
      nombres: fa.lider.nombres,
      apellidos: fa.lider.apellidos,
      numero_documento: fa.lider.numeroDocumento,
      telefono: fa.lider.telefono,
      barrio: fa.lider.barrio,
      puesto_votacion: fa.lider.puestoVotacion,
      asignado_at: fa.createdAt.toISOString(),
    }))

    return NextResponse.json({ data: lideres })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const profile = await requireCoordinadorOrAdmin()
    const { id } = await params

    const where: Record<string, unknown> = {
      id,
      role: { in: ['validador', 'confirmador'] },
    }

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

    const body = await request.json()
    const validatedData = asignarLideresSchema.parse(body)

    // Verificar que los líderes pertenezcan al coordinador del filtro
    const lideres = await prisma.profile.findMany({
      where: {
        id: { in: validatedData.lideres_ids },
        role: 'lider',
        coordinadorId: filtro.coordinadorId,
      },
    })

    if (lideres.length !== validatedData.lideres_ids.length) {
      return NextResponse.json(
        { error: 'Algunos líderes no existen o no pertenecen al coordinador del filtro' },
        { status: 400 }
      )
    }

    // Verificar cuáles ya están asignados
    const asignacionesExistentes = await prisma.filtroLider.findMany({
      where: {
        filtroId: id,
        liderId: { in: validatedData.lideres_ids },
      },
    })

    const idsYaAsignados = asignacionesExistentes.map((a) => a.liderId)
    const nuevosIds = validatedData.lideres_ids.filter((lid) => !idsYaAsignados.includes(lid))

    if (nuevosIds.length === 0) {
      return NextResponse.json(
        { error: 'Todos los líderes ya están asignados a este filtro' },
        { status: 400 }
      )
    }

    // Crear las nuevas asignaciones
    await prisma.filtroLider.createMany({
      data: nuevosIds.map((liderId) => ({
        filtroId: id,
        liderId,
      })),
    })

    return NextResponse.json({ 
      message: `${nuevosIds.length} líder(es) asignado(s) correctamente`,
      asignados: nuevosIds.length,
    }, { status: 201 })
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
    const { searchParams } = new URL(request.url)
    const liderId = searchParams.get('lider_id')

    if (!liderId) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro lider_id' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      id,
      role: { in: ['validador', 'confirmador'] },
    }

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

    // Verificar que la asignación exista
    const asignacion = await prisma.filtroLider.findFirst({
      where: {
        filtroId: id,
        liderId,
      },
    })

    if (!asignacion) {
      return NextResponse.json(
        { error: 'El líder no está asignado a este filtro' },
        { status: 404 }
      )
    }

    // Eliminar la asignación
    await prisma.filtroLider.delete({
      where: { id: asignacion.id },
    })

    return NextResponse.json({ message: 'Líder desasignado correctamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
