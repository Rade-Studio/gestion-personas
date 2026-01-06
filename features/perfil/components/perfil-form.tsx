'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { liderSchema, type LiderFormData } from '@/features/lideres/validations/lider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/lib/types'

interface PerfilFormProps {
  profile: Profile
  onSubmit: (data: LiderFormData) => Promise<void>
  loading?: boolean
}

export function PerfilForm({ profile, onSubmit, loading = false }: PerfilFormProps) {
  const form = useForm<LiderFormData>({
    resolver: zodResolver(liderSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      tipo_documento: 'CC',
      numero_documento: '',
      fecha_nacimiento: '',
      telefono: '',
      direccion: '',
      barrio_id: null,
      departamento: '',
      municipio: '',
      zona: '',
      candidato_id: '',
      coordinador_id: '',
      puesto_votacion_id: null,
      mesa_votacion: '',
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        tipo_documento: 'CC',
        numero_documento: profile.numero_documento,
        fecha_nacimiento: profile.fecha_nacimiento || '',
        telefono: profile.telefono || '',
        direccion: profile.direccion || '',
        barrio_id: profile.barrio_id || null,
        departamento: profile.departamento || '',
        municipio: profile.municipio || '',
        zona: profile.zona || '',
        candidato_id: profile.candidato_id || '',
        coordinador_id: profile.coordinador_id || '',
        puesto_votacion_id: profile.puesto_votacion_id || null,
        mesa_votacion: profile.mesa_votacion || '',
      })
    }
  }, [profile, form])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombres">Nombres *</Label>
          <Input
            id="nombres"
            {...form.register('nombres')}
            disabled={loading}
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
            disabled={loading}
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
          <Input
            id="tipo_documento"
            value="CC"
            disabled
            readOnly
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            El tipo de documento es fijo en CC
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="numero_documento">Número de Documento *</Label>
          <Input
            id="numero_documento"
            {...form.register('numero_documento')}
            disabled={loading}
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
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            {...form.register('telefono')}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  )
}

