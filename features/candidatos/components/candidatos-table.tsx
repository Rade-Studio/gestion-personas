'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import type { Candidato } from '@/lib/types'

interface CandidatosTableProps {
  candidatos: Candidato[]
  onEdit: (candidato: Candidato) => void
  onDelete: (id: string) => void
  loading?: boolean
}

export function CandidatosTable({
  candidatos,
  onEdit,
  onDelete,
  loading = false,
}: CandidatosTableProps) {
  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Número Tarjetón</TableHead>
              <TableHead>Partido/Grupo</TableHead>
              <TableHead>Por Defecto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Cargando...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  if (candidatos.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Número Tarjetón</TableHead>
              <TableHead>Partido/Grupo</TableHead>
              <TableHead>Por Defecto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                No hay candidatos registrados
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imagen</TableHead>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Número Tarjetón</TableHead>
            <TableHead>Partido/Grupo</TableHead>
            <TableHead>Por Defecto</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidatos.map((candidato) => (
            <TableRow key={candidato.id}>
              <TableCell>
                {candidato.imagen_url ? (
                  <div className="relative w-16 h-16">
                    <Image
                      src={candidato.imagen_url}
                      alt={candidato.nombre_completo}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                    Sin imagen
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{candidato.nombre_completo}</TableCell>
              <TableCell>{candidato.numero_tarjeton}</TableCell>
              <TableCell>{candidato.partido_grupo || '-'}</TableCell>
              <TableCell>
                {candidato.es_por_defecto ? (
                  <Badge variant="default">Por Defecto</Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(candidato)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(candidato.id)}
                      disabled={candidato.es_por_defecto}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

