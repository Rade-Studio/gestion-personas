'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserRole } from '@/lib/types'

export interface RequireAuthProps {
  children: React.ReactNode
  requireAdmin?: boolean
  allowedRoles?: UserRole[]
}

export function RequireAuth({ children, requireAdmin = false, allowedRoles }: RequireAuthProps) {
  const router = useRouter()
  const { user, profile, loading, isAdmin } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }

      if (requireAdmin && !isAdmin) {
        router.push('/dashboard')
        return
      }

      if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [user, loading, isAdmin, requireAdmin, router, allowedRoles, profile])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireAdmin && !isAdmin) {
    return null
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null
  }

  return <>{children}</>
}

