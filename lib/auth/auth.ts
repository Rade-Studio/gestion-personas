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

// Extended JWT type for callbacks
interface ExtendedJWT {
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
      const extToken = token as ExtendedJWT & typeof token
      if (user) {
        extToken.id = user.id
        extToken.role = user.role
        extToken.nombres = user.nombres
        extToken.apellidos = user.apellidos
        extToken.numeroDocumento = user.numeroDocumento
        extToken.tipoDocumento = user.tipoDocumento
        extToken.telefono = user.telefono
        extToken.direccion = user.direccion
        extToken.barrioId = user.barrioId
        extToken.departamento = user.departamento
        extToken.municipio = user.municipio
        extToken.zona = user.zona
        extToken.candidatoId = user.candidatoId
        extToken.coordinadorId = user.coordinadorId
        extToken.puestoVotacionId = user.puestoVotacionId
        extToken.mesaVotacion = user.mesaVotacion
      }

      // Handle session update (refresh profile)
      if (trigger === 'update' && session) {
        const profile = await prisma.profile.findUnique({
          where: { id: extToken.id },
        })
        if (profile) {
          extToken.role = profile.role
          extToken.nombres = profile.nombres
          extToken.apellidos = profile.apellidos
          extToken.numeroDocumento = profile.numeroDocumento
          extToken.tipoDocumento = profile.tipoDocumento
          extToken.telefono = profile.telefono
          extToken.direccion = profile.direccion
          extToken.barrioId = profile.barrioId
          extToken.departamento = profile.departamento
          extToken.municipio = profile.municipio
          extToken.zona = profile.zona
          extToken.candidatoId = profile.candidatoId
          extToken.coordinadorId = profile.coordinadorId
          extToken.puestoVotacionId = profile.puestoVotacionId
          extToken.mesaVotacion = profile.mesaVotacion
        }
      }

      return extToken
    },
    async session({ session, token }) {
      const extToken = token as unknown as ExtendedJWT
      if (session.user) {
        session.user.id = extToken.id
        session.user.role = extToken.role
        session.user.nombres = extToken.nombres
        session.user.apellidos = extToken.apellidos
        session.user.numeroDocumento = extToken.numeroDocumento
        session.user.tipoDocumento = extToken.tipoDocumento
        session.user.telefono = extToken.telefono
        session.user.direccion = extToken.direccion
        session.user.barrioId = extToken.barrioId
        session.user.departamento = extToken.departamento
        session.user.municipio = extToken.municipio
        session.user.zona = extToken.zona
        session.user.candidatoId = extToken.candidatoId
        session.user.coordinadorId = extToken.coordinadorId
        session.user.puestoVotacionId = extToken.puestoVotacionId
        session.user.mesaVotacion = extToken.mesaVotacion
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
