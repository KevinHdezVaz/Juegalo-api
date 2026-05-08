import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { creditCoins } from '../../../../lib/supabase';

/**
 * GET /api/postback/adjoe
 * adjoe llama este endpoint (S2S) cuando un usuario gana recompensas.
 * Documentación: https://docs.adjoe.io/playtime/s2s-rewards
 *
 * Parámetros que envía adjoe:
 *   user_id        → el userId que pasamos al SDK (Supabase UID)
 *   reward         → monedas a acreditar (ya calculadas por adjoe según nuestra config)
 *   transaction_id → ID único del evento (para deduplicación)
 *   checksum       → HMAC-SHA256(secret, transaction_id + ":" + user_id + ":" + reward)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const userId        = searchParams.get('user_id');
  const rewardStr     = searchParams.get('reward');
  const transactionId = searchParams.get('transaction_id');
  const checksum      = searchParams.get('checksum');

  // 1. Validar parámetros básicos
  if (!userId || !rewardStr || !transactionId || !checksum) {
    console.error('[adjoe] Parámetros faltantes:', { userId, rewardStr, transactionId, checksum });
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  // 2. Verificar firma HMAC (anti-fraude)
  const secret = process.env.ADJOE_S2S_SECRET;
  if (!secret) {
    console.error('[adjoe] ADJOE_S2S_SECRET no configurada');
    return NextResponse.json({ error: 'Config error' }, { status: 500 });
  }

  const rawString    = `${transactionId}:${userId}:${rewardStr}`;
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(rawString)
    .digest('hex');

  if (checksum !== expectedHash) {
    console.error('[adjoe] Checksum inválido:', { received: checksum, expected: expectedHash });
    return NextResponse.json({ error: 'Checksum inválido' }, { status: 403 });
  }

  // 3. Calcular monedas a acreditar
  // adjoe ya nos envía el valor en nuestra moneda virtual (Monedas)
  // según la config: 10,000 monedas = $1 USD, 60% revenue share
  const coins = Math.floor(Number(rewardStr));

  if (coins <= 0) {
    return NextResponse.json({ ok: true, coins: 0 });
  }

  // 4. Acreditar monedas (con deduplicación por transaction_id)
  try {
    await creditCoins(
      userId,
      coins,
      'adjoe',
      `adjoe Playtime: recompensa ganada`,
      { transaction_id: transactionId, reward: rewardStr }
    );

    console.log(`[adjoe] ✅ ${coins} monedas → ${userId} (tx: ${transactionId})`);
    return NextResponse.json({ ok: true, coins });

  } catch (err: any) {
    // Si el error es por transacción duplicada, responder OK para que adjoe no reintente
    if (err?.message?.includes('duplicate') || err?.code === '23505') {
      console.warn(`[adjoe] Transacción duplicada ignorada: ${transactionId}`);
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error('[adjoe] Error acreditando:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
