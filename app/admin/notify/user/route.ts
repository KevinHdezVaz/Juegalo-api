import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendToToken } from '../../../../lib/fcm';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /admin/notify/user
 * Enviado por el trigger de Supabase cuando un usuario cruza un hito de monedas.
 * Body: { user_id, title, body, data }
 */
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    user_id: string;
    title:   string;
    body:    string;
    data?:   Record<string, string>;
  };

  if (!body.user_id || !body.title || !body.body) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }

  // Obtener el token FCM del usuario
  const { data: user } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', body.user_id)
    .single();

  if (!user?.fcm_token) {
    return NextResponse.json({ sent: false, reason: 'No FCM token' });
  }

  const ok = await sendToToken(user.fcm_token, {
    title: body.title,
    body:  body.body,
    data:  body.data ?? {},
  });

  return NextResponse.json({ sent: ok });
}
