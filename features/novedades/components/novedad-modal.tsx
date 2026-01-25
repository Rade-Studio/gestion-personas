'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Novedad, PersonaWithConfirmacion } from '@/lib/types'

interface NovedadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona: PersonaWithConfirmacion | null
  onNovedadCreated?: () => void
  canCreateNovedad?: boolean
}

export function NovedadModal({
  open,
  onOpenChange,
  persona,
  onNovedadCreated,
  canCreateNovedad = true,
}: NovedadModalProps) {
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [observacion, setObservacion] = useState('')

  const fetchNovedades = async () => {
    if (!persona?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/personas/${persona.id}/novedades`)
      const data = await response.json()
      if (response.ok) {
        setNovedades(data.data || [])
      }
    } catch {
      // Ignore error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && persona?.id) {
      fetchNovedades()
      setShowCreateForm(false)
      setObservacion('')
    }
  }, [open, persona?.id])

  const handleCreateNovedad = async () => {
    if (!persona?.id || !observacion.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/novedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: persona.id,
          observacion: observacion.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear novedad')
      }

      toast.success('Novedad creada correctamente')
      setObservacion('')
      setShowCreateForm(false)
      fetchNovedades()
      onNovedadCreated?.()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  const handleResolverNovedad = async (novedadId: string) => {
    setResolving(novedadId)
    try {
      const response = await fetch(`/api/novedades/${novedadId}/resolver`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al resolver novedad')
      }

      toast.success('Novedad resuelta correctamente')
      fetchNovedades()
      onNovedadCreated?.()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setResolving(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const novedadActiva = novedades.find((n) => !n.resuelta)
  const novedadesResueltas = novedades.filter((n) => n.resuelta)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Novedades de {persona?.nombres} {persona?.apellidos}
          </DialogTitle>
          <DialogDescription>
            Gestione las novedades asociadas a esta persona
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Novedad activa */}
          {novedadActiva && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Activa</Badge>
                  <span className="text-xs text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {formatDate(novedadActiva.created_at)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm">{novedadActiva.observacion}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Creada por: {novedadActiva.creada_por_profile?.nombres}{' '}
                {novedadActiva.creada_por_profile?.apellidos}
              </p>
              {canCreateNovedad && (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => handleResolverNovedad(novedadActiva.id)}
                  disabled={resolving === novedadActiva.id}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {resolving === novedadActiva.id ? 'Resolviendo...' : 'Resolver Novedad'}
                </Button>
              )}
            </div>
          )}

          {/* Crear nueva novedad */}
          {canCreateNovedad && !novedadActiva && (
            <>
              {showCreateForm ? (
                <div className="space-y-3">
                  <Label htmlFor="observacion">Observación *</Label>
                  <Textarea
                    id="observacion"
                    placeholder="Describa la novedad..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateNovedad}
                      disabled={creating || !observacion.trim()}
                    >
                      {creating ? 'Creando...' : 'Crear Novedad'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false)
                        setObservacion('')
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nueva Novedad
                </Button>
              )}
            </>
          )}

          {/* Historial de novedades resueltas */}
          {novedadesResueltas.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Historial de Novedades</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {novedadesResueltas.map((novedad) => (
                      <div
                        key={novedad.id}
                        className="rounded-lg border p-3 bg-muted/30"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">Resuelta</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(novedad.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{novedad.observacion}</p>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <p>
                            Creada por: {novedad.creada_por_profile?.nombres}{' '}
                            {novedad.creada_por_profile?.apellidos}
                          </p>
                          {novedad.resuelta_por_profile && (
                            <p>
                              Resuelta por: {novedad.resuelta_por_profile.nombres}{' '}
                              {novedad.resuelta_por_profile.apellidos}
                              {novedad.resuelta_at && (
                                <> el {formatDate(novedad.resuelta_at)}</>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {loading && (
            <div className="text-center py-4 text-muted-foreground">
              Cargando novedades...
            </div>
          )}

          {!loading && novedades.length === 0 && !showCreateForm && (
            <div className="text-center py-4 text-muted-foreground">
              No hay novedades registradas
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
