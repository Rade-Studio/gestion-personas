import { z } from 'zod'

export const crearNovedadSchema = z.object({
  persona_id: z.string().uuid('ID de persona inválido'),
  observacion: z.string().min(1, 'La observación es obligatoria').max(2000, 'La observación no puede exceder 2000 caracteres'),
})

export type CrearNovedadData = z.infer<typeof crearNovedadSchema>

export const resolverNovedadSchema = z.object({
  observacion_resolucion: z.string().optional(),
})

export type ResolverNovedadData = z.infer<typeof resolverNovedadSchema>
