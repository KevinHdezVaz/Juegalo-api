import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /admin/flags
 * Actualiza un feature flag desde el panel de admin.
 * Acepta tanto JSON ({ key, enabled }) como form-urlencoded (desde <form> HTML).
 * Redirige de vuelta a /admin?tab=config tras el update.
 */
export async function POST(req: NextRequest) {
  try {
    let key: string | undefined;
    let enabledRaw: string | boolean | undefined;

    const ct = req.headers.get('content-type') ?? '';

    if (ct.includes('application/json')) {
      // Llamada fetch() desde JS
      const body = await req.json();
      key        = body.key;
      enabledRaw = body.enabled;
    } else {
      // Envío nativo de <form method="POST">
      const form = await req.formData();
      key        = form.get('key')?.toString();
      enabledRaw = form.get('enabled')?.toString();
    }

    const enabled =
      typeof enabledRaw === 'boolean'
        ? enabledRaw
        : enabledRaw === 'true';

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw error;

    console.log(`[Flags] ✅ ${key} → ${enabled}`);

    // Si viene de un <form>, redirigir de vuelta al panel
    if (!ct.includes('application/json')) {
      const msg = enabled ? 'activado' : 'desactivado';
      return NextResponse.redirect(
        new URL(`/admin?tab=config&success=Flag+${key}+${msg}`, req.url),
        303, // See Other — el browser hace GET
      );
    }

    return NextResponse.json({ ok: true, key, enabled });
  } catch (e) {
    console.error('[Flags] Error:', e);

    const ct = req.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      return NextResponse.redirect(
        new URL('/admin?tab=config&error=Error+al+actualizar', req.url),
        303,
      );
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
