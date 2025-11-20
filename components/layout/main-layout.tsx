'use client'

import { useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
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
import { LogOut, User, LayoutDashboard, Users, UserCog, Award, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, signOut, isAdmin } = useAuth()

  const handleSignOut = async () => {
    try {
      // Primero llamamos al endpoint del servidor para limpiar cookies
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        })
        if (!response.ok) {
          console.error('Error al cerrar sesión en servidor')
        }
      } catch (serverError) {
        console.error('Error al cerrar sesión en servidor:', serverError)
      }
      
      // Luego cerramos sesión en el cliente
      await signOut()
      
      toast.success('Sesión cerrada')
      
      // Redirigir inmediatamente
      window.location.href = '/auth/login'
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión. Por favor, intenta nuevamente.')
      // Aún así intentamos redirigir
      window.location.href = '/auth/login'
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
            { href: '/lideres', label: 'Líderes', icon: UserCog },
            { href: '/candidatos', label: 'Candidatos', icon: Award },
          ]
        : []),
    ],
    [isAdmin]
  )

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Gestión</span>
              <span className="text-xs text-muted-foreground">Votantes</span>
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
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {profile?.nombres} {profile?.apellidos}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {profile?.role === 'admin' ? 'Administrador' : 'Líder'}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.nombres} {profile?.apellidos}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.role === 'admin' ? 'Administrador' : 'Líder'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
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
