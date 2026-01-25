import { z } from 'zod'
import { documentoTipos } from '@/features/personas/validations/persona'

export const filtroRoles = ['validador', 'confirmador'] as const

export const filtroSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son obligatorios'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  tipo_documento: z.enum(documentoTipos, {
    message: 'Tipo de documento inválido',
  }),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  departamento: z.string().optional().or(z.literal('')),
  municipio: z.string().optional().or(z.literal('')),
  zona: z.string().optional().or(z.literal('')),
  barrio_id: z.number().int().positive().optional().or(z.null()),
  puesto_votacion_id: z.number().int().positive().optional().or(z.null()),
  mesa_votacion: z.string().optional().or(z.literal('')),
  candidato_id: z.string().uuid().optional().or(z.literal('')),
  coordinador_id: z.string().uuid('El coordinador es obligatorio'),
  role: z.enum(filtroRoles, {
    message: 'El rol debe ser validador o confirmador',
  }),
  lideres_ids: z.array(z.string().uuid()).min(1, 'Debe asignar al menos un líder'),
})

export type FiltroFormData = z.infer<typeof filtroSchema>

export const filtroUpdateSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son obligatorios').optional(),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios').optional(),
  tipo_documento: z.enum(documentoTipos, {
    message: 'Tipo de documento inválido',
  }).optional(),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio').optional(),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  departamento: z.string().optional().or(z.literal('')),
  municipio: z.string().optional().or(z.literal('')),
  zona: z.string().optional().or(z.literal('')),
  barrio_id: z.number().int().positive().optional().or(z.null()),
  puesto_votacion_id: z.number().int().positive().optional().or(z.null()),
  mesa_votacion: z.string().optional().or(z.literal('')),
  candidato_id: z.string().uuid().optional().or(z.literal('')),
  coordinador_id: z.string().uuid().optional(),
  lideres_ids: z.array(z.string().uuid()).optional(),
})

export type FiltroUpdateData = z.infer<typeof filtroUpdateSchema>

export const asignarLideresSchema = z.object({
  lideres_ids: z.array(z.string().uuid()).min(1, 'Debe especificar al menos un líder'),
})

export type AsignarLideresData = z.infer<typeof asignarLideresSchema>
