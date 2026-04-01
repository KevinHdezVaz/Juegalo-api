import { NextRequest, NextResponse } from 'next/server';
import { getUnclaimedBonusTokens, sendToTokens } from '../../../../lib/fcm';

/**
 * GET /api/notify/daily-bonus
 * Llamado por el cron de Vercel cada día a las 10am (UTC-6 México = 16:00 UTC).
 * Envía recordatorio del bono diario a usuarios que no lo reclamaron.
 *
 * Protegido con CRON_SECRET para que solo Vercel pueda llamarlo.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const tokens = await getUnclaimedBonusTokens();

  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No hay tokens pendientes' });
  }

  const sent = await sendToTokens(tokens, {
    title: '🔥 ¡Tu bono diario te espera!',
    body:  'Juega un video o encuesta para reclamar tus monedas gratis.',
    data:  { type: 'daily_bonus', screen: 'home' },
  });

  console.log(`[Cron] Bono diario: ${sent}/${tokens.length} notificaciones enviadas`);
  return NextResponse.json({ ok: true, sent, total: tokens.length });
}
