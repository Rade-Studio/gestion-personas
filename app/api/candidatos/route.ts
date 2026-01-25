import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/helpers'
import { candidatoSchema } from '@/features/candidatos/validations/candidato'
import { uploadFile, deleteFile, isValidImage, isValidFileSize } from '@/lib/storage/client'

export async function GET() {
  try {
    await requireAdmin()

    const data = await prisma.candidato.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Transform to match expected format
    const transformedData = data.map((c) => ({
      id: c.id,
      nombre_completo: c.nombreCompleto,
      numero_tarjeton: c.numeroTarjeton,
      imagen_url: c.imagenUrl,
      imagen_path: c.imagenPath,
      partido_grupo: c.partidoGrupo,
      es_por_defecto: c.esPorDefecto,
      created_at: c.createdAt.toISOString(),
      updated_at: c.updatedAt.toISOString(),
    }))

    return NextResponse.json({ data: transformedData })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error en el servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('No autorizado') ? 403 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const imagen = formData.get('imagen') as File | null
    const nombre_completo = formData.get('nombre_completo') as string
    const numero_tarjeton = formData.get('numero_tarjeton') as string
    const partido_grupo = formData.get('partido_grupo') as string | null
    const es_por_defecto = formData.get('es_por_defecto') === 'true'

    // Validate data
    const validatedData = candidatoSchema.parse({
      nombre_completo,
      numero_tarjeton,
      partido_grupo: partido_grupo || '',
      es_por_defecto,
    })

    // Check if numero_tarjeton already exists
    const existing = await prisma.candidato.findUnique({
      where: { numeroTarjeton: validatedData.numero_tarjeton },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un candidato con este número de tarjetón' },
        { status: 400 }
      )
    }

    // If marking as default, unmark other candidates
    if (validatedData.es_por_defecto) {
      await prisma.candidato.updateMany({
        where: { esPorDefecto: true },
        data: { esPorDefecto: false },
      })
    }

    let imagenUrl: string | null = null
    let imagenPath: string | null = null

    // Upload image if provided
    if (imagen) {
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

    // Create candidato
    try {
      const candidato = await prisma.candidato.create({
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

      return NextResponse.json({ data: response }, { status: 201 })
    } catch (dbError) {
      // Delete uploaded file if record creation fails
      if (imagenPath) {
        try {
          await deleteFile(imagenPath)
        } catch {
          // Ignore delete error
        }
      }
      return NextResponse.json(
        {
          error:
            'Error al crear candidato: ' +
            (dbError instanceof Error ? dbError.message : 'Error desconocido'),
        },
        { status: 500 }
      )
    }
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
