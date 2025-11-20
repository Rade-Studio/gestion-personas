'use client'

import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { documentoTipos } from '@/features/personas/validations/persona'

export function ProfileSetup() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipo_documento: 'CC' as const,
    numero_documento: '',
    fecha_nacimiento: '',
    telefono: '',
    role: 'lider' as 'admin' | 'lider',
  })

  if (loading) return null

  if (!user) return null

  // Si no hay perfil, mostrar alerta
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Perfil no encontrado</AlertTitle>
          <AlertDescription>
            Tu usuario no tiene un perfil configurado. Por favor, completa la información para continuar.
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowDialog(true)}
            >
              Configurar Perfil
            </Button>
          </AlertDescription>
        </Alert>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Perfil</DialogTitle>
              <DialogDescription>
                Completa tu información para crear tu perfil
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                      setFormData({ ...formData, tipo_documento: value as any })
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
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!formData.nombres || !formData.apellidos || !formData.numero_documento) {
                    toast.error('Completa todos los campos obligatorios')
                    return
                  }

                  setSaving(true)
                  try {
                    const response = await fetch('/api/admin/setup-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formData),
                    })

                    const result = await response.json()

                    if (!response.ok) {
                      throw new Error(result.error || 'Error al crear perfil')
                    }

                    toast.success('Perfil creado exitosamente')
                    setShowDialog(false)
                    await refreshProfile()
                  } catch (error: any) {
                    toast.error(error.message)
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Crear Perfil'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return null
}

