import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * DELETE /api/account/delete
 *
 * Elimina la cuenta del usuario autenticado.
 * Requiere el JWT del usuario en el header Authorization.
 * Usa la service_role key para borrar de auth.users (cascade borra todo lo demás).
 */
export async function DELETE(req: NextRequest) {
  // ── Leer JWT del usuario ─────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '').trim();

  if (!jwt) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // ── Verificar JWT y obtener user_id ──────────────────────────────
  // Cliente con anon key solo para verificar el token
  const anonClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);

  if (authError || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // ── Eliminar usuario usando service_role (admin) ─────────────────
  // La tabla users tiene ON DELETE CASCADE → se borra todo automáticamente
  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('[DeleteAccount] Error eliminando usuario:', deleteError.message);
    return NextResponse.json({ error: 'Error al eliminar cuenta' }, { status: 500 });
  }

  console.log(`[DeleteAccount] ✅ Cuenta eliminada: ${user.id} (${user.email})`);
  return NextResponse.json({ ok: true });
}
