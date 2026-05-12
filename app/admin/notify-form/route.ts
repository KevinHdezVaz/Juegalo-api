import { NextRequest, NextResponse } from 'next/server';
import { getActiveTokens, getUnclaimedBonusTokens, sendToTokens } from '../../../lib/fcm';
import { supabase } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const title    = (form.get('title')    as string | null)?.trim() ?? '';
  const message  = (form.get('message')  as string | null)?.trim() ?? '';
  const audience = (form.get('audience') as string | null)?.trim() ?? 'all';
  const preset   = (form.get('preset')   as string | null)?.trim() ?? null;

  if (!title || !message) {
    return NextResponse.redirect(
      new URL('/admin?tab=notificaciones&error=' + encodeURIComponent('Completa el título y el mensaje.'), req.url)
    );
  }

  try {
    const tokens = audience === 'unclaimed_bonus'
      ? await getUnclaimedBonusTokens()
      : await getActiveTokens(30);

    const total = tokens.length;
    const sent  = await sendToTokens(tokens, { title, body: message });

    // ── Guardar en historial ─────────────────────────────────────────────────
    await supabase.from('notification_logs').insert({
      title,
      body        : message,
      audience,
      preset,
      sent_count  : sent,
      total_count : total,
    });

    const successUrl = `/admin?tab=notificaciones&success=enviado&sent=${sent}&total=${total}`;
    return NextResponse.redirect(new URL(successUrl, req.url));
  } catch (err: any) {
    console.error('[notify-form]', err);
    return NextResponse.redirect(
      new URL('/admin?tab=notificaciones&error=' + encodeURIComponent(err?.message ?? 'Error desconocido'), req.url)
    );
  }
}
