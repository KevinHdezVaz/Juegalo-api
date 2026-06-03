import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { sendToTokens } from '../../../../lib/fcm';
import { AppConstants } from '../../../../lib/constants';

/**
 * GET /api/notify/almost-cashout
 *
 * Avisa a usuarios que están CERCA del mínimo para cobrar (70-99% del mínimo).
 * Ej: si el mínimo es 20,000 coins, notifica a quienes tengan entre 14,000 y 19,999.
 *
 * Cron: cada día a las 18:00 UTC (12pm México) — buen momento para enganchar
 *       a usuarios que pueden completar el cobro esa misma tarde.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ ok: true, sent: 0, message: 'FCM no configurado' });
  }

  const min   = AppConstants.minCashoutCoins;       // 20,000
  const lower = Math.floor(min * 0.70);             // 14,000 (70%)
  const upper = min - 1;                            // 19,999

  // Solo notificamos a usuarios activos en los últimos 5 días
  const since = new Date(Date.now() - 5 * 86400000).toISOString().substring(0, 10);

  const { data, error } = await supabase
    .from('users')
    .select('fcm_token, coins')
    .not('fcm_token', 'is', null)
    .gte('coins', lower)
    .lte('coins', upper)
    .gte('last_active', since);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, total: 0 });
  }

  // Agrupar en una sola notificación por usuario, personalizada
  let sent = 0;
  await Promise.all(
    data.map(async (u: any) => {
      const missing = min - u.coins;
      const ok = await sendToTokens([u.fcm_token], {
        title: '💰 ¡Casi puedes cobrar!',
        body:  `Solo te faltan ${missing.toLocaleString('es-MX')} monedas para retirar a PayPal. ¡Sigue jugando!`,
        data:  { type: 'almost_cashout', screen: 'wallet' },
      });
      if (ok > 0) sent++;
    })
  );

  console.log(`[Cron] almost-cashout: ${sent}/${data.length} enviadas (rango ${lower}–${upper} coins)`);
  return NextResponse.json({ ok: true, sent, total: data.length });
}
