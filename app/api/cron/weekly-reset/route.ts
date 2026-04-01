import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * GET /api/cron/weekly-reset
 * Ejecutado automáticamente cada lunes a las 00:00 UTC por Vercel Cron.
 * - Premia top 3 del ranking semanal (5000 / 2000 / 1000 monedas)
 * - Resetea weekly_coins a 0 para todos los usuarios
 *
 * Protegido con CRON_SECRET para evitar llamadas no autorizadas.
 */
export async function GET(req: NextRequest) {
  // Verificar secreto del cron
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    console.log('[WeeklyReset] 🚀 Iniciando reset semanal...');

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

    return NextResponse.json({
      ok:      true,
      reset:   new Date().toISOString(),
      winners,
    });

  } catch (err) {
    console.error('[WeeklyReset] ❌ Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
