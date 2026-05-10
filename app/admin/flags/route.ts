import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /admin/flags
 * Actualiza un feature flag desde el panel de admin.
 * Body: { key: string, enabled: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const { key, enabled } = await req.json();

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw error;

    console.log(`[Flags] ✅ ${key} → ${enabled}`);
    return NextResponse.json({ ok: true, key, enabled });
  } catch (e) {
    console.error('[Flags] Error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
