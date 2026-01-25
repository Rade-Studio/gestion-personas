import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { numero_documento } = body

    if (!numero_documento) {
      return NextResponse.json({ error: 'Número de documento requerido' }, { status: 400 })
    }

    // Buscar el perfil por número de documento
    const profile = await prisma.profile.findUnique({
      where: { numeroDocumento: numero_documento },
      select: { id: true, email: true, numeroDocumento: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (!profile.email) {
      return NextResponse.json(
        { error: 'No se pudo obtener el email del usuario' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email: profile.email })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
