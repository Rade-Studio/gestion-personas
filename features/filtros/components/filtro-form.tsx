'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { filtroSchema, type FiltroFormData } from '@/features/filtros/validations/filtro'
import { documentoTipos } from '@/features/personas/validations/persona'
import type { Profile, Filtro } from '@/lib/types'

interface FiltroFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FiltroFormData) => Promise<void>
  initialData?: Filtro
  loading?: boolean
  coordinadores?: Profile[]
  userRole?: string
  userCoordinadorId?: string
}

interface Lider {
  id: string
  nombres: string
  apellidos: string
  numero_documento: string
}

export function FiltroForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
  coordinadores = [],
  userRole,
  userCoordinadorId,
}: FiltroFormProps) {
  const [lideres, setLideres] = useState<Lider[]>([])
  const [loadingLideres, setLoadingLideres] = useState(false)

  const form = useForm<FiltroFormData>({
    resolver: zodResolver(filtroSchema),
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
      barrio_id: null,
      puesto_votacion_id: null,
      mesa_votacion: '',
      candidato_id: '',
      coordinador_id: userRole === 'coordinador' ? userCoordinadorId : '',
      role: 'validador',
      lideres_ids: [],
    },
  })

  const selectedCoordinadorId = form.watch('coordinador_id')

  // Reset form when opening for new filtro
  useEffect(() => {
    if (open) {
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
          barrio_id: initialData.barrio_id || null,
          puesto_votacion_id: initialData.puesto_votacion_id || null,
          mesa_votacion: initialData.mesa_votacion || '',
          candidato_id: initialData.candidato_id || '',
          coordinador_id: initialData.coordinador_id || '',
          role: initialData.role as 'validador' | 'confirmador',
          lideres_ids: initialData.lideres_asignados?.map(l => l.id) || [],
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
          barrio_id: null,
          puesto_votacion_id: null,
          mesa_votacion: '',
          candidato_id: '',
          coordinador_id: userRole === 'coordinador' ? userCoordinadorId : '',
          role: 'validador',
          lideres_ids: [],
        })
      }
    }
  }, [open, initialData, form, userRole, userCoordinadorId])

  // Fetch líderes when coordinador changes
  useEffect(() => {
    const fetchLideres = async () => {
      if (!selectedCoordinadorId) {
        setLideres([])
        return
      }

      setLoadingLideres(true)
      try {
        const response = await fetch(`/api/coordinadores/${selectedCoordinadorId}/lideres`)
        const data = await response.json()
        if (response.ok) {
          setLideres(data.data || [])
        }
      } catch {
        setLideres([])
      } finally {
        setLoadingLideres(false)
      }
    }

    fetchLideres()
  }, [selectedCoordinadorId])

  const handleSubmit = async (data: FiltroFormData) => {
    try {
      await onSubmit(data)
    } catch {
      // Error is handled in parent
    }
  }

  const selectedLideres = form.watch('lideres_ids')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Filtro' : 'Nuevo Filtro (Validador/Confirmador)'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Modifica los datos del filtro'
              : 'Crea un nuevo validador o confirmador y asigna sus líderes'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Rol */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="validador">Validador</SelectItem>
                      <SelectItem value="confirmador">Confirmador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coordinador (solo admin puede seleccionar) */}
            {userRole === 'admin' && (
              <FormField
                control={form.control}
                name="coordinador_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordinador *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar coordinador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coordinadores.map((coord) => (
                          <SelectItem key={coord.id} value={coord.id}>
                            {coord.nombres} {coord.apellidos} - {coord.numero_documento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Datos personales */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentoTipos.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Documento *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!initialData} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Líderes asignados */}
            <FormField
              control={form.control}
              name="lideres_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Líderes Asignados *</FormLabel>
                  <div className="border rounded-md">
                    {loadingLideres ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Cargando líderes...
                      </div>
                    ) : !selectedCoordinadorId ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Seleccione un coordinador primero
                      </div>
                    ) : lideres.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No hay líderes para este coordinador
                      </div>
                    ) : (
                      <ScrollArea className="h-48">
                        <div className="p-4 space-y-2">
                          {lideres.map((lider) => (
                            <label
                              key={lider.id}
                              htmlFor={`lider-${lider.id}`}
                              className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                id={`lider-${lider.id}`}
                                checked={selectedLideres.includes(lider.id)}
                                onCheckedChange={(checked) => {
                                  const current = form.getValues('lideres_ids')
                                  if (checked) {
                                    form.setValue('lideres_ids', [...current, lider.id], { shouldValidate: true })
                                  } else {
                                    form.setValue('lideres_ids', current.filter(id => id !== lider.id), { shouldValidate: true })
                                  }
                                }}
                              />
                              <span className="text-sm">
                                {lider.nombres} {lider.apellidos} - {lider.numero_documento}
                              </span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedLideres.length} líder(es) seleccionado(s)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
