'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
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

interface LiderStats {
  lider: string
  confirmados: number
  pendientes: number
}

const chartConfig = {
  confirmados: {
    label: 'Confirmados',
    color: 'hsl(142 76% 36%)', // Verde success
  },
  pendientes: {
    label: 'Por Confirmar',
    color: 'hsl(38 92% 50%)', // Naranja warning
  },
} satisfies ChartConfig

export function ChartLideres() {
  const [data, setData] = useState<LiderStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/charts/lideres')
        if (!response.ok) {
          throw new Error('Error al cargar datos')
        }
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching lideres stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estadísticas por Líder</CardTitle>
          <CardDescription className="text-xs">Confirmados vs Por Confirmar</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Estadísticas por Líder</CardTitle>
        <CardDescription className="text-xs">Confirmados vs Por Confirmar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="lider"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) => {
                  const parts = value.split(' ')
                  if (parts.length > 2) {
                    return `${parts[0]} ${parts[1]?.charAt(0) || ''}.`
                  }
                  return value.length > 15 ? `${value.slice(0, 12)}...` : value
                }}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="confirmados"
                stackId="a"
                fill="var(--color-confirmados)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="pendientes"
                stackId="a"
                fill="var(--color-pendientes)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

