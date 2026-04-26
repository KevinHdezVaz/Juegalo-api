/**
 * MercadoPago Disbursements API
 * Docs: https://www.mercadopago.com.mx/developers/es/reference/transfers/_transfers/post
 */

const MP_BASE = 'https://api.mercadopago.com';

// ── Enviar pago a una cuenta MercadoPago ─────────────────────────
export interface MPPayoutResult {
  id:     string;
  status: string;
}

export async function sendMercadoPagoPayout(params: {
  recipientAlias: string;   // email, teléfono, CVU o alias
  amountUsd:      number;
  cashoutId:      string;
  description?:   string;
}): Promise<MPPayoutResult> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN!;

  if (!token || token === 'PENDIENTE') {
    throw new Error('MercadoPago no configurado (MERCADOPAGO_ACCESS_TOKEN)');
  }

  const { recipientAlias, amountUsd, cashoutId, description } = params;

  // MercadoPago maneja pesos MXN — convertimos USD a MXN (tipo de cambio aprox)
  // En producción deberías usar una API de tipo de cambio en tiempo real
  const MXN_PER_USD = 17.5;
  const amountMxn   = Math.round(amountUsd * MXN_PER_USD * 100) / 100;

  const body = {
    amount:          amountMxn,
    currency_id:     'MXN',
    description:     description ?? `Retiro JUEGALO #${cashoutId.substring(0, 8)}`,
    external_id:     cashoutId,
    receiver: {
      alias: recipientAlias,   // email o alias de MP
    },
  };

  const res = await fetch(`${MP_BASE}/v1/transfers`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'X-Idempotency-Key': cashoutId,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MercadoPago payout error (${res.status}): ${err}`);
  }

  const json = await res.json();
  return {
    id:     String(json.id ?? ''),
    status: json.status ?? 'pending',
  };
}

export function isMercadoPagoConfigured(): boolean {
  return !!(
    process.env.MERCADOPAGO_ACCESS_TOKEN &&
    process.env.MERCADOPAGO_ACCESS_TOKEN !== 'PENDIENTE'
  );
}
