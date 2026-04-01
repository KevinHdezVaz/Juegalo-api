import { supabase } from './supabase';

// ── FCM HTTP v1 ──────────────────────────────────────────────────
// Necesitas una Service Account de Firebase.
// Firebase Console → Project Settings → Service Accounts → Generate new private key
// Guarda el JSON como env var FIREBASE_SERVICE_ACCOUNT (base64) en Vercel

interface FcmMessage {
  title: string;
  body:  string;
  data?: Record<string, string>;
}

// Obtiene un access token OAuth2 desde la service account
async function getAccessToken(): Promise<string> {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT!;
  const sa = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf8'));

  const now   = Math.floor(Date.now() / 1000);
  const claim = {
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };

  // Firma JWT con RS256
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const signing = `${header}.${payload}`;

  const { createSign } = await import('node:crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(signing);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${signing}.${signature}`;

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// Envía una notificación a un token FCM específico
export async function sendToToken(token: string, msg: FcmMessage): Promise<boolean> {
  const projectId   = process.env.FIREBASE_PROJECT_ID!;
  const accessToken = await getAccessToken();

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: msg.title, body: msg.body },
          data:         msg.data ?? {},
          android: {
            priority: 'high',
            notification: { channel_id: 'juegalo_main', sound: 'default' },
          },
          apns: {
            payload: { aps: { sound: 'default', badge: 1 } },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    console.error('[FCM] Error enviando a token:', err);
    return false;
  }
  return true;
}

// Envía a múltiples tokens (máx 500 por llamada)
export async function sendToTokens(tokens: string[], msg: FcmMessage): Promise<number> {
  let sent = 0;
  await Promise.all(
    tokens.map(async (token) => {
      const ok = await sendToToken(token, msg);
      if (ok) sent++;
    })
  );
  return sent;
}

// Obtiene todos los FCM tokens de usuarios activos en los últimos N días
export async function getActiveTokens(daysSinceActive = 30): Promise<string[]> {
  const since = new Date();
  since.setDate(since.getDate() - daysSinceActive);

  const { data, error } = await supabase
    .from('users')
    .select('fcm_token')
    .not('fcm_token', 'is', null)
    .gte('last_active', since.toISOString().substring(0, 10));

  if (error) {
    console.error('[FCM] Error obteniendo tokens:', error);
    return [];
  }
  return (data ?? []).map((u: { fcm_token: string }) => u.fcm_token).filter(Boolean);
}

// Obtiene tokens de usuarios que NO reclamaron el bono hoy
export async function getUnclaimedBonusTokens(): Promise<string[]> {
  const today = new Date().toISOString().substring(0, 10);

  const { data, error } = await supabase
    .from('users')
    .select('fcm_token')
    .not('fcm_token', 'is', null)
    .or(`daily_bonus_claimed_at.is.null,daily_bonus_claimed_at.lt.${today}`)
    .gte('last_active', new Date(Date.now() - 7 * 86400000).toISOString().substring(0, 10));

  if (error) {
    console.error('[FCM] Error obteniendo tokens sin bono:', error);
    return [];
  }
  return (data ?? []).map((u: { fcm_token: string }) => u.fcm_token).filter(Boolean);
}
