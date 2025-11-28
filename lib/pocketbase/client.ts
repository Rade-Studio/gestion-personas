/**
 * Cliente para interactuar con PocketBase
 * Maneja autenticación, verificación de documentos, creación y eliminación de registros
 */

interface PocketBaseConfig {
  url: string
  email: string
  password: string
}

interface PocketBasePerson {
  document_number: string
  place: string | null
  leader_id: string
}

interface PocketBaseAuthResponse {
  token: string
  record: {
    id: string
    email: string
  }
}

// Cache de autenticación en memoria
let authToken: string | null = null
let authTokenExpiry: number = 0

/**
 * Verifica si la validación de documentos está habilitada
 */
export function isDocumentValidationEnabled(): boolean {
  return process.env.DOCUMENTO_VALIDATION_ENABLED === 'true'
}

/**
 * Obtiene la configuración de PocketBase desde variables de entorno
 */
function getPocketBaseConfig(): PocketBaseConfig | null {
  if (!isDocumentValidationEnabled()) {
    return null
  }

  const url = process.env.POCKETBASE_URL
  const email = process.env.POCKETBASE_EMAIL
  const password = process.env.POCKETBASE_PASSWORD

  if (!url || !email || !password) {
    return null
  }

  return { url: url.replace(/\/$/, ''), email, password }
}

/**
 * Autentica en PocketBase y obtiene token de acceso
 */
async function authenticate(config: PocketBaseConfig): Promise<string> {
  // Si tenemos un token válido, reutilizarlo
  if (authToken && Date.now() < authTokenExpiry) {
    return authToken
  }

  try {
    const response = await fetch(`${config.url}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: config.email,
        password: config.password,
      }),
      signal: AbortSignal.timeout(10000), // 10 segundos timeout
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Error de autenticación en PocketBase: ${errorData.message || response.statusText}`
      )
    }

    const data: PocketBaseAuthResponse = await response.json()
    authToken = data.token
    // El token expira en 1 hora, pero renovamos antes (55 minutos)
    authTokenExpiry = Date.now() + 55 * 60 * 1000

    return authToken
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Timeout al conectar con PocketBase')
    }
    throw error
  }
}

/**
 * Realiza una petición autenticada a PocketBase
 */
async function authenticatedRequest(
  config: PocketBaseConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await authenticate(config)

  const response = await fetch(`${config.url}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000), // 10 segundos timeout
  })

  return response
}

/**
 * Verifica si un documento ya existe en PocketBase
 */
export async function checkDocumentExists(documentNumber: string): Promise<boolean> {
  const config = getPocketBaseConfig()
  if (!config) {
    return false
  }

  try {
    const response = await authenticatedRequest(
      config,
      `/api/collections/people/records?filter=document_number="${documentNumber}"&perPage=1`
    )

    if (!response.ok) {
      // Si hay error, asumimos que no existe para continuar
      return false
    }

    const data = await response.json()
    return (data.items && data.items.length > 0) || false
  } catch (error) {
    // Si hay error de conexión, retornar false para continuar sin validación
    return false
  }
}

/**
 * Obtiene la información completa de un documento si existe en PocketBase
 * Retorna el registro completo incluyendo el campo 'place' (nombre completo del candidato)
 */
export async function getDocumentInfo(
  documentNumber: string
): Promise<{ place: string | null } | null> {
  const config = getPocketBaseConfig()
  if (!config) {
    return null
  }

  try {
    const response = await authenticatedRequest(
      config,
      `/api/collections/people/records?filter=document_number="${documentNumber}"&perPage=1`
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      return null
    }

    const record = data.items[0]
    return {
      place: record.place || null,
    }
  } catch (error) {
    // Si hay error de conexión, retornar null
    return null
  }
}

/**
 * Crea un registro en PocketBase
 */
export async function createPerson(person: PocketBasePerson): Promise<void> {
  const config = getPocketBaseConfig()
  if (!config) {
    return
  }

  try {
    const response = await authenticatedRequest(config, `/api/collections/people/records`, {
      method: 'POST',
      body: JSON.stringify(person),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // No lanzar error, solo loguear para no bloquear la operación principal
      console.error('Error al crear registro en PocketBase:', errorData)
    }
  } catch (error) {
    // No lanzar error, solo loguear para no bloquear la operación principal
    console.error('Error al crear registro en PocketBase:', error)
  }
}

/**
 * Elimina un registro de PocketBase por número de documento
 */
export async function deletePerson(documentNumber: string): Promise<void> {
  const config = getPocketBaseConfig()
  if (!config) {
    return
  }

  try {
    // Primero buscar el registro por document_number
    const response = await authenticatedRequest(
      config,
      `/api/collections/people/records?filter=document_number="${documentNumber}"&perPage=1`
    )

    if (!response.ok) {
      return
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      return
    }

    const recordId = data.items[0].id

    // Eliminar el registro
    const deleteResponse = await authenticatedRequest(
      config,
      `/api/collections/people/records/${recordId}`,
      {
        method: 'DELETE',
      }
    )

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}))
      // No lanzar error, solo loguear para no bloquear la operación principal
      console.error('Error al eliminar registro en PocketBase:', errorData)
    }
  } catch (error) {
    // No lanzar error, solo loguear para no bloquear la operación principal
    console.error('Error al eliminar registro en PocketBase:', error)
  }
}

