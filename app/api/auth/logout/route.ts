import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Timeout máximo de 2 segundos para evitar bloqueos
    const timeoutPromise = new Promise<{ error: null }>((resolve) => 
      setTimeout(() => resolve({ error: null }), 2000)
    )

    const supabase = await createClient()
    const signOutPromise = supabase.auth.signOut()
    
    // Usar Promise.race para aplicar timeout
    const { error } = await Promise.race([signOutPromise, timeoutPromise])

    // Limpiar cookies manualmente incluso si hay error
    const cookieStore = await cookies()
    
    // Lista de todas las posibles cookies de Supabase
    const supabaseCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase-auth-token',
    ]

    // Eliminar cookies del store
    supabaseCookieNames.forEach((name) => {
      cookieStore.delete(name)
    })

    const response = NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
    
    // Asegurar que las cookies se eliminen en la respuesta con diferentes configuraciones
    supabaseCookieNames.forEach((name) => {
      // Eliminar con diferentes paths y dominios
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      response.cookies.delete(name)
    })

    // Si hubo error, loguearlo pero retornar éxito de todas formas
    // para evitar que el cliente se quede bloqueado
    if (error) {
      console.error('Error al cerrar sesión (pero continuando):', error)
    }

    return response
  } catch (error: any) {
    console.error('Error al cerrar sesión:', error)
    
    // Intentar limpiar cookies incluso en caso de error
    try {
      const cookieStore = await cookies()
      const supabaseCookieNames = [
        'sb-access-token',
        'sb-refresh-token',
        'sb-auth-token',
        'supabase-auth-token',
      ]
      
      supabaseCookieNames.forEach((name) => {
        cookieStore.delete(name)
      })
    } catch (cookieError) {
      console.error('Error al limpiar cookies:', cookieError)
    }

    // Retornar éxito de todas formas para evitar bloqueos en el cliente
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}

