'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { liderSchema, type LiderFormData } from '@/lib/validations/lider'
import { documentoTipos } from '@/lib/validations/persona'

export default function PerfilPage() {
  const { profile, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)

  const form = useForm<LiderFormData>({
    resolver: zodResolver(liderSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      tipo_documento: 'CC',
      numero_documento: '',
      fecha_nacimiento: '',
      telefono: '',
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        tipo_documento: profile.tipo_documento,
        numero_documento: profile.numero_documento,
        fecha_nacimiento: profile.fecha_nacimiento || '',
        telefono: profile.telefono || '',
      })
    }
  }, [profile, form])

  const handleSubmit = async (data: LiderFormData) => {
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
      window.location.reload()
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
        <h1 className="text-3xl font-bold">Mi Perfil</h1>

        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    {...form.register('nombres')}
                    disabled={saving}
                  />
                  {form.formState.errors.nombres && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nombres.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    {...form.register('apellidos')}
                    disabled={saving}
                  />
                  {form.formState.errors.apellidos && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.apellidos.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                  <Select
                    value={form.watch('tipo_documento')}
                    onValueChange={(value) => form.setValue('tipo_documento', value as any)}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentoTipos.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_documento">Número de Documento *</Label>
                  <Input
                    id="numero_documento"
                    {...form.register('numero_documento')}
                    disabled={saving}
                  />
                  {form.formState.errors.numero_documento && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.numero_documento.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    {...form.register('fecha_nacimiento')}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    {...form.register('telefono')}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

