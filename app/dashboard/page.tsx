'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { ProfileSetup } from '@/components/auth/profile-setup'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, CheckCircle2, XCircle } from 'lucide-react'

interface DashboardStats {
  total_registradas: number
  total_confirmadas: number
  total_no_confirmadas: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar estadísticas')
      }

      setStats(data)
    } catch (error: any) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <MainLayout>
      <ProfileSetup />
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Resumen general del sistema
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">
                Personas Registradas
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <div className="text-3xl font-semibold">
                  {stats?.total_registradas || 0}
                </div>
              )}
              <CardDescription className="mt-2">
                Total de personas en el sistema
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">
                Votos Confirmados
              </CardTitle>
              <div className="rounded-lg bg-[hsl(var(--success))]/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <div className="text-3xl font-semibold text-[hsl(var(--success))]">
                  {stats?.total_confirmadas || 0}
                </div>
              )}
              <CardDescription className="mt-2">
                Personas que ya votaron
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">
                Pendientes de Confirmar
              </CardTitle>
              <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-2">
                <XCircle className="h-4 w-4 text-[hsl(var(--warning))]" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <div className="text-3xl font-semibold text-[hsl(var(--warning))]">
                  {stats?.total_no_confirmadas || 0}
                </div>
              )}
              <CardDescription className="mt-2">
                Personas pendientes por confirmar
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

