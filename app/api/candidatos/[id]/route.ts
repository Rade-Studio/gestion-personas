import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { candidatoSchema } from '@/features/candidatos/validations/candidato'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
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
    const supabase = await createClient()

    // Check if candidato exists
    const { data: existing } = await supabase
      .from('candidatos')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Candidato no encontrado' },
        { status: 404 }
      )
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
    if (validatedData.numero_tarjeton !== existing.numero_tarjeton) {
      const { data: duplicate } = await supabase
        .from('candidatos')
        .select('id')
        .eq('numero_tarjeton', validatedData.numero_tarjeton)
        .neq('id', id)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe un candidato con este número de tarjetón' },
          { status: 400 }
        )
      }
    }

    // If marking as default, unmark other candidates
    if (validatedData.es_por_defecto && !existing.es_por_defecto) {
      const { error: unmarkError } = await supabase
        .from('candidatos')
        .update({ es_por_defecto: false })
        .eq('es_por_defecto', true)
        .neq('id', id)

      if (unmarkError) {
        return NextResponse.json(
          { error: 'Error al actualizar candidatos por defecto: ' + unmarkError.message },
          { status: 500 }
        )
      }
    }

    let imagenUrl: string | null | undefined = existing.imagen_url
    let imagenPath: string | null | undefined = existing.imagen_path

    // Handle image removal
    if (removeImage && existing.imagen_path) {
      await supabase.storage.from('candidatos-imagenes').remove([existing.imagen_path])
      imagenUrl = null
      imagenPath = null
    }

    // Upload new image if provided
    if (imagen) {
      // Delete old image if exists
      if (existing.imagen_path) {
        await supabase.storage.from('candidatos-imagenes').remove([existing.imagen_path])
      }

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

    // Update candidato
    const { data: candidato, error: candidatoError } = await supabase
      .from('candidatos')
      .update({
        nombre_completo: validatedData.nombre_completo,
        numero_tarjeton: validatedData.numero_tarjeton,
        partido_grupo: validatedData.partido_grupo || null,
        es_por_defecto: validatedData.es_por_defecto,
        imagen_url: imagenUrl,
        imagen_path: imagenPath,
      })
      .eq('id', id)
      .select()
      .single()

    if (candidatoError) {
      return NextResponse.json(
        { error: 'Error al actualizar candidato: ' + candidatoError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: candidato })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createClient()

    // Check if candidato exists
    const { data: existing } = await supabase
      .from('candidatos')
      .select('id, es_por_defecto, imagen_path')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Candidato no encontrado' },
        { status: 404 }
      )
    }

    // Prevent deletion if it's the default candidate
    if (existing.es_por_defecto) {
      return NextResponse.json(
        { error: 'No se puede eliminar el candidato por defecto' },
        { status: 400 }
      )
    }

    // Delete image if exists
    if (existing.imagen_path) {
      await supabase.storage.from('candidatos-imagenes').remove([existing.imagen_path])
    }

    // Unassign candidato from all leaders (set candidato_id to NULL)
    await supabase
      .from('profiles')
      .update({ candidato_id: null })
      .eq('candidato_id', id)

    // Delete candidato
    const { error: deleteError } = await supabase
      .from('candidatos')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Error al eliminar candidato: ' + deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}

