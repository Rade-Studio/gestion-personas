import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error al cerrar sesión:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Limpiar cookies manualmente
    const cookieStore = await cookies()
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')

    const response = NextResponse.json({ success: true })
    
    // Asegurar que las cookies se eliminen en la respuesta
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch (error: any) {
    console.error('Error al cerrar sesión:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

