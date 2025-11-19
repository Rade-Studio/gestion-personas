'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import type { Persona } from '@/lib/types'

interface ConfirmarVotoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona: Persona | null
  onConfirm: (personaId: string, file: File) => Promise<void>
}

export function ConfirmarVotoDialog({
  open,
  onOpenChange,
  persona,
  onConfirm,
}: ConfirmarVotoDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen', { duration: 8000 })
      return
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe exceder 5MB', { duration: 8000 })
      return
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = async () => {
    if (!file || !persona) {
      toast.error('Debe seleccionar una imagen', { duration: 8000 })
      return
    }

    setLoading(true)
    try {
      await onConfirm(persona.id, file)
      // Solo limpiar y cerrar si fue exitoso
      setFile(null)
      setPreview(null)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al confirmar voto', { duration: 8000 })
      // No cerrar el diálogo ni limpiar el archivo si hay error
      // El archivo se mantiene para que el usuario pueda intentar de nuevo
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Voto</DialogTitle>
          <DialogDescription>
            Sube una imagen como evidencia de que {persona?.nombres} {persona?.apellidos} ya votó
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imagen">Imagen de Evidencia *</Label>
            <Input
              id="imagen"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB. En dispositivos móviles puedes tomar una foto directamente.
            </p>
          </div>

          {preview && (
            <div className="relative w-full h-48 border rounded-lg overflow-hidden">
              <Image
                src={preview}
                alt="Vista previa"
                fill
                className="object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveFile}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!file || loading}>
            {loading ? 'Confirmando...' : 'Confirmar Voto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

