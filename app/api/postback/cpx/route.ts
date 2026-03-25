import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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
  const amountStr  = searchParams.get('amount_local'); // monedas CPX
  const hash       = searchParams.get('hash');

  if (!userId || !transId || !amountStr || !hash) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  // Verificar hash de CPX Research
  const secret = process.env.CPX_RESEARCH_SECRET!;
  const appId  = process.env.CPX_RESEARCH_APP_ID!;
  const expectedHash = crypto
    .createHash('md5')
    .update(`${userId}-${appId}${secret}`)
    .digest('hex');

  if (hash !== expectedHash) {
    return NextResponse.json({ error: 'Hash inválido' }, { status: 403 });
  }

  // CPX paga en su propia moneda, convertir a monedas JUÉGALO
  // 1 CPX coin ≈ $0.001 USD → ajustar según tu acuerdo con CPX
  const cpxCoins   = parseInt(amountStr, 10);
  const juegaloCoins = Math.floor(cpxCoins * 0.6); // 60% al usuario

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
