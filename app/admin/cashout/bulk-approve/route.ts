import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendToToken } from '../../../../lib/fcm';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const REFERRAL_BONUS_COINS = 1_000;

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
    // Verificar si es primer cobro del usuario
    const { count: prevPaidCount } = await supabase
      .from('cashout_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', cashout.user_id)
      .eq('status', 'paid');

    const isFirstCashout = (prevPaidCount ?? 0) === 0;

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

    const userData   = cashout.users as any;
    const fcmToken   = userData?.fcm_token   as string | null;
    const referredBy = userData?.referred_by as string | null;
    const bonusPaid  = userData?.referral_bonus_paid as boolean | null;
    const amount     = Number(cashout.amount_usd).toFixed(2);

    // Bono de referido en primer cobro
    if (isFirstCashout && referredBy && !bonusPaid) {
      await Promise.allSettled([
        supabase.rpc('credit_coins', {
          p_user_id:     cashout.user_id,
          p_coins:       REFERRAL_BONUS_COINS,
          p_source:      'referral_bonus_referee',
          p_description: '🎁 Bono por usar código de referido en tu primer cobro',
        }),
        supabase.rpc('credit_coins', {
          p_user_id:     referredBy,
          p_coins:       REFERRAL_BONUS_COINS,
          p_source:      'referral_bonus_referrer',
          p_description: '🎁 Bono de referido — tu amigo hizo su primer cobro',
        }),
        supabase.from('users').update({ referral_bonus_paid: true }).eq('id', cashout.user_id),
        supabase.rpc('increment_referral_count', { p_referrer_id: referredBy, p_bonus_coins: REFERRAL_BONUS_COINS }).maybeSingle(),
      ]);

      // Notificar al referidor
      const { data: referrerData } = await supabase
        .from('users').select('fcm_token, username').eq('id', referredBy).single();
      const referrerToken = referrerData?.fcm_token as string | null;
      if (referrerToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
        await sendToToken(referrerToken, {
          title: '🎁 ¡Bono de referido recibido!',
          body:  `Tu amigo ${userData?.username ?? 'un amigo'} hizo su primer cobro. ¡Ya tienes ${REFERRAL_BONUS_COINS.toLocaleString()} monedas extra!`,
          data:  { type: 'referral_bonus', screen: 'wallet' },
        });
      }

      if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
        await sendToToken(fcmToken, {
          title: '🎉 ¡Tu pago fue enviado!',
          body:  `$${amount} USD en camino + 🎁 ${REFERRAL_BONUS_COINS.toLocaleString()} monedas de bono de referido.`,
          data:  { type: 'cashout_paid', screen: 'wallet' },
        });
      }
    } else {
      if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
        await sendToToken(fcmToken, {
          title: '🎉 ¡Tu pago fue enviado!',
          body:  `$${amount} USD ya están en camino a tu cuenta de PayPal.`,
          data:  { type: 'cashout_paid', screen: 'wallet' },
        });
      }
    }
  }

  return NextResponse.redirect(
    new URL(`/admin?tab=retiros&success=bulk_aprobado&total=${approved}`, req.url)
  );
}
