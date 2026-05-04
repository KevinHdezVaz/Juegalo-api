import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { sendToToken } from '../../../../lib/fcm';

const PRIZE_EMOJI  = ['🥇', '🥈', '🥉'];
const PRIZE_LABELS = ['¡Ganaste el ranking!', '¡Segundo lugar!', '¡Tercer lugar!'];

/**
 * GET /api/notify/ranking-winners
 * Ejecutado cada lunes a las 00:30 UTC — 30 min después de que pg_cron
 * ya corrió award_weekly_winners() y acreditó los premios.
 * Envía notificación push personalizada a cada ganador.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Buscar transacciones de ranking_prize de los últimos 60 minutos
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('user_id, coins, description')
    .eq('source', 'ranking_prize')
    .gte('created_at', since)
    .order('coins', { ascending: false })
    .limit(3);

  if (error) {
    console.error('[RankingNotify] ❌ Error buscando transacciones:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!txs || txs.length === 0) {
    console.log('[RankingNotify] ℹ️ No hay ganadores recientes para notificar.');
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Obtener FCM tokens de los ganadores
  const userIds = txs.map((t: { user_id: string }) => t.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, fcm_token')
    .in('id', userIds)
    .not('fcm_token', 'is', null);

  const tokenMap = new Map(
    (users ?? []).map((u: { id: string; fcm_token: string }) => [u.id, u.fcm_token])
  );

  let sent = 0;
  for (let i = 0; i < txs.length; i++) {
    const tx    = txs[i];
    const token = tokenMap.get(tx.user_id);
    if (!token) continue;

    const rank  = i + 1;
    const emoji = PRIZE_EMOJI[i]  ?? '🏅';
    const label = PRIZE_LABELS[i] ?? '¡Ganaste un premio!';
    const coins = (tx.coins as number).toLocaleString('es-MX');

    const ok = await sendToToken(token, {
      title: `${emoji} ${label}`,
      body:  `Terminaste #${rank} en el ranking semanal. Se acreditaron ${coins} monedas a tu cuenta.`,
      data:  { type: 'ranking_prize', screen: 'ranking', rank: String(rank) },
    });

    if (ok) {
      sent++;
      console.log(`[RankingNotify] 📲 Notificación enviada al ganador #${rank}`);
    }
  }

  return NextResponse.json({ ok: true, sent, total: txs.length });
}
