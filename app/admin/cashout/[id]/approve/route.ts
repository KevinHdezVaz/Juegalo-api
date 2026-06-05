import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendToToken } from '../../../../../lib/fcm';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── Fetch cashout + user data ──────────────────────────────────
  const { data: cashout, error: fetchError } = await supabase
    .from('cashout_requests')
    .select('*, users(fcm_token, username)')
    .eq('id', id)
    .single();

  if (fetchError || !cashout) {
    return new NextResponse(`Retiro no encontrado: ${fetchError?.message}`, { status: 404 });
  }

  const returnPage   = req.nextUrl.searchParams.get('returnPage') ?? '1';
  const pendingPage  = req.nextUrl.searchParams.get('pp') ?? '1';

  if (cashout.status === 'paid') {
    return NextResponse.redirect(new URL(`/admin?tab=retiros&page=${returnPage}&pp=${pendingPage}&error=ya_procesado`, req.url));
  }

  // ── Marcar como pagado ─────────────────────────────────────────
  await supabase
    .from('cashout_requests')
    .update({
      status:       'paid',
      processed_at: new Date().toISOString(),
      notes:        `Pago manual aprobado (${cashout.method})`,
    })
    .eq('id', id);

  const userData = cashout.users as any;
  const fcmToken = userData?.fcm_token as string | null;
  const amount   = Number(cashout.amount_usd).toFixed(2);

  // ⚠️ Bono de referido REMOVIDO — solo se notifica el pago.
  if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
    await sendToToken(fcmToken, {
      title: '🎉 ¡Tu pago fue enviado!',
      body:  `$${amount} USD ya están en camino a tu cuenta de ${cashout.method === 'paypal' ? 'PayPal' : 'MercadoPago'}.`,
      data:  { type: 'cashout_paid', screen: 'wallet' },
    });
  }

  return NextResponse.redirect(new URL(`/admin?tab=retiros&page=${returnPage}&pp=${pendingPage}&success=aprobado`, req.url));
}
