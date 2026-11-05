import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { PageStub } from '@/components/marketing/page-stub';
import { getAreaBySlug, getAreas } from '@/lib/content/queries';
import { pick } from '@/lib/i18n/text';
import { alternatesFor } from '@/lib/seo';

// Only published areas get a page (BRIEF §5: no thin duplicate pages).
// The whole route must be static. For a slug missing from generateStaticParams the first request
// waits for the full render instead of streaming the App Shell, so notFound() below returns a real
// 404 status rather than a soft 404 with status 200 (DECISIONS №17).
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  return (await getAreas()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/areas/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) return {};
  const locale = await getLocale();
  return { title: pick(area.name, locale), alternates: alternatesFor(locale, `/areas/${slug}`) };
}

export default async function AreaPage({ params }: PageProps<'/[locale]/areas/[slug]'>) {
  // Existence check before any <Suspense>: an unknown slug gets a real 404 status,
  // not a streamed soft 404 (Next docs, streaming guide → Status codes).
  const { slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) notFound();
  const locale = await getLocale();
  return <PageStub title={pick(area.name, locale)} />;
}
