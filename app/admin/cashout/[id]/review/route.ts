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

  const { data: cashout, error } = await supabase
    .from('cashout_requests')
    .select('status, amount_usd, method, users(fcm_token)')
    .eq('id', id)
    .single();

  if (error || !cashout) {
    return new NextResponse('Retiro no encontrado', { status: 404 });
  }

  if (cashout.status !== 'pending') {
    return NextResponse.redirect(new URL('/admin?error=ya_procesado', req.url));
  }

  await supabase
    .from('cashout_requests')
    .update({
      status: 'processing',
      notes:  'En revisión por el equipo de JUEGALO',
    })
    .eq('id', id);

  // Notificar al usuario
  const usersData = cashout.users as unknown as { fcm_token: string | null } | null;
  const fcmToken = usersData?.fcm_token;
  if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PROJECT_ID) {
    const amount = Number(cashout.amount_usd).toFixed(2);
    await sendToToken(fcmToken, {
      title: '🔍 Estamos revisando tu solicitud',
      body:  `Tu retiro de $${amount} USD está siendo verificado. Te avisamos en cuanto esté listo.`,
      data:  { type: 'cashout_reviewing', screen: 'wallet' },
    });
  }

  return NextResponse.redirect(new URL('/admin?success=en_revision', req.url));
}
