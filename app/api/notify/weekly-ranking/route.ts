import { NextRequest, NextResponse } from 'next/server';
import { getActiveTokens, sendToTokens } from '../../../../lib/fcm';

/**
 * GET /api/notify/weekly-ranking
 * Llamado cada lunes a las 9am cuando se reinicia el ranking.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const tokens = await getActiveTokens(14); // usuarios activos últimas 2 semanas

  const sent = await sendToTokens(tokens, {
    title: '🏆 ¡Nuevo ranking semanal!',
    body:  'El ranking se reinició. Sé el primero esta semana y gana 5,000 monedas.',
    data:  { type: 'ranking_reset', screen: 'ranking' },
  });

  console.log(`[Cron] Ranking semanal: ${sent}/${tokens.length} enviadas`);
  return NextResponse.json({ ok: true, sent, total: tokens.length });
}
