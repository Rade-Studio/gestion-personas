import { z } from 'zod'

export const candidatoSchema = z.object({
  nombre_completo: z.string().min(1, 'El nombre completo es obligatorio'),
  numero_tarjeton: z.string().min(1, 'El número de tarjetón es obligatorio'),
  partido_grupo: z.string().optional().or(z.literal('')),
  es_por_defecto: z.boolean(),
})

export type CandidatoFormData = z.infer<typeof candidatoSchema>

