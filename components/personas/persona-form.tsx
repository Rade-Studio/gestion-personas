'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personaSchema, documentoTipos, type PersonaFormData } from '@/lib/validations/persona'
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
import type { Persona } from '@/lib/types'

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
  const form = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      tipo_documento: 'CC',
      numero_documento: '',
      fecha_nacimiento: '',
      numero_celular: '',
      direccion: '',
      barrio: '',
      puesto_votacion: '',
      mesa_votacion: '',
    },
  })

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        nombres: initialData.nombres || '',
        apellidos: initialData.apellidos || '',
        tipo_documento: initialData.tipo_documento || 'CC',
        numero_documento: initialData.numero_documento || '',
        fecha_nacimiento: initialData.fecha_nacimiento || '',
        numero_celular: initialData.numero_celular || '',
        direccion: initialData.direccion || '',
        barrio: initialData.barrio || '',
        puesto_votacion: initialData.puesto_votacion || '',
        mesa_votacion: initialData.mesa_votacion || '',
      })
    } else {
      form.reset({
        nombres: '',
        apellidos: '',
        tipo_documento: 'CC',
        numero_documento: '',
        fecha_nacimiento: '',
        numero_celular: '',
        direccion: '',
        barrio: '',
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
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
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
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              name="barrio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barrio</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="puesto_votacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puesto de Votación *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mesa_votacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesa de Votación *</FormLabel>
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
                {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

