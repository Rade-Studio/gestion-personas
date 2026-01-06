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

interface RepresentanteStats {
  representante: string
  confirmadas: number
  pendientes: number
}

const chartConfig = {
  confirmadas: {
    label: 'Confirmadas',
    color: 'hsl(142 76% 36%)', // Verde success
  },
  pendientes: {
    label: 'Pendientes',
    color: 'hsl(38 92% 50%)', // Naranja warning
  },
} satisfies ChartConfig

export function ChartRepresentantes() {
  const [data, setData] = useState<RepresentanteStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/charts/representantes')
        if (!response.ok) {
          throw new Error('Error al cargar datos')
        }
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching representantes stats:', error)
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
          <CardTitle className="text-base">Personas por Representante</CardTitle>
          <CardDescription className="text-xs">Confirmadas vs Pendientes por representante</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personas por Representante</CardTitle>
          <CardDescription className="text-xs">Confirmadas vs Pendientes por representante</CardDescription>
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
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Personas por Representante</CardTitle>
        <CardDescription className="text-xs">Confirmadas vs Pendientes por representante</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="representante"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) => {
                  return value.length > 20 ? `${value.slice(0, 17)}...` : value
                }}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="confirmadas"
                stackId="a"
                fill="var(--color-confirmadas)"
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

