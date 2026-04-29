import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendToToken } from '../../../../../lib/fcm';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Obtener la solicitud para devolver monedas y notificar
  const { data: req } = await supabase
    .from('cashout_requests')
    .select('user_id, coins, amount_usd, method, users(fcm_token)')
    .eq('id', id)
    .single();

  if (!req) {
    return new NextResponse('Solicitud no encontrada', { status: 404 });
  }

  // Devolver monedas al usuario
  await supabase.rpc('credit_coins', {
    p_user_id:     req.user_id,
    p_coins:       req.coins,
    p_source:      'cashout_rejected',
    p_description: 'Retiro rechazado — monedas devueltas',
  });

  // Marcar como rechazado
  await supabase
    .from('cashout_requests')
    .update({
      status:       'rejected',
      processed_at: new Date().toISOString(),
    })
    .eq('id', id);

  // Notificar al usuario
  const usersData = req.users as unknown as { fcm_token: string | null } | null;
  const fcmToken = usersData?.fcm_token;
  if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
    const coins = Number(req.coins).toLocaleString('en-US');
    await sendToToken(fcmToken, {
      title: '❌ Tu retiro no pudo procesarse',
      body:  `Tus ${coins} monedas han sido devueltas a tu cuenta. Puedes intentarlo de nuevo.`,
      data:  { type: 'cashout_rejected', screen: 'wallet' },
    });
  }

  return NextResponse.redirect(new URL('/admin?success=rechazado', _req.url));
}
