'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PersonaForm } from '@/components/personas/persona-form'
import { PersonasTable } from '@/components/personas/personas-table'
import { PersonasFilters } from '@/components/personas/personas-filters'
import { ConfirmarVotoDialog } from '@/components/personas/confirmar-voto-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download, Upload, CheckCircle2, XCircle, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { PersonaWithConfirmacion, PersonaFormData } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useAuth } from '@/hooks/use-auth'

export default function PersonasPage() {
  const { profile } = useAuth()
  const [personas, setPersonas] = useState<PersonaWithConfirmacion[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<PersonaWithConfirmacion | null>(null)
  const [confirmVotoOpen, setConfirmVotoOpen] = useState(false)
  const [confirmingPersona, setConfirmingPersona] = useState<PersonaWithConfirmacion | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [filters, setFilters] = useState<any>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [puestosVotacion, setPuestosVotacion] = useState<string[]>([])
  const [mesasVotacion, setMesasVotacion] = useState<string[]>([])
  const [lideres, setLideres] = useState<Array<{ id: string; nombres: string; apellidos: string }>>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null)
  const [reversarDialogOpen, setReversarDialogOpen] = useState(false)
  const [personaToReversar, setPersonaToReversar] = useState<PersonaWithConfirmacion | null>(null)

  // Serializar filters para comparación estable
  const filtersString = useMemo(() => JSON.stringify(filters), [filters])
  const prevFiltersStringRef = useRef<string>('')
  const prevPageRef = useRef<number>(1)

  const fetchPersonas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters,
      })

      const response = await fetch(`/api/personas?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar personas')
      }

      setPersonas(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error: any) {
      toast.error(error.message, { duration: 8000 })
    } finally {
      setLoading(false)
    }
  }, [page, filtersString])

  const fetchFilters = useCallback(async () => {
    try {
      const response = await fetch('/api/personas?limit=1000')
      const data = await response.json()

      if (data.data) {
        const puestos = [...new Set(data.data.map((p: PersonaWithConfirmacion) => p.puesto_votacion))]
        const mesas = [...new Set(data.data.map((p: PersonaWithConfirmacion) => p.mesa_votacion))]
        setPuestosVotacion(puestos.sort())
        setMesasVotacion(mesas.sort())
      }

      // Cargar líderes si es admin
      if (profile?.role === 'admin') {
        try {
          const lideresResponse = await fetch('/api/lideres')
          const lideresData = await lideresResponse.json()
          
          if (!lideresResponse.ok) {
            console.error('Error al cargar líderes:', lideresData.error)
            return
          }
          
          if (lideresData.data) {
            setLideres(lideresData.data)
          }
        } catch (lideresError) {
          console.error('Error al cargar líderes:', lideresError)
        }
      } else {
        // Limpiar líderes si no es admin
        setLideres([])
      }
    } catch (error) {
      console.error('Error fetching filters:', error)
    }
  }, [profile?.role])

  // Efecto para cargar personas solo cuando cambian page o filters
  useEffect(() => {
    const filtersChanged = prevFiltersStringRef.current !== filtersString
    const pageChanged = prevPageRef.current !== page
    
    if (filtersChanged || pageChanged) {
      prevFiltersStringRef.current = filtersString
      prevPageRef.current = page
      fetchPersonas()
    }
  }, [page, filtersString, fetchPersonas])

  // Efecto para cargar filtros cuando profile esté disponible
  useEffect(() => {
    if (profile !== undefined) {
      fetchFilters()
    }
  }, [profile, fetchFilters])

  const handleCreate = () => {
    setEditingPersona(null)
    setFormOpen(true)
  }

  const handleEdit = (persona: PersonaWithConfirmacion) => {
    setEditingPersona(persona)
    setFormOpen(true)
  }

  const handleSubmit = async (data: PersonaFormData) => {
    try {
      const url = editingPersona
        ? `/api/personas/${editingPersona.id}`
        : '/api/personas'
      const method = editingPersona ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar persona')
      }

      toast.success(editingPersona ? 'Persona actualizada' : 'Persona creada')
      setFormOpen(false)
      setEditingPersona(null)
      fetchPersonas()
    } catch (error: any) {
      toast.error(error.message, { duration: 8000 })
      // No cerrar el formulario ni resetear - mantener los datos para corrección
      throw error // Re-lanzar el error para que el formulario no se resetee
    }
  }

  const handleDeleteClick = (id: string) => {
    setPersonaToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!personaToDelete) return

    try {
      const response = await fetch(`/api/personas/${personaToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar persona')
      }

      toast.success('Persona eliminada')
      setDeleteDialogOpen(false)
      setPersonaToDelete(null)
      fetchPersonas()
    } catch (error: any) {
      toast.error(error.message, { duration: 8000 })
    }
  }

  const handleConfirmVoto = async (personaId: string, file: File) => {
    const formData = new FormData()
    formData.append('imagen', file)
    formData.append('persona_id', personaId)

    const response = await fetch('/api/confirmaciones', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error al confirmar voto')
    }

    toast.success('Voto confirmado exitosamente')
    fetchPersonas()
  }

  const handleReversarVotoClick = (persona: PersonaWithConfirmacion) => {
    setPersonaToReversar(persona)
    setReversarDialogOpen(true)
  }

  const handleReversarVoto = async () => {
    if (!personaToReversar?.confirmacion?.id) return

    try {
      const response = await fetch(`/api/confirmaciones/${personaToReversar.confirmacion.id}/reversar`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al reversar confirmación')
      }

      toast.success('Confirmación reversada')
      setReversarDialogOpen(false)
      setPersonaToReversar(null)
      fetchPersonas()
    } catch (error: any) {
      toast.error(error.message, { duration: 8000 })
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/importaciones/template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla-personas.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Plantilla descargada')
    } catch (error: any) {
      toast.error('Error al descargar plantilla')
    }
  }

  const handleImportFile = async () => {
    if (!importFile) {
      toast.error('Debe seleccionar un archivo')
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)

    try {
      const response = await fetch('/api/importaciones', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al importar archivo')
      }

      toast.success(`Importación completada: ${result.registros_exitosos} exitosos, ${result.registros_fallidos} fallidos`)
      setImportOpen(false)
      setImportFile(null)
      fetchPersonas()
    } catch (error: any) {
      toast.error(error.message, { duration: 8000 })
    }
  }

  const totalPersonas = personas.length
  const confirmadas = personas.filter(p => p.confirmacion && !p.confirmacion.reversado).length
  const pendientes = totalPersonas - confirmadas

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Personas</h1>
            <p className="text-muted-foreground mt-2">
              Administra y gestiona el registro de votantes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleDownloadTemplate} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Plantilla
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button onClick={handleCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Persona
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Registradas</p>
                <p className="text-3xl font-semibold">{totalPersonas}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
                <p className="text-3xl font-semibold text-[hsl(var(--success))]">{confirmadas}</p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--success))]/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-3xl font-semibold text-[hsl(var(--warning))]">{pendientes}</p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-3">
                <XCircle className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <PersonasFilters
          onFilter={setFilters}
          puestosVotacion={puestosVotacion}
          mesasVotacion={mesasVotacion}
          lideres={profile?.role === 'admin' ? lideres : undefined}
        />

        {/* Table */}
        <PersonasTable
          personas={personas}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onConfirmVoto={(persona) => {
            setConfirmingPersona(persona)
            setConfirmVotoOpen(true)
          }}
          onReversarVoto={handleReversarVotoClick}
          loading={loading}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between rounded-xl border bg-card px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Página <span className="font-medium text-foreground">{page}</span> de{' '}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <PersonaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingPersona || undefined}
      />

      <ConfirmarVotoDialog
        open={confirmVotoOpen}
        onOpenChange={setConfirmVotoOpen}
        persona={confirmingPersona}
        onConfirm={handleConfirmVoto}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Personas</DialogTitle>
            <DialogDescription>
              Seleccione el archivo Excel con los datos de las personas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Archivo Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportFile} disabled={!importFile}>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar persona?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la información de esta persona.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPersonaToDelete(null)}>
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

      {/* Reversar Voto Confirmation Dialog */}
      <AlertDialog open={reversarDialogOpen} onOpenChange={setReversarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reversar confirmación de voto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la confirmación de voto como reversada. La persona volverá a aparecer como pendiente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPersonaToReversar(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReversarVoto}>
              Reversar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}

