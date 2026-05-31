import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /admin/cashout/export-csv?page=1
// page = página del panel admin (PAGE_SIZE=25), o "all" para todos los pendientes
export async function GET(req: NextRequest) {
  const pageParam = req.nextUrl.searchParams.get('page');
  const PAGE_SIZE = 25;

  let query = supabase
    .from('cashout_requests')
    .select('id, amount_usd, account, method')
    .eq('status', 'pending')
    .eq('method', 'paypal')
    .order('created_at', { ascending: true }); // más antiguos primero

  if (pageParam && pageParam !== 'all') {
    const page   = Math.max(1, Number(pageParam));
    const offset = (page - 1) * PAGE_SIZE;
    query = query.range(offset, offset + PAGE_SIZE - 1);
  }
  // si page === 'all' (o no se pasa), descarga todo sin limite

  const { data, error } = await query;

  if (error || !data) {
    console.error('[CSV export] Supabase error:', error);
    return new NextResponse(`Error: ${error?.message ?? 'Sin datos'}`, { status: 500 });
  }

  // Parsear "correo@paypal.com | USD" → correo limpio
  const parseAccount = (raw: string | null): { email: string; currency: string } => {
    if (!raw) return { email: '', currency: 'USD' };
    const parts = raw.split('|');
    return {
      email:    parts[0].trim(),
      currency: parts[1]?.trim() ?? 'USD',
    };
  };

  // Construir CSV en formato PayPal Mass Pay
  // Columnas: Email, Amount, Currency, Note
  const rows = data.map((r: any) => {
    const raw = r.account ?? '';
    const { email, currency } = parseAccount(raw);
    const amount    = Number(r.amount_usd).toFixed(2);
    const note      = 'Pago JUEGALO';
    const safeEmail = `"${email.replace(/"/g, '""')}"`;
    return `${safeEmail},${amount},${currency},${note}`;
  });

  const header = 'email,amount,currency,note';
  const csv    = [header, ...rows].join('\n');

  const date     = new Date().toISOString().slice(0, 10);
  const label    = pageParam && pageParam !== 'all' ? `-p${pageParam}` : '-all';
  const filename = `juegalo-payouts${label}-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
