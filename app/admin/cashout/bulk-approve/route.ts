import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendToToken } from '../../../../lib/fcm';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);


// POST /admin/cashout/bulk-approve
// Marca todos los retiros pending+paypal como pagados y envía notificaciones
export async function POST(req: NextRequest) {
  // Obtener todos los pendientes PayPal
  const { data: pendingList, error } = await supabase
    .from('cashout_requests')
    .select('*, users(fcm_token, username, referred_by, referral_bonus_paid)')
    .eq('status', 'pending')
    .eq('method', 'paypal')
    .order('created_at', { ascending: true });

  if (error || !pendingList || pendingList.length === 0) {
    return NextResponse.redirect(new URL('/admin?tab=retiros&error=sin_pendientes', req.url));
  }

  let approved = 0;

  for (const cashout of pendingList) {
    // Marcar como pagado
    await supabase
      .from('cashout_requests')
      .update({
        status:       'paid',
        processed_at: new Date().toISOString(),
        notes:        'Pago aprobado en lote (bulk approve)',
      })
      .eq('id', cashout.id);

    approved++;

    const userData = cashout.users as any;
    const fcmToken = userData?.fcm_token as string | null;
    const amount   = Number(cashout.amount_usd).toFixed(2);

    // ⚠️ Bono de referido REMOVIDO — solo se notifica el pago.
    if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
      await sendToToken(fcmToken, {
        title: '🎉 ¡Tu pago fue enviado!',
        body:  `$${amount} USD ya están en camino a tu cuenta de PayPal.`,
        data:  { type: 'cashout_paid', screen: 'wallet' },
      });
    }
  }

  return NextResponse.redirect(
    new URL(`/admin?tab=retiros&success=bulk_aprobado&total=${approved}`, req.url)
  );
}
