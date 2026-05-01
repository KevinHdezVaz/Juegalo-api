import { NextRequest, NextResponse } from 'next/server';

const EMAILJS_SERVICE_ID  = 'service_m7kwjz8';
const EMAILJS_TEMPLATE_ID = 'template_4neo6wl';
const EMAILJS_PUBLIC_KEY  = '3pdmYJQXeK7_EhCFQ';
const EMAILJS_PRIVATE_KEY = 'fl4tm65TN7uUM87g097e7';

/**
 * POST /api/notify/new-cashout
 * Llamado por el Supabase Database Webhook cuando se inserta en cashout_requests.
 * Envía un email a kevinhdezvaz@gmail.com via EmailJS.
 */
export async function POST(req: NextRequest) {
  // Verificar secret del webhook
  const secret = req.headers.get('x-webhook-secret');
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();

  // Supabase Webhook manda { type, table, record, old_record }
  const record = body.record ?? body;

  const username  = record.users?.username ?? 'Usuario';
  const userEmail = record.users?.email    ?? '—';
  const amountUsd = Number(record.amount_usd ?? 0).toFixed(2);
  const coins     = Number(record.coins ?? 0).toLocaleString('en-US');
  const method    = (record.method ?? 'paypal').toUpperCase();
  const account   = record.account ?? record.payment_detail ?? '—';
  const createdAt = new Date(record.created_at ?? Date.now())
    .toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium', timeStyle: 'short' });

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:   EMAILJS_SERVICE_ID,
      template_id:  EMAILJS_TEMPLATE_ID,
      user_id:      EMAILJS_PUBLIC_KEY,
      accessToken:  EMAILJS_PRIVATE_KEY,
      template_params: {
        username,
        user_email: userEmail,
        amount_usd: amountUsd,
        coins,
        method,
        account,
        created_at: createdAt,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[EmailJS] Error:', err);
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }

  console.log(`[EmailJS] Email enviado: $${amountUsd} USD de ${username}`);
  return NextResponse.json({ ok: true });
}
