import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { sendToTokens } from '../../../../lib/fcm';

/**
 * GET /api/notify/videos-available
 *
 * Recordatorio para usuarios que aún tienen videos disponibles del día
 * pero no han abierto la app en las últimas 4 horas.
 *
 * Cron: cada día a las 19:00 UTC (1pm México) — pico de actividad mobile.
 *
 * Filtra: usuarios activos en los últimos 3 días, que NO han visto 50
 * videos hoy (no han llegado al cap diario).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ ok: true, sent: 0, message: 'FCM no configurado' });
  }

  const today = new Date().toISOString().substring(0, 10);
  const since = new Date(Date.now() - 3 * 86400000).toISOString().substring(0, 10);

  // 1. Subquery: user_ids que YA vieron 50+ videos hoy (excluirlos)
  const { data: cappedRows } = await supabase
    .from('transactions')
    .select('user_id')
    .eq('source', 'video')
    .gte('created_at', `${today}T00:00:00.000Z`);

  const counts = new Map<string, number>();
  (cappedRows ?? []).forEach((r: any) => {
    counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
  });
  const cappedUserIds = Array.from(counts.entries())
    .filter(([, n]) => n >= 50)
    .map(([id]) => id);

  // 2. Usuarios activos con FCM token, excluyendo los que ya hicieron tope
  let query = supabase
    .from('users')
    .select('fcm_token')
    .not('fcm_token', 'is', null)
    .gte('last_active', since);

  if (cappedUserIds.length > 0) {
    query = query.not('id', 'in', `(${cappedUserIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, total: 0 });
  }

  const tokens = data.map((u: any) => u.fcm_token).filter(Boolean);

  const sent = await sendToTokens(tokens, {
    title: '🎬 ¡Videos disponibles ahora!',
    body:  'Tus videos están listos para ganar monedas. Entra antes de que se acaben.',
    data:  { type: 'videos_available', screen: 'videos' },
  });

  console.log(`[Cron] videos-available: ${sent}/${tokens.length} enviadas`);
  return NextResponse.json({ ok: true, sent, total: tokens.length });
}
