import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return user
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autenticado')
  }
  return user
}

export async function requireAdmin() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    throw new Error('No autorizado: se requiere rol de administrador')
  }
  return profile
}

export async function requireLiderOrAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) {
    throw new Error('No autenticado')
  }
  return profile
}

