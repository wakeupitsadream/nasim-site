'use client';

import Error from 'next/error';

// Requests outside any valid locale (e.g. /unknown.txt) have no root layout to render into,
// so this page brings its own <html>. Inside a locale, app/[locale]/not-found.tsx is used.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
