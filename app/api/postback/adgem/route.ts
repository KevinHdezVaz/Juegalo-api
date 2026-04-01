import { NextRequest, NextResponse } from 'next/server';
import { creditCoins } from '../../../../lib/supabase';

/**
 * GET /api/postback/adgem
 * AdGem llama este endpoint cuando un usuario completa una oferta.
 * Docs: https://docs.adgem.com/publisher-support/web-offer-wall-integration-guide/
 *
 * Parámetros que envía AdGem:
 *   appid          — tu App ID (32279)
 *   player_id      — UID del usuario en Supabase
 *   amount         — monedas a acreditar (configurado en AdGem)
 *   payout         — pago en USD para el publisher
 *   offer_id       — ID de la oferta completada
 *   offer_name     — nombre de la oferta
 *   transaction_id — ID único de la transacción (para evitar duplicados)
 *   state          — estado: 1=completada, 2=revertida/chargeBack
 *   country        — país del usuario
 *   gaid           — Google Advertising ID
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const appId         = searchParams.get('appid');
  const playerId      = searchParams.get('player_id');
  const amountStr     = searchParams.get('amount');
  const payout        = searchParams.get('payout');
  const offerId       = searchParams.get('offer_id');
  const offerName     = searchParams.get('offer_name') ?? 'Oferta AdGem';
  const transactionId = searchParams.get('transaction_id');
  const state         = searchParams.get('state') ?? '1';
  const country       = searchParams.get('country') ?? '';
  const postbackKey   = searchParams.get('postback_key') ?? searchParams.get('key') ?? '';

  // ── Validar parámetros obligatorios ─────────────────────────────
  if (!playerId || !amountStr || !transactionId) {
    console.warn('[AdGem] Parámetros faltantes:', { playerId, amountStr, transactionId });
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  // ── Verificar postback key de AdGem ─────────────────────────────
  const expectedKey = process.env.ADGEM_POSTBACK_KEY!;
  if (postbackKey !== expectedKey) {
    console.warn('[AdGem] Postback key inválida:', postbackKey);
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // ── Verificar App ID ─────────────────────────────────────────────
  if (appId !== process.env.ADGEM_APP_ID) {
    console.warn('[AdGem] App ID inválido:', appId);
    return NextResponse.json({ error: 'App ID inválido' }, { status: 403 });
  }

  // ── Oferta revertida (chargeBack) — no acreditar ─────────────────
  if (state === '2') {
    console.log(`[AdGem] ↩️ Oferta revertida: txn=${transactionId}`);
    return NextResponse.json({ ok: true, skipped: 'chargeback' });
  }

  const coins = parseInt(amountStr, 10);
  if (isNaN(coins) || coins <= 0) {
    return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
  }

  // ── Acreditar monedas ─────────────────────────────────────────────
  try {
    await creditCoins(
      playerId,
      coins,
      'adgem',
      `Oferta completada: ${offerName}`,
      {
        transaction_id : transactionId,
        offer_id       : offerId,
        offer_name     : offerName,
        payout_usd     : payout,
        country        : country,
        app_id         : appId,
      }
    );

    console.log(`[AdGem] ✅ ${coins} monedas → usuario ${playerId} | oferta: ${offerName} | txn: ${transactionId}`);
    return NextResponse.json({ ok: true });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Si el error es de transacción duplicada (RPC puede validarlo), ignorar
    if (message.includes('duplicate') || message.includes('already')) {
      console.warn(`[AdGem] ⚠️ Transacción duplicada ignorada: ${transactionId}`);
      return NextResponse.json({ ok: true, skipped: 'duplicate' });
    }

    console.error('[AdGem] ❌ Error:', message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
