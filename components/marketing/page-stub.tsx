import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo';

/** Phase 0 placeholder page: a translated heading. Real sections arrive in phase 3. */
export function PageStub({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-page px-gutter py-16 lg:px-gutter-lg">
      <h1 className="text-h1 text-primary">{title}</h1>
      {children}
    </div>
  );
}

type PageKey =
  | 'home'
  | 'services'
  | 'pricing'
  | 'annualContracts'
  | 'areas'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'thankYou';

/** generateMetadata + page component for a static stub route under app/[locale]. */
export function stubRoute(key: PageKey, href: string) {
  async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const t = await getTranslations('Pages');
    return { title: t(`${key}.title`), alternates: alternatesFor(locale, href) };
  }

  async function Page() {
    const t = await getTranslations('Pages');
    return <PageStub title={t(`${key}.title`)} />;
  }

  return { generateMetadata, Page };
}
