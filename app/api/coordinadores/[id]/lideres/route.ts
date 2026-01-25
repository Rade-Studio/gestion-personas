import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentProfile } from '@/lib/auth/helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Coordinadores solo pueden ver sus propios líderes
    if (profile.role === 'coordinador' && profile.id !== id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Solo admins y coordinadores pueden acceder
    if (profile.role !== 'admin' && profile.role !== 'coordinador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const data = await prisma.profile.findMany({
      where: {
        coordinadorId: id,
        role: 'lider',
      },
      include: {
        candidato: { select: { id: true, nombreCompleto: true } },
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
      role: p.role,
      departamento: p.departamento,
      municipio: p.municipio,
      zona: p.zona,
      candidato_id: p.candidatoId,
      candidato: p.candidato
        ? { id: p.candidato.id, nombre_completo: p.candidato.nombreCompleto }
        : null,
      coordinador_id: p.coordinadorId,
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
