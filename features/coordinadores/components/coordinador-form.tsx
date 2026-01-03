'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { coordinadorSchema, type CoordinadorFormData } from '@/features/coordinadores/validations/coordinador'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'
import type { Profile, Candidato, Barrio, PuestoVotacion } from '@/lib/types'

interface CoordinadorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CoordinadorFormData) => Promise<void>
  initialData?: Profile
  loading?: boolean
}

export function CoordinadorForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading = false,
}: CoordinadorFormProps) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [loadingCandidatos, setLoadingCandidatos] = useState(false)
  const [barrios, setBarrios] = useState<Barrio[]>([])
  const [puestosVotacion, setPuestosVotacion] = useState<PuestoVotacion[]>([])
  const [loadingBarrios, setLoadingBarrios] = useState(false)
  const [loadingPuestos, setLoadingPuestos] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const form = useForm<CoordinadorFormData>({
    resolver: zodResolver(coordinadorSchema),
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
      barrio_id: undefined,
      puesto_votacion_id: undefined,
      candidato_id: '',
    },
  })

  useEffect(() => {
    if (open) {
      // Load candidatos when dialog opens
      const fetchCandidatos = async () => {
        setLoadingCandidatos(true)
        try {
          const response = await fetch('/api/candidatos')
          const data = await response.json()
          if (response.ok) {
            setCandidatos(data.data || [])
            // If creating new coordinador and there's a default candidate, set it
            if (!initialData) {
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

      const fetchBarrios = async () => {
        setLoadingBarrios(true)
        try {
          const response = await fetch('/api/barrios')
          const data = await response.json()
          if (response.ok) {
            setBarrios(data.data || [])
          }
        } catch (error) {
          // Silently fail
        } finally {
          setLoadingBarrios(false)
        }
      }

      const fetchPuestos = async () => {
        setLoadingPuestos(true)
        try {
          const response = await fetch('/api/puestos-votacion')
          const data = await response.json()
          if (response.ok) {
            setPuestosVotacion(data.data || [])
          }
        } catch (error) {
          // Silently fail
        } finally {
          setLoadingPuestos(false)
        }
      }

      Promise.all([
        fetchCandidatos(),
        fetchBarrios(),
        fetchPuestos(),
      ]).then(() => {
        setIsDataLoaded(true)
      })
    } else {
      setIsDataLoaded(false)
    }
  }, [open, initialData, form])

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
        barrio_id: undefined,
        puesto_votacion_id: undefined,
        candidato_id: initialData.candidato_id || '',
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
        barrio_id: undefined,
        puesto_votacion_id: undefined,
        candidato_id: '',
      })
    }
  }, [initialData, form])

  const handleSubmit = async (data: CoordinadorFormData) => {
    try {
      await onSubmit(data)
      form.reset()
      setIsDataLoaded(false)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIsDataLoaded(false)
    }
    onOpenChange(isOpen)
  }

  const isLoading = loadingBarrios || loadingPuestos || loadingCandidatos || !isDataLoaded

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Coordinador' : 'Nuevo Coordinador'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Modifica los datos del coordinador'
              : 'Completa los datos para crear un nuevo coordinador'}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando datos...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              <Select
                value={form.watch('tipo_documento')}
                onValueChange={(value) => form.setValue('tipo_documento', value as any)}
                disabled={loading}
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
                disabled={loading}
              />
              {form.formState.errors.numero_documento && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.numero_documento.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                {...form.register('departamento')}
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barrio_id">Barrio</Label>
              <Select
                value={form.watch('barrio_id') != null ? form.watch('barrio_id')!.toString() : 'none'}
                onValueChange={(value) => form.setValue('barrio_id', value === 'none' ? null : parseInt(value))}
                disabled={loading || loadingBarrios}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingBarrios ? 'Cargando...' : 'Seleccionar barrio'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin barrio</SelectItem>
                  {barrios && barrios.length > 0
                    ? barrios
                        .filter((barrio) => barrio?.id != null && barrio.id !== undefined)
                        .map((barrio) => {
                          const idStr = String(barrio.id)
                          if (!idStr || idStr.trim() === '') return null
                          return (
                            <SelectItem key={barrio.id} value={idStr}>
                              {barrio.nombre}
                            </SelectItem>
                          )
                        })
                        .filter(Boolean)
                    : null}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="puesto_votacion_id">Puesto de Votación</Label>
              <Select
                value={form.watch('puesto_votacion_id') != null ? form.watch('puesto_votacion_id')!.toString() : 'none'}
                onValueChange={(value) => form.setValue('puesto_votacion_id', value === 'none' ? null : parseInt(value))}
                disabled={loading || loadingPuestos}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingPuestos ? 'Cargando...' : 'Seleccionar puesto'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin puesto</SelectItem>
                  {puestosVotacion && puestosVotacion.length > 0
                    ? puestosVotacion
                        .filter((puesto) => puesto?.id != null && puesto.id !== undefined)
                        .map((puesto) => {
                          const idStr = String(puesto.id)
                          if (!idStr || idStr.trim() === '') return null
                          return (
                            <SelectItem key={puesto.id} value={idStr}>
                              {puesto.nombre}
                            </SelectItem>
                          )
                        })
                        .filter(Boolean)
                    : null}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidato_id">Representante</Label>
            <Select
              value={form.watch('candidato_id') || 'none'}
              onValueChange={(value) => form.setValue('candidato_id', value === 'none' ? '' : value)}
              disabled={loading || loadingCandidatos}
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


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                initialData ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

