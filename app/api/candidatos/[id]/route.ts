import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/helpers'
import { candidatoSchema } from '@/features/candidatos/validations/candidato'
import { uploadFile, deleteFile, isValidImage, isValidFileSize } from '@/lib/storage/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const candidato = await prisma.candidato.findUnique({
      where: { id },
    })

    if (!candidato) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    }

    // Transform to match expected format
    const data = {
      id: candidato.id,
      nombre_completo: candidato.nombreCompleto,
      numero_tarjeton: candidato.numeroTarjeton,
      imagen_url: candidato.imagenUrl,
      imagen_path: candidato.imagenPath,
      partido_grupo: candidato.partidoGrupo,
      es_por_defecto: candidato.esPorDefecto,
      created_at: candidato.createdAt.toISOString(),
      updated_at: candidato.updatedAt.toISOString(),
    }

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    // Check if candidato exists
    const existing = await prisma.candidato.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    }

    const formData = await request.formData()
    const imagen = formData.get('imagen') as File | null
    const nombre_completo = formData.get('nombre_completo') as string
    const numero_tarjeton = formData.get('numero_tarjeton') as string
    const partido_grupo = formData.get('partido_grupo') as string | null
    const es_por_defecto = formData.get('es_por_defecto') === 'true'
    const removeImage = formData.get('removeImage') === 'true'

    // Validate data
    const validatedData = candidatoSchema.parse({
      nombre_completo,
      numero_tarjeton,
      partido_grupo: partido_grupo || '',
      es_por_defecto,
    })

    // Check if numero_tarjeton already exists (excluding current record)
    if (validatedData.numero_tarjeton !== existing.numeroTarjeton) {
      const duplicate = await prisma.candidato.findFirst({
        where: {
          numeroTarjeton: validatedData.numero_tarjeton,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe un candidato con este número de tarjetón' },
          { status: 400 }
        )
      }
    }

    // If marking as default, unmark other candidates
    if (validatedData.es_por_defecto && !existing.esPorDefecto) {
      await prisma.candidato.updateMany({
        where: {
          esPorDefecto: true,
          id: { not: id },
        },
        data: { esPorDefecto: false },
      })
    }

    let imagenUrl: string | null | undefined = existing.imagenUrl
    let imagenPath: string | null | undefined = existing.imagenPath

    // Handle image removal
    if (removeImage && existing.imagenPath) {
      try {
        await deleteFile(existing.imagenPath)
      } catch {
        // Ignore delete error
      }
      imagenUrl = null
      imagenPath = null
    }

    // Upload new image if provided
    if (imagen) {
      // Delete old image if exists
      if (existing.imagenPath) {
        try {
          await deleteFile(existing.imagenPath)
        } catch {
          // Ignore delete error
        }
      }

      // Validate file type
      if (!isValidImage(imagen)) {
        return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
      }

      // Validate file size (5MB)
      if (!isValidFileSize(imagen, 5 * 1024 * 1024)) {
        return NextResponse.json({ error: 'La imagen no debe exceder 5MB' }, { status: 400 })
      }

      const fileExt = imagen.name.split('.').pop()
      const fileName = `${Date.now()}-${validatedData.numero_tarjeton}.${fileExt}`
      const filePath = `candidatos/${fileName}`

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
    }

    // Update candidato
    const candidato = await prisma.candidato.update({
      where: { id },
      data: {
        nombreCompleto: validatedData.nombre_completo,
        numeroTarjeton: validatedData.numero_tarjeton,
        partidoGrupo: validatedData.partido_grupo || null,
        esPorDefecto: validatedData.es_por_defecto,
        imagenUrl,
        imagenPath,
      },
    })

    // Transform to match expected format
    const response = {
      id: candidato.id,
      nombre_completo: candidato.nombreCompleto,
      numero_tarjeton: candidato.numeroTarjeton,
      imagen_url: candidato.imagenUrl,
      imagen_path: candidato.imagenPath,
      partido_grupo: candidato.partidoGrupo,
      es_por_defecto: candidato.esPorDefecto,
      created_at: candidato.createdAt.toISOString(),
      updated_at: candidato.updatedAt.toISOString(),
    }

    return NextResponse.json({ data: response })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: (error as { errors: unknown }).errors },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    // Check if candidato exists
    const existing = await prisma.candidato.findUnique({
      where: { id },
      select: { id: true, esPorDefecto: true, imagenPath: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    }

    // Prevent deletion if it's the default candidate
    if (existing.esPorDefecto) {
      return NextResponse.json(
        { error: 'No se puede eliminar el candidato por defecto' },
        { status: 400 }
      )
    }

    // Delete image if exists
    if (existing.imagenPath) {
      try {
        await deleteFile(existing.imagenPath)
      } catch {
        // Ignore delete error
      }
    }

    // Unassign candidato from all leaders (set candidato_id to NULL)
    await prisma.profile.updateMany({
      where: { candidatoId: id },
      data: { candidatoId: null },
    })

    // Delete candidato
    await prisma.candidato.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}
