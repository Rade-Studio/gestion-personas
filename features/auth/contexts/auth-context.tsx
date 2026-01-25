'use client'

import { createContext, useContext, useMemo } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import type { Profile } from '@/lib/types'

interface AuthContextType {
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAdmin: boolean
  isCoordinador: boolean
  isLider: boolean
  isConsultor: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()

  const loading = status === 'loading'
  const user = session?.user ? { id: session.user.id, email: session.user.email || '' } : null

  // Map session user to Profile type
  const profile: Profile | null = session?.user
    ? {
        id: session.user.id,
        nombres: session.user.nombres,
        apellidos: session.user.apellidos,
        tipo_documento: session.user.tipoDocumento as Profile['tipo_documento'],
        numero_documento: session.user.numeroDocumento,
        telefono: session.user.telefono || undefined,
        direccion: session.user.direccion || undefined,
        barrio_id: session.user.barrioId || undefined,
        role: session.user.role as Profile['role'],
        departamento: session.user.departamento || undefined,
        municipio: session.user.municipio || undefined,
        zona: session.user.zona || undefined,
        candidato_id: session.user.candidatoId || undefined,
        coordinador_id: session.user.coordinadorId || undefined,
        puesto_votacion_id: session.user.puestoVotacionId || undefined,
        mesa_votacion: session.user.mesaVotacion || undefined,
        created_at: '',
        updated_at: '',
      }
    : null

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/auth/login', redirect: true })
  }

  const refreshProfile = async () => {
    await update()
  }

  const isAdmin = profile?.role === 'admin'
  const isCoordinador = profile?.role === 'coordinador'
  const isLider = profile?.role === 'lider'
  const isConsultor = profile?.role === 'consultor'

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signOut,
      refreshProfile,
      isAdmin,
      isCoordinador,
      isLider,
      isConsultor,
    }),
    [user, profile, loading, isAdmin, isCoordinador, isLider, isConsultor]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
