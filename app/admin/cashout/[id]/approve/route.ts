import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendPayPalPayout, isPayPalConfigured } from '../../../../../lib/paypal';
import { sendMercadoPagoPayout, isMercadoPagoConfigured } from '../../../../../lib/mercadopago';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Obtener los detalles del retiro
  const { data: cashout, error: fetchError } = await supabase
    .from('cashout_requests')
    .select('*, users(username, email)')
    .eq('id', id)
    .single();

  if (fetchError || !cashout) {
    return new NextResponse(`Retiro no encontrado: ${fetchError?.message}`, { status: 404 });
  }

  if (cashout.status !== 'pending') {
    return NextResponse.redirect(new URL('/admin?error=ya_procesado', req.url));
  }

  // ── Marcar como procesando ───────────────────────────────────────
  await supabase
    .from('cashout_requests')
    .update({ status: 'processing' })
    .eq('id', id);

  // ── Pago automático si es PayPal y Payouts API está habilitado ──
  // NOTA: PayPal Payouts requiere aprobación manual de PayPal.
  // Mientras se aprueba, los pagos de PayPal se procesan manualmente igual que los demás.
  if (cashout.method === 'paypal' && isPayPalConfigured()) {
    try {
      const result = await sendPayPalPayout({
        recipientEmail: cashout.payment_detail,
        amountUsd:      Number(cashout.amount_usd),
        cashoutId:      id,
        note:           `Retiro JUEGALO #${id.substring(0, 8)}`,
      });

      await supabase
        .from('cashout_requests')
        .update({
          status:       'paid',
          processed_at: new Date().toISOString(),
          notes:        `PayPal batch: ${result.batchId} | status: ${result.status}`,
        })
        .eq('id', id);

      console.log(`[PayPal] ✅ Pago enviado: $${cashout.amount_usd} → ${cashout.payment_detail} | batch: ${result.batchId}`);
      return NextResponse.redirect(new URL('/admin?success=paypal_enviado', req.url));

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[PayPal] ⚠️ API no disponible, procesando manualmente:`, message);
      // Si falla el API de PayPal, caemos al flujo manual (no revertimos)
    }
  }

  // ── MercadoPago automático ────────────────────────────────────────
  if (cashout.method === 'mercadopago' && isMercadoPagoConfigured()) {
    try {
      const result = await sendMercadoPagoPayout({
        recipientAlias: cashout.payment_detail,
        amountUsd:      Number(cashout.amount_usd),
        cashoutId:      id,
      });

      await supabase
        .from('cashout_requests')
        .update({
          status:       'paid',
          processed_at: new Date().toISOString(),
          notes:        `MercadoPago transfer id: ${result.id} | status: ${result.status}`,
        })
        .eq('id', id);

      console.log(`[MP] ✅ Pago enviado: $${cashout.amount_usd} → ${cashout.payment_detail} | id: ${result.id}`);
      return NextResponse.redirect(new URL('/admin?success=mp_enviado', req.url));

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[MP] ⚠️ Error API, procesando manualmente:`, message);
    }
  }

  // ── Pago manual (fallback) ────────────────────────────────────────
  await supabase
    .from('cashout_requests')
    .update({
      status:       'paid',
      processed_at: new Date().toISOString(),
      notes:        `Pago manual aprobado (${cashout.method})`,
    })
    .eq('id', id);

  return NextResponse.redirect(new URL('/admin?success=aprobado', req.url));
}
