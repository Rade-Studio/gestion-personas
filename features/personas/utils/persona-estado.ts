import type { PersonaWithConfirmacion } from '@/lib/types'

export type PersonaEstado = 'missing_data' | 'pending' | 'confirmed'

export function getPersonaEstado(persona: PersonaWithConfirmacion): PersonaEstado {
  // Si falta puesto_votacion o mesa_votacion, es "Datos Faltantes"
  if (!persona.puesto_votacion || !persona.mesa_votacion) {
    return 'missing_data'
  }

  // Si tiene confirmación y no está reversada, es "Confirmado"
  if (persona.confirmacion && !persona.confirmacion.reversado) {
    return 'confirmed'
  }

  // Si tiene puesto y mesa pero no confirmación o está reversada, es "Pendiente"
  return 'pending'
}

export function hasDatosFaltantes(persona: PersonaWithConfirmacion): boolean {
  return !persona.puesto_votacion || !persona.mesa_votacion
}

