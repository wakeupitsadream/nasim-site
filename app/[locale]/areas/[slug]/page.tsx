import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import seed from '@/content/seed/areas.json';
import { PageStub } from '@/components/marketing/page-stub';
import { pick } from '@/lib/i18n/text';
import { alternatesFor } from '@/lib/seo';

// Only published areas get a page (BRIEF §5: no thin duplicate pages).
// Phase 0 reads the seed file; phase 2 replaces this with a cached DB query (lib/db/queries).
const areas = seed.areas.filter((a) => a.published);

// The whole route must be static. For a slug missing from generateStaticParams the first request
// waits for the full render instead of streaming the App Shell, so notFound() below returns a real
// 404 status rather than a soft 404 with status 200.
export const ensureStatic = 'navigation';

function findArea(slug: string) {
  return areas.find((a) => a.slug === slug);
}

export function generateStaticParams() {
  return areas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/areas/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const area = findArea(slug);
  if (!area) return {};
  const locale = await getLocale();
  return { title: pick(area.name, locale), alternates: alternatesFor(locale, `/areas/${slug}`) };
}

export default async function AreaPage({ params }: PageProps<'/[locale]/areas/[slug]'>) {
  // Existence check before any <Suspense>: an unknown slug gets a real 404 status,
  // not a streamed soft 404 (Next docs, streaming guide → Status codes).
  const { slug } = await params;
  const area = findArea(slug);
  if (!area) notFound();
  const locale = await getLocale();
  return <PageStub title={pick(area.name, locale)} />;
}
