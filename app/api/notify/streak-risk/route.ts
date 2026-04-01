import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { sendToTokens } from '../../../../lib/fcm';

/**
 * GET /api/notify/streak-risk
 * Llamado cada día a las 8pm. Avisa a usuarios con racha activa que no han jugado hoy.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const today     = new Date().toISOString().substring(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

  // Usuarios con racha >= 2 días cuyo last_active fue ayer (no han jugado hoy)
  const { data, error } = await supabase
    .from('users')
    .select('fcm_token, streak_days')
    .not('fcm_token', 'is', null)
    .gte('streak_days', 2)
    .eq('last_active', yesterday);

  if (error || !data?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Agrupa por nivel de racha para personalizar mensaje
  const tokens = data.map((u: { fcm_token: string }) => u.fcm_token).filter(Boolean);

  const sent = await sendToTokens(tokens, {
    title: '⚠️ ¡Tu racha está en riesgo!',
    body:  'Juega hoy para no perder tu racha y el bono extra. ¡Solo toma 30 segundos!',
    data:  { type: 'streak_risk', screen: 'home' },
  });

  console.log(`[Cron] Racha en riesgo: ${sent}/${tokens.length} enviadas`);
  return NextResponse.json({ ok: true, sent, total: tokens.length });
}
