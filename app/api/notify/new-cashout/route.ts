import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL  = process.env.ADMIN_EMAIL ?? 'kevinv.contacto@gmail.com';
const FROM_EMAIL   = 'JUEGALO <onboarding@resend.dev>';

/**
 * POST /api/notify/new-cashout
 * Llamado por el Supabase Database Webhook cuando se inserta en cashout_requests.
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

  const username   = record.users?.username ?? 'Usuario';
  const email      = record.users?.email    ?? '—';
  const amountUsd  = Number(record.amount_usd ?? 0).toFixed(2);
  const coins      = Number(record.coins ?? 0).toLocaleString('en-US');
  const method     = (record.method ?? 'paypal').toUpperCase();
  const account    = record.account ?? record.payment_detail ?? '—';
  const createdAt  = new Date(record.created_at ?? Date.now())
    .toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium', timeStyle: 'short' });
  const adminUrl   = `https://juegalo-api.vercel.app/admin`;

  const { error } = await resend.emails.send({
    from:    FROM_EMAIL,
    to:      ADMIN_EMAIL,
    subject: `💰 Nueva solicitud de cobro — $${amountUsd} USD`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);padding:28px 32px;">
          <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">JUEGALO</div>
          <div style="color:#BFDBFE;font-size:13px;margin-top:4px;">Panel de administración</div>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;">
          <p style="font-size:18px;font-weight:800;color:#0F172A;margin:0 0 6px;">
            💰 Nueva solicitud de cobro
          </p>
          <p style="font-size:13px;color:#64748B;margin:0 0 24px;">${createdAt}</p>

          <!-- Monto destacado -->
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:18px 22px;margin-bottom:20px;text-align:center;">
            <div style="font-size:36px;font-weight:900;color:#059669;">$${amountUsd} USD</div>
            <div style="font-size:13px;color:#64748B;margin-top:4px;">${coins} monedas · ${method}</div>
          </div>

          <!-- Datos del usuario -->
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr>
              <td style="padding:10px 0;color:#64748B;border-bottom:1px solid #F1F5F9;width:40%;">Usuario</td>
              <td style="padding:10px 0;color:#0F172A;font-weight:600;border-bottom:1px solid #F1F5F9;">${username}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748B;border-bottom:1px solid #F1F5F9;">Correo</td>
              <td style="padding:10px 0;color:#0F172A;font-weight:600;border-bottom:1px solid #F1F5F9;">${email}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748B;border-bottom:1px solid #F1F5F9;">Cuenta destino</td>
              <td style="padding:10px 0;color:#0F172A;font-weight:600;font-family:monospace;border-bottom:1px solid #F1F5F9;">${account}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748B;">Método</td>
              <td style="padding:10px 0;color:#0F172A;font-weight:600;">${method}</td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="margin-top:28px;text-align:center;">
            <a href="${adminUrl}" style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:800;font-size:14px;display:inline-block;">
              Ver en el panel →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 32px;text-align:center;">
          <p style="font-size:11px;color:#94A3B8;margin:0;">JUEGALO Admin · Notificación automática</p>
        </div>

      </div>
    `,
  });

  if (error) {
    console.error('[Email] Error enviando notificación de cashout:', error);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }

  console.log(`[Email] Notificación enviada: $${amountUsd} USD de ${username}`);
  return NextResponse.json({ ok: true });
}
