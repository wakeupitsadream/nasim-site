import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { PageStub } from '@/components/marketing/page-stub';
import { getServiceBySlug, getServices } from '@/lib/content/queries';
import { pick } from '@/lib/i18n/text';
import { alternatesFor } from '@/lib/seo';

// The whole route must be static. For a slug missing from generateStaticParams the first request
// waits for the full render instead of streaming the App Shell, so notFound() below returns a real
// 404 status rather than a soft 404 with status 200 (DECISIONS №17).
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  return (await getServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/services/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  const locale = await getLocale();
  return {
    title: pick(service.seo_title, locale) || pick(service.name, locale),
    description: pick(service.seo_description, locale) || undefined,
    alternates: alternatesFor(locale, `/services/${slug}`),
  };
}

export default async function ServicePage({ params }: PageProps<'/[locale]/services/[slug]'>) {
  // Existence check before any <Suspense>: an unknown slug gets a real 404 status,
  // not a streamed soft 404 (Next docs, streaming guide → Status codes).
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();
  const locale = await getLocale();
  return <PageStub title={pick(service.name, locale)} />;
}
