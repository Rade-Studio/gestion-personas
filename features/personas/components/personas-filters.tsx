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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Filter, X, Search, ChevronDown } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PersonasFiltersProps {
  onFilter: (filters: {
    puesto_votacion?: string | string[]
    barrio_id?: string | string[]
    numero_documento?: string
    lider_id?: string
    coordinador_id?: string
    estado?: string
  }) => void
  puestosVotacion: Array<{ id: number; codigo: string; nombre: string }>
  barrios: Array<{ id: number; codigo: string; nombre: string }>
  mesasVotacion: string[]
  lideres?: Array<{ id: string; nombres: string; apellidos: string }>
  coordinadores?: Array<{ id: string; nombres: string; apellidos: string }>
}

export function PersonasFilters({
  onFilter,
  puestosVotacion,
  barrios,
  mesasVotacion,
  lideres,
  coordinadores,
}: PersonasFiltersProps) {
  const { isAdmin, isCoordinador } = useAuth()
  const [filters, setFilters] = useState<{
    puesto_votacion: string[] | undefined
    barrio_id: string[] | undefined
    numero_documento: string
    lider_id: string | undefined
    coordinador_id: string | undefined
    estado: string | undefined
  }>({
    puesto_votacion: undefined,
    barrio_id: undefined,
    numero_documento: '',
    lider_id: undefined,
    coordinador_id: undefined,
    estado: undefined,
  })
  const [liderSearch, setLiderSearch] = useState('')
  const [liderSelectOpen, setLiderSelectOpen] = useState(false)
  const [coordinadorSearch, setCoordinadorSearch] = useState('')
  const [coordinadorSelectOpen, setCoordinadorSelectOpen] = useState(false)
  const [puestoSearch, setPuestoSearch] = useState('')
  const [puestoPopoverOpen, setPuestoPopoverOpen] = useState(false)
  const [barrioSearch, setBarrioSearch] = useState('')
  const [barrioPopoverOpen, setBarrioPopoverOpen] = useState(false)

  // Apply filters function
  const applyFilters = useCallback(() => {
    const activeFilters: any = {}
    if (filters.puesto_votacion && filters.puesto_votacion.length > 0) {
      activeFilters.puesto_votacion = filters.puesto_votacion
    }
    if (filters.barrio_id && filters.barrio_id.length > 0) {
      activeFilters.barrio_id = filters.barrio_id
    }
    if (filters.numero_documento.trim()) {
      activeFilters.numero_documento = filters.numero_documento.trim()
    }
    if (filters.coordinador_id && isAdmin) {
      activeFilters.coordinador_id = filters.coordinador_id
    } else if (filters.lider_id && (isAdmin || isCoordinador)) {
      activeFilters.lider_id = filters.lider_id
    }
    if (filters.estado) {
      activeFilters.estado = filters.estado
    }
    onFilter(activeFilters)
  }, [filters, onFilter, isAdmin, isCoordinador])

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
  }, [filters.puesto_votacion, filters.barrio_id, filters.lider_id, filters.coordinador_id, filters.estado, applyFilters])

  // Toggle puesto selection
  const togglePuesto = (puestoId: string) => {
    setFilters((prev) => {
      const current = prev.puesto_votacion || []
      const newSelection = current.includes(puestoId)
        ? current.filter((id) => id !== puestoId)
        : [...current, puestoId]
      return { ...prev, puesto_votacion: newSelection.length > 0 ? newSelection : undefined }
    })
  }

  // Toggle barrio selection
  const toggleBarrio = (barrioId: string) => {
    setFilters((prev) => {
      const current = prev.barrio_id || []
      const newSelection = current.includes(barrioId)
        ? current.filter((id) => id !== barrioId)
        : [...current, barrioId]
      return { ...prev, barrio_id: newSelection.length > 0 ? newSelection : undefined }
    })
  }

  // Simple handler for filter changes
  const handleFilterChange = (key: string, value: string) => {
    // If value is "all", set to undefined to clear the filter
    const filterValue = value === 'all' ? undefined : value
    
    // Si se selecciona un coordinador, limpiar el filtro de líder
    if (key === 'coordinador_id' && filterValue) {
      setFilters((prev) => ({ ...prev, [key]: filterValue, lider_id: undefined }))
    }
    // Si se selecciona un líder, limpiar el filtro de coordinador
    else if (key === 'lider_id' && filterValue) {
      setFilters((prev) => ({ ...prev, [key]: filterValue, coordinador_id: undefined }))
    }
    else {
      setFilters((prev) => ({ ...prev, [key]: filterValue }))
    }
  }

  const handleClearFilters = () => {
    setFilters({
      puesto_votacion: undefined,
      barrio_id: undefined,
      numero_documento: '',
      lider_id: undefined,
      coordinador_id: undefined,
      estado: undefined,
    })
    onFilter({})
  }

  const hasActiveFilters = 
    (filters.puesto_votacion && filters.puesto_votacion.length > 0) || 
    (filters.barrio_id && filters.barrio_id.length > 0) ||
    filters.numero_documento.trim() || 
    filters.lider_id ||
    filters.coordinador_id ||
    filters.estado

  return (
    <Card className="overflow-visible">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Filtros</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1.5" />
              Limpiar
            </Button>
          )}
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-3 ${
          isAdmin && coordinadores
            ? 'lg:grid-cols-6' 
            : (isAdmin || isCoordinador) && lideres
            ? 'lg:grid-cols-5'
            : 'lg:grid-cols-4'
        }`}>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Número de Documento</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por documento..."
                value={filters.numero_documento}
                onChange={(e) => handleFilterChange('numero_documento', e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Puesto de Votación</Label>
            <Popover open={puestoPopoverOpen} onOpenChange={setPuestoPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "h-9 w-full justify-between text-sm font-normal",
                    (!filters.puesto_votacion || filters.puesto_votacion.length === 0) && "text-muted-foreground"
                  )}
                >
                  {filters.puesto_votacion && filters.puesto_votacion.length > 0
                    ? `${filters.puesto_votacion.length} puesto(s) seleccionado(s)`
                    : "Todos los puestos"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar puesto..."
                      value={puestoSearch}
                      onChange={(e) => setPuestoSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {puestosVotacion
                    .filter((p) => {
                      if (!p) return false
                      if (!puestoSearch.trim()) return true
                      const searchLower = puestoSearch.toLowerCase()
                      return p.nombre.toLowerCase().includes(searchLower) || 
                             p.codigo.toLowerCase().includes(searchLower)
                    })
                    .map((puesto) => {
                      const isChecked = filters.puesto_votacion?.includes(puesto.id.toString()) || false
                      return (
                        <div
                          key={puesto.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                          onClick={() => togglePuesto(puesto.id.toString())}
                        >
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked !== isChecked) {
                                  togglePuesto(puesto.id.toString())
                                }
                              }}
                            />
                          </div>
                          <label className="text-sm cursor-pointer flex-1" onClick={(e) => {
                            e.stopPropagation()
                            togglePuesto(puesto.id.toString())
                          }}>
                            {puesto.nombre}
                          </label>
                        </div>
                      )
                    })}
                  {puestosVotacion.filter((p) => {
                    if (!p) return false
                    if (!puestoSearch.trim()) return false
                    const searchLower = puestoSearch.toLowerCase()
                    return p.nombre.toLowerCase().includes(searchLower) || 
                           p.codigo.toLowerCase().includes(searchLower)
                  }).length === 0 && puestoSearch.trim() && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No se encontraron puestos
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Barrio</Label>
            <Popover open={barrioPopoverOpen} onOpenChange={setBarrioPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "h-9 w-full justify-between text-sm font-normal",
                    (!filters.barrio_id || filters.barrio_id.length === 0) && "text-muted-foreground"
                  )}
                >
                  {filters.barrio_id && filters.barrio_id.length > 0
                    ? `${filters.barrio_id.length} barrio(s) seleccionado(s)`
                    : "Todos los barrios"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar barrio..."
                      value={barrioSearch}
                      onChange={(e) => setBarrioSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {barrios
                    .filter((b) => {
                      if (!b) return false
                      if (!barrioSearch.trim()) return true
                      const searchLower = barrioSearch.toLowerCase()
                      return b.nombre.toLowerCase().includes(searchLower) || 
                             b.codigo.toLowerCase().includes(searchLower)
                    })
                    .map((barrio) => {
                      const isChecked = filters.barrio_id?.includes(barrio.id.toString()) || false
                      return (
                        <div
                          key={barrio.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                          onClick={() => toggleBarrio(barrio.id.toString())}
                        >
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked !== isChecked) {
                                  toggleBarrio(barrio.id.toString())
                                }
                              }}
                            />
                          </div>
                          <label className="text-sm cursor-pointer flex-1" onClick={(e) => {
                            e.stopPropagation()
                            toggleBarrio(barrio.id.toString())
                          }}>
                            {barrio.nombre}
                          </label>
                        </div>
                      )
                    })}
                  {barrios.filter((b) => {
                    if (!b) return false
                    if (!barrioSearch.trim()) return false
                    const searchLower = barrioSearch.toLowerCase()
                    return b.nombre.toLowerCase().includes(searchLower) || 
                           b.codigo.toLowerCase().includes(searchLower)
                  }).length === 0 && barrioSearch.trim() && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No se encontraron barrios
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Estado</Label>
            <Select
              value={filters.estado ? filters.estado : 'all'}
              onValueChange={(value) => handleFilterChange('estado', value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="missing_data">Datos Faltantes</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(isAdmin || isCoordinador) && lideres && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Líder</Label>
              <Select
                value={filters.lider_id ? filters.lider_id : 'all'}
                onValueChange={(value) => {
                  handleFilterChange('lider_id', value)
                  setLiderSearch('')
                }}
                open={liderSelectOpen}
                onOpenChange={setLiderSelectOpen}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todos los líderes" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="sticky top-0 z-10 bg-background p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar líder..."
                        value={liderSearch}
                        onChange={(e) => setLiderSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <SelectItem value="all">Todos los líderes</SelectItem>
                  {lideres
                    .filter((lider) => {
                      if (!liderSearch.trim()) return true
                      const searchLower = liderSearch.toLowerCase()
                      return (
                        lider.nombres.toLowerCase().includes(searchLower) ||
                        lider.apellidos.toLowerCase().includes(searchLower) ||
                        `${lider.nombres} ${lider.apellidos}`.toLowerCase().includes(searchLower)
                      )
                    })
                    .map((lider) => (
                      <SelectItem key={lider.id} value={lider.id}>
                        {lider.nombres} {lider.apellidos}
                      </SelectItem>
                    ))}
                  {lideres.filter((lider) => {
                    if (!liderSearch.trim()) return false
                    const searchLower = liderSearch.toLowerCase()
                    return (
                      lider.nombres.toLowerCase().includes(searchLower) ||
                      lider.apellidos.toLowerCase().includes(searchLower) ||
                      `${lider.nombres} ${lider.apellidos}`.toLowerCase().includes(searchLower)
                    )
                  }).length === 0 && liderSearch.trim() && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No se encontraron líderes
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {isAdmin && coordinadores && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Coordinador</Label>
              <Select
                value={filters.coordinador_id ? filters.coordinador_id : 'all'}
                onValueChange={(value) => {
                  handleFilterChange('coordinador_id', value)
                  setCoordinadorSearch('')
                }}
                open={coordinadorSelectOpen}
                onOpenChange={setCoordinadorSelectOpen}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todos los coordinadores" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
                  <div className="sticky top-0 z-10 bg-background p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar coordinador..."
                        value={coordinadorSearch}
                        onChange={(e) => setCoordinadorSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <SelectItem value="all">Todos los coordinadores</SelectItem>
                  {coordinadores
                    .filter((coordinador) => {
                      if (!coordinadorSearch.trim()) return true
                      const searchLower = coordinadorSearch.toLowerCase()
                      return (
                        coordinador.nombres.toLowerCase().includes(searchLower) ||
                        coordinador.apellidos.toLowerCase().includes(searchLower) ||
                        `${coordinador.nombres} ${coordinador.apellidos}`.toLowerCase().includes(searchLower)
                      )
                    })
                    .map((coordinador) => (
                      <SelectItem key={coordinador.id} value={coordinador.id}>
                        {coordinador.nombres} {coordinador.apellidos}
                      </SelectItem>
                    ))}
                  {coordinadores.filter((coordinador) => {
                    if (!coordinadorSearch.trim()) return false
                    const searchLower = coordinadorSearch.toLowerCase()
                    return (
                      coordinador.nombres.toLowerCase().includes(searchLower) ||
                      coordinador.apellidos.toLowerCase().includes(searchLower) ||
                      `${coordinador.nombres} ${coordinador.apellidos}`.toLowerCase().includes(searchLower)
                    )
                  }).length === 0 && coordinadorSearch.trim() && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No se encontraron coordinadores
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

