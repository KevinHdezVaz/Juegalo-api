/**
 * PayPal Payouts API helper
 * Docs: https://developer.paypal.com/docs/api/payments.payouts-batch/v1/
 */

const PAYPAL_BASE = process.env.PAYPAL_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// ── 1. Obtener token OAuth2 ──────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials no configuradas (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth error: ${err}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

// ── 2. Enviar pago a un email de PayPal ─────────────────────────
export interface PayPalPayoutResult {
  batchId:   string;
  status:    string;
  itemId:    string;
}

export async function sendPayPalPayout(params: {
  recipientEmail: string;
  amountUsd:      number;
  cashoutId:      string;
  note?:          string;
}): Promise<PayPalPayoutResult> {
  const { recipientEmail, amountUsd, cashoutId, note } = params;
  const token = await getAccessToken();

  const body = {
    sender_batch_header: {
      sender_batch_id: `juegalo-${cashoutId}-${Date.now()}`,
      email_subject:   '¡Tu pago de JUEGALO ha llegado!',
      email_message:   note ?? 'Has recibido tu retiro de JUEGALO. ¡Gracias por jugar!',
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value:    amountUsd.toFixed(2),
          currency: 'USD',
        },
        note:           note ?? 'Retiro JUEGALO',
        sender_item_id: cashoutId,
        receiver:       recipientEmail,
      },
    ],
  };

  const res = await fetch(`${PAYPAL_BASE}/v1/payments/payouts`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal payout error (${res.status}): ${err}`);
  }

  const json = await res.json();

  return {
    batchId: json.batch_header?.payout_batch_id ?? '',
    status:  json.batch_header?.batch_status     ?? 'PENDING',
    itemId:  cashoutId,
  };
}

// ── 3. Verificar si PayPal está configurado ──────────────────────
export function isPayPalConfigured(): boolean {
  return !!(
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET &&
    process.env.PAYPAL_CLIENT_ID    !== 'PENDIENTE' &&
    process.env.PAYPAL_CLIENT_SECRET !== 'PENDIENTE'
  );
}
