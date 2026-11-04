import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

// Next 16 file convention (middleware.ts is deprecated); always runs on the Node runtime.
export default createMiddleware(routing);

export const config = {
  // Everything except /api, /admin, /_next, /_vercel and files with an extension.
  // Phase 5: add a separate branch for /admin/* and /api/admin/* that only does an optimistic
  // session-cookie check and skips next-intl. Real auth stays in every server action and route handler.
  matcher: '/((?!api|admin|_next|_vercel|.*\\..*).*)',
};
