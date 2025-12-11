'use client'

import { useEffect, useState } from 'react'
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
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { Profile, Candidato } from '@/lib/types'

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
  const { profile: currentProfile, isCoordinador, isAdmin } = useAuth()
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [coordinadores, setCoordinadores] = useState<Profile[]>([])
  const [loadingCandidatos, setLoadingCandidatos] = useState(false)
  const [loadingCoordinadores, setLoadingCoordinadores] = useState(false)

  const form = useForm<LiderFormData>({
    resolver: zodResolver(liderSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      tipo_documento: 'CC',
      numero_documento: '',
      fecha_nacimiento: '',
      telefono: '',
      departamento: '',
      municipio: '',
      zona: '',
      candidato_id: '',
      coordinador_id: '',
      password: '',
      email: '',
    },
  })

  useEffect(() => {
    if (open) {
      // Load candidatos when dialog opens (for admins and to show coordinador's candidato)
      const fetchCandidatos = async () => {
        setLoadingCandidatos(true)
        try {
          const response = await fetch('/api/candidatos')
          const data = await response.json()
          if (response.ok) {
            setCandidatos(data.data || [])
            // If creating new leader and there's a default candidate, set it (only for admins)
            if (!initialData && isAdmin) {
              const defaultCandidato = (data.data || []).find((c: Candidato) => c.es_por_defecto)
              if (defaultCandidato) {
                form.setValue('candidato_id', defaultCandidato.id)
              } else {
                form.setValue('candidato_id', '')
              }
            }
          }
        } catch (error) {
          // Silently fail, candidatos selector will be empty
        } finally {
          setLoadingCandidatos(false)
        }
      }

      // Load coordinadores when dialog opens (only for admins)
      const fetchCoordinadores = async () => {
        if (!isAdmin) return
        setLoadingCoordinadores(true)
        try {
          const response = await fetch('/api/coordinadores')
          const data = await response.json()
          if (response.ok) {
            setCoordinadores(data.data || [])
          }
        } catch (error) {
          // Silently fail
        } finally {
          setLoadingCoordinadores(false)
        }
      }

      fetchCandidatos()
      if (isAdmin) {
        fetchCoordinadores()
      }
    }
  }, [open, initialData, form, isAdmin])

  useEffect(() => {
    if (initialData) {
      form.reset({
        nombres: initialData.nombres,
        apellidos: initialData.apellidos,
        tipo_documento: initialData.tipo_documento,
        numero_documento: initialData.numero_documento,
        fecha_nacimiento: initialData.fecha_nacimiento || '',
        telefono: initialData.telefono || '',
        departamento: initialData.departamento || '',
        municipio: initialData.municipio || '',
        zona: initialData.zona || '',
        candidato_id: initialData.candidato_id || '',
        coordinador_id: initialData.coordinador_id || '',
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
        departamento: '',
        municipio: '',
        zona: '',
        candidato_id: '',
        coordinador_id: '',
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                {...form.register('departamento')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">Municipio</Label>
              <Input
                id="municipio"
                {...form.register('municipio')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zona">Zona</Label>
              <Input
                id="zona"
                {...form.register('zona')}
              />
            </div>
          </div>

          {isCoordinador && !initialData && (
            <div className="space-y-2 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Información del Coordinador</p>
              <p className="text-xs text-muted-foreground">
                El líder heredará automáticamente el representante asignado a su coordinador.
                {currentProfile?.candidato_id && (
                  <span className="block mt-1">
                    Representante actual: <strong>{candidatos.find(c => c.id === currentProfile.candidato_id)?.nombre_completo || 'No asignado'}</strong>
                  </span>
                )}
              </p>
            </div>
          )}

          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="coordinador_id">Coordinador (opcional)</Label>
                <Select
                  value={form.watch('coordinador_id') || 'none'}
                  onValueChange={(value) => form.setValue('coordinador_id', value === 'none' ? '' : value)}
                  disabled={loadingCoordinadores}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCoordinadores ? 'Cargando...' : 'Seleccionar coordinador'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin coordinador</SelectItem>
                    {coordinadores.map((coordinador) => (
                      <SelectItem key={coordinador.id} value={coordinador.id}>
                        {coordinador.nombres} {coordinador.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Si se selecciona un coordinador, el líder heredará su representante
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidato_id">Representante</Label>
                <Select
                  value={form.watch('candidato_id') || 'none'}
                  onValueChange={(value) => form.setValue('candidato_id', value === 'none' ? '' : value)}
                  disabled={loadingCandidatos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCandidatos ? 'Cargando...' : 'Seleccionar representante'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin representante</SelectItem>
                    {candidatos.map((candidato) => (
                      <SelectItem key={candidato.id} value={candidato.id}>
                        {candidato.nombre_completo}
                        {candidato.es_por_defecto && ' (Por defecto)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {!initialData && 'Si no se selecciona, se asignará automáticamente el candidato por defecto'}
                </p>
              </div>
            </>
          )}

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

