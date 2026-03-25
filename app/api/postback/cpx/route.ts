import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { creditCoins } from '../../../../lib/supabase';
import { AppConstants } from '../../../../lib/constants';

/**
 * GET /api/postback/cpx
 * CPX Research llama este endpoint cuando usuario completa encuesta.
 * Documentación: https://developers.cpx-research.com/
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const userId     = searchParams.get('user_id');
  const transId    = searchParams.get('trans_id');
  const amountStr  = searchParams.get('amount_local');
  const status     = searchParams.get('status') ?? '1'; // 1=completada, 2=cancelada
  const hash       = searchParams.get('hash');

  if (!userId || !transId || !amountStr || !hash) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  // Encuesta cancelada — no acreditar
  if (status === '2') {
    return NextResponse.json({ ok: true, skipped: 'cancelled' });
  }

  // Verificar hash: MD5(trans_id-secret)  ← formato real de CPX Research
  const secret = process.env.CPX_RESEARCH_SECRET!;
  const expectedHash = crypto
    .createHash('md5')
    .update(`${transId}-${secret}`)
    .digest('hex');

  if (hash !== expectedHash) {
    return NextResponse.json({ error: 'Hash inválido' }, { status: 403 });
  }

  // amount_local ya viene en tus monedas (configurado en Reward Settings)
  const cpxCoins     = parseInt(amountStr, 10);
  const juegaloCoins = Math.max(1, cpxCoins); // ya es la cantidad correcta

  try {
    await creditCoins(
      userId,
      juegaloCoins,
      'cpx_research',
      `Encuesta completada: ${transId}`,
      { trans_id: transId, cpx_coins: cpxCoins }
    );

    console.log(`[CPX] ✅ ${juegaloCoins} monedas a ${userId}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[CPX] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
