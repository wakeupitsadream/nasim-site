// Deployment environment helpers. No next/* imports, so unit tests can load this file directly.

/** True only for the production deployment on Vercel (previews and local builds are not). */
export const isProductionDeployment = (): boolean => process.env.VERCEL_ENV === 'production';

/** True once the site has its own domain; until then production stays out of search (noindex). */
export const hasCanonicalDomain = (): boolean => Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim());

/**
 * Absolute origin for metadataBase, canonical and hreflang: NEXT_PUBLIC_SITE_URL, else the Vercel
 * system URL of this deployment (values come without a scheme), else localhost.
 */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  const host =
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  return new URL(host ? `https://${host}` : 'http://localhost:3000');
}
