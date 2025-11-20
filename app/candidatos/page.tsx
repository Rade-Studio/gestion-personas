'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RequireAuth } from '@/features/auth/components/require-auth'
import { Button } from '@/components/ui/button'
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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CandidatoForm } from '@/features/candidatos/components/candidato-form'
import { CandidatosTable } from '@/features/candidatos/components/candidatos-table'
import { candidatoSchema, type CandidatoFormData } from '@/features/candidatos/validations/candidato'
import type { Candidato } from '@/lib/types'

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCandidato, setEditingCandidato] = useState<Candidato | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [candidatoToDelete, setCandidatoToDelete] = useState<string | null>(null)

  const fetchCandidatos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/candidatos')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar candidatos')
      }

      setCandidatos(data.data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidatos()
  }, [])

  const handleCreate = () => {
    setEditingCandidato(null)
    setFormOpen(true)
  }

  const handleEdit = (candidato: Candidato) => {
    setEditingCandidato(candidato)
    setFormOpen(true)
  }

  const handleSubmit = async (
    data: CandidatoFormData,
    imagen?: File | null,
    removeImage?: boolean
  ) => {
    try {
      const formData = new FormData()
      formData.append('nombre_completo', data.nombre_completo)
      formData.append('numero_tarjeton', data.numero_tarjeton)
      formData.append('partido_grupo', data.partido_grupo || '')
      formData.append('es_por_defecto', data.es_por_defecto.toString())

      if (imagen) {
        formData.append('imagen', imagen)
      }

      if (removeImage) {
        formData.append('removeImage', 'true')
      }

      const url = editingCandidato
        ? `/api/candidatos/${editingCandidato.id}`
        : '/api/candidatos'
      const method = editingCandidato ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar candidato')
      }

      toast.success(editingCandidato ? 'Candidato actualizado' : 'Candidato creado')
      setFormOpen(false)
      setEditingCandidato(null)
      fetchCandidatos()
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const handleDeleteClick = (id: string) => {
    setCandidatoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!candidatoToDelete) return

    try {
      const response = await fetch(`/api/candidatos/${candidatoToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar candidato')
      }

      toast.success('Candidato eliminado')
      setDeleteDialogOpen(false)
      setCandidatoToDelete(null)
      fetchCandidatos()
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
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Candidatos</h1>
              <p className="text-muted-foreground mt-1.5">
                Administra los candidatos del sistema
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Candidato
            </Button>
          </div>

          <CandidatosTable
            candidatos={candidatos}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            loading={loading}
          />

          <CandidatoForm
            open={formOpen}
            onOpenChange={setFormOpen}
            onSubmit={handleSubmit}
            initialData={editingCandidato || undefined}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar candidato?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la información de este candidato y se desasignará de todos los líderes asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCandidatoToDelete(null)}>
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
        </div>
      </MainLayout>
    </RequireAuth>
  )
}

