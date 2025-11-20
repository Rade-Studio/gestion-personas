'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { candidatoSchema, type CandidatoFormData } from '@/features/candidatos/validations/candidato'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import type { Candidato } from '@/lib/types'

interface CandidatoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CandidatoFormData, imagen?: File | null, removeImage?: boolean) => Promise<void>
  initialData?: Candidato
}

export function CandidatoForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CandidatoFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const form = useForm<CandidatoFormData>({
    resolver: zodResolver(candidatoSchema),
    defaultValues: {
      nombre_completo: '',
      numero_tarjeton: '',
      partido_grupo: '',
      es_por_defecto: false,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        nombre_completo: initialData.nombre_completo,
        numero_tarjeton: initialData.numero_tarjeton,
        partido_grupo: initialData.partido_grupo || '',
        es_por_defecto: initialData.es_por_defecto,
      })
      setPreview(initialData.imagen_url || null)
      setFile(null)
      setRemoveImage(false)
    } else {
      form.reset({
        nombre_completo: '',
        numero_tarjeton: '',
        partido_grupo: '',
        es_por_defecto: false,
      })
      setPreview(null)
      setFile(null)
      setRemoveImage(false)
    }
  }, [initialData, form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      form.setError('root', { message: 'El archivo debe ser una imagen' })
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      form.setError('root', { message: 'La imagen no debe exceder 5MB' })
      return
    }

    setFile(selectedFile)
    setRemoveImage(false)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    if (initialData?.imagen_url) {
      setRemoveImage(true)
    }
  }

  const handleSubmit = async (data: CandidatoFormData) => {
    try {
      await onSubmit(data, file, removeImage)
      form.reset()
      setFile(null)
      setPreview(null)
      setRemoveImage(false)
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
            {initialData ? 'Editar Candidato' : 'Nuevo Candidato'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Modifica los datos del candidato'
              : 'Completa los datos para crear un nuevo candidato'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo *</Label>
            <Input
              id="nombre_completo"
              {...form.register('nombre_completo')}
            />
            {form.formState.errors.nombre_completo && (
              <p className="text-sm text-destructive">
                {form.formState.errors.nombre_completo.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_tarjeton">Número de Tarjetón *</Label>
            <Input
              id="numero_tarjeton"
              {...form.register('numero_tarjeton')}
            />
            {form.formState.errors.numero_tarjeton && (
              <p className="text-sm text-destructive">
                {form.formState.errors.numero_tarjeton.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partido_grupo">Partido/Grupo</Label>
            <Input
              id="partido_grupo"
              {...form.register('partido_grupo')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagen">Imagen</Label>
            <Input
              id="imagen"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
            </p>
          </div>

          {(preview || (initialData?.imagen_url && !removeImage)) && (
            <div className="relative w-full h-48 border rounded-lg overflow-hidden">
              <Image
                src={preview || initialData?.imagen_url || ''}
                alt="Vista previa"
                fill
                className="object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="es_por_defecto"
              checked={form.watch('es_por_defecto')}
              onCheckedChange={(checked) => form.setValue('es_por_defecto', checked === true)}
            />
            <Label htmlFor="es_por_defecto" className="cursor-pointer">
              Marcar como candidato por defecto
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Si se marca como por defecto, se asignará automáticamente a los nuevos líderes creados
          </p>

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
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

