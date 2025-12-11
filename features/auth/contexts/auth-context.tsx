'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAdmin: boolean
  isCoordinador: boolean
  isLider: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!mounted) return

        setUser(user)

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('Error al obtener perfil:', profileError)
          }

          if (mounted) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error('Error en getUser:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setUser(session?.user ?? null)
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error al obtener perfil en auth change:', error)
        }

        if (mounted) {
          setProfile(data)
        }
      } else {
        setProfile(null)
        // Si el evento es SIGNED_OUT y estamos en una página protegida, redirigir
        if (event === 'SIGNED_OUT' && typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          if (!currentPath.startsWith('/auth/login') && !currentPath.startsWith('/login')) {
            window.location.href = '/auth/login'
          }
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error al cerrar sesión:', error)
        throw error
      }
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Aún así limpiamos el estado local
      setUser(null)
      setProfile(null)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error al refrescar perfil:', error)
      return
    }

    setProfile(data)
  }

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile?.role])
  const isCoordinador = useMemo(() => profile?.role === 'coordinador', [profile?.role])
  const isLider = useMemo(() => profile?.role === 'lider', [profile?.role])

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
    }),
    [user, profile, loading, isAdmin, isCoordinador, isLider]
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

