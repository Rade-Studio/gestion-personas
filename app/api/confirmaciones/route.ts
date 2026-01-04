import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin, getCurrentProfile } from '@/lib/auth/helpers'

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
    const supabase = await createClient()

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

    // Check if persona exists and user has permission
    let personaQuery = supabase
      .from('personas')
      .select('id, registrado_por')
      .eq('id', personaId)

    if (profile.role === 'lider') {
      personaQuery = personaQuery.eq('registrado_por', profile.id)
    }

    const { data: persona, error: personaError } = await personaQuery.single()

    if (personaError || !persona) {
      return NextResponse.json(
        { error: 'Persona no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    // Check if already confirmed
    const { data: existingConfirmacion } = await supabase
      .from('voto_confirmaciones')
      .select('id')
      .eq('persona_id', personaId)
      .eq('reversado', false)
      .single()

    if (existingConfirmacion) {
      return NextResponse.json(
        { error: 'Esta persona ya tiene una actividad confirmada' },
        { status: 400 }
      )
    }

    // Upload image to Supabase Storage
    const fileExt = imagen.name.split('.').pop()
    const fileName = `${personaId}-${Date.now()}.${fileExt}`
    const filePath = `confirmaciones/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voto-imagenes')
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

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('voto-imagenes').getPublicUrl(filePath)

    // Create confirmacion record
    const { data: confirmacion, error: confirmacionError } = await supabase
      .from('voto_confirmaciones')
      .insert({
        persona_id: personaId,
        imagen_url: publicUrl,
        imagen_path: filePath,
        confirmado_por: profile.id,
      })
      .select()
      .single()

    if (confirmacionError) {
      // Delete uploaded file if record creation fails
      await supabase.storage.from('voto-imagenes').remove([filePath])
      return NextResponse.json(
        { error: 'Error al crear confirmación: ' + confirmacionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: confirmacion }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}

