import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendToToken } from '../../../lib/fcm';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const email   = (form.get('email')   as string | null)?.trim() ?? '';
  const title   = (form.get('title')   as string | null)?.trim() ?? '';
  const message = (form.get('message') as string | null)?.trim() ?? '';

  if (!email || !title || !message) {
    return NextResponse.redirect(
      new URL('/admin?tab=notificaciones&error=' + encodeURIComponent('Completa correo, título y mensaje.'), req.url)
    );
  }

  // Buscar el usuario por correo
  const { data: user, error } = await supabase
    .from('users')
    .select('username, fcm_token')
    .eq('email', email)
    .single();

  if (error || !user) {
    return NextResponse.redirect(
      new URL('/admin?tab=notificaciones&error=' + encodeURIComponent(`Usuario no encontrado: ${email}`), req.url)
    );
  }

  if (!user.fcm_token) {
    return NextResponse.redirect(
      new URL('/admin?tab=notificaciones&error=' + encodeURIComponent(`${user.username ?? email} no tiene token FCM registrado (nunca abrió la app o no dio permiso).`), req.url)
    );
  }

  const ok = await sendToToken(user.fcm_token, { title, body: message });

  if (!ok) {
    return NextResponse.redirect(
      new URL('/admin?tab=notificaciones&error=' + encodeURIComponent(`Error enviando a ${user.username ?? email}. Token puede estar vencido.`), req.url)
    );
  }

  return NextResponse.redirect(
    new URL(`/admin?tab=notificaciones&success=prueba&username=${encodeURIComponent(user.username ?? email)}`, req.url)
  );
}
