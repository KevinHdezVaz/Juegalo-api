import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /admin/cashout/[id]/paypal-issue
 *
 * Marca un cobro como "PayPal no funciona". El status sigue siendo "pending"
 * pero queda flag=true para sacarlo de la cola normal y mostrarlo en el tab
 * "PayPal no funciona". Las monedas siguen retenidas.
 *
 * Soporta query ?undo=1 para revertir (volver a la cola normal).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const undo         = req.nextUrl.searchParams.get('undo') === '1';
  const returnPage   = req.nextUrl.searchParams.get('returnPage') ?? '1';
  const pendingPage  = req.nextUrl.searchParams.get('pp') ?? '1';
  const fromTab      = req.nextUrl.searchParams.get('from') ?? 'retiros';

  const { data: cashout, error: fetchError } = await supabase
    .from('cashout_requests')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchError || !cashout) {
    return new NextResponse(`Retiro no encontrado: ${fetchError?.message}`, { status: 404 });
  }

  if (cashout.status !== 'pending') {
    return NextResponse.redirect(
      new URL(`/admin?tab=${fromTab}&page=${returnPage}&pp=${pendingPage}&error=no_pendiente`, req.url)
    );
  }

  await supabase
    .from('cashout_requests')
    .update({
      paypal_issue:    !undo,
      paypal_issue_at: undo ? null : new Date().toISOString(),
    })
    .eq('id', id);

  const successKey = undo ? 'paypal_ok' : 'paypal_problema';
  return NextResponse.redirect(
    new URL(`/admin?tab=${fromTab}&page=${returnPage}&pp=${pendingPage}&success=${successKey}`, req.url)
  );
}
