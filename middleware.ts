import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const SESSION_COOKIE = '__admin_session';

/** Verifica que el cookie de sesión sea válido y no haya expirado. */
function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? 'change_me';
    // Formato: "{expiry}.{username}|{hmac_hex}"
    const pipeIdx = token.lastIndexOf('|');
    if (pipeIdx === -1) return false;
    const payload = token.slice(0, pipeIdx);
    const sig     = token.slice(pipeIdx + 1);
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expected) return false;
    const expiry = parseInt(payload.split('.')[0], 10);
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas excluidas de auth
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/auth')
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    const loginUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
