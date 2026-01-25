import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname

  // Public routes - no auth required
  const isAuthPage =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/login')
  const isPublicApi = pathname.startsWith('/api/candidatos/public')
  const isAuthApi = pathname.startsWith('/api/auth')
  const isStaticFile =
    pathname.startsWith('/_next') ||
    pathname.includes('.') // files with extensions

  // Allow public routes
  if (isAuthPage || isPublicApi || isAuthApi || isStaticFile) {
    // If logged in and trying to access login page, redirect to dashboard
    if (isLoggedIn && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
    }
    return NextResponse.next()
  }

  // Protect all other routes
  if (!isLoggedIn) {
    const loginUrl = new URL('/auth/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
