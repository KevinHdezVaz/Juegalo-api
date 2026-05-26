import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { creditCoins } from '../../../../lib/supabase';

/**
 * GET /api/postback/adjoe
 * adjoe llama este endpoint (S2S) cuando un usuario gana recompensas.
 * Documentación: https://docs.adjoe.io/playtime/s2s-rewards
 *
 * Parámetros que envía adjoe:
 *   user_uuid   → Supabase UID del usuario (pasado al SDK en inicialización)
 *   trans_uuid  → ID único de transacción (UUID v4, para deduplicación)
 *   coin_amount → Monedas a acreditar (calculadas por adjoe según nuestra config)
 *   currency    → Nombre de la moneda virtual ("Monedas")
 *   sid         → Firma SHA1 de seguridad
 *   device_id   → (opcional) ID del dispositivo
 *   sdk_app_id  → (opcional) App ID del SDK (ej. com.kevinhv.juegalo)
 *   reward_type → (opcional) Tipo: Playtime, Advance, AdvancePlus, etc.
 *   placement   → (opcional) Lugar en la app donde se mostró el catálogo
 *
 * Fórmula del SID:
 *   sha1(trans_uuid + user_uuid + currency + coin_amount + device_id + sdk_app_id + s2s_token)
 *   Si device_id o sdk_app_id no están presentes, se omiten de la concatenación.
 *
 * IPs autorizadas de adjoe:
 *   3.121.65.44 | 18.185.166.67 | 52.29.52.48
 */

// IPs oficiales de adjoe (para referencia — Vercel no expone la IP del caller fácilmente)
const ADJOE_IPS = new Set(['3.121.65.44', '18.185.166.67', '52.29.52.48']);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const userUuid    = searchParams.get('user_uuid');
  const transUuid   = searchParams.get('trans_uuid');
  const coinAmountStr = searchParams.get('coin_amount');
  const currency    = searchParams.get('currency');
  const sid         = searchParams.get('sid');
  const deviceId    = searchParams.get('device_id')   ?? '';
  const sdkAppId    = searchParams.get('sdk_app_id')  ?? '';
  const rewardType  = searchParams.get('reward_type') ?? '';
  const placement   = searchParams.get('placement')   ?? '';

  // 1. Validar parámetros requeridos
  if (!userUuid || !transUuid || !coinAmountStr || !currency || !sid) {
    console.error('[adjoe] Parámetros faltantes:', { userUuid, transUuid, coinAmountStr, currency, sid });
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  // 2. Verificar firma SHA1 (anti-fraude)
  //    sid = sha1(trans_uuid + user_uuid + currency + coin_amount + device_id + sdk_app_id + s2s_token)
  //    Si device_id o sdk_app_id no están en la URL, se omiten de la concatenación

  // Leer el token desde app_config (Supabase) o caer a env var como fallback
  let s2sToken = process.env.ADJOE_S2S_TOKEN ?? '';
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data } = await db
      .from('app_config')
      .select('value')
      .eq('key', 'adjoe_s2s_token')
      .maybeSingle();
    if (data?.value) s2sToken = data.value;
  } catch { /* usa env var */ }

  if (!s2sToken) {
    console.error('[adjoe] adjoe_s2s_token no configurado (ni Supabase ni env)');
    return NextResponse.json({ error: 'Config error' }, { status: 500 });
  }

  // Construir string según qué parámetros opcionales están presentes
  const hasDeviceId  = !!searchParams.get('device_id');
  const hasSdkAppId  = !!searchParams.get('sdk_app_id');

  let raw = transUuid + userUuid + currency + coinAmountStr;
  if (hasDeviceId)  raw += deviceId;
  if (hasSdkAppId)  raw += sdkAppId;
  raw += s2sToken;

  const expectedSid = crypto.createHash('sha1').update(raw).digest('hex');

  if (sid !== expectedSid) {
    console.error('[adjoe] SID inválido:', { received: sid, expected: expectedSid });
    return NextResponse.json({ error: 'SID inválido' }, { status: 403 });
  }

  // 3. Parsear y validar coin_amount
  // Revenue share: usuario recibe 20%, app retiene 80%
  const coinsRaw = Math.floor(Number(coinAmountStr));
  const coins    = Math.floor(coinsRaw * 0.20);
  if (isNaN(coins) || coins <= 0) {
    return NextResponse.json({ ok: true, coins: 0 });
  }

  // 4. Acreditar monedas con deduplicación por trans_uuid
  try {
    await creditCoins(
      userUuid,
      coins,
      'adjoe',
      `adjoe ${rewardType || 'Playtime'}: ${coins} monedas${placement ? ` (${placement})` : ''}`,
      {
        trans_uuid:  transUuid,
        coin_amount: coins,
        currency,
        reward_type: rewardType,
        sdk_app_id:  sdkAppId,
        placement,
      }
    );

    console.log(`[adjoe] ✅ ${coins} monedas → ${userUuid} | tx: ${transUuid} | tipo: ${rewardType}`);

    // adjoe espera HTTP 200 para confirmar éxito
    return NextResponse.json({ ok: true, coins });

  } catch (err: any) {
    // Transacción duplicada — responder 200 para que adjoe no reintente
    if (err?.message?.includes('duplicate') || err?.code === '23505') {
      console.warn(`[adjoe] Transacción duplicada ignorada: ${transUuid}`);
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error('[adjoe] Error acreditando:', err);
    // Retornar 500 para que adjoe reintente (tiene retry por 12h)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
