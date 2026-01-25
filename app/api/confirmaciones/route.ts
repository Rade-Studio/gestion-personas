import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'
import { uploadFile, deleteFile, isValidImage, isValidFileSize } from '@/lib/storage/client'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireLiderOrAdmin()

    // Bloquear consultores de confirmar actividades
    if (profile.role === 'consultor') {
      return NextResponse.json(
        { error: 'No autorizado: los consultores no pueden confirmar actividades' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const imagen = formData.get('imagen') as File
    const personaId = formData.get('persona_id') as string

    if (!imagen || !personaId) {
      return NextResponse.json(
        { error: 'Imagen y persona_id son requeridos' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidImage(imagen)) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }

    // Validate file size (5MB)
    if (!isValidFileSize(imagen, 5 * 1024 * 1024)) {
      return NextResponse.json({ error: 'La imagen no debe exceder 5MB' }, { status: 400 })
    }

    // Check if persona exists and user has permission
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        ...(profile.role === 'lider' ? { registradoPorId: profile.id } : {}),
      },
      select: { id: true, registradoPorId: true },
    })

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    // Check if already confirmed
    const existingConfirmacion = await prisma.votoConfirmacion.findFirst({
      where: {
        personaId,
        reversado: false,
      },
    })

    if (existingConfirmacion) {
      return NextResponse.json(
        { error: 'Esta persona ya tiene una actividad confirmada' },
        { status: 400 }
      )
    }

    // Upload image to storage
    const fileExt = imagen.name.split('.').pop()
    const fileName = `${personaId}-${Date.now()}.${fileExt}`
    const filePath = `confirmaciones/${fileName}`

    let imagenUrl: string
    let imagenPath: string

    try {
      const result = await uploadFile(imagen, filePath, imagen.type)
      imagenUrl = result.url
      imagenPath = result.path
    } catch (uploadError) {
      return NextResponse.json(
        {
          error:
            'Error al subir la imagen: ' +
            (uploadError instanceof Error ? uploadError.message : 'Error desconocido'),
        },
        { status: 500 }
      )
    }

    // Create confirmacion record and update persona state to COMPLETADO
    try {
      // Get current persona state
      const personaActual = await prisma.persona.findUnique({
        where: { id: personaId },
        select: { estado: true },
      })

      const [confirmacion] = await prisma.$transaction([
        prisma.votoConfirmacion.create({
          data: {
            personaId,
            imagenUrl,
            imagenPath,
            confirmadoPorId: profile.id,
          },
        }),
        prisma.persona.update({
          where: { id: personaId },
          data: {
            estado: 'COMPLETADO',
            estadoAnterior: personaActual?.estado || 'DATOS_PENDIENTES',
          },
        }),
      ])

      // Transform to match expected format
      const response = {
        id: confirmacion.id,
        persona_id: confirmacion.personaId,
        imagen_url: confirmacion.imagenUrl,
        imagen_path: confirmacion.imagenPath,
        confirmado_por: confirmacion.confirmadoPorId,
        confirmado_at: confirmacion.confirmadoAt.toISOString(),
        reversado: confirmacion.reversado,
        reversado_por: confirmacion.reversadoPorId,
        reversado_at: confirmacion.reversadoAt?.toISOString(),
        created_at: confirmacion.createdAt.toISOString(),
        updated_at: confirmacion.updatedAt.toISOString(),
      }

      return NextResponse.json({ data: response }, { status: 201 })
    } catch (dbError) {
      // Delete uploaded file if record creation fails
      try {
        await deleteFile(imagenPath)
      } catch {
        // Ignore delete error
      }
      return NextResponse.json(
        {
          error:
            'Error al crear confirmación: ' +
            (dbError instanceof Error ? dbError.message : 'Error desconocido'),
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autenticado') ? 401 : 500 }
    )
  }
}
