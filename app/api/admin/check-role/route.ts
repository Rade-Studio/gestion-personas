import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/helpers'

export async function GET() {
  try {
    const profile = await getCurrentProfile()

    if (!profile) {
      return NextResponse.json({ error: 'No se encontró perfil de usuario' }, { status: 404 })
    }

    return NextResponse.json({
      role: profile.role,
      isAdmin: profile.role === 'admin',
      isCoordinador: profile.role === 'coordinador',
      isLider: profile.role === 'lider',
      isConsultor: profile.role === 'consultor',
      profile,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
