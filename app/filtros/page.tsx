'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RequireAuth } from '@/features/auth/components/require-auth'
import { useAuth } from '@/features/auth/hooks/use-auth'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, MoreHorizontal, Users } from 'lucide-react'
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
import { toast } from 'sonner'
import { FiltroForm } from '@/features/filtros/components/filtro-form'
import { type FiltroFormData } from '@/features/filtros/validations/filtro'
import type { Profile, Filtro } from '@/lib/types'

export default function FiltrosPage() {
  const { profile } = useAuth()
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [coordinadores, setCoordinadores] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFiltro, setEditingFiltro] = useState<Filtro | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [filtroToDelete, setFiltroToDelete] = useState<string | null>(null)
  const [lideresDialogOpen, setLideresDialogOpen] = useState(false)
  const [selectedFiltroLideres, setSelectedFiltroLideres] = useState<Filtro | null>(null)
  const [activeTab, setActiveTab] = useState<'validador' | 'confirmador'>('validador')

  const fetchFiltros = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/filtros')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar filtros')
      }

      setFiltros(data.data || [])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCoordinadores = async () => {
    if (profile?.role !== 'admin') return

    try {
      const response = await fetch('/api/coordinadores')
      const data = await response.json()
      if (response.ok) {
        setCoordinadores(data.data || [])
      }
    } catch {
      // Ignore error
    }
  }

  useEffect(() => {
    fetchFiltros()
    fetchCoordinadores()
  }, [profile?.role])

  const handleCreate = () => {
    setEditingFiltro(null)
    setFormOpen(true)
  }

  const handleEdit = (filtro: Filtro) => {
    setEditingFiltro(filtro)
    setFormOpen(true)
  }

  const handleViewLideres = (filtro: Filtro) => {
    setSelectedFiltroLideres(filtro)
    setLideresDialogOpen(true)
  }

  const handleSubmit = async (data: FiltroFormData) => {
    setSaving(true)
    try {
      const url = editingFiltro
        ? `/api/filtros/${editingFiltro.id}`
        : '/api/filtros'
      const method = editingFiltro ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar filtro')
      }

      toast.success(editingFiltro ? 'Filtro actualizado' : 'Filtro creado')
      setFormOpen(false)
      setEditingFiltro(null)
      fetchFiltros()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setFiltroToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!filtroToDelete) return

    try {
      const response = await fetch(`/api/filtros/${filtroToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar filtro')
      }

      toast.success('Filtro eliminado')
      setDeleteDialogOpen(false)
      setFiltroToDelete(null)
      fetchFiltros()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  const filteredFiltros = filtros.filter(f => f.role === activeTab)

  const renderTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombres</TableHead>
          <TableHead>Apellidos</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Coordinador</TableHead>
          <TableHead>Líderes</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              Cargando...
            </TableCell>
          </TableRow>
        ) : filteredFiltros.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              No hay {activeTab === 'validador' ? 'validadores' : 'confirmadores'} registrados
            </TableCell>
          </TableRow>
        ) : (
          filteredFiltros.map((filtro) => (
            <TableRow key={filtro.id}>
              <TableCell className="font-medium">{filtro.nombres}</TableCell>
              <TableCell>{filtro.apellidos}</TableCell>
              <TableCell>{filtro.numero_documento}</TableCell>
              <TableCell>{filtro.telefono || '-'}</TableCell>
              <TableCell>
                {filtro.coordinador
                  ? `${filtro.coordinador.nombres} ${filtro.coordinador.apellidos}`
                  : '-'}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewLideres(filtro)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  {filtro.lideres_count || 0}
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(filtro)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(filtro.id)}
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
  )

  return (
    <RequireAuth allowedRoles={['admin', 'coordinador']}>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Filtros</h1>
              <p className="text-muted-foreground mt-1.5">
                Administra validadores y confirmadores del sistema
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Filtro
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filtros del Sistema</CardTitle>
              <CardDescription>
                Los validadores verifican los datos de personas y los confirmadores aprueban el proceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'validador' | 'confirmador')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="validador">
                    Validadores
                    <Badge variant="secondary" className="ml-2">
                      {filtros.filter(f => f.role === 'validador').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="confirmador">
                    Confirmadores
                    <Badge variant="secondary" className="ml-2">
                      {filtros.filter(f => f.role === 'confirmador').length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="validador">
                  {renderTable()}
                </TabsContent>
                <TabsContent value="confirmador">
                  {renderTable()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <FiltroForm
          open={formOpen}
          onOpenChange={(open) => {
            if (!saving) {
              setFormOpen(open)
              if (!open) {
                setEditingFiltro(null)
              }
            }
          }}
          onSubmit={handleSubmit}
          initialData={editingFiltro || undefined}
          loading={saving}
          coordinadores={coordinadores}
          userRole={profile?.role}
          userCoordinadorId={profile?.id}
        />

        {/* Líderes Dialog */}
        <Dialog open={lideresDialogOpen} onOpenChange={setLideresDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Líderes asignados a {selectedFiltroLideres?.nombres} {selectedFiltroLideres?.apellidos}
              </DialogTitle>
              <DialogDescription>
                Lista de líderes que este {selectedFiltroLideres?.role} puede gestionar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {selectedFiltroLideres?.lideres_asignados?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay líderes asignados
                </p>
              ) : (
                selectedFiltroLideres?.lideres_asignados?.map((lider) => (
                  <div
                    key={lider.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {lider.nombres} {lider.apellidos}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lider.numero_documento}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar filtro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente este
                {activeTab === 'validador' ? ' validador' : ' confirmador'} y sus asignaciones.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setFiltroToDelete(null)}>
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
