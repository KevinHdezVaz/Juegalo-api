import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /api/webhook/adgem
 * AdGem llama este endpoint cuando suspende a un jugador (fraude, chargeback, etc.)
 * Docs: https://docs.adgem.com/publisher-support/suspended-players-alert/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verificar webhook secret
    const secret = req.headers.get('x-adgem-secret') ?? body?.secret ?? '';
    const expectedSecret = process.env.ADGEM_WEBHOOK_SECRET!;

    if (secret !== expectedSecret) {
      console.warn('[AdGem Webhook] Secret inválido:', secret);
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const playerId = body?.player_id ?? body?.user_id;
    const reason   = body?.reason ?? 'Suspendido por AdGem';

    if (!playerId) {
      return NextResponse.json({ error: 'player_id requerido' }, { status: 400 });
    }

    // Marcar usuario como suspendido en Supabase
    const { error } = await supabase
      .from('users')
      .update({
        is_banned: true,
        ban_reason: `AdGem: ${reason}`,
        banned_at: new Date().toISOString(),
      })
      .eq('id', playerId);

    if (error) {
      console.error('[AdGem Webhook] Error al suspender usuario:', error.message);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    console.log(`[AdGem Webhook] 🚫 Usuario suspendido: ${playerId} | Razón: ${reason}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[AdGem Webhook] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
