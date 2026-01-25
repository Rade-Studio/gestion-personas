'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Users, 
  AlertTriangle, 
  Shield, 
  ShieldCheck, 
  FileCheck, 
  Undo2,
  Clock,
  FileWarning
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { PersonaWithConfirmacion, PuestoVotacion, PersonaEstado } from '@/lib/types'
import Image from 'next/image'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { toast } from 'sonner'

interface PersonasTableProps {
  personas: PersonaWithConfirmacion[]
  onEdit: (persona: PersonaWithConfirmacion) => void
  onDelete: (id: string) => void
  onConfirmVoto: (persona: PersonaWithConfirmacion) => void
  onReversarVoto: (persona: PersonaWithConfirmacion) => void
  onNovedad?: (persona: PersonaWithConfirmacion) => void
  onRefresh?: () => void
  loading?: boolean
}

const getPuestoVotacionNombre = (puesto: string | PuestoVotacion | undefined): string => {
  if (!puesto) return '-'
  if (typeof puesto === 'string') return puesto
  return puesto.nombre || '-'
}

const ESTADO_CONFIG: Record<PersonaEstado, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; icon: typeof Clock }> = {
  DATOS_PENDIENTES: { label: 'Datos Pendientes', variant: 'secondary', icon: Clock },
  CON_NOVEDAD: { label: 'Con Novedad', variant: 'warning', icon: AlertTriangle },
  VERIFICADO: { label: 'Verificado', variant: 'outline', icon: Shield },
  CONFIRMADO: { label: 'Confirmado', variant: 'default', icon: ShieldCheck },
  COMPLETADO: { label: 'Completado', variant: 'success', icon: CheckCircle2 },
}

