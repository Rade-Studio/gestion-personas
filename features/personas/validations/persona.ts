import { z } from 'zod'

export const documentoTipos = ['CC', 'CE', 'Pasaporte', 'TI', 'Otro'] as const

// Función para validar fecha de nacimiento
const validateFechaNacimiento = (value: string | undefined): boolean => {
  if (!value || value.trim() === '') return true // Opcional
  
  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(value)) return false
  
  // Validar que sea una fecha válida
  const date = new Date(value)
  if (isNaN(date.getTime())) return false
  
  // Validar que no sea una fecha futura
  if (date > new Date()) return false
  
  // Validar que no sea muy antigua (más de 150 años)
  const minDate = new Date()
  minDate.setFullYear(minDate.getFullYear() - 150)
  if (date < minDate) return false
  
  return true
}

// Función para validar fecha de expedición
const validateFechaExpedicion = (value: string | undefined): boolean => {
  if (!value || value.trim() === '') return true // Opcional
  
  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(value)) return false
  
  // Validar que sea una fecha válida
  const date = new Date(value)
  if (isNaN(date.getTime())) return false
  
  // Validar que no sea una fecha futura
  if (date > new Date()) return false
  
  return true
}

export const personaSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son obligatorios'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  tipo_documento: z.enum(documentoTipos, {
    message: 'Tipo de documento inválido. Debe ser: CC, CE, Pasaporte, TI u Otro',
  }),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
  fecha_nacimiento: z.string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || validateFechaNacimiento(val),
      {
        message: 'Fecha de nacimiento inválida. Debe estar en formato YYYY-MM-DD y ser una fecha válida no futura',
      }
    ),
  fecha_expedicion: z.string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || validateFechaExpedicion(val),
      {
        message: 'Fecha de expedición inválida. Debe estar en formato YYYY-MM-DD y ser una fecha válida no futura',
      }
    ),
  profesion: z.string().optional().or(z.literal('')),
  numero_celular: z.string().optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  barrio_id: z.number().int().positive().optional().or(z.null()),
  barrio: z.string().optional().or(z.literal('')), // Mantener para compatibilidad
  departamento: z.string().optional().or(z.literal('')),
  municipio: z.string().optional().or(z.literal('')),
  puesto_votacion_id: z.number().int().positive().optional().or(z.null()),
  puesto_votacion: z.string().optional().or(z.literal('')), // Mantener para compatibilidad
  mesa_votacion: z.string().optional().or(z.literal('')),
  registrado_por: z.string().uuid().optional().or(z.null()), // ID del líder asignado (para coordinadores)
})

export type PersonaFormData = z.infer<typeof personaSchema>

