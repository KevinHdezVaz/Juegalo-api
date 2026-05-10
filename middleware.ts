import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = '__admin_session';

const enc = new TextEncoder();

/** Convierte ArrayBuffer a hex string */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifica la sesión usando Web Crypto API (disponible en Edge Runtime).
 * Formato del token: "{expiry}.{username}|{hmac_sha256_hex}"
 */
async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const secret  = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? 'change_me';
    const pipeIdx = token.lastIndexOf('|');
    if (pipeIdx === -1) return false;

    const payload = token.slice(0, pipeIdx);
    const sig     = token.slice(pipeIdx + 1);

    // Importar clave HMAC-SHA256 via Web Crypto
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const sigBuf   = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expected = bufToHex(sigBuf);

    if (sig !== expected) return false;

    const expiry = parseInt(payload.split('.')[0], 10);
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas excluidas de auth
  if (pathname === '/admin/login' || pathname.startsWith('/admin/auth')) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
