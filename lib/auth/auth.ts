import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import type { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    role: UserRole
    nombres: string
    apellidos: string
    numeroDocumento: string
    tipoDocumento: string
    telefono?: string | null
    direccion?: string | null
    barrioId?: number | null
    departamento?: string | null
    municipio?: string | null
    zona?: string | null
    candidatoId?: string | null
    coordinadorId?: string | null
    puestoVotacionId?: number | null
    mesaVotacion?: string | null
  }

  interface Session {
    user: User & {
      id: string
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: UserRole
    nombres: string
    apellidos: string
    numeroDocumento: string
    tipoDocumento: string
    telefono?: string | null
    direccion?: string | null
    barrioId?: number | null
    departamento?: string | null
    municipio?: string | null
    zona?: string | null
    candidatoId?: string | null
    coordinadorId?: string | null
    puestoVotacionId?: number | null
    mesaVotacion?: string | null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email o Documento', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Buscar por email o numero_documento
        const profile = await prisma.profile.findFirst({
          where: {
            OR: [
              { email: email },
              { numeroDocumento: email },
            ],
          },
        })

        if (!profile || !profile.passwordHash) {
          return null
        }

        const passwordMatch = await bcrypt.compare(password, profile.passwordHash)

        if (!passwordMatch) {
          return null
        }

        return {
          id: profile.id,
          email: profile.email || '',
          role: profile.role,
          nombres: profile.nombres,
          apellidos: profile.apellidos,
          numeroDocumento: profile.numeroDocumento,
          tipoDocumento: profile.tipoDocumento,
          telefono: profile.telefono,
          direccion: profile.direccion,
          barrioId: profile.barrioId,
          departamento: profile.departamento,
          municipio: profile.municipio,
          zona: profile.zona,
          candidatoId: profile.candidatoId,
          coordinadorId: profile.coordinadorId,
          puestoVotacionId: profile.puestoVotacionId,
          mesaVotacion: profile.mesaVotacion,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.nombres = user.nombres
        token.apellidos = user.apellidos
        token.numeroDocumento = user.numeroDocumento
        token.tipoDocumento = user.tipoDocumento
        token.telefono = user.telefono
        token.direccion = user.direccion
        token.barrioId = user.barrioId
        token.departamento = user.departamento
        token.municipio = user.municipio
        token.zona = user.zona
        token.candidatoId = user.candidatoId
        token.coordinadorId = user.coordinadorId
        token.puestoVotacionId = user.puestoVotacionId
        token.mesaVotacion = user.mesaVotacion
      }

      // Handle session update (refresh profile)
      if (trigger === 'update' && session) {
        const profile = await prisma.profile.findUnique({
          where: { id: token.id },
        })
        if (profile) {
          token.role = profile.role
          token.nombres = profile.nombres
          token.apellidos = profile.apellidos
          token.numeroDocumento = profile.numeroDocumento
          token.tipoDocumento = profile.tipoDocumento
          token.telefono = profile.telefono
          token.direccion = profile.direccion
          token.barrioId = profile.barrioId
          token.departamento = profile.departamento
          token.municipio = profile.municipio
          token.zona = profile.zona
          token.candidatoId = profile.candidatoId
          token.coordinadorId = profile.coordinadorId
          token.puestoVotacionId = profile.puestoVotacionId
          token.mesaVotacion = profile.mesaVotacion
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.nombres = token.nombres
        session.user.apellidos = token.apellidos
        session.user.numeroDocumento = token.numeroDocumento
        session.user.tipoDocumento = token.tipoDocumento
        session.user.telefono = token.telefono
        session.user.direccion = token.direccion
        session.user.barrioId = token.barrioId
        session.user.departamento = token.departamento
        session.user.municipio = token.municipio
        session.user.zona = token.zona
        session.user.candidatoId = token.candidatoId
        session.user.coordinadorId = token.coordinadorId
        session.user.puestoVotacionId = token.puestoVotacionId
        session.user.mesaVotacion = token.mesaVotacion
      }
      return session
    },
  },
})

// Helper function to hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Helper function to verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
