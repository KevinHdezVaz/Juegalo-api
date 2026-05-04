import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabase, creditCoins } from '../../../../lib/supabase';

/**
 * GET /api/postback/cpx
 *
 * CPX Research llama este endpoint cuando el usuario completa una encuesta.
 * Docs: https://developers.cpx-research.com/docs/postback
 *
 * Parámetros que envía CPX:
 *   user_id      — ext_user_id que pasamos en la config (UID de Supabase)
 *   trans_id     — ID único de la transacción CPX
 *   amount_local — monedas a acreditar (configurado en CPX → Reward Settings)
 *   status       — 1=completada, 2=cancelada/chargeback
 *   hash         — MD5(trans_id + "-" + secure_hash_key) para validar autenticidad
 *
 * CPX espera respuesta "1" en texto plano para confirmar recepción.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const userId    = searchParams.get('user_id');
  const transId   = searchParams.get('trans_id');
  const amountStr = searchParams.get('amount_local');
  const status    = searchParams.get('status') ?? '1';
  const hash      = searchParams.get('hash');

  // ── Parámetros obligatorios ──────────────────────────────────────
  if (!userId || !transId || !amountStr || !hash) {
    console.warn('[CPX] Parámetros faltantes:', { userId, transId, amountStr, hash });
    return new NextResponse('0', { status: 400 });
  }

  // ── Encuesta cancelada / chargeback ─────────────────────────────
  if (status === '2') {
    console.log(`[CPX] ↩️ Encuesta cancelada: trans_id=${transId}`);
    return new NextResponse('1'); // CPX requiere "1" aunque no acreditemos
  }

  // ── Verificar hash — MD5(trans_id + "-" + secure_hash_key) ────────
  // Fórmula oficial CPX: md5({trans_id}-yourappsecurehash)
  const hashKey = process.env.CPX_RESEARCH_SECRET!;

  const expectedHash = crypto
    .createHash('md5')
    .update(`${transId}-${hashKey}`)
    .digest('hex');

  if (hash !== expectedHash) {
    console.warn('[CPX] Hash inválido:', { received: hash, expected: expectedHash });
    return new NextResponse('0', { status: 403 });
  }

  // ── Detección de duplicados ──────────────────────────────────────
  // Buscamos si ya existe una transacción con este trans_id en metadata
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('source', 'cpx_research')
    .contains('metadata', { trans_id: transId })
    .maybeSingle();

  if (existing) {
    console.warn(`[CPX] ⚠️ Transacción duplicada ignorada: trans_id=${transId}`);
    return new NextResponse('1'); // confirmamos para que CPX no reintente
  }

  // ── Acreditar monedas ────────────────────────────────────────────
  // amount_local ya refleja el margen configurado en CPX → Reward Settings
  // (Currency Factor = 600 → usuario recibe 60% del valor de la encuesta)
  const coins = Math.floor(parseFloat(amountStr));
  if (isNaN(coins) || coins <= 0) {
    console.warn('[CPX] Monto inválido:', amountStr);
    return new NextResponse('0', { status: 400 });
  }

  try {
    await creditCoins(
      userId,
      coins,
      'cpx_research',
      `Encuesta completada CPX`,
      { trans_id: transId, amount_local: coins }
    );

    console.log(`[CPX] ✅ ${coins} monedas → usuario ${userId} | trans_id: ${transId}`);
    return new NextResponse('1'); // CPX requiere texto plano "1"

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[CPX] ❌ Error:', message);
    return new NextResponse('0', { status: 500 });
  }
}
