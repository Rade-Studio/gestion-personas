'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface VotoDepartamentoStats {
  departamento: string
  municipio: string
  confirmados: number
}

export function ChartVotosDepartamentos() {
  const [data, setData] = useState<VotoDepartamentoStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/charts/votos-departamentos')
        if (!response.ok) {
          throw new Error('Error al cargar datos')
        }
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching votos departamentos stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Obtener todos los municipios
  const municipios = useMemo(() => {
    const muniSet = new Set<string>()
    
    data.forEach((item) => {
      const muni = item.municipio || 'Sin municipio'
      muniSet.add(muni)
    })

    return Array.from(muniSet).sort()
  }, [data])

  // Función helper para crear clave CSS segura
  const getSafeKey = (str: string) => {
    return str.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  }

  // Crear chartConfig dinámicamente basado en todos los municipios
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--success))',
      'hsl(var(--warning))',
      'hsl(var(--destructive))',
      'hsl(var(--muted-foreground))',
    ]

    municipios.forEach((muni, index) => {
      const muniKey = getSafeKey(muni)
      config[muniKey] = {
        label: muni,
        color: colors[index % colors.length],
      }
    })

    return config
  }, [municipios]) satisfies ChartConfig

  // Transformar datos para el gráfico de barras apiladas
  // Agrupar por departamento y crear series para todos los municipios
  const chartData = useMemo(() => {
    const departamentos = Array.from(new Set(data.map((d) => d.departamento)))
      .sort()

    return departamentos.map((dept) => {
      const deptData: Record<string, string | number> = {
        departamento: dept,
      }

      municipios.forEach((muni) => {
        const item = data.find(
          (d) => d.departamento === dept && d.municipio === muni
        )
        deptData[muni] = item ? item.confirmados : 0
      })

      return deptData
    })
  }, [data, municipios])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votos Confirmados por Departamento y Municipio</CardTitle>
          <CardDescription className="text-xs">Distribución de votos confirmados</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0 || municipios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votos Confirmados por Departamento y Municipio</CardTitle>
          <CardDescription className="text-xs">Distribución de votos confirmados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Votos Confirmados por Departamento y Municipio</CardTitle>
        <CardDescription className="text-xs">Todos los departamentos y municipios</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="departamento"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return value.length > 12 ? `${value.slice(0, 10)}...` : value
              }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            {municipios.map((muni, index) => {
              const isFirst = index === 0
              const isLast = index === municipios.length - 1
              const muniKey = getSafeKey(muni)
              
              return (
                <Bar
                  key={muni}
                  dataKey={muni}
                  stackId="a"
                  fill={`var(--color-${muniKey})`}
                  radius={isFirst ? [0, 0, 4, 4] : isLast ? [4, 4, 0, 0] : undefined}
                />
              )
            })}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

