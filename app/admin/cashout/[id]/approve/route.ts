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

  const { error } = await supabase
    .from('cashout_requests')
    .update({
      status: 'paid',
      processed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }

  return NextResponse.redirect(new URL('/admin', _req.url));
}
