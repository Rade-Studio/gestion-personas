'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { documentoTipos } from '@/features/personas/validations/persona'
import type { DocumentoTipo } from '@/lib/types'

export default function FixRolePage() {
  const { profile, loading } = useAuth()
  const [roleInfo, setRoleInfo] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState<{
    role: 'admin' | 'lider'
    nombres: string
    apellidos: string
    tipo_documento: DocumentoTipo
    numero_documento: string
    fecha_nacimiento: string
    telefono: string
  }>({
    role: 'admin',
    nombres: '',
    apellidos: '',
    tipo_documento: 'CC',
    numero_documento: '',
    fecha_nacimiento: '',
    telefono: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        role: profile.role,
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        tipo_documento: profile.tipo_documento,
        numero_documento: profile.numero_documento,
        fecha_nacimiento: profile.fecha_nacimiento || '',
        telefono: profile.telefono || '',
      })
    }
  }, [profile])

  const checkRole = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/admin/check-role')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar rol')
      }

      setRoleInfo(data)
      toast.success('Rol verificado')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setChecking(false)
    }
  }

  const updateProfile = async () => {
    if (!formData.nombres || !formData.apellidos || !formData.numero_documento) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch('/api/admin/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div>Cargando...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Verificar y Corregir Rol</h1>
          <p className="text-muted-foreground">
            Verifica tu rol actual y actualízalo si es necesario
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Rol</CardTitle>
            <CardDescription>
              Verifica tu rol actual en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkRole} disabled={checking}>
              {checking ? 'Verificando...' : 'Verificar Rol'}
            </Button>

            {roleInfo && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Rol Actual</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1">
                    <p><strong>Rol:</strong> {roleInfo.role}</p>
                    <p><strong>Es Admin:</strong> {roleInfo.isAdmin ? 'Sí' : 'No'}</p>
                    <p><strong>Es Líder:</strong> {roleInfo.isLider ? 'Sí' : 'No'}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {profile && !roleInfo && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Perfil Encontrado</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1">
                    <p><strong>Rol actual:</strong> {profile.role}</p>
                    <p><strong>Nombre:</strong> {profile.nombres} {profile.apellidos}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actualizar Perfil y Rol</CardTitle>
            <CardDescription>
              Actualiza tu información y rol si es necesario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as 'admin' | 'lider' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="lider">Líder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) =>
                    setFormData({ ...formData, nombres: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) =>
                    setFormData({ ...formData, apellidos: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                <Select
                  value={formData.tipo_documento}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_documento: value as DocumentoTipo })
                  }
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
                  value={formData.numero_documento}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_documento: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_nacimiento: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>
            </div>

            <Button onClick={updateProfile} disabled={updating} className="w-full">
              {updating ? 'Actualizando...' : 'Actualizar Perfil y Rol'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

