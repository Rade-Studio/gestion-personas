'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PersonaForm } from '@/features/personas/components/persona-form'
import { PersonasTable } from '@/features/personas/components/personas-table'
import { PersonasFilters } from '@/features/personas/components/personas-filters'
import { ConfirmarActividadDialog } from '@/features/personas/components/confirmar-actividad-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download, Upload, CheckCircle2, XCircle, Users, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import type { PersonaWithConfirmacion } from '@/lib/types'
import type { PersonaFormData } from '@/features/personas/validations/persona'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export default function PersonasPage() {
  const { profile } = useAuth()
  const [personas, setPersonas] = useState<PersonaWithConfirmacion[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<PersonaWithConfirmacion | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmActividadOpen, setConfirmActividadOpen] = useState(false)
  const [confirmingPersona, setConfirmingPersona] = useState<PersonaWithConfirmacion | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [filters, setFilters] = useState<any>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [puestosVotacion, setPuestosVotacion] = useState<Array<{ id: number; codigo: string; nombre: string }>>([])
  const [barrios, setBarrios] = useState<Array<{ id: number; codigo: string; nombre: string }>>([])
  const [mesasVotacion, setMesasVotacion] = useState<string[]>([])
  const [lideres, setLideres] = useState<Array<{ id: string; nombres: string; apellidos: string }>>([])
  const [coordinadores, setCoordinadores] = useState<Array<{ id: string; nombres: string; apellidos: string }>>([])
  const [stats, setStats] = useState({
    total: 0,
    datosFaltantes: 0,
    pendientes: 0,
    confirmadas: 0,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null)
  const [reversarDialogOpen, setReversarDialogOpen] = useState(false)
  const [personaToReversar, setPersonaToReversar] = useState<PersonaWithConfirmacion | null>(null)
  const [importReportOpen, setImportReportOpen] = useState(false)
  const [importReport, setImportReport] = useState<{
    registros_exitosos: number
    registros_actualizados: number
    registros_creados: number
    registros_omitidos: number
    documentos_omitidos?: string[]
    registros_fallidos: number
    errores?: Array<{ row?: number; error: string; tipo?: string; numero_documento?: string }>
  } | null>(null)

  // Serializar filters para comparación estable
  const filtersString = useMemo(() => JSON.stringify(filters), [filters])
  const prevFiltersStringRef = useRef<string>('')
  const prevPageRef = useRef<number>(1)

  const fetchPersonas = useCallback(async (currentPage?: number, currentFilters?: any) => {
    setLoading(true)
    try {
      const pageToUse = currentPage ?? page
      const filtersToUse = currentFilters ?? filters
      
      const params = new URLSearchParams({
        page: pageToUse.toString(),
        limit: '10',
        ...filtersToUse,
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
  }, [page, filters])

  const fetchFilters = useCallback(async () => {
    try {
      // Cargar lista completa de puestos de votación desde la API
      try {
        const puestosResponse = await fetch('/api/puestos-votacion')
        const puestosData = await puestosResponse.json()
        if (puestosResponse.ok && puestosData.data) {
          setPuestosVotacion(puestosData.data)
        }
      } catch (puestosError) {
        console.error('Error al cargar puestos de votación:', puestosError)
      }

      // Cargar lista completa de barrios desde la API
      try {
        const barriosResponse = await fetch('/api/barrios')
        const barriosData = await barriosResponse.json()
        if (barriosResponse.ok && barriosData.data) {
          setBarrios(barriosData.data)
        }
      } catch (barriosError) {
        console.error('Error al cargar barrios:', barriosError)
      }

      // Cargar mesas desde personas
      const response = await fetch('/api/personas?limit=1000')
      const data = await response.json()

      if (data.data) {
        // Get unique mesas, normalize (trim) and filter out empty values
        const mesasSet = new Set<string>()
        data.data.forEach((p: PersonaWithConfirmacion) => {
          if (p.mesa_votacion) {
            const normalized = p.mesa_votacion.trim()
            if (normalized) {
              mesasSet.add(normalized)
            }
          }
        })
        const mesas = Array.from(mesasSet).sort()
        
        setMesasVotacion(mesas)
      }

      // Cargar líderes si es admin o coordinador
      if (profile?.role === 'admin' || profile?.role === 'coordinador') {
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
        // Limpiar líderes si no es admin ni coordinador
        setLideres([])
      }

      // Cargar coordinadores solo si es admin
      if (profile?.role === 'admin') {
        try {
          const coordinadoresResponse = await fetch('/api/coordinadores')
          const coordinadoresData = await coordinadoresResponse.json()
          
          if (!coordinadoresResponse.ok) {
            console.error('Error al cargar coordinadores:', coordinadoresData.error)
            return
          }
          
          if (coordinadoresData.data) {
            setCoordinadores(coordinadoresData.data)
          }
        } catch (coordinadoresError) {
          console.error('Error al cargar coordinadores:', coordinadoresError)
        }
      } else {
        // Limpiar coordinadores si no es admin
        setCoordinadores([])
      }
    } catch (error) {
      console.error('Error fetching filters:', error)
    }
  }, [profile?.role])

  // Efecto para manejar cambios en filtros y página
  useEffect(() => {
    const filtersChanged = prevFiltersStringRef.current !== filtersString
    const pageChanged = prevPageRef.current !== page
    
    // Si cambian los filtros y no estamos en página 1, resetear a página 1
    if (filtersChanged && page !== 1) {
      prevFiltersStringRef.current = filtersString
      prevPageRef.current = 1 // Prevenir que el siguiente efecto detecte el cambio de página
      setPage(1)
      // Cargar datos con página 1 y los nuevos filtros inmediatamente
      fetchPersonas(1, filters)
      return
    }
    
    // Si cambian los filtros o la página, cargar datos
    if (filtersChanged || pageChanged) {
      prevFiltersStringRef.current = filtersString
      prevPageRef.current = page
      // Usar los valores actuales del estado
      fetchPersonas()
    }
  }, [page, filtersString, filters, fetchPersonas])

  // Función para obtener estadísticas totales con filtros aplicados
  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '10000', // Obtener todas para contar
        ...filters,
      })

      const response = await fetch(`/api/personas?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar estadísticas')
      }

      const allPersonas = data.data || []
      const total = allPersonas.length
      const datosFaltantes = allPersonas.filter((p: PersonaWithConfirmacion) => !p.puesto_votacion || !p.mesa_votacion).length
      const confirmadas = allPersonas.filter((p: PersonaWithConfirmacion) => 
        (p.puesto_votacion?.nombre || p.puesto_votacion) && p.mesa_votacion && 
        p.confirmacion && !p.confirmacion.reversado
      ).length
      const pendientes = allPersonas.filter((p: PersonaWithConfirmacion) => 
        (p.puesto_votacion?.nombre || p.puesto_votacion) && p.mesa_votacion &&
        (!p.confirmacion || p.confirmacion.reversado)
      ).length

      setStats({
        total,
        datosFaltantes,
        pendientes,
        confirmadas,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [filtersString])

  // Cargar estadísticas cuando cambian los filtros
  useEffect(() => {
    fetchStats()
  }, [filtersString, fetchStats])

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
    setSaving(true)
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

      toast.success(
        editingPersona 
          ? 'Persona actualizada exitosamente' 
          : 'Persona creada exitosamente',
        { duration: 3000 }
      )
      setFormOpen(false)
      setEditingPersona(null)
      fetchPersonas()
    } catch (error: any) {
      toast.error(error.message, { duration: 8000 })
      // No cerrar el formulario ni resetear - mantener los datos para corrección
      throw error // Re-lanzar el error para que el formulario no se resetee
    } finally {
      setSaving(false)
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
      throw new Error(result.error || 'Error al confirmar actividad')
    }

    toast.success('Actividad confirmada exitosamente')
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
      
      // Extract filename from Content-Disposition header or generate with timestamp
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'plantilla-personas.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      } else {
        // Fallback: generate timestamp if header not available (DDMMYYYYHHMMSS)
        const now = new Date()
        const day = String(now.getDate()).padStart(2, '0')
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const year = now.getFullYear()
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`
        filename = `plantilla-personas-${timestamp}.xlsx`
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Plantilla descargada')
    } catch (error: any) {
      toast.error('Error al descargar plantilla')
    }
  }

  const handleExportData = async () => {
    try {
      const params = new URLSearchParams()
      
      // Add active filters
      if (filters.puesto_votacion) {
        if (Array.isArray(filters.puesto_votacion)) {
          filters.puesto_votacion.forEach((pv: string) => params.append('puesto_votacion', pv))
        } else {
          params.append('puesto_votacion', filters.puesto_votacion)
        }
      }
      if (filters.barrio_id) {
        if (Array.isArray(filters.barrio_id)) {
          filters.barrio_id.forEach((bid: string) => params.append('barrio_id', bid))
        } else {
          params.append('barrio_id', filters.barrio_id)
        }
      }
      if (filters.numero_documento) {
        params.append('numero_documento', filters.numero_documento)
      }
      if (filters.lider_id) {
        params.append('lider_id', filters.lider_id)
      }
      if (filters.estado) {
        params.append('estado', filters.estado)
      }

      const response = await fetch(`/api/importaciones/export?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al exportar datos')
      }

      const blob = await response.blob()
      
      // Extract filename from Content-Disposition header or generate with timestamp
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'personas-exportadas.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      } else {
        // Fallback: generate timestamp if header not available (DDMMYYYYHHMMSS)
        const now = new Date()
        const day = String(now.getDate()).padStart(2, '0')
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const year = now.getFullYear()
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`
        filename = `personas-exportadas-${timestamp}.xlsx`
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Datos exportados exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al exportar datos', { duration: 8000 })
    }
  }

  const handleImportFile = async () => {
    if (!importFile) {
      toast.error('Debe seleccionar un archivo')
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)

    setImporting(true)
    setImportProgress(0)

    const loadingToast = toast.loading('Preparando importación...', {
      id: 'import-loading',
    })

    try {
      // Simular progreso inicial
      setImportProgress(10)
      toast.loading('Leyendo archivo Excel...', {
        id: 'import-loading',
      })

      const response = await fetch('/api/importaciones', {
        method: 'POST',
        body: formData,
      })

      // Simular progreso durante la carga
      setImportProgress(50)
      toast.loading('Procesando registros...', {
        id: 'import-loading',
      })

      const result = await response.json()

      setImportProgress(80)
      toast.loading('Guardando datos...', {
        id: 'import-loading',
      })

      if (!response.ok) {
        throw new Error(result.error || 'Error al importar archivo')
      }

      setImportProgress(100)
      toast.loading('Finalizando...', {
        id: 'import-loading',
      })

      // Pequeño delay para mostrar el 100%
      await new Promise(resolve => setTimeout(resolve, 300))

      toast.dismiss('import-loading')

      // Show report modal
      setImportReport(result)
      setImportReportOpen(true)
      setImportOpen(false)
      setImportFile(null)
      setImportProgress(0)
      fetchPersonas()
    } catch (error: any) {
      toast.dismiss('import-loading')
      toast.error(error.message, { duration: 8000 })
      setImportProgress(0)
    } finally {
      setImporting(false)
    }
  }


  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Personas</h1>
            <p className="text-muted-foreground mt-1.5">
              Administra y gestiona el registro de personas
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleDownloadTemplate} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Plantilla
            </Button>
            <Button variant="outline" onClick={handleExportData} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className={`border-2 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              !filters.estado ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20' : ''
            }`}
            onClick={() => {
              setFilters({})
              setPage(1)
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Registradas</p>
                  <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-2 hover:shadow-md transition-all cursor-pointer border-red-200/50 bg-red-50/30 hover:scale-[1.02] active:scale-[0.98] hover:border-red-300/50 ${
              filters.estado === 'missing_data' ? 'border-red-400/70 bg-red-100/50 ring-2 ring-red-300/30' : ''
            }`}
            onClick={() => {
              setFilters({ estado: 'missing_data' })
              setPage(1)
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Datos Faltantes</p>
                  <p className="text-3xl font-bold text-destructive">{stats.datosFaltantes.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-2 hover:shadow-md transition-all cursor-pointer border-orange-200/50 bg-orange-50/30 hover:scale-[1.02] active:scale-[0.98] hover:border-orange-300/50 ${
              filters.estado === 'pending' ? 'border-orange-400/70 bg-orange-100/50 ring-2 ring-orange-300/30' : ''
            }`}
            onClick={() => {
              setFilters({ estado: 'pending' })
              setPage(1)
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendientes.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-orange-500/10 p-3">
                  <XCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-2 hover:shadow-md transition-all cursor-pointer border-green-200/50 bg-green-50/30 hover:scale-[1.02] active:scale-[0.98] hover:border-green-300/50 ${
              filters.estado === 'confirmed' ? 'border-green-400/70 bg-green-100/50 ring-2 ring-green-300/30' : ''
            }`}
            onClick={() => {
              setFilters({ estado: 'confirmed' })
              setPage(1)
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.confirmadas.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-green-500/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <PersonasFilters
          onFilter={setFilters}
          puestosVotacion={puestosVotacion}
          barrios={barrios}
          mesasVotacion={[]}
          lideres={(profile?.role === 'admin' || profile?.role === 'coordinador') ? lideres : undefined}
          coordinadores={profile?.role === 'admin' ? coordinadores : undefined}
        />

        {/* Table */}
        <PersonasTable
          personas={personas}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onConfirmVoto={(persona) => {
            setConfirmingPersona(persona)
            setConfirmActividadOpen(true)
          }}
          onReversarVoto={handleReversarVotoClick}
          loading={loading}
        />

        {/* Pagination */}
        <Card>
          <CardContent className="flex items-center justify-between px-6 py-4">
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
          </CardContent>
        </Card>
      </div>

      <PersonaForm
        open={formOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setFormOpen(open)
            if (!open) {
              setEditingPersona(null)
            }
          }
        }}
        onSubmit={handleSubmit}
        initialData={editingPersona || undefined}
        loading={saving}
      />

      <ConfirmarActividadDialog
        open={confirmActividadOpen}
        onOpenChange={setConfirmActividadOpen}
        persona={confirmingPersona}
        onConfirm={handleConfirmVoto}
      />

      <Dialog open={importOpen} onOpenChange={(open) => {
        if (!importing) {
          setImportOpen(open)
          if (!open) {
            setImportFile(null)
            setImportProgress(0)
          }
        }
      }}>
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
                disabled={importing}
              />
            </div>

            {importing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Importando registros...</span>
                  <span className="font-medium">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando archivo, por favor espere...</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setImportOpen(false)
                setImportFile(null)
                setImportProgress(0)
              }}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImportFile} 
              disabled={!importFile || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                'Importar'
              )}
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
            <AlertDialogTitle>¿Reversar confirmación de actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la confirmación de actividad como reversada. La persona volverá a aparecer como pendiente.
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

      {/* Import Report Dialog */}
      <Dialog open={importReportOpen} onOpenChange={setImportReportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl">Informe de Importación</DialogTitle>
            <DialogDescription className="text-sm">
              Resumen de la operación realizada
            </DialogDescription>
          </DialogHeader>
          {importReport && (
            <div className="space-y-5 overflow-y-auto max-h-[calc(90vh-180px)] pr-1">
              {/* Summary Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Exitosos</p>
                    <p className="text-lg font-semibold">{importReport.registros_exitosos}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Fallidos</p>
                    <p className="text-lg font-semibold">{importReport.registros_fallidos}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-1">
                  <span className="text-sm text-muted-foreground">Creados</span>
                  <span className="text-sm font-medium">{importReport.registros_creados}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-1">
                  <span className="text-sm text-muted-foreground">Actualizados</span>
                  <span className="text-sm font-medium">{importReport.registros_actualizados}</span>
                </div>
                {importReport.registros_omitidos > 0 && (
                  <div className="flex items-center justify-between py-2 px-1">
                    <span className="text-sm text-muted-foreground">Omitidos</span>
                    <span className="text-sm font-medium">{importReport.registros_omitidos}</span>
                  </div>
                )}
              </div>

              {/* Omitted Documents */}
              {importReport.documentos_omitidos && importReport.documentos_omitidos.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Documentos omitidos</p>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Tienen confirmación activa y no se actualizaron
                  </p>
                  <div className="max-h-24 overflow-y-auto rounded border p-2 bg-muted/20">
                    <div className="flex flex-wrap gap-1.5">
                      {importReport.documentos_omitidos.map((doc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-background border"
                        >
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importReport.errores && importReport.errores.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Errores</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {importReport.errores.map((error, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2.5 rounded border bg-muted/20"
                      >
                        <div className="flex items-start gap-2 mb-1">
                          {error.row && (
                            <span className="font-medium text-muted-foreground">Fila {error.row}</span>
                          )}
                          {error.numero_documento && (
                            <span className="font-mono text-muted-foreground">{error.numero_documento}</span>
                          )}
                          {error.tipo && (
                            <span className="text-muted-foreground">({error.tipo})</span>
                          )}
                        </div>
                        <p className="text-muted-foreground">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {importReport.registros_fallidos === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20">
                  <CheckCircle2 className="h-4 w-4 text-foreground flex-shrink-0" />
                  <p className="text-sm font-medium">Importación completada sin errores</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="border-t pt-4">
            <Button onClick={() => setImportReportOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

