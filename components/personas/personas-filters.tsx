'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X, Search } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface PersonasFiltersProps {
  onFilter: (filters: {
    puesto_votacion?: string
    mesa_votacion?: string
    numero_documento?: string
    lider_id?: string
    estado?: string
  }) => void
  puestosVotacion: string[]
  mesasVotacion: string[]
  lideres?: Array<{ id: string; nombres: string; apellidos: string }>
}

export function PersonasFilters({
  onFilter,
  puestosVotacion,
  mesasVotacion,
  lideres,
}: PersonasFiltersProps) {
  const { isAdmin } = useAuth()
  const [filters, setFilters] = useState<{
    puesto_votacion: string | undefined
    mesa_votacion: string | undefined
    numero_documento: string
    lider_id: string | undefined
    estado: string | undefined
  }>({
    puesto_votacion: undefined,
    mesa_votacion: undefined,
    numero_documento: '',
    lider_id: undefined,
    estado: undefined,
  })

  // Apply filters function
  const applyFilters = useCallback(() => {
    const activeFilters: any = {}
    if (filters.puesto_votacion) {
      activeFilters.puesto_votacion = filters.puesto_votacion
    }
    if (filters.mesa_votacion) {
      activeFilters.mesa_votacion = filters.mesa_votacion
    }
    if (filters.numero_documento.trim()) {
      activeFilters.numero_documento = filters.numero_documento.trim()
    }
    if (filters.lider_id && isAdmin) {
      activeFilters.lider_id = filters.lider_id
    }
    if (filters.estado) {
      activeFilters.estado = filters.estado
    }
    onFilter(activeFilters)
  }, [filters, onFilter, isAdmin])

  // Debounce effect for text input (numero_documento)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters.numero_documento, applyFilters])

  // Apply filters immediately when selects change
  useEffect(() => {
    applyFilters()
  }, [filters.puesto_votacion, filters.mesa_votacion, filters.lider_id, filters.estado, applyFilters])

  // Simple handler for filter changes
  const handleFilterChange = (key: string, value: string) => {
    // If value is "all", set to undefined to clear the filter
    const filterValue = value === 'all' ? undefined : value
    setFilters((prev) => ({ ...prev, [key]: filterValue }))
  }

  const handleClearFilters = () => {
    setFilters({
      puesto_votacion: undefined,
      mesa_votacion: undefined,
      numero_documento: '',
      lider_id: undefined,
      estado: undefined,
    })
    onFilter({})
  }

  const hasActiveFilters = 
    filters.puesto_votacion || 
    filters.mesa_votacion || 
    filters.numero_documento.trim() || 
    filters.lider_id ||
    filters.estado

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Filtros</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1.5" />
              Limpiar
            </Button>
          )}
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isAdmin && lideres ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Puesto de Votación</Label>
            <Select
              value={filters.puesto_votacion ? filters.puesto_votacion : 'all'}
              onValueChange={(value) => handleFilterChange('puesto_votacion', value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos los puestos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los puestos</SelectItem>
                {puestosVotacion.map((puesto) => (
                  <SelectItem key={puesto} value={puesto}>
                    {puesto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Mesa de Votación</Label>
            <Select
              value={filters.mesa_votacion ? filters.mesa_votacion : 'all'}
              onValueChange={(value) => handleFilterChange('mesa_votacion', value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todas las mesas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las mesas</SelectItem>
                {mesasVotacion.map((mesa) => (
                  <SelectItem key={mesa} value={mesa}>
                    {mesa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Número de Documento</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por documento..."
                value={filters.numero_documento}
                onChange={(e) => handleFilterChange('numero_documento', e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Estado</Label>
            <Select
              value={filters.estado ? filters.estado : 'all'}
              onValueChange={(value) => handleFilterChange('estado', value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && lideres && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Líder</Label>
              <Select
                value={filters.lider_id ? filters.lider_id : 'all'}
                onValueChange={(value) => handleFilterChange('lider_id', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todos los líderes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los líderes</SelectItem>
                  {lideres.map((lider) => (
                    <SelectItem key={lider.id} value={lider.id}>
                      {lider.nombres} {lider.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

