import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from './lib/auth/session';
import { routing } from './lib/i18n/routing';

const intl = createMiddleware(routing);

// Next 16 file convention (middleware.ts is deprecated); always runs on the Node runtime.
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const admin = pathname === '/admin' || pathname.startsWith('/admin/');
  const adminApi = pathname.startsWith('/api/admin/');
  if (!admin && !adminApi) return intl(request);

  // Optimistic only: is there a session cookie at all. The signature, the expiry and the user
  // are checked in every page and server action (lib/auth, `requireRole`).
  if (pathname === '/admin/login' || request.cookies.has(SESSION_COOKIE))
    return NextResponse.next();
  if (adminApi) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.redirect(new URL('/admin/login', request.url));
}

export const config = {
  // Everything except /api (but /api/admin is included), /_next, /_vercel and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/api/admin/:path*'],
};
