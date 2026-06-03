import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/payouts/recent
// Devuelve los últimos 15 cobros PAGADOS para mostrar en el live feed.
// Datos anonimizados — solo primer nombre + país + monto.
export async function GET() {
  const { data, error } = await supabase
    .from('cashout_requests')
    .select('amount_usd, processed_at, users(username, country_code)')
    .eq('status', 'paid')
    .order('processed_at', { ascending: false })
    .limit(15);

  if (error || !data) {
    return NextResponse.json({ payouts: [] }, { status: 200 });
  }

  const payouts = data.map((c: any) => {
    const username = c.users?.username ?? 'Jugador';
    const firstName = username.split(' ')[0] || 'Jugador';
    return {
      name:    firstName,
      country: c.users?.country_code ?? 'MX',
      amount:  Number(c.amount_usd ?? 0),
      at:      c.processed_at,
    };
  });

  return NextResponse.json(
    { payouts },
    {
      status: 200,
      headers: {
        // Cache 60s en CDN para no martillar Supabase
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
