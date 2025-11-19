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
import { MoreHorizontal, Edit, Trash2, CheckCircle2, XCircle, Eye, Users } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PersonaWithConfirmacion } from '@/lib/types'
import { getPersonaEstado } from '@/features/personas/utils/persona-estado'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'

interface PersonasTableProps {
  personas: PersonaWithConfirmacion[]
  onEdit: (persona: PersonaWithConfirmacion) => void
  onDelete: (id: string) => void
  onConfirmVoto: (persona: PersonaWithConfirmacion) => void
  onReversarVoto: (persona: PersonaWithConfirmacion) => void
  loading?: boolean
}

export function PersonasTable({
  personas,
  onEdit,
  onDelete,
  onConfirmVoto,
  onReversarVoto,
  loading = false,
}: PersonasTableProps) {
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  const isConfirmed = (persona: PersonaWithConfirmacion) => {
    return persona.confirmacion && !persona.confirmacion.reversado
  }

  const getEstadoBadge = (persona: PersonaWithConfirmacion) => {
    const estado = getPersonaEstado(persona)
    
    if (estado === 'confirmed') {
      return (
        <Badge 
          variant="success" 
          className="gap-1.5 px-2.5 py-1"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Confirmado
        </Badge>
      )
    } else if (estado === 'missing_data') {
      return (
        <Badge 
          variant="destructive" 
          className="gap-1.5 px-2.5 py-1"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Datos Faltantes
        </Badge>
      )
    } else {
      return (
        <Badge 
          variant="warning" 
          className="gap-1.5 px-2.5 py-1"
        >
          <XCircle className="h-3.5 w-3.5" />
          Pendiente
        </Badge>
      )
    }
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
                      <span className="text-sm">{persona.puesto_votacion || '-'}</span>
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
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {isConfirmed(persona) && persona.confirmacion?.imagen_url && (
                            <DropdownMenuItem
                              onClick={() => setViewingImage(persona.confirmacion!.imagen_url)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Imagen
                            </DropdownMenuItem>
                          )}
                          {getPersonaEstado(persona) === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => onConfirmVoto(persona)}
                              className="cursor-pointer"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Confirmar Voto
                            </DropdownMenuItem>
                          )}
                          {isConfirmed(persona) && (
                            <DropdownMenuItem 
                              onClick={() => onReversarVoto(persona)}
                              className="cursor-pointer"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reversar Voto
                            </DropdownMenuItem>
                          )}
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
            <DialogTitle>Imagen de Confirmación de Voto</DialogTitle>
            <DialogDescription>
              Evidencia de la confirmación de voto
            </DialogDescription>
          </DialogHeader>
          {viewingImage && (
            <div className="relative w-full h-96">
              <Image
                src={viewingImage}
                alt="Confirmación de voto"
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

