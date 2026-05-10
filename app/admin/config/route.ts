import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /admin/config
 * Actualiza una clave de app_config desde el panel de admin.
 * Acepta form-urlencoded (desde <form>) y redirige de vuelta.
 * Body: { key: string, value: string }
 */
export async function POST(req: NextRequest) {
  try {
    const form  = await req.formData();
    const key   = form.get('key')?.toString().trim();
    const value = form.get('value')?.toString().trim() ?? '';

    if (!key) {
      return NextResponse.redirect(
        new URL('/admin?tab=config&error=Clave+inválida', req.url), 303,
      );
    }

    const { error } = await supabase
      .from('app_config')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;

    console.log(`[Config] ✅ ${key} actualizado`);

    return NextResponse.redirect(
      new URL(`/admin?tab=config&success=✓+${key}+guardado`, req.url), 303,
    );
  } catch (e) {
    console.error('[Config] Error:', e);
    return NextResponse.redirect(
      new URL('/admin?tab=config&error=Error+al+guardar', req.url), 303,
    );
  }
}
