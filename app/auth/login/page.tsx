'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/features/auth/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Users, Shield, BarChart3 } from 'lucide-react'
import { RepresentantesAdModal } from '@/features/auth/components/representantes-ad-modal'

interface RepresentantePublic {
  id: string
  nombre_completo: string
  numero_tarjeton: string
  imagen_url?: string
  partido_grupo?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [representantes, setRepresentantes] = useState<RepresentantePublic[]>([])
  const [showAdModal, setShowAdModal] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    const loadRepresentantes = async () => {
      const showAds = process.env.NEXT_PUBLIC_SHOW_CANDIDATOS_ADS === 'true'
      
      if (!showAds) return

      try {
        const response = await fetch('/api/candidatos/public')
        const result = await response.json()

        if (response.ok && result.data && result.data.length > 0) {
          setRepresentantes(result.data)
          setShowAdModal(true)
        }
      } catch (error) {
        console.error('Error al cargar representantes:', error)
      }
    }

    loadRepresentantes()
  }, [])

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Inicio de sesión exitoso')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <RepresentantesAdModal
        open={showAdModal}
        onOpenChange={setShowAdModal}
        representantes={representantes}
      />
      <div className="min-h-screen flex">
      {/* Panel Izquierdo - Información */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary flex-col justify-between p-12 text-white">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Sistema de Gestión de Personas</h1>
            <p className="text-lg text-primary-foreground/90">
              Plataforma integral para la administración y seguimiento de personas
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-white/20 p-3">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Gestión de Personas</h3>
                <p className="text-primary-foreground/80">
                  Administra y registra personas de manera eficiente y organizada
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-white/20 p-3">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Confirmación de Actividades</h3>
                <p className="text-primary-foreground/80">
                  Sistema de verificación con evidencia fotográfica para cada actividad
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-white/20 p-3">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Reportes y Estadísticas</h3>
                <p className="text-primary-foreground/80">
                  Dashboard completo con métricas y análisis en tiempo real
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight">Bienvenido</h2>
            <p className="text-muted-foreground mt-2">
              Inicia sesión para acceder al sistema
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register('email')}
                    disabled={loading}
                    className="h-11"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={loading}
                    className="h-11"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}

