import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const data = await prisma.candidato.findMany({
      select: {
        id: true,
        nombreCompleto: true,
        numeroTarjeton: true,
        imagenUrl: true,
        partidoGrupo: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to match expected format
    const transformedData = data.map((c) => ({
      id: c.id,
      nombre_completo: c.nombreCompleto,
      numero_tarjeton: c.numeroTarjeton,
      imagen_url: c.imagenUrl,
      partido_grupo: c.partidoGrupo,
    }))

    return NextResponse.json({ data: transformedData })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
