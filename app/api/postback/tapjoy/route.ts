import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { creditCoins } from '../../../../lib/supabase';
import { AppConstants } from '../../../../lib/constants';

/**
 * POST /api/postback/tapjoy
 * Tapjoy llama este endpoint cuando un usuario completa una oferta.
 * Documentación: https://dev.tapjoy.com/en/server-to-server-callbacks
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const userId    = searchParams.get('user_id');
  const offerId   = searchParams.get('offer_id');
  const revenueStr = searchParams.get('revenue');   // USD que Tapjoy nos paga
  const currency  = searchParams.get('currency') ?? 'USD';
  const verifier  = searchParams.get('verifier');   // firma HMAC de Tapjoy

  // 1. Validar parámetros básicos
  if (!userId || !offerId || !revenueStr || !verifier) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  // 2. Verificar firma de Tapjoy (seguridad anti-fraude)
  const secretKey = process.env.TAPJOY_SECRET_KEY!;
  const rawString = `${userId}:${offerId}:${revenueStr}:${secretKey}`;
  const expectedHash = crypto.createHash('md5').update(rawString).digest('hex');

  if (verifier !== expectedHash) {
    console.error('[Tapjoy] Firma inválida:', { verifier, expected: expectedHash });
    return NextResponse.json({ error: 'Firma inválida' }, { status: 403 });
  }

  // 3. Calcular monedas (60% del revenue al usuario)
  const revenueUsd = parseFloat(revenueStr);
  const coinsToCredit = Math.floor(
    revenueUsd * AppConstants.coinsPerDollar * AppConstants.revenueShareUser
  );

  if (coinsToCredit <= 0) {
    return NextResponse.json({ ok: true, coins: 0 });
  }

  // 4. Acreditar monedas (transacción ACID en Supabase)
  try {
    await creditCoins(
      userId,
      coinsToCredit,
      'tapjoy',
      `Oferta completada: ${offerId}`,
      { offer_id: offerId, revenue_usd: revenueUsd, currency }
    );

    console.log(`[Tapjoy] ✅ ${coinsToCredit} monedas acreditadas a ${userId}`);
    return NextResponse.json({ ok: true, coins: coinsToCredit });

  } catch (err) {
    console.error('[Tapjoy] Error acreditando:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
