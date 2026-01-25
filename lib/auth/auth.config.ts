import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // Public routes
      const isAuthPage =
        pathname.startsWith('/auth/login') || pathname.startsWith('/login')
      const isPublicApi = pathname.startsWith('/api/candidatos/public')
      const isAuthApi = pathname.startsWith('/api/auth')

      // Allow public routes
      if (isPublicApi || isAuthApi) {
        return true
      }

      // Redirect logged-in users away from login page
      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl))
        }
        return true
      }

      // Protect all other routes
      return isLoggedIn
    },
  },
  providers: [], // Providers are added in auth.ts
}
