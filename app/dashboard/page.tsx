'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { ProfileSetup } from '@/features/auth/components/profile-setup'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, CheckCircle2, XCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { ChartLideres } from '@/features/dashboard/components/chart-lideres'
import { ChartDepartamentos } from '@/features/dashboard/components/chart-departamentos'
import { ChartVotosDepartamentos } from '@/features/dashboard/components/chart-votos-departamentos'

interface DashboardStats {
  total_registradas: number
  total_confirmadas: number
  total_no_confirmadas: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAdmin, isCoordinador, isLider, isConsultor, profile } = useAuth()
  const enableAdminCharts = process.env.NEXT_PUBLIC_ENABLE_ADMIN_CHARTS === 'true'

  // Obtener descripción según el rol
  const getDashboardDescription = () => {
    if (isAdmin) {
      return 'Resumen general del sistema de gestión de personas'
    } else if (isCoordinador) {
      return 'Resumen de tus datos y los datos de tus líderes asignados'
    } else if (isLider) {
      return 'Resumen de tus datos registrados'
    }
    return 'Resumen general del sistema de gestión de personas'
  }

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

  const total = stats?.total_registradas || 0
  const confirmadas = stats?.total_confirmadas || 0
  const pendientes = stats?.total_no_confirmadas || 0
  const porcentajeConfirmadas = total > 0 ? Math.round((confirmadas / total) * 100) : 0
  const porcentajePendientes = total > 0 ? Math.round((pendientes / total) * 100) : 0

  return (
    <MainLayout>
      <ProfileSetup />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">
            {getDashboardDescription()}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Personas Registradas
              </CardTitle>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24 mb-2" />
              ) : (
                <>
                  <div className="text-4xl font-bold tracking-tight mb-1">
                    {total.toLocaleString()}
                  </div>
                  <CardDescription className="text-xs">
                    {isAdmin 
                      ? 'Total de personas en el sistema'
                      : isCoordinador
                      ? 'Total de personas registradas por ti y tus líderes'
                      : 'Total de personas registradas por ti'}
                  </CardDescription>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-md transition-shadow border-green-200/50 bg-green-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actividades Confirmadas
              </CardTitle>
              <div className="rounded-lg bg-green-500/10 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24 mb-2" />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold tracking-tight text-green-600 mb-1">
                      {confirmadas.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      <span>{porcentajeConfirmadas}%</span>
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    Personas con actividad confirmada
                  </CardDescription>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-md transition-shadow border-orange-200/50 bg-orange-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes de Confirmar
              </CardTitle>
              <div className="rounded-lg bg-orange-500/10 p-2.5">
                <XCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24 mb-2" />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold tracking-tight text-orange-600 mb-1">
                      {pendientes.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                      <ArrowDownRight className="h-4 w-4" />
                      <span>{porcentajePendientes}%</span>
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    Personas pendientes por confirmar
                  </CardDescription>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {!loading && stats && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen de Confirmaciones</CardTitle>
                <CardDescription>
                  Distribución de actividades confirmadas y pendientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confirmados</span>
                      <span className="font-semibold">{confirmadas} ({porcentajeConfirmadas}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${porcentajeConfirmadas}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pendientes</span>
                      <span className="font-semibold">{pendientes} ({porcentajePendientes}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${porcentajePendientes}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estadísticas Rápidas</CardTitle>
                <CardDescription>
                  Métricas clave del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Tasa de Confirmación</p>
                      <p className="text-xs text-muted-foreground">Actividades confirmadas vs total</p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {porcentajeConfirmadas}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Pendientes</p>
                      <p className="text-xs text-muted-foreground">Requieren confirmación</p>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {porcentajePendientes}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(isAdmin || isConsultor) && enableAdminCharts && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Estadísticas Avanzadas</h2>
              <p className="text-muted-foreground mt-1.5">
                Gráficos detallados para administradores y consultores
              </p>
            </div>

            <ChartLideres />

            <ChartDepartamentos />

            <ChartVotosDepartamentos />
          </div>
        )}
      </div>
    </MainLayout>
  )
}

