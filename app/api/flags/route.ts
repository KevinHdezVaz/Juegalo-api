import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /api/flags
 * Retorna todos los feature flags como { key: boolean }
 * La app Flutter llama este endpoint al iniciar.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled');

    if (error) throw error;

    // Convertir array a objeto { maintenance_mode: false, surveys_enabled: true, ... }
    const flags: Record<string, boolean> = {};
    for (const row of data ?? []) {
      flags[row.key] = row.enabled;
    }

    return NextResponse.json(flags, {
      headers: {
        // Cache 30 segundos — reduce requests sin sacrificar reactividad
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10',
      },
    });
  } catch (e) {
    console.error('[Flags] Error:', e);
    // En caso de error, devolver flags seguros (todo habilitado, sin mantenimiento)
    return NextResponse.json({
      maintenance_mode:  false,
      surveys_enabled:   true,
      games_enabled:     true,
      cashout_enabled:   true,
      videos_enabled:    true,
      referrals_enabled: true,
    });
  }
}
