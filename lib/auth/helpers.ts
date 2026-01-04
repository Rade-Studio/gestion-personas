import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/lib/types'

/**
 * Genera el email automático basado en el número de documento
 * Usa la variable de entorno SYSTEM_EMAIL_DOMAIN o '@sistema.local' por defecto
 */
export function generateSystemEmail(numeroDocumento: string): string {
  const domain = process.env.SYSTEM_EMAIL_DOMAIN || '@sistema.local'
  // Asegurar que el dominio comience con @
  const emailDomain = domain.startsWith('@') ? domain : `@${domain}`
  return `${numeroDocumento}${emailDomain}`
}

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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error al obtener perfil:', error)
    return null
  }

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
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autenticado')
  }

  // Intentar obtener el perfil con el cliente normal primero
  let profile = await getCurrentProfile()
  
  // Si no se puede obtener con el cliente normal (por RLS), usar admin client
  if (!profile) {
    const adminClient = createAdminClient()
    const { data: adminProfile, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error || !adminProfile) {
      throw new Error('No autenticado: no se pudo obtener el perfil')
    }
    
    profile = adminProfile
  }

  // Asegurar que profile no sea null
  if (!profile) {
    throw new Error('No autenticado: no se pudo obtener el perfil')
  }

  // Permitir líderes, coordinadores, admins y consultores
  if (profile.role !== 'admin' && profile.role !== 'coordinador' && profile.role !== 'lider' && profile.role !== 'consultor') {
    throw new Error('No autorizado: se requiere rol de administrador, coordinador, líder o consultor')
  }
  return profile
}

export async function requireCoordinador() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'coordinador') {
    throw new Error('No autorizado: se requiere rol de coordinador')
  }
  return profile
}

export async function requireCoordinadorOrAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autenticado')
  }

  // Intentar obtener el perfil con el cliente normal primero
  let profile = await getCurrentProfile()
  
  // Si no se puede obtener con el cliente normal (por RLS), usar admin client
  if (!profile) {
    const adminClient = createAdminClient()
    const { data: adminProfile, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error || !adminProfile) {
      throw new Error('No autenticado: no se pudo obtener el perfil')
    }
    
    profile = adminProfile
  }

  // Asegurar que profile no sea null
  if (!profile) {
    throw new Error('No autenticado: no se pudo obtener el perfil')
  }

  // Verificar que el rol sea válido
  if (profile.role !== 'admin' && profile.role !== 'coordinador') {
    throw new Error('No autorizado: se requiere rol de administrador o coordinador')
  }
  return profile
}

export async function requireAdminOrCoordinador() {
  return requireCoordinadorOrAdmin()
}

export async function requireConsultor() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'consultor') {
    throw new Error('No autorizado: se requiere rol de consultor')
  }
  return profile
}

export async function requireConsultorOrAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autenticado')
  }

  // Intentar obtener el perfil con el cliente normal primero
  let profile = await getCurrentProfile()
  
  // Si no se puede obtener con el cliente normal (por RLS), usar admin client
  if (!profile) {
    const adminClient = createAdminClient()
    const { data: adminProfile, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error || !adminProfile) {
      throw new Error('No autenticado: no se pudo obtener el perfil')
    }
    
    profile = adminProfile
  }

  // Asegurar que profile no sea null
  if (!profile) {
    throw new Error('No autenticado: no se pudo obtener el perfil')
  }

  // Verificar que el rol sea válido
  if (profile.role !== 'admin' && profile.role !== 'consultor') {
    throw new Error('No autorizado: se requiere rol de administrador o consultor')
  }
  return profile
}

