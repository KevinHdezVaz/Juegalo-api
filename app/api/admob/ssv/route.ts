import { NextRequest, NextResponse } from 'next/server';
import { createVerify }              from 'crypto';
import { creditCoins, supabase }     from '../../../../lib/supabase';

/**
 * GET /api/admob/ssv
 *
 * AdMob Server-Side Verification callback.
 * Google llama este endpoint directamente cuando el usuario termina de ver
 * un anuncio recompensado. La firma RSA-SHA256 garantiza que la llamada
 * es auténtica — los bots no pueden falsificarla.
 *
 * Docs: https://developers.google.com/admob/android/ssv
 *
 * Parámetros que envía AdMob (en este orden):
 *   ad_network      — ID de la red publicitaria
 *   ad_unit         — ID del ad unit
 *   custom_data     — dato personalizado (usamos el UID del usuario)
 *   key_id          — ID de la clave pública usada para firmar
 *   reward_amount   — cantidad de recompensa configurada en AdMob
 *   reward_item     — nombre del ítem de recompensa
 *   timestamp       — Unix timestamp en milisegundos
 *   transaction_id  — ID único de la transacción (para evitar duplicados)
 *   user_id         — user_id configurado en ServerSideVerificationOptions
 *   signature       — firma RSA-SHA256 en base64url
 */

// ── Caché de claves públicas de Google ──────────────────────────────────────
const KEYS_URL = 'https://gstatic.com/admob/reward/verifier-keys.json';
let cachedKeys: Record<string, string> = {};
let keysExpiry = 0;

async function getPublicKey(keyId: string): Promise<string | null> {
  if (Date.now() > keysExpiry) {
    try {
      const res  = await fetch(KEYS_URL, { next: { revalidate: 3600 } });
      const data = await res.json() as { keys: { keyId: number; pem: string }[] };
      cachedKeys = {};
      for (const k of data.keys) {
        cachedKeys[String(k.keyId)] = k.pem;
      }
      keysExpiry = Date.now() + 3_600_000; // 1 hora
    } catch (e) {
      console.error('[AdMob SSV] Error obteniendo claves públicas:', e);
    }
  }
  return cachedKeys[keyId] ?? null;
}

// ── Verificar firma RSA-SHA256 ───────────────────────────────────────────────
function verifySignature(message: string, signature: string, pem: string): boolean {
  try {
    const verify = createVerify('SHA256');
    verify.update(message);
    // AdMob usa base64url (sin padding)
    const sigBuf = Buffer.from(signature, 'base64url');
    return verify.verify(pem, sigBuf);
  } catch {
    return false;
  }
}

// ── Handler principal ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams, search } = new URL(req.url);

  const keyId         = searchParams.get('key_id');
  const signature     = searchParams.get('signature');
  const transactionId = searchParams.get('transaction_id');
  const customData    = searchParams.get('custom_data');   // UID del usuario
  const userId        = searchParams.get('user_id');        // alternativo
  const rewardAmount  = searchParams.get('reward_amount');

  // ── Validar parámetros obligatorios ────────────────────────────────────────
  if (!keyId || !signature || !transactionId) {
    console.warn('[AdMob SSV] Parámetros faltantes');
    return new NextResponse('0', { status: 400 });
  }

  // ── El mensaje firmado es todo el query string excepto "&signature=..." ─────
  // AdMob siempre pone "signature" al final
  const rawQuery  = search.slice(1); // quitar el "?"
  const sigIndex  = rawQuery.lastIndexOf('&signature=');
  const message   = sigIndex !== -1 ? rawQuery.slice(0, sigIndex) : rawQuery;

  // ── Obtener clave pública y verificar firma ────────────────────────────────
  const pem = await getPublicKey(keyId);
  if (!pem) {
    console.warn(`[AdMob SSV] Clave desconocida: ${keyId}`);
    return new NextResponse('0', { status: 403 });
  }

  if (!verifySignature(message, signature, pem)) {
    console.warn(`[AdMob SSV] Firma inválida | txn: ${transactionId}`);
    return new NextResponse('0', { status: 403 });
  }

  // ── Obtener UID del usuario ────────────────────────────────────────────────
  const uid = customData || userId;
  if (!uid) {
    // Sin UID = petición de verificación de AdMob (test de conectividad)
    // Devolvemos 200 para pasar la verificación sin acreditar monedas
    console.log('[AdMob SSV] ✅ Verificación de conectividad OK (sin user ID)');
    return new NextResponse('1', { status: 200 });
  }

  // ── Anti-fraude 1: intervalo mínimo de 10 s entre videos ─────────────────
  // Con cooldown por slot de 15 s, el mínimo legítimo entre dos videos es ~15 s.
  // Bloqueamos < 10 s para atrapar bots que van en 2-5 s sin afectar usuarios reales.
  const { data: lastVideo } = await supabase
    .from('transactions')
    .select('created_at')
    .eq('user_id', uid)
    .eq('source', 'video')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastVideo) {
    const secondsSince = (Date.now() - new Date(lastVideo.created_at).getTime()) / 1000;
    if (secondsSince < 10) {
      console.warn(
        `[AdMob SSV] 🚫 Intervalo demasiado corto: ${secondsSince.toFixed(1)}s | ` +
        `uid=${uid} | txn: ${transactionId}`
      );
      return new NextResponse('1', { status: 200 }); // 200 → AdMob no reintenta
    }
  }

  // ── Anti-fraude 2: cap diario de 50 videos (1 500 monedas) ───────────────
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const { count: videosToday } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .eq('source', 'video')
    .gte('created_at', `${today}T00:00:00.000Z`);

  if ((videosToday ?? 0) >= 50) {
    console.warn(
      `[AdMob SSV] 🚫 Cap diario alcanzado: uid=${uid} | ` +
      `${videosToday} videos hoy | txn: ${transactionId}`
    );
    return new NextResponse('1', { status: 200 });
  }

  // ── Acreditar monedas ──────────────────────────────────────────────────────
  // Siempre 30 monedas fijas — ignoramos reward_amount de AdMob para evitar
  // manipulación del parámetro.
  const coins = 30;

  try {
    await creditCoins(
      uid,
      coins,
      'video',
      'Video recompensado',
      { transaction_id: transactionId, reward_amount: rewardAmount },
    );

    console.log(`[AdMob SSV] ✅ ${coins} monedas → ${uid} | txn: ${transactionId}`);

    // Marcar el intento pendiente más antiguo de este usuario como verificado
    try {
      await supabase.rpc('verify_oldest_video_attempt', {
        p_user_id:        uid,
        p_transaction_id: transactionId,
      });
    } catch (verifyErr) {
      // No crítico — solo log, no interrumpir la respuesta a AdMob
      console.warn('[AdMob SSV] No se pudo verificar intento pendiente:', verifyErr);
    }

    // AdMob espera "1" o HTTP 200 para confirmar recepción
    return new NextResponse('1', { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // Transacción duplicada — responder 200 para que AdMob no reintente
    if (msg.includes('duplicate') || msg.includes('already') || msg.includes('daily_video_limit')) {
      console.warn(`[AdMob SSV] Duplicado ignorado: ${transactionId}`);
      return new NextResponse('1', { status: 200 });
    }

    console.error('[AdMob SSV] ❌ Error:', msg);
    // Responder 500 para que AdMob reintente más tarde
    return new NextResponse('0', { status: 500 });
  }
}
