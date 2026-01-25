import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/helpers'
import type { DocumentoTipo } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const { nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, telefono } =
      body

    // Verificar si el perfil ya existe
    const existingProfile = await prisma.profile.findUnique({
      where: { id: user.id },
    })

    if (existingProfile) {
      // Actualizar perfil existente - NO permitir cambiar el rol
      const updatedProfile = await prisma.profile.update({
        where: { id: user.id },
        data: {
          nombres: nombres || existingProfile.nombres,
          apellidos: apellidos || existingProfile.apellidos,
          tipoDocumento: (tipo_documento as DocumentoTipo) || existingProfile.tipoDocumento,
          numeroDocumento: numero_documento || existingProfile.numeroDocumento,
          fechaNacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : existingProfile.fechaNacimiento,
          telefono: telefono || existingProfile.telefono,
        },
      })

      // Transform to match expected format
      const response = {
        id: updatedProfile.id,
        nombres: updatedProfile.nombres,
        apellidos: updatedProfile.apellidos,
        tipo_documento: updatedProfile.tipoDocumento,
        numero_documento: updatedProfile.numeroDocumento,
        fecha_nacimiento: updatedProfile.fechaNacimiento?.toISOString().split('T')[0],
        telefono: updatedProfile.telefono,
        role: updatedProfile.role,
        created_at: updatedProfile.createdAt.toISOString(),
        updated_at: updatedProfile.updatedAt.toISOString(),
      }

      return NextResponse.json({ data: response, message: 'Perfil actualizado' })
    } else {
      // Crear nuevo perfil
      if (!nombres || !apellidos || !tipo_documento || !numero_documento) {
        return NextResponse.json(
          { error: 'Faltan datos requeridos para crear el perfil' },
          { status: 400 }
        )
      }

      const newProfile = await prisma.profile.create({
        data: {
          id: user.id,
          nombres,
          apellidos,
          tipoDocumento: tipo_documento as DocumentoTipo,
          numeroDocumento: numero_documento,
          fechaNacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
          telefono: telefono || null,
          role: 'lider', // Siempre 'lider' por defecto
        },
      })

      // Transform to match expected format
      const response = {
        id: newProfile.id,
        nombres: newProfile.nombres,
        apellidos: newProfile.apellidos,
        tipo_documento: newProfile.tipoDocumento,
        numero_documento: newProfile.numeroDocumento,
        fecha_nacimiento: newProfile.fechaNacimiento?.toISOString().split('T')[0],
        telefono: newProfile.telefono,
        role: newProfile.role,
        created_at: newProfile.createdAt.toISOString(),
        updated_at: newProfile.updatedAt.toISOString(),
      }

      return NextResponse.json({ data: response, message: 'Perfil creado' }, { status: 201 })
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
