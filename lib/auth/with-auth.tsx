import { redirect } from 'next/navigation'
import { getCurrentProfile, requireAuth } from './helpers'

export async function withAuth<T extends {}>(
  Component: React.ComponentType<T>,
  options?: { requireAdmin?: boolean }
) {
  return async function AuthenticatedComponent(props: T) {
    try {
      await requireAuth()
      const profile = await getCurrentProfile()

      if (options?.requireAdmin && profile?.role !== 'admin') {
        redirect('/dashboard')
      }

      return <Component {...props} />
    } catch {
      redirect('/login')
    }
  }
}

