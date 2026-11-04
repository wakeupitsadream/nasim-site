import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  // Cache Components are the Next 16.4 default; see CLAUDE.md rule 5 and DECISIONS.
  cacheComponents: true,
  // Set explicitly: the Nov 2026 shell-cache advisory affects apps with it unset.
  partialPrefetching: true,
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
