import { ArrowRightIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Ltr } from '@/components/ltr';
import { CrewPortrait } from '@/components/marketing/crew-portrait';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { Section } from '@/components/marketing/section';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/page-transition';
import { Link } from '@/lib/i18n/navigation';
import { stagger } from '@/lib/motion';

/** 404 under the locale layout: the crew, two ways out, nothing to dead-end on. */
export default async function LocaleNotFound() {
  const [t, tHome] = await Promise.all([getTranslations('NotFound'), getTranslations('Home')]);
  return (
    <PageTransition>
      <Section tone="sand" aria-labelledby="not-found-title" className="pt-10 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-7 lg:pe-8">
            <Eyebrow className="enter" style={stagger(0)}>
              <Ltr>404</Ltr>
            </Eyebrow>
            <h1
              id="not-found-title"
              className="enter max-w-[14ch] text-h1 text-balance text-primary"
              style={stagger(1)}
            >
              {t('title')}
            </h1>
            <p
              className="enter max-w-[38rem] text-lead text-pretty text-muted-foreground"
              style={stagger(2)}
            >
              {t('lead')}
            </p>
            <div className="enter flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={stagger(3)}>
              <Button size="lg" asChild>
                <Link href="/">{t('backHome')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services" transitionTypes={['nav-forward']}>
                  {t('services')}
                  <ArrowRightIcon className="rtl:-scale-x-100" />
                </Link>
              </Button>
            </div>
          </div>
          <CrewPortrait
            alt={tHome('team.alt')}
            caption={tHome('team.caption')}
            sizes="(min-width: 1024px) 36vw, 100vw"
            priority
            className="enter mx-auto w-full max-w-[24rem] lg:col-span-5 lg:max-w-none"
          />
        </div>
      </Section>
    </PageTransition>
  );
}
