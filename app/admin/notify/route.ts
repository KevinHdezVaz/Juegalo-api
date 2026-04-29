import { NextRequest, NextResponse } from 'next/server';
import { getActiveTokens, getUnclaimedBonusTokens, sendToTokens } from '../../../lib/fcm';

/**
 * POST /admin/notify
 * Body: { preset: string } | { title: string, body: string, audience: 'all' | 'unclaimed_bonus' }
 *
 * Presets disponibles:
 *  - daily_bonus   → usuarios que no han reclamado su bono hoy
 *  - new_games     → todos los activos (últimos 30 días)
 *  - streak        → todos los activos
 *  - surveys       → todos los activos
 */

const PRESETS: Record<string, { title: string; body: string; audience: 'all' | 'unclaimed_bonus'; data: Record<string, string> }> = {
  daily_bonus: {
    title:    '🎁 ¡Tu bono diario te espera!',
    body:     'Entra a JUEGALO y reclama tus monedas gratis de hoy.',
    audience: 'unclaimed_bonus',
    data:     { type: 'daily_bonus', screen: 'home' },
  },
  new_games: {
    title:    '🎮 ¡Nuevas misiones disponibles!',
    body:     'Instala juegos y gana monedas extra hoy.',
    audience: 'all',
    data:     { type: 'new_games', screen: 'games' },
  },
  surveys: {
    title:    '📋 ¡Hay encuestas para ti!',
    body:     'Completa encuestas y gana hasta $0.60 USD cada una.',
    audience: 'all',
    data:     { type: 'surveys', screen: 'surveys' },
  },
  streak: {
    title:    '🔥 ¡No pierdas tu racha!',
    body:     'Entra hoy y mantén tu racha activa. ¡Hay bonos esperándote!',
    audience: 'all',
    data:     { type: 'streak', screen: 'home' },
  },
  ranking: {
    title:    '🏆 ¡El ranking semanal reinicia pronto!',
    body:     'Gana más monedas antes del cierre y llévate el premio.',
    audience: 'all',
    data:     { type: 'ranking', screen: 'ranking' },
  },
};

export async function POST(req: NextRequest) {
  // Protección simple: solo desde el admin panel (mismo origen) o con secret
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json() as {
    preset?: string;
    title?: string;
    message?: string;
    audience?: 'all' | 'unclaimed_bonus';
  };

  let title: string;
  let notifBody: string;
  let audience: 'all' | 'unclaimed_bonus';
  let data: Record<string, string> = { type: 'broadcast', screen: 'home' };

  if (body.preset && PRESETS[body.preset]) {
    ({ title, body: notifBody, audience, data } = PRESETS[body.preset]);
  } else if (body.title && body.message) {
    title     = body.title;
    notifBody = body.message;
    audience  = body.audience ?? 'all';
  } else {
    return NextResponse.json({ error: 'Falta preset o title+message' }, { status: 400 });
  }

  const tokens = audience === 'unclaimed_bonus'
    ? await getUnclaimedBonusTokens()
    : await getActiveTokens(30);

  if (tokens.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No hay tokens disponibles' });
  }

  const sent = await sendToTokens(tokens, { title, body: notifBody, data });
  return NextResponse.json({ sent, total: tokens.length });
}
