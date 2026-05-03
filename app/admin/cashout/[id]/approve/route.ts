import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendToToken } from '../../../../../lib/fcm';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const REFERRAL_BONUS_COINS = 1_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── Fetch cashout + user data ──────────────────────────────────
  const { data: cashout, error: fetchError } = await supabase
    .from('cashout_requests')
    .select('*, users(fcm_token, username, referred_by, referral_bonus_paid)')
    .eq('id', id)
    .single();

  if (fetchError || !cashout) {
    return new NextResponse(`Retiro no encontrado: ${fetchError?.message}`, { status: 404 });
  }

  if (cashout.status === 'paid') {
    return NextResponse.redirect(new URL('/admin?error=ya_procesado', req.url));
  }

  // ── ¿Es el primer cobro del usuario? ───────────────────────────
  const { count: prevPaidCount } = await supabase
    .from('cashout_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', cashout.user_id)
    .eq('status', 'paid');

  const isFirstCashout = (prevPaidCount ?? 0) === 0;

  // ── Marcar como pagado ─────────────────────────────────────────
  await supabase
    .from('cashout_requests')
    .update({
      status:       'paid',
      processed_at: new Date().toISOString(),
      notes:        `Pago manual aprobado (${cashout.method})`,
    })
    .eq('id', id);

  const userData   = cashout.users as any;
  const fcmToken   = userData?.fcm_token   as string | null;
  const referredBy = userData?.referred_by as string | null;
  const bonusPaid  = userData?.referral_bonus_paid as boolean | null;
  const amount     = Number(cashout.amount_usd).toFixed(2);

  // ── Bono de referido: solo en el primer cobro y si no se pagó ──
  if (isFirstCashout && referredBy && !bonusPaid) {
    await Promise.allSettled([

      // 1. Dar monedas al usuario referido (quien cobró)
      supabase.rpc('credit_coins', {
        p_user_id:     cashout.user_id,
        p_coins:       REFERRAL_BONUS_COINS,
        p_source:      'referral_bonus_referee',
        p_description: '🎁 Bono por usar código de referido en tu primer cobro',
      }),

      // 2. Dar monedas al referidor
      supabase.rpc('credit_coins', {
        p_user_id:     referredBy,
        p_coins:       REFERRAL_BONUS_COINS,
        p_source:      'referral_bonus_referrer',
        p_description: '🎁 Bono de referido — tu amigo hizo su primer cobro',
      }),

      // 3. Marcar bono como pagado para no repetirlo
      supabase
        .from('users')
        .update({ referral_bonus_paid: true })
        .eq('id', cashout.user_id),

      // 4. Actualizar contador de referidos del referidor
      supabase.rpc('increment_referral_count', {
        p_referrer_id: referredBy,
        p_bonus_coins: REFERRAL_BONUS_COINS,
      }).maybeSingle(),
    ]);

    // Notificar al referidor
    const { data: referrerData } = await supabase
      .from('users')
      .select('fcm_token, username')
      .eq('id', referredBy)
      .single();

    const referrerToken = referrerData?.fcm_token as string | null;
    if (referrerToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
      await sendToToken(referrerToken, {
        title: '🎁 ¡Bono de referido recibido!',
        body:  `Tu amigo ${userData?.username ?? 'un amigo'} hizo su primer cobro. ¡Ya tienes ${REFERRAL_BONUS_COINS.toLocaleString()} monedas extra!`,
        data:  { type: 'referral_bonus', screen: 'wallet' },
      });
    }

    // Notificar al usuario que cobró (con mención del bono)
    if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
      await sendToToken(fcmToken, {
        title: '🎉 ¡Tu pago fue enviado!',
        body:  `$${amount} USD en camino + 🎁 ${REFERRAL_BONUS_COINS.toLocaleString()} monedas de bono de referido.`,
        data:  { type: 'cashout_paid', screen: 'wallet' },
      });
    }

  } else {
    // Notificación normal sin bono
    if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
      await sendToToken(fcmToken, {
        title: '🎉 ¡Tu pago fue enviado!',
        body:  `$${amount} USD ya están en camino a tu cuenta de ${cashout.method === 'paypal' ? 'PayPal' : 'MercadoPago'}.`,
        data:  { type: 'cashout_paid', screen: 'wallet' },
      });
    }
  }

  return NextResponse.redirect(new URL('/admin?success=aprobado', req.url));
}
