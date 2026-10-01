import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Verifica que quien llama esta ruta sea un Director/Secretaría autenticado
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!perfil || !['director', 'secretaria'].includes(perfil.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { nombre_completo, correo, password, role } = await request.json()

  if (!['docente', 'portero', 'secretaria'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: nuevoUsuario, error: errorAuth } =
    await admin.auth.admin.createUser({
      email: correo,
      password,
      email_confirm: true,
    })

  if (errorAuth || !nuevoUsuario.user) {
    return NextResponse.json(
      { error: errorAuth?.message ?? 'No se pudo crear el usuario' },
      { status: 400 }
    )
  }

  const { error: errorPerfil } = await admin.from('profiles').insert({
    id: nuevoUsuario.user.id,
    role,
    nombre_completo,
  })

  if (errorPerfil) {
    // Si falla el perfil, deshace la creación del usuario para no dejarlo huérfano
    await admin.auth.admin.deleteUser(nuevoUsuario.user.id)
    return NextResponse.json({ error: errorPerfil.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!perfil || !['director', 'secretaria'].includes(perfil.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await request.json()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}