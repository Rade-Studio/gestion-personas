'use client'

import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react'
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
  isConsultor: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const signOutInProgressRef = useRef(false)

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
        // No redirigir automáticamente aquí para evitar conflictos con la redirección
        // manejada en main-layout.tsx. El logout debe ser manejado explícitamente.
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    // Protección contra múltiples llamadas simultáneas
    if (signOutInProgressRef.current) {
      return
    }

    signOutInProgressRef.current = true

    try {
      // Timeout de 2 segundos para evitar bloqueos
      const signOutPromise = Promise.race([
        supabase.auth.signOut(),
        new Promise<{ error: null }>((resolve) => 
          setTimeout(() => resolve({ error: null }), 2000)
        )
      ])

      const { error } = await signOutPromise
      
      if (error) {
        console.error('Error al cerrar sesión:', error)
      }
      
      // Limpiar estado local siempre, incluso si hay error
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Aún así limpiamos el estado local
      setUser(null)
      setProfile(null)
    } finally {
      // Resetear el flag después de un pequeño delay para permitir que se complete
      setTimeout(() => {
        signOutInProgressRef.current = false
      }, 100)
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
  const isConsultor = useMemo(() => profile?.role === 'consultor', [profile?.role])

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

