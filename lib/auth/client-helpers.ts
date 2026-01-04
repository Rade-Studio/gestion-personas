'use client'

/**
 * Limpia completamente el almacenamiento local relacionado con Supabase
 * Incluye localStorage, sessionStorage y cookies
 * Esta función debe ejecutarse solo en el cliente
 */
export function clearSupabaseStorage(): void {
  if (typeof window === 'undefined') return

  try {
    // Limpiar localStorage
    const localStorageKeys = Object.keys(localStorage)
    localStorageKeys.forEach((key) => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key)
      }
    })

    // Limpiar sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage)
    sessionStorageKeys.forEach((key) => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key)
      }
    })

    // Limpiar cookies
    const domain = window.location.hostname
    const cookies = document.cookie.split(';')
    
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      
      if (name.startsWith('sb-') || name.includes('supabase')) {
        // Intentar eliminar con diferentes configuraciones de dominio y path
        const cookieOptions = [
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`,
        ]
        
        cookieOptions.forEach((cookieString) => {
          document.cookie = cookieString
        })
      }
    })
  } catch (error) {
    console.error('Error al limpiar almacenamiento de Supabase:', error)
  }
}

