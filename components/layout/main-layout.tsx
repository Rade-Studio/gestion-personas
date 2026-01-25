'use client'

import { useMemo, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { clearAuthStorage } from '@/lib/auth/client-helpers'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { LogOut, User, LayoutDashboard, Users, UserCog, Award, Building2, Loader2 } from 'lucide-react'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, signOut, isAdmin, isCoordinador } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isLoggingOutRef = useRef(false)

  const handleSignOut = async () => {
    // Protección contra múltiples clicks
    if (isLoggingOutRef.current) {
      return
    }

    isLoggingOutRef.current = true
    setIsLoggingOut(true)
    
    try {
      // Usar signOut de Auth.js - maneja CSRF y cookies automáticamente
      await signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Fallback: limpiar storage manualmente y redirigir
      if (typeof window !== 'undefined') {
        clearAuthStorage()
        window.location.href = '/auth/login'
      }
    } finally {
      isLoggingOutRef.current = false
      setIsLoggingOut(false)
    }
  }

  const initials = useMemo(
    () => (profile ? `${profile.nombres[0]}${profile.apellidos[0]}`.toUpperCase() : 'U'),
    [profile]
  )

  const navItems = useMemo(
    () => [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/personas', label: 'Personas', icon: Users },
      ...(isAdmin
        ? [
            { href: '/coordinadores', label: 'Coordinadores', icon: Building2 },
            { href: '/lideres', label: 'Líderes', icon: UserCog },
            { href: '/candidatos', label: 'Representantes', icon: Award },
          ]
        : isCoordinador
        ? [
            { href: '/lideres', label: 'Líderes', icon: UserCog },
          ]
        : []),
    ],
    [isAdmin, isCoordinador]
  )

  return (
    <SidebarProvider>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Cerrando sesión...</p>
              <p className="text-sm text-muted-foreground">
                {profile?.nombres ? `¡Hasta pronto, ${profile.nombres}!` : '¡Hasta pronto!'}
              </p>
            </div>
          </div>
        </div>
      )}
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Gestión</span>
              <span className="text-xs text-muted-foreground">Personas</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Perfil"
              >
                <Link href="/perfil">
                  <User />
                  <span>Perfil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-sm font-medium truncate w-full" title={`${profile?.nombres} ${profile?.apellidos}`}>
                        {profile?.nombres} {profile?.apellidos}
                      </span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'coordinador' ? 'Coordinador' : 'Líder'}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate" title={`${profile?.nombres} ${profile?.apellidos}`}>
                        {profile?.nombres} {profile?.apellidos}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'coordinador' ? 'Coordinador' : 'Líder'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Cerrando sesión...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-lg font-semibold">
              {useMemo(() => navItems.find(item => item.href === pathname)?.label || 'Dashboard', [navItems, pathname])}
            </h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
