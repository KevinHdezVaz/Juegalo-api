import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /admin/cashout/export-csv?limit=10|20|30
export async function GET(req: NextRequest) {
  const limit = Math.min(
    Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 10)),
    50 // máx 50 por seguridad
  );

  // Traer los N pendientes más antiguos vía PayPal
  const { data, error } = await supabase
    .from('cashout_requests')
    .select('id, amount_usd, account, payment_detail, method, users(username, email)')
    .eq('status', 'pending')
    .eq('method', 'paypal')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) {
    return new NextResponse('Error obteniendo datos', { status: 500 });
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
    const raw = r.payment_detail ?? r.account ?? '';
    const { email, currency } = parseAccount(raw);
    const amount = Number(r.amount_usd).toFixed(2);
    const note   = 'Pago JUEGALO';
    // Escapar comas y comillas en el email por si acaso
    const safeEmail = `"${email.replace(/"/g, '""')}"`;
    return `${safeEmail},${amount},${currency},${note}`;
  });

  const header = 'email,amount,currency,note';
  const csv    = [header, ...rows].join('\n');

  const date     = new Date().toISOString().slice(0, 10);
  const filename = `juegalo-payouts-${limit}-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
