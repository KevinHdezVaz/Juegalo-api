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
const PUBLIC_KEYS = new Set([
  'adjoe_app_id',
  'force_update',       // "true" | "false"  — Android
  'min_version',        // semver, ej. "1.2.0" — Android
  'force_update_ios',   // "true" | "false"  — iOS
  'min_version_ios',    // semver, ej. "1.2.0" — iOS
]);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', [...PUBLIC_KEYS]);

    if (error) throw error;

    const config: Record<string, string> = {};
    for (const row of data ?? []) {
      if (PUBLIC_KEYS.has(row.key)) {
        config[row.key] = row.value ?? '';
      }
    }

    return NextResponse.json(config, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10' },
    });
  } catch (e) {
    console.error('[Config] Error:', e);
    // Defaults seguros: sin force update
    return NextResponse.json({
      force_update: 'false',
      min_version: '1.0.0',
      force_update_ios: 'false',
      min_version_ios: '1.0.0',
    });
  }
}
