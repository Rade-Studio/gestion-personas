import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Limpiar cookies manualmente
    const cookieStore = await cookies()

    // Lista de todas las posibles cookies de Auth.js y legacy Supabase
    const authCookieNames = [
      'authjs.session-token',
      'authjs.callback-url',
      'authjs.csrf-token',
      '__Secure-authjs.session-token',
      '__Host-authjs.csrf-token',
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      // Legacy Supabase cookies
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase-auth-token',
    ]

    // Eliminar cookies del store
    authCookieNames.forEach((name) => {
      try {
        cookieStore.delete(name)
      } catch {
        // Ignore errors for non-existent cookies
      }
    })

    const response = NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )

    // Asegurar que las cookies se eliminen en la respuesta
    authCookieNames.forEach((name) => {
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      response.cookies.delete(name)
    })

    return response
  } catch (error: unknown) {
    console.error('Error al cerrar sesión:', error)

    // Retornar éxito de todas formas para evitar bloqueos en el cliente
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  }
}
