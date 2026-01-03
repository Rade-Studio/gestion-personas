import { z } from 'zod'
import { documentoTipos } from '@/features/personas/validations/persona'

export const liderSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son obligatorios'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  tipo_documento: z.enum(documentoTipos, {
    message: 'Tipo de documento inválido',
  }),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  fecha_expedicion: z.string().optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  departamento: z.string().optional().or(z.literal('')),
  municipio: z.string().optional().or(z.literal('')),
  zona: z.string().optional().or(z.literal('')),
  candidato_id: z.string().uuid().optional().or(z.literal('')),
  coordinador_id: z.string().uuid().optional().or(z.literal('')),
  puesto_votacion_id: z.number().int().positive().optional().or(z.null()),
  mesa_votacion: z.string().optional().or(z.literal('')),
})

export type LiderFormData = z.infer<typeof liderSchema>

