import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Obtener la solicitud para devolver monedas
  const { data: req } = await supabase
    .from('cashout_requests')
    .select('user_id, coins')
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
      status: 'rejected',
      processed_at: new Date().toISOString(),
    })
    .eq('id', id);

  return NextResponse.redirect(new URL('/admin', _req.url));
}
