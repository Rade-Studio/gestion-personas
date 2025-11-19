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
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { LiderForm } from '@/features/lideres/components/lider-form'
import { type LiderFormData } from '@/features/lideres/validations/lider'
import type { Profile } from '@/lib/types'

export default function LideresPage() {
  const [lideres, setLideres] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingLider, setEditingLider] = useState<Profile | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [liderToDelete, setLiderToDelete] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)

  const fetchLideres = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/lideres')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar líderes')
      }

      setLideres(data.data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLideres()
  }, [])

  const handleCreate = () => {
    setEditingLider(null)
    setFormOpen(true)
  }

  const handleEdit = (lider: Profile) => {
    setEditingLider(lider)
    setFormOpen(true)
  }

  const handleSubmit = async (data: LiderFormData) => {
    try {
      const url = editingLider
        ? `/api/lideres/${editingLider.id}`
        : '/api/lideres'
      const method = editingLider ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar líder')
      }

      if (result.credentials) {
        setCredentials(result.credentials)
      } else {
        toast.success(editingLider ? 'Líder actualizado' : 'Líder creado')
        setFormOpen(false)
        setEditingLider(null)
        fetchLideres()
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteClick = (id: string) => {
    setLiderToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!liderToDelete) return

    try {
      const response = await fetch(`/api/lideres/${liderToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar líder')
      }

      toast.success('Líder eliminado')
      setDeleteDialogOpen(false)
      setLiderToDelete(null)
      fetchLideres()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <RequireAuth requireAdmin>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Gestión de Líderes</h1>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Líder
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombres</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>Tipo Doc.</TableHead>
                  <TableHead>Número Doc.</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : lideres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No hay líderes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  lideres.map((lider) => (
                    <TableRow key={lider.id}>
                      <TableCell>{lider.nombres}</TableCell>
                      <TableCell>{lider.apellidos}</TableCell>
                      <TableCell>{lider.tipo_documento}</TableCell>
                      <TableCell>{lider.numero_documento}</TableCell>
                      <TableCell>{lider.telefono || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(lider)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(lider.id)}
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
          </div>
        </div>

        <LiderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          initialData={editingLider || undefined}
        />

        <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Líder Creado Exitosamente</DialogTitle>
              <DialogDescription>
                Guarde estas credenciales para el nuevo líder
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
                  fetchLideres()
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
              <AlertDialogTitle>¿Eliminar líder?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la información de este líder y todos sus registros asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLiderToDelete(null)}>
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

