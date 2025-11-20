'use client'

import { useState, useEffect, useMemo } from 'react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface DepartamentoStats {
  departamento: string
  municipio: string
  cantidad: number
}

const chartConfigDepartamentos = {
  cantidad: {
    label: 'Personas',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

const chartConfigMunicipios = {
  cantidad: {
    label: 'Personas',
    color: 'hsl(var(--success))',
  },
} satisfies ChartConfig

export function ChartDepartamentos() {
  const [data, setData] = useState<DepartamentoStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/charts/departamentos')
        if (!response.ok) {
          throw new Error('Error al cargar datos')
        }
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching departamentos stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Transformar datos para departamentos
  const departamentosData = useMemo(() => {
    const deptMap = new Map<string, number>()
    
    data.forEach((item) => {
      const dept = item.departamento || 'Sin departamento'
      deptMap.set(dept, (deptMap.get(dept) || 0) + item.cantidad)
    })

    return Array.from(deptMap.entries())
      .map(([departamento, cantidad]) => ({
        departamento,
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10) // Limitar a los 10 departamentos con más personas
  }, [data])

  // Transformar datos para municipios
  const municipiosData = useMemo(() => {
    const muniMap = new Map<string, number>()
    
    data.forEach((item) => {
      const muni = item.municipio || 'Sin municipio'
      muniMap.set(muni, (muniMap.get(muni) || 0) + item.cantidad)
    })

    return Array.from(muniMap.entries())
      .map(([municipio, cantidad]) => ({
        municipio,
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10) // Limitar a los 10 municipios con más personas
  }, [data])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="items-center pb-4">
            <CardTitle className="text-base">Personas por Departamento</CardTitle>
            <CardDescription className="text-xs">Top 10 departamentos</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <Skeleton className="h-[250px] w-full mx-auto aspect-square max-h-[250px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="items-center pb-4">
            <CardTitle className="text-base">Personas por Municipio</CardTitle>
            <CardDescription className="text-xs">Top 10 municipios</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <Skeleton className="h-[250px] w-full mx-auto aspect-square max-h-[250px]" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfica de Departamentos */}
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle className="text-base">Personas por Departamento</CardTitle>
          <CardDescription className="text-xs">Top 10 departamentos</CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <ChartContainer
            config={chartConfigDepartamentos}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <RadarChart
              data={departamentosData}
              margin={{
                top: 10,
                right: 10,
                bottom: 10,
                left: 10,
              }}
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarAngleAxis
                dataKey="departamento"
                tick={({ x, y, textAnchor, value, index, ...props }) => {
                  const data = departamentosData[index]

                  return (
                    <text
                      x={x}
                      y={index === 0 ? y - 10 : y}
                      textAnchor={textAnchor}
                      fontSize={13}
                      fontWeight={500}
                      {...props}
                    >
                      <tspan>{data.cantidad}</tspan>
                      <tspan
                        x={x}
                        dy={"1rem"}
                        fontSize={12}
                        className="fill-muted-foreground"
                      >
                        {data.departamento}
                      </tspan>
                    </text>
                  )
                }}
              />

              <PolarGrid />

              <Radar
                dataKey="cantidad"
                fill="var(--color-cantidad)"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfica de Municipios */}
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle className="text-base">Personas por Municipio</CardTitle>
          <CardDescription className="text-xs">Top 10 municipios</CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <ChartContainer
            config={chartConfigMunicipios}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <RadarChart
              data={municipiosData}
              margin={{
                top: 10,
                right: 10,
                bottom: 10,
                left: 10,
              }}
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarAngleAxis
                dataKey="municipio"
                tick={({ x, y, textAnchor, value, index, ...props }) => {
                  const data = municipiosData[index]

                  return (
                    <text
                      x={x}
                      y={index === 0 ? y - 10 : y}
                      textAnchor={textAnchor}
                      fontSize={13}
                      fontWeight={500}
                      {...props}
                    >
                      <tspan>{data.cantidad}</tspan>
                      <tspan
                        x={x}
                        dy={"1rem"}
                        fontSize={12}
                        className="fill-muted-foreground"
                      >
                        {data.municipio}
                      </tspan>
                    </text>
                  )
                }}
              />

              <PolarGrid />

              <Radar
                dataKey="cantidad"
                fill="var(--color-cantidad)"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

