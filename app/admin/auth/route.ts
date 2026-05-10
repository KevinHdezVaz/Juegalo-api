import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const SESSION_COOKIE = '__admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function makeSession(username: string): string {
  const secret  = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? 'change_me';
  const expiry  = Date.now() + SESSION_TTL_MS;
  const payload = `${expiry}.${username}`;
  const sig     = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}|${sig}`;
}

/** POST /admin/auth  — login o logout según action */
export async function POST(req: NextRequest) {
  const form   = await req.formData();
  const action = form.get('action')?.toString();

  // ── LOGOUT ──────────────────────────────────────────────────────────
  if (action === 'logout') {
    const res = NextResponse.redirect(new URL('/admin/login', req.url), 303);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  // ── LOGIN ────────────────────────────────────────────────────────────
  const username = form.get('username')?.toString() ?? '';
  const password = form.get('password')?.toString() ?? '';

  const validUser = process.env.ADMIN_USERNAME ?? 'admin';
  const validPass = process.env.ADMIN_PASSWORD ?? '';

  if (!validPass) {
    // ADMIN_PASSWORD no configurada → bloquear para seguridad
    return NextResponse.redirect(
      new URL('/admin/login?error=Configura+ADMIN_PASSWORD+en+Vercel', req.url),
      303,
    );
  }

  if (username !== validUser || password !== validPass) {
    return NextResponse.redirect(
      new URL('/admin/login?error=Usuario+o+contraseña+incorrectos', req.url),
      303,
    );
  }

  const token = makeSession(username);
  const res   = NextResponse.redirect(new URL('/admin', req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   SESSION_TTL_MS / 1000,
    path:     '/',
  });
  return res;
}
