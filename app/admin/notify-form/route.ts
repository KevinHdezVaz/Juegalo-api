import { NextRequest, NextResponse } from 'next/server';
import { getActiveTokens, getUnclaimedBonusTokens, sendToTokens } from '../../../lib/fcm';

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const title    = (form.get('title')    as string | null)?.trim() ?? '';
  const message  = (form.get('message')  as string | null)?.trim() ?? '';
  const audience = (form.get('audience') as string | null)?.trim() ?? 'all';

  if (!title || !message) {
    return NextResponse.redirect(
      new URL('/admin?tab=notificaciones&error=' + encodeURIComponent('Completa el título y el mensaje.'), req.url)
    );
  }

  try {
    let tokens: string[];

    if (audience === 'unclaimed_bonus') {
      tokens = await getUnclaimedBonusTokens();
    } else {
      tokens = await getActiveTokens(30);
    }

    const total = tokens.length;
    const sent  = await sendToTokens(tokens, { title, body: message });

    const successUrl = `/admin?tab=notificaciones&success=enviado&sent=${sent}&total=${total}`;
    return NextResponse.redirect(new URL(successUrl, req.url));
  } catch (err: any) {
    console.error('[notify-form]', err);
    return NextResponse.redirect(
      new URL('/admin?tab=notificaciones&error=' + encodeURIComponent(err?.message ?? 'Error desconocido'), req.url)
    );
  }
}
