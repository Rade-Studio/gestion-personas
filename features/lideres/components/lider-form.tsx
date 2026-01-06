'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { liderSchema, type LiderFormData } from '@/features/lideres/validations/lider'
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
import { Loader2, Search, ChevronDown } from 'lucide-react'
import type { Profile, Candidato, PuestoVotacion, Barrio } from '@/lib/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface LiderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: LiderFormData) => Promise<void>
  initialData?: Profile
  loading?: boolean
}

export function LiderForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading = false,
}: LiderFormProps) {
  const { profile: currentProfile, isCoordinador, isAdmin } = useAuth()
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [coordinadores, setCoordinadores] = useState<Profile[]>([])
  const [puestosVotacion, setPuestosVotacion] = useState<PuestoVotacion[]>([])
  const [barrios, setBarrios] = useState<Barrio[]>([])
  const [loadingCandidatos, setLoadingCandidatos] = useState(false)
  const [loadingCoordinadores, setLoadingCoordinadores] = useState(false)
  const [loadingPuestos, setLoadingPuestos] = useState(false)
  const [loadingBarrios, setLoadingBarrios] = useState(false)
  const [barrioSearch, setBarrioSearch] = useState('')
  const [barrioPopoverOpen, setBarrioPopoverOpen] = useState(false)
  const [puestoSearch, setPuestoSearch] = useState('')
  const [puestoPopoverOpen, setPuestoPopoverOpen] = useState(false)

  // Configuración de valores por defecto
  const useDefaultLocation = process.env.NEXT_PUBLIC_USE_DEFAULT_LOCATION === 'true'
  const defaultDepartamento = process.env.NEXT_PUBLIC_DEFAULT_DEPARTAMENTO || 'Atlántico'
  const defaultMunicipio = process.env.NEXT_PUBLIC_DEFAULT_MUNICIPIO || 'Soledad'

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
      departamento: useDefaultLocation ? defaultDepartamento : '',
      municipio: useDefaultLocation ? defaultMunicipio : '',
      zona: '',
      candidato_id: '',
      coordinador_id: '',
      puesto_votacion_id: null,
      mesa_votacion: '',
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

      // Load puestos de votación
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

      // Load barrios
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

      fetchCandidatos()
      fetchPuestos()
      fetchBarrios()
      if (isAdmin) {
        fetchCoordinadores()
      }
    }
  }, [open, initialData, form, isAdmin])

  useEffect(() => {
    if (initialData) {
      const barrioId = initialData.barrio_id || (initialData.barrio as any)?.id || null
      form.reset({
        nombres: initialData.nombres,
        apellidos: initialData.apellidos,
        tipo_documento: 'CC',
        numero_documento: initialData.numero_documento,
        fecha_nacimiento: initialData.fecha_nacimiento || '',
        telefono: initialData.telefono || '',
        direccion: initialData.direccion || '',
        barrio_id: barrioId,
        departamento: initialData.departamento || (useDefaultLocation ? defaultDepartamento : ''),
        municipio: initialData.municipio || (useDefaultLocation ? defaultMunicipio : ''),
        zona: initialData.zona || '',
        candidato_id: initialData.candidato_id || '',
        coordinador_id: initialData.coordinador_id || '',
        puesto_votacion_id: initialData.puesto_votacion_id || null,
        mesa_votacion: initialData.mesa_votacion || '',
      })
    } else {
      form.reset({
        nombres: '',
        apellidos: '',
        tipo_documento: 'CC',
        numero_documento: '',
        fecha_nacimiento: '',
        telefono: '',
        direccion: '',
        barrio_id: null,
        departamento: useDefaultLocation ? defaultDepartamento : '',
        municipio: useDefaultLocation ? defaultMunicipio : '',
        zona: '',
        candidato_id: '',
        coordinador_id: '',
        puesto_votacion_id: null,
        mesa_votacion: '',
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
      // No resetear el formulario si hay error - mantener los datos para corrección
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
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

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              {...form.register('direccion')}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Barrio</Label>
            <Popover open={barrioPopoverOpen} onOpenChange={setBarrioPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between text-sm font-normal",
                    !form.watch('barrio_id') && "text-muted-foreground"
                  )}
                  disabled={loading || loadingBarrios}
                >
                  {form.watch('barrio_id')
                    ? barrios.find((b) => b.id === form.watch('barrio_id'))?.nombre || 'Seleccionar barrio'
                    : 'Seleccionar barrio'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar barrio..."
                      value={barrioSearch}
                      onChange={(e) => setBarrioSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                  <div
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                    onClick={() => {
                      form.setValue('barrio_id', null)
                      setBarrioPopoverOpen(false)
                      setBarrioSearch('')
                    }}
                  >
                    <label className="text-sm cursor-pointer flex-1">
                      Sin barrio
                    </label>
                  </div>
                  {barrios
                    .filter((b) => {
                      if (!b) return false
                      if (!barrioSearch.trim()) return true
                      const searchLower = barrioSearch.toLowerCase()
                      return b.nombre.toLowerCase().includes(searchLower) || 
                             b.codigo.toLowerCase().includes(searchLower)
                    })
                    .map((barrio) => {
                      const isSelected = form.watch('barrio_id') === barrio.id
                      return (
                        <div
                          key={barrio.id}
                          className={cn(
                            "flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer",
                            isSelected && "bg-accent"
                          )}
                          onClick={() => {
                            form.setValue('barrio_id', barrio.id)
                            setBarrioPopoverOpen(false)
                            setBarrioSearch('')
                          }}
                        >
                          <label className="text-sm cursor-pointer flex-1">
                            {barrio.nombre}
                          </label>
                        </div>
                      )
                    })}
                  {barrios.filter((b) => {
                    if (!b) return false
                    if (!barrioSearch.trim()) return false
                    const searchLower = barrioSearch.toLowerCase()
                    return b.nombre.toLowerCase().includes(searchLower) || 
                           b.codigo.toLowerCase().includes(searchLower)
                  }).length === 0 && barrioSearch.trim() && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No se encontraron barrios
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                {...form.register('departamento')}
                disabled={loading || useDefaultLocation}
                readOnly={useDefaultLocation}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">Municipio</Label>
              <Input
                id="municipio"
                {...form.register('municipio')}
                disabled={loading || useDefaultLocation}
                readOnly={useDefaultLocation}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Puesto de Votación</Label>
              <Popover open={puestoPopoverOpen} onOpenChange={setPuestoPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between text-sm font-normal",
                      !form.watch('puesto_votacion_id') && "text-muted-foreground"
                    )}
                    disabled={loading || loadingPuestos}
                  >
                    {form.watch('puesto_votacion_id')
                      ? puestosVotacion.find((p) => p.id === form.watch('puesto_votacion_id'))?.nombre || 'Seleccionar puesto'
                      : 'Seleccionar puesto'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar puesto..."
                        value={puestoSearch}
                        onChange={(e) => setPuestoSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    <div
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                      onClick={() => {
                        form.setValue('puesto_votacion_id', null)
                        setPuestoPopoverOpen(false)
                        setPuestoSearch('')
                      }}
                    >
                      <label className="text-sm cursor-pointer flex-1">
                        Sin puesto
                      </label>
                    </div>
                    {puestosVotacion
                      .filter((p) => {
                        if (!p) return false
                        if (!puestoSearch.trim()) return true
                        const searchLower = puestoSearch.toLowerCase()
                        return p.nombre.toLowerCase().includes(searchLower) || 
                               p.codigo.toLowerCase().includes(searchLower)
                      })
                      .map((puesto) => {
                        const isSelected = form.watch('puesto_votacion_id') === puesto.id
                        return (
                          <div
                            key={puesto.id}
                            className={cn(
                              "flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer",
                              isSelected && "bg-accent"
                            )}
                            onClick={() => {
                              form.setValue('puesto_votacion_id', puesto.id)
                              setPuestoPopoverOpen(false)
                              setPuestoSearch('')
                            }}
                          >
                            <label className="text-sm cursor-pointer flex-1">
                              {puesto.nombre}
                            </label>
                          </div>
                        )
                      })}
                    {puestosVotacion.filter((p) => {
                      if (!p) return false
                      if (!puestoSearch.trim()) return false
                      const searchLower = puestoSearch.toLowerCase()
                      return p.nombre.toLowerCase().includes(searchLower) || 
                             p.codigo.toLowerCase().includes(searchLower)
                    }).length === 0 && puestoSearch.trim() && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        No se encontraron puestos
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mesa_votacion">Mesa de Votación</Label>
              <Input
                id="mesa_votacion"
                {...form.register('mesa_votacion')}
                disabled={loading}
                placeholder="Ej: 1, 2, 3..."
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
                  disabled={loading || loadingCoordinadores}
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
            </>
          )}


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  )
}

