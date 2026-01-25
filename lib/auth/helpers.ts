import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import type { Profile } from '@/lib/types'

/**
 * Genera el email automático basado en el número de documento
 * Usa la variable de entorno SYSTEM_EMAIL_DOMAIN o '@sistema.local' por defecto
 */
export function generateSystemEmail(numeroDocumento: string): string {
  const domain = process.env.SYSTEM_EMAIL_DOMAIN || '@sistema.local'
  const emailDomain = domain.startsWith('@') ? domain : `@${domain}`
  return `${numeroDocumento}${emailDomain}`
}

export async function getCurrentUser() {
  const session = await auth()

  if (!session?.user) return null

  return {
    id: session.user.id,
    email: session.user.email,
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await auth()

  if (!session?.user) return null

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    include: {
      barrio: true,
      puestoVotacion: true,
    },
  })

  if (!profile) return null

  return {
    id: profile.id,
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    tipo_documento: profile.tipoDocumento as Profile['tipo_documento'],
    numero_documento: profile.numeroDocumento,
    fecha_nacimiento: profile.fechaNacimiento?.toISOString(),
    telefono: profile.telefono || undefined,
    direccion: profile.direccion || undefined,
    barrio_id: profile.barrioId || undefined,
    barrio: profile.barrio
      ? {
          id: profile.barrio.id,
          codigo: profile.barrio.codigo,
          nombre: profile.barrio.nombre,
        }
      : undefined,
    role: profile.role as Profile['role'],
    departamento: profile.departamento || undefined,
    municipio: profile.municipio || undefined,
    zona: profile.zona || undefined,
    candidato_id: profile.candidatoId || undefined,
    coordinador_id: profile.coordinadorId || undefined,
    puesto_votacion_id: profile.puestoVotacionId || undefined,
    puesto_votacion: profile.puestoVotacion
      ? {
          id: profile.puestoVotacion.id,
          codigo: profile.puestoVotacion.codigo,
          nombre: profile.puestoVotacion.nombre,
          direccion: profile.puestoVotacion.direccion || undefined,
        }
      : undefined,
    mesa_votacion: profile.mesaVotacion || undefined,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  }
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
  const session = await auth()
  if (!session?.user) {
    throw new Error('No autenticado')
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    include: {
      barrio: true,
      puestoVotacion: true,
    },
  })

  if (!profile) {
    throw new Error('No autenticado: no se pudo obtener el perfil')
  }

  if (
    profile.role !== 'admin' &&
    profile.role !== 'coordinador' &&
    profile.role !== 'lider' &&
    profile.role !== 'consultor'
  ) {
    throw new Error(
      'No autorizado: se requiere rol de administrador, coordinador, líder o consultor'
    )
  }

  return {
    id: profile.id,
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    tipo_documento: profile.tipoDocumento as Profile['tipo_documento'],
    numero_documento: profile.numeroDocumento,
    fecha_nacimiento: profile.fechaNacimiento?.toISOString(),
    telefono: profile.telefono || undefined,
    direccion: profile.direccion || undefined,
    barrio_id: profile.barrioId || undefined,
    barrio: profile.barrio
      ? {
          id: profile.barrio.id,
          codigo: profile.barrio.codigo,
          nombre: profile.barrio.nombre,
        }
      : undefined,
    role: profile.role as Profile['role'],
    departamento: profile.departamento || undefined,
    municipio: profile.municipio || undefined,
    zona: profile.zona || undefined,
    candidato_id: profile.candidatoId || undefined,
    coordinador_id: profile.coordinadorId || undefined,
    puesto_votacion_id: profile.puestoVotacionId || undefined,
    puesto_votacion: profile.puestoVotacion
      ? {
          id: profile.puestoVotacion.id,
          codigo: profile.puestoVotacion.codigo,
          nombre: profile.puestoVotacion.nombre,
          direccion: profile.puestoVotacion.direccion || undefined,
        }
      : undefined,
    mesa_votacion: profile.mesaVotacion || undefined,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  } as Profile
}

export async function requireCoordinador() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'coordinador') {
    throw new Error('No autorizado: se requiere rol de coordinador')
  }
  return profile
}

export async function requireCoordinadorOrAdmin() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('No autenticado')
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    include: {
      barrio: true,
      puestoVotacion: true,
    },
  })

  if (!profile) {
    throw new Error('No autenticado: no se pudo obtener el perfil')
  }

  if (profile.role !== 'admin' && profile.role !== 'coordinador') {
    throw new Error('No autorizado: se requiere rol de administrador o coordinador')
  }

  return {
    id: profile.id,
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    tipo_documento: profile.tipoDocumento as Profile['tipo_documento'],
    numero_documento: profile.numeroDocumento,
    fecha_nacimiento: profile.fechaNacimiento?.toISOString(),
    telefono: profile.telefono || undefined,
    direccion: profile.direccion || undefined,
    barrio_id: profile.barrioId || undefined,
    barrio: profile.barrio
      ? {
          id: profile.barrio.id,
          codigo: profile.barrio.codigo,
          nombre: profile.barrio.nombre,
        }
      : undefined,
    role: profile.role as Profile['role'],
    departamento: profile.departamento || undefined,
    municipio: profile.municipio || undefined,
    zona: profile.zona || undefined,
    candidato_id: profile.candidatoId || undefined,
    coordinador_id: profile.coordinadorId || undefined,
    puesto_votacion_id: profile.puestoVotacionId || undefined,
    puesto_votacion: profile.puestoVotacion
      ? {
          id: profile.puestoVotacion.id,
          codigo: profile.puestoVotacion.codigo,
          nombre: profile.puestoVotacion.nombre,
          direccion: profile.puestoVotacion.direccion || undefined,
        }
      : undefined,
    mesa_votacion: profile.mesaVotacion || undefined,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  } as Profile
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
  const session = await auth()
  if (!session?.user) {
    throw new Error('No autenticado')
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    include: {
      barrio: true,
      puestoVotacion: true,
    },
  })

  if (!profile) {
    throw new Error('No autenticado: no se pudo obtener el perfil')
  }

  if (profile.role !== 'admin' && profile.role !== 'consultor') {
    throw new Error('No autorizado: se requiere rol de administrador o consultor')
  }

  return {
    id: profile.id,
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    tipo_documento: profile.tipoDocumento as Profile['tipo_documento'],
    numero_documento: profile.numeroDocumento,
    fecha_nacimiento: profile.fechaNacimiento?.toISOString(),
    telefono: profile.telefono || undefined,
    direccion: profile.direccion || undefined,
    barrio_id: profile.barrioId || undefined,
    barrio: profile.barrio
      ? {
          id: profile.barrio.id,
          codigo: profile.barrio.codigo,
          nombre: profile.barrio.nombre,
        }
      : undefined,
    role: profile.role as Profile['role'],
    departamento: profile.departamento || undefined,
    municipio: profile.municipio || undefined,
    zona: profile.zona || undefined,
    candidato_id: profile.candidatoId || undefined,
    coordinador_id: profile.coordinadorId || undefined,
    puesto_votacion_id: profile.puestoVotacionId || undefined,
    puesto_votacion: profile.puestoVotacion
      ? {
          id: profile.puestoVotacion.id,
          codigo: profile.puestoVotacion.codigo,
          nombre: profile.puestoVotacion.nombre,
          direccion: profile.puestoVotacion.direccion || undefined,
        }
      : undefined,
    mesa_votacion: profile.mesaVotacion || undefined,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  } as Profile
}
