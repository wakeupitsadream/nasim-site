import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, Unbounded } from 'next/font/google';
import { Suspense, type ReactNode } from 'react';
import { dictionary } from '@/lib/admin/i18n';
import '../globals.css';

// The admin has its own root layout: no locale in the URL, Russian or English by cookie
// (CLAUDE.md, repo map). Latin and Cyrillic only, so two of the site's five fonts.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-plex',
  display: 'swap',
});
const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-unbounded',
  display: 'swap',
});

export const viewport: Viewport = { themeColor: '#d4262a' };
export const metadata: Metadata = {
  title: dictionary('ru').app.title,
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    // The language cookie is read below the boundary, so the document itself stays static; the
    // panel sets `lang` on its own wrapper.
    <html lang="ru" className={`${plexSans.variable} ${unbounded.variable}`}>
      <body className="min-h-dvh bg-background">
        {/* Every admin page reads the session cookie: request data lives under <Suspense>. */}
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
