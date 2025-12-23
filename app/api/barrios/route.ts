import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireLiderOrAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await requireLiderOrAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('barrios')
      .select('id, codigo, nombre')
      .order('nombre', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener barrios' },
      { status: error.message?.includes('No autenticado') ? 401 : 500 }
    )
  }
}
