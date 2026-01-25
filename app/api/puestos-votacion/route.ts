import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'

export async function GET() {
  try {
    await requireLiderOrAdmin()

    const data = await prisma.puestoVotacion.findMany({
      select: {
        id: true,
        codigo: true,
        nombre: true,
        direccion: true,
      },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error al obtener puestos de votación'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
