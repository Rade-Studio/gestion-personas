import { z } from 'zod'

export const documentoTipos = ['CC', 'CE', 'Pasaporte', 'TI', 'Otro'] as const

export const personaSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son obligatorios'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  tipo_documento: z.enum(documentoTipos, {
    errorMap: () => ({ message: 'Tipo de documento inválido' }),
  }),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  numero_celular: z.string().optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  barrio: z.string().optional().or(z.literal('')),
  departamento: z.string().optional().or(z.literal('')),
  municipio: z.string().optional().or(z.literal('')),
  puesto_votacion: z.string().optional().or(z.literal('')),
  mesa_votacion: z.string().optional().or(z.literal('')),
})

export type PersonaFormData = z.infer<typeof personaSchema>

