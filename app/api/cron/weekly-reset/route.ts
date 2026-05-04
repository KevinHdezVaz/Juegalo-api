import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { sendToToken } from '../../../../lib/fcm';

const PRIZE_EMOJI = ['🥇', '🥈', '🥉'];
const PRIZE_LABEL = ['¡Ganaste el ranking!', '¡Segundo lugar!', '¡Tercer lugar!'];

/**
 * GET /api/cron/weekly-reset
 * Ejecutado automáticamente cada lunes a las 06:00 UTC por Vercel Cron.
 * - Premia top 3 del ranking semanal (2500 / 1000 / 500 monedas)
 * - Resetea weekly_coins a 0 para todos los usuarios
 * - Envía notificación push personalizada a cada ganador
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    console.log('[WeeklyReset] 🚀 Iniciando reset semanal...');

    // 1. Premiar ganadores y resetear ranking
    const { data, error } = await supabase.rpc('award_weekly_winners');

    if (error) {
      console.error('[WeeklyReset] ❌ Error en RPC:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const winners = data as Array<{
      rank: number;
      user_id: string;
      username: string;
      weekly_coins: number;
      prize: number;
    }>;

    console.log(`[WeeklyReset] ✅ Reset completado. Ganadores: ${winners.length}`);
    winners.forEach(w =>
      console.log(`  #${w.rank} ${w.username} — ${w.weekly_coins} monedas → premio: ${w.prize}`)
    );

    // 2. Enviar notificación push personalizada a cada ganador
    if (winners.length > 0) {
      const userIds = winners.map(w => w.user_id);
      const { data: users } = await supabase
        .from('users')
        .select('id, fcm_token')
        .in('id', userIds)
        .not('fcm_token', 'is', null);

      const tokenMap = new Map((users ?? []).map((u: { id: string; fcm_token: string }) => [u.id, u.fcm_token]));

      for (const winner of winners) {
        const token = tokenMap.get(winner.user_id);
        if (!token) continue;

        const idx   = winner.rank - 1;
        const emoji = PRIZE_EMOJI[idx] ?? '🏅';
        const label = PRIZE_LABEL[idx] ?? '¡Ganaste un premio!';
        const coins = winner.prize.toLocaleString('es-MX');

        await sendToToken(token, {
          title: `${emoji} ${label}`,
          body:  `Terminó la semana y quedaste #${winner.rank}. Se acreditaron ${coins} monedas a tu cuenta.`,
          data:  { type: 'ranking_prize', screen: 'ranking', rank: String(winner.rank) },
        });

        console.log(`[WeeklyReset] 📲 Notificación enviada a ${winner.username} (#${winner.rank})`);
      }
    }

    return NextResponse.json({ ok: true, reset: new Date().toISOString(), winners });

  } catch (err) {
    console.error('[WeeklyReset] ❌ Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
