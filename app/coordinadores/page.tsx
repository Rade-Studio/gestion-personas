'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RequireAuth } from '@/features/auth/components/require-auth'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { CoordinadorForm } from '@/features/coordinadores/components/coordinador-form'
import { type CoordinadorFormData } from '@/features/coordinadores/validations/coordinador'
import type { Profile } from '@/lib/types'

export default function CoordinadoresPage() {
  const [coordinadores, setCoordinadores] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCoordinador, setEditingCoordinador] = useState<Profile | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [coordinadorToDelete, setCoordinadorToDelete] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)

  const fetchCoordinadores = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/coordinadores')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar coordinadores')
      }

      setCoordinadores(data.data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoordinadores()
  }, [])

  const handleCreate = () => {
    setEditingCoordinador(null)
    setFormOpen(true)
  }

  const handleEdit = (coordinador: Profile) => {
    setEditingCoordinador(coordinador)
    setFormOpen(true)
  }

  const handleSubmit = async (data: CoordinadorFormData) => {
    setSaving(true)
    try {
      const url = editingCoordinador
        ? `/api/coordinadores/${editingCoordinador.id}`
        : '/api/coordinadores'
      const method = editingCoordinador ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar coordinador')
      }

      if (result.credentials) {
        setCredentials(result.credentials)
      } else {
        toast.success(editingCoordinador ? 'Coordinador actualizado' : 'Coordinador creado')
        setFormOpen(false)
        setEditingCoordinador(null)
        fetchCoordinadores()
      }
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setCoordinadorToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!coordinadorToDelete) return

    try {
      const response = await fetch(`/api/coordinadores/${coordinadorToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar coordinador')
      }

      toast.success('Coordinador eliminado')
      setDeleteDialogOpen(false)
      setCoordinadorToDelete(null)
      fetchCoordinadores()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <RequireAuth requireAdmin>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Coordinadores</h1>
              <p className="text-muted-foreground mt-1.5">
                Administra los coordinadores del sistema
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Coordinador
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombres</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>Tipo Doc.</TableHead>
                  <TableHead>Número Doc.</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Representante</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : coordinadores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      No hay coordinadores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  coordinadores.map((coordinador: any) => (
                    <TableRow key={coordinador.id}>
                      <TableCell>{coordinador.nombres}</TableCell>
                      <TableCell>{coordinador.apellidos}</TableCell>
                      <TableCell>{coordinador.tipo_documento}</TableCell>
                      <TableCell>{coordinador.numero_documento}</TableCell>
                      <TableCell>{coordinador.telefono || '-'}</TableCell>
                      <TableCell>{coordinador.departamento || '-'}</TableCell>
                      <TableCell>{coordinador.municipio || '-'}</TableCell>
                      <TableCell>{coordinador.zona || '-'}</TableCell>
                      <TableCell>{coordinador.candidato?.nombre_completo || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(coordinador)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(coordinador.id)}
                              className="text-destructive"
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
          </Card>
        </div>

        <CoordinadorForm
          open={formOpen}
          onOpenChange={(open) => {
            if (!saving) {
              setFormOpen(open)
              if (!open) {
                setEditingCoordinador(null)
              }
            }
          }}
          onSubmit={handleSubmit}
          initialData={editingCoordinador || undefined}
          loading={saving}
        />

        <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Coordinador Creado Exitosamente</DialogTitle>
              <DialogDescription>
                Guarde estas credenciales para el nuevo coordinador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={credentials?.email || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input value={credentials?.password || ''} readOnly />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setCredentials(null)
                  setFormOpen(false)
                  fetchCoordinadores()
                }}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar coordinador?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la información de este coordinador y todos sus registros asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCoordinadorToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MainLayout>
    </RequireAuth>
  )
}

