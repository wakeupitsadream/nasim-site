import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import seed from '@/content/seed/services.json';
import { PageStub } from '@/components/marketing/page-stub';
import { pick } from '@/lib/i18n/text';
import { alternatesFor } from '@/lib/seo';

// Phase 0 reads the seed file; phase 2 replaces this with a cached DB query (lib/db/queries).
const services = seed.services;

// The whole route must be static. For a slug missing from generateStaticParams the first request
// waits for the full render instead of streaming the App Shell, so notFound() below returns a real
// 404 status rather than a soft 404 with status 200.
export const ensureStatic = 'navigation';

function findService(slug: string) {
  return services.find((s) => s.slug === slug);
}

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/services/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return {};
  const locale = await getLocale();
  return {
    title: pick(service.name, locale),
    alternates: alternatesFor(locale, `/services/${slug}`),
  };
}

export default async function ServicePage({ params }: PageProps<'/[locale]/services/[slug]'>) {
  // Existence check before any <Suspense>: an unknown slug gets a real 404 status,
  // not a streamed soft 404 (Next docs, streaming guide → Status codes).
  const { slug } = await params;
  const service = findService(slug);
  if (!service) notFound();
  const locale = await getLocale();
  return <PageStub title={pick(service.name, locale)} />;
}
