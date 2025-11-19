export type DocumentoTipo = 'CC' | 'CE' | 'Pasaporte' | 'TI' | 'Otro'
export type UserRole = 'admin' | 'lider'

export interface Profile {
  id: string
  nombres: string
  apellidos: string
  tipo_documento: DocumentoTipo
  numero_documento: string
  fecha_nacimiento?: string
  telefono?: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Persona {
  id: string
  nombres: string
  apellidos: string
  tipo_documento: DocumentoTipo
  numero_documento: string
  fecha_nacimiento?: string
  edad?: number
  numero_celular?: string
  direccion?: string
  barrio?: string
  departamento?: string
  municipio?: string
  puesto_votacion?: string
  mesa_votacion?: string
  registrado_por: string
  es_importado: boolean
  importacion_id?: string
  created_at: string
  updated_at: string
}

export interface VotoConfirmacion {
  id: string
  persona_id: string
  imagen_url: string
  imagen_path: string
  confirmado_por: string
  confirmado_at: string
  reversado: boolean
  reversado_por?: string
  reversado_at?: string
  created_at: string
  updated_at: string
}

export interface Importacion {
  id: string
  usuario_id: string
  total_registros: number
  registros_exitosos: number
  registros_fallidos: number
  archivo_nombre?: string
  errores?: Record<string, any>
  created_at: string
}

export interface PersonaWithConfirmacion extends Persona {
  confirmacion?: VotoConfirmacion
}

