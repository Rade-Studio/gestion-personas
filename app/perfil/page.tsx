'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { PerfilForm } from '@/features/perfil/components/perfil-form'

export default function PerfilPage() {
  const { profile, loading: authLoading, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (data: any) => {
    if (!profile) return

    setSaving(true)
    try {
      const response = await fetch(`/api/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar perfil')
      }

      toast.success('Perfil actualizado exitosamente')
      await refreshProfile()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <MainLayout>
        <div>Cargando...</div>
      </MainLayout>
    )
  }

  if (!profile) {
    return (
      <MainLayout>
        <div>Error al cargar perfil</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1.5">
            Administra tu información personal y configuración
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerfilForm profile={profile} onSubmit={handleSubmit} loading={saving} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

