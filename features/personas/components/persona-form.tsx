'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personaSchema, documentoTipos, type PersonaFormData } from '@/features/personas/validations/persona'
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, Search, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Persona, Barrio, PuestoVotacion } from '@/lib/types'

interface PersonaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PersonaFormData) => Promise<void>
  initialData?: Persona
  loading?: boolean
}

export function PersonaForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading = false,
}: PersonaFormProps) {
  const [barrios, setBarrios] = useState<Barrio[]>([])
  const [puestosVotacion, setPuestosVotacion] = useState<PuestoVotacion[]>([])
  const [loadingBarrios, setLoadingBarrios] = useState(false)
  const [loadingPuestos, setLoadingPuestos] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [barrioSearch, setBarrioSearch] = useState('')
  const [barrioPopoverOpen, setBarrioPopoverOpen] = useState(false)
  const [puestoSearch, setPuestoSearch] = useState('')
  const [puestoPopoverOpen, setPuestoPopoverOpen] = useState(false)

  // Configuración de valores por defecto
  const useDefaultLocation = process.env.NEXT_PUBLIC_USE_DEFAULT_LOCATION === 'true'
  const defaultDepartamento = process.env.NEXT_PUBLIC_DEFAULT_DEPARTAMENTO || 'Atlántico'
  const defaultMunicipio = process.env.NEXT_PUBLIC_DEFAULT_MUNICIPIO || 'Soledad'

  const form = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      tipo_documento: 'CC',
      numero_documento: '',
      fecha_nacimiento: '',
      fecha_expedicion: '',
      profesion: '',
      numero_celular: '',
      direccion: '',
      barrio_id: undefined,
      barrio: '',
      departamento: useDefaultLocation ? defaultDepartamento : '',
      municipio: useDefaultLocation ? defaultMunicipio : '',
      puesto_votacion_id: undefined,
      puesto_votacion: '',
      mesa_votacion: '',
    },
  })

  // Cargar barrios y puestos de votación cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setIsDataLoaded(false)
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

      Promise.all([fetchBarrios(), fetchPuestos()]).then(() => {
        setIsDataLoaded(true)
      })
    } else {
      setIsDataLoaded(false)
    }
  }, [open])

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      // Extraer IDs de las relaciones si vienen como objetos
      const barrioId = initialData.barrio_id || (initialData.barrio as any)?.id || undefined
      const puestoVotacionId = initialData.puesto_votacion_id || (initialData.puesto_votacion as any)?.id || undefined
      
      form.reset({
        nombres: initialData.nombres || '',
        apellidos: initialData.apellidos || '',
        tipo_documento: 'CC',
        numero_documento: initialData.numero_documento || '',
        fecha_nacimiento: initialData.fecha_nacimiento || '',
        fecha_expedicion: initialData.fecha_expedicion || '',
        profesion: initialData.profesion || '',
        numero_celular: initialData.numero_celular || '',
        direccion: initialData.direccion || '',
        barrio_id: barrioId,
        barrio: typeof initialData.barrio === 'string' ? initialData.barrio : (initialData.barrio as any)?.nombre || '',
        departamento: initialData.departamento || (useDefaultLocation ? defaultDepartamento : ''),
        municipio: initialData.municipio || (useDefaultLocation ? defaultMunicipio : ''),
        puesto_votacion_id: puestoVotacionId,
        puesto_votacion: typeof initialData.puesto_votacion === 'string' ? initialData.puesto_votacion : (initialData.puesto_votacion as any)?.nombre || '',
        mesa_votacion: initialData.mesa_votacion || '',
      })
    } else {
      form.reset({
        nombres: '',
        apellidos: '',
        tipo_documento: 'CC',
        numero_documento: '',
        fecha_nacimiento: '',
        fecha_expedicion: '',
        profesion: '',
        numero_celular: '',
        direccion: '',
        barrio_id: undefined,
        barrio: '',
        departamento: useDefaultLocation ? defaultDepartamento : '',
        municipio: useDefaultLocation ? defaultMunicipio : '',
        puesto_votacion_id: undefined,
        puesto_votacion: '',
        mesa_votacion: '',
      })
    }
  }, [initialData, form])

  const handleSubmit = async (data: PersonaFormData) => {
    try {
      await onSubmit(data)
      // Solo resetear si fue exitoso
      if (!initialData) {
        form.reset()
        onOpenChange(false)
      } else {
        // Mantener los datos después de actualizar
        form.reset(data)
        onOpenChange(false)
      }
    } catch (error) {
      // No resetear el formulario si hay error
      // Los datos se mantienen para que el usuario pueda corregir
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Solo resetear cuando se cierra el diálogo
      form.reset()
      setIsDataLoaded(false)
    }
    onOpenChange(isOpen)
  }

  const isLoading = loadingBarrios || loadingPuestos || !isDataLoaded

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Persona' : 'Nueva Persona'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Modifica los datos de la persona'
              : 'Completa los datos para registrar una nueva persona'}
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
          <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_documento"
                render={({ field }) => {
                  // Asegurar que siempre sea CC
                  if (field.value !== 'CC') {
                    field.onChange('CC')
                  }
                  return (
                    <FormItem>
                      <FormLabel>Tipo de Documento *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value="CC"
                          disabled
                          readOnly
                          className="bg-muted"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        El tipo de documento es fijo en CC
                      </p>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="numero_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Documento *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_expedicion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Fecha de Expedición
                      {process.env.NEXT_PUBLIC_FECHA_EXPEDICION_REQUIRED === 'true' && ' *'}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profesion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profesión</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Celular</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="barrio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barrio</FormLabel>
                  <Select
                    value={field.value != null ? field.value.toString() : 'none'}
                    onValueChange={(value) => field.onChange(value === 'none' ? null : parseInt(value))}
                    disabled={loading || loadingBarrios}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingBarrios ? 'Cargando...' : 'Seleccionar barrio'} />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading || useDefaultLocation} readOnly={useDefaultLocation} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="municipio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Municipio</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading || useDefaultLocation} readOnly={useDefaultLocation} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="puesto_votacion_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puesto de Votación</FormLabel>
                    <Popover open={puestoPopoverOpen} onOpenChange={setPuestoPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between text-sm font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={loading || loadingPuestos}
                          >
                            {field.value
                              ? puestosVotacion.find((p) => p.id === field.value)?.nombre || 'Seleccionar puesto'
                              : 'Seleccionar puesto'}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
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
                              field.onChange(null)
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
                              const isSelected = field.value === puesto.id
                              return (
                                <div
                                  key={puesto.id}
                                  className={cn(
                                    "flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer",
                                    isSelected && "bg-accent"
                                  )}
                                  onClick={() => {
                                    field.onChange(puesto.id)
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mesa_votacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesa de Votación</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
        </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

