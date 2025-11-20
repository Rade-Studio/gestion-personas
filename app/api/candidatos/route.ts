import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { candidatoSchema } from '@/features/candidatos/validations/candidato'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()

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
    const { data: existing } = await supabase
      .from('candidatos')
      .select('id')
      .eq('numero_tarjeton', validatedData.numero_tarjeton)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un candidato con este número de tarjetón' },
        { status: 400 }
      )
    }

    // If marking as default, unmark other candidates
    if (validatedData.es_por_defecto) {
      const { error: unmarkError } = await supabase
        .from('candidatos')
        .update({ es_por_defecto: false })
        .eq('es_por_defecto', true)

      if (unmarkError) {
        return NextResponse.json(
          { error: 'Error al actualizar candidatos por defecto: ' + unmarkError.message },
          { status: 500 }
        )
      }
    }

    let imagenUrl: string | null = null
    let imagenPath: string | null = null

    // Upload image if provided
    if (imagen) {
      // Validate file type
      if (!imagen.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'El archivo debe ser una imagen' },
          { status: 400 }
        )
      }

      // Validate file size (5MB)
      if (imagen.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'La imagen no debe exceder 5MB' },
          { status: 400 }
        )
      }

      const fileExt = imagen.name.split('.').pop()
      const fileName = `${Date.now()}-${validatedData.numero_tarjeton}.${fileExt}`
      const filePath = `candidatos/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('candidatos-imagenes')
        .upload(filePath, imagen, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return NextResponse.json(
          { error: 'Error al subir la imagen: ' + uploadError.message },
          { status: 500 }
        )
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('candidatos-imagenes').getPublicUrl(filePath)

      imagenUrl = publicUrl
      imagenPath = filePath
    }

    // Create candidato
    const { data: candidato, error: candidatoError } = await supabase
      .from('candidatos')
      .insert({
        nombre_completo: validatedData.nombre_completo,
        numero_tarjeton: validatedData.numero_tarjeton,
        partido_grupo: validatedData.partido_grupo || null,
        es_por_defecto: validatedData.es_por_defecto,
        imagen_url: imagenUrl,
        imagen_path: imagenPath,
      })
      .select()
      .single()

    if (candidatoError) {
      // Delete uploaded file if record creation fails
      if (imagenPath) {
        await supabase.storage.from('candidatos-imagenes').remove([imagenPath])
      }
      return NextResponse.json(
        { error: 'Error al crear candidato: ' + candidatoError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: candidato }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

