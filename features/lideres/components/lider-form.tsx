'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { liderSchema, type LiderFormData } from '@/features/lideres/validations/lider'
import { documentoTipos } from '@/features/personas/validations/persona'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Profile } from '@/lib/types'

interface LiderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: LiderFormData) => Promise<void>
  initialData?: Profile
}

export function LiderForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: LiderFormProps) {
  const form = useForm<LiderFormData>({
    resolver: zodResolver(liderSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      tipo_documento: 'CC',
      numero_documento: '',
      fecha_nacimiento: '',
      telefono: '',
      password: '',
      email: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        nombres: initialData.nombres,
        apellidos: initialData.apellidos,
        tipo_documento: initialData.tipo_documento,
        numero_documento: initialData.numero_documento,
        fecha_nacimiento: initialData.fecha_nacimiento || '',
        telefono: initialData.telefono || '',
        password: '',
        email: '',
      })
    } else {
      form.reset({
        nombres: '',
        apellidos: '',
        tipo_documento: 'CC',
        numero_documento: '',
        fecha_nacimiento: '',
        telefono: '',
        password: '',
        email: '',
      })
    }
  }, [initialData, form])

  const handleSubmit = async (data: LiderFormData) => {
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Líder' : 'Nuevo Líder'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Modifica los datos del líder'
              : 'Completa los datos para crear un nuevo líder'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                {...form.register('nombres')}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...form.register('telefono')}
              />
            </div>
          </div>

          {!initialData && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                />
                <p className="text-xs text-muted-foreground">
                  Si no se proporciona, se generará automáticamente
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña (opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                />
                <p className="text-xs text-muted-foreground">
                  Si no se proporciona, se generará automáticamente
                </p>
              </div>
            </div>
          )}

          {initialData && (
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
              />
              <p className="text-xs text-muted-foreground">
                Deje vacío para mantener la contraseña actual
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {initialData ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

