import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /api/config
 * Devuelve configuración pública (no secreta) para la app Flutter.
 * Solo expone claves en la lista blanca — NUNCA el s2s_token.
 */
const PUBLIC_KEYS = new Set(['adjoe_app_id']);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', [...PUBLIC_KEYS]);

    if (error) throw error;

    const config: Record<string, string> = {};
    for (const row of data ?? []) {
      if (PUBLIC_KEYS.has(row.key) && row.value) {
        config[row.key] = row.value;
      }
    }

    return NextResponse.json(config, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (e) {
    console.error('[Config] Error:', e);
    return NextResponse.json({});
  }
}