export function PersonasTable({
  personas,
  onEdit,
  onDelete,
  onConfirmVoto,
  onReversarVoto,
  onNovedad,
  onRefresh,
  loading = false,
}: PersonasTableProps) {
  const { profile, isConsultor } = useAuth()
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isConfirmed = (persona: PersonaWithConfirmacion) => {
    return persona.confirmacion && !persona.confirmacion.reversado
  }

  const getEstadoBadge = (persona: PersonaWithConfirmacion) => {
    const estado = persona.estado || 'DATOS_PENDIENTES'
    const config = ESTADO_CONFIG[estado]
    const IconComponent = config.icon

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={config.variant} className="gap-1.5 px-2.5 py-1 cursor-help">
              <IconComponent className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {estado === 'CON_NOVEDAD' && persona.novedad_activa && (
              <p className="max-w-xs">{persona.novedad_activa.observacion}</p>
            )}
            {estado === 'VERIFICADO' && persona.validado_por_profile && (
              <p>
                Verificado por {persona.validado_por_profile.nombres} {persona.validado_por_profile.apellidos}
                {persona.validado_at && ` el ${new Date(persona.validado_at).toLocaleDateString('es-CO')}`}
              </p>
            )}
            {estado === 'CONFIRMADO' && persona.confirmado_estado_por_profile && (
              <p>
                Confirmado por {persona.confirmado_estado_por_profile.nombres} {persona.confirmado_estado_por_profile.apellidos}
                {persona.confirmado_estado_at && ` el ${new Date(persona.confirmado_estado_at).toLocaleDateString('es-CO')}`}
              </p>
            )}
            {estado === 'COMPLETADO' && persona.confirmacion && (
              <p>
                Completado el {new Date(persona.confirmacion.confirmado_at).toLocaleDateString('es-CO')}
              </p>
            )}
            {estado === 'DATOS_PENDIENTES' && <p>Persona pendiente de verificación</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const handleVerificar = async (personaId: string) => {
    setActionLoading(personaId)
    try {
      const response = await fetch(`/api/personas/${personaId}/verificar`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar')
      }
      toast.success('Persona verificada correctamente')
      onRefresh?.()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmarEstado = async (personaId: string) => {
    setActionLoading(personaId)
    try {
      const response = await fetch(`/api/personas/${personaId}/confirmar-estado`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al confirmar')
      }
      toast.success('Persona confirmada correctamente')
      onRefresh?.()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReversarEstado = async (personaId: string) => {
    setActionLoading(personaId)
    try {
      const response = await fetch(`/api/personas/${personaId}/reversar-estado`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al reversar')
      }
      toast.success(data.message || 'Estado reversado correctamente')
      onRefresh?.()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setActionLoading(null)
    }
  }

  const canVerificar = (persona: PersonaWithConfirmacion) => {
    if (!profile) return false
    if (profile.role === 'admin') return true
    if (profile.role === 'validador' && ['DATOS_PENDIENTES'].includes(persona.estado || '')) return true
    return false
  }

  const canConfirmarEstado = (persona: PersonaWithConfirmacion) => {
    if (!profile) return false
    if (profile.role === 'admin') return true
    if (profile.role === 'confirmador' && ['VERIFICADO', 'DATOS_PENDIENTES'].includes(persona.estado || '')) return true
    return false
  }

  const canReversarEstado = (persona: PersonaWithConfirmacion) => {
    if (!profile) return false
    const estado = persona.estado || 'DATOS_PENDIENTES'
    if (estado === 'DATOS_PENDIENTES') return false
    if (profile.role === 'admin') return true
    if (profile.role === 'coordinador') return true
    if ((profile.role === 'validador' || profile.role === 'confirmador') && estado !== 'COMPLETADO') return true
    return false
  }

  const canCreateNovedad = () => {
    if (!profile) return false
    return ['admin', 'coordinador', 'lider', 'validador', 'confirmador'].includes(profile.role)
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50">
                <TableHead className="h-12 font-semibold">Nombres</TableHead>
                <TableHead className="h-12 font-semibold">Apellidos</TableHead>
                <TableHead className="h-12 font-semibold">Tipo Doc.</TableHead>
                <TableHead className="h-12 font-semibold">Número Doc.</TableHead>
                <TableHead className="h-12 font-semibold">Departamento</TableHead>
                <TableHead className="h-12 font-semibold">Municipio</TableHead>
                <TableHead className="h-12 font-semibold">Puesto</TableHead>
                <TableHead className="h-12 font-semibold">Mesa</TableHead>
                <TableHead className="h-12 font-semibold">Estado</TableHead>
                <TableHead className="text-right h-12 font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-sm font-medium text-muted-foreground">Cargando personas...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : personas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-muted p-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold">No hay personas registradas</p>
                      <p className="text-xs text-muted-foreground">
                        Comienza agregando una nueva persona
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                personas.map((persona) => (
                  <TableRow 
                    key={persona.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="py-4">
                      <span className="font-medium">{persona.nombres}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-medium">{persona.apellidos}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                        {persona.tipo_documento}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-mono text-sm">{persona.numero_documento}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{persona.departamento || '-'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{persona.municipio || '-'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{getPuestoVotacionNombre(persona.puesto_votacion)}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm">{persona.mesa_votacion || '-'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      {getEstadoBadge(persona)}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === persona.id}
                          >
                            {actionLoading === persona.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {/* Ver imagen si está completado */}
                          {isConfirmed(persona) && persona.confirmacion?.imagen_url && (
                            <DropdownMenuItem
                              onClick={() => setViewingImage(persona.confirmacion!.imagen_url)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Imagen Evidencia
                            </DropdownMenuItem>
                          )}

                          {/* Ver/Crear novedades */}
                          {onNovedad && (
                            <DropdownMenuItem
                              onClick={() => onNovedad(persona)}
                              className="cursor-pointer"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              {persona.novedad_activa ? 'Ver Novedad' : 'Novedades'}
                            </DropdownMenuItem>
                          )}

                          {!isConsultor && (
                            <>
                              <DropdownMenuSeparator />

                              {/* Acciones de estado */}
                              {canVerificar(persona) && (
                                <DropdownMenuItem
                                  onClick={() => handleVerificar(persona.id)}
                                  className="cursor-pointer"
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Verificar
                                </DropdownMenuItem>
                              )}

                              {canConfirmarEstado(persona) && (
                                <DropdownMenuItem
                                  onClick={() => handleConfirmarEstado(persona.id)}
                                  className="cursor-pointer"
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Confirmar Estado
                                </DropdownMenuItem>
                              )}

                              {/* Completar (cargar evidencia) */}
                              {(persona.estado === 'CONFIRMADO' || persona.estado === 'DATOS_PENDIENTES' || persona.estado === 'VERIFICADO') && !isConfirmed(persona) && (
                                <DropdownMenuItem 
                                  onClick={() => onConfirmVoto(persona)}
                                  className="cursor-pointer"
                                >
                                  <FileCheck className="mr-2 h-4 w-4" />
                                  Completar (Cargar Evidencia)
                                </DropdownMenuItem>
                              )}

                              {/* Reversar estado */}
                              {canReversarEstado(persona) && (
                                <DropdownMenuItem
                                  onClick={() => handleReversarEstado(persona.id)}
                                  className="cursor-pointer text-orange-600"
                                >
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Reversar Estado
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Editar y eliminar */}
                              <DropdownMenuItem 
                                onClick={() => onEdit(persona)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(persona.id)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Imagen de Confirmación de Actividad</DialogTitle>
            <DialogDescription>
              Evidencia de la confirmación de actividad
            </DialogDescription>
          </DialogHeader>
          {viewingImage && (
            <div className="relative w-full h-96">
              <Image
                src={viewingImage}
                alt="Confirmación de actividad"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

