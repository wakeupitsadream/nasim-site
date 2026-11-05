import { getTranslations } from 'next-intl/server';
import { Ltr } from '@/components/ltr';
import { AirflowLines } from '@/components/marketing/airflow-lines';
import { Section } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { getBlock } from '@/lib/content/queries';
import { formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalizedValue } from '@/lib/i18n/text';

/** The dark band: four steps that mirror the owner's flow (block `home.how.steps`). */
export async function HowItWorks({ locale }: { locale: Locale }) {
  const [t, block] = await Promise.all([getTranslations('Home'), getBlock('home.how.steps')]);
  const steps = pickLocalizedValue(block, locale);
  const fallback = steps.lang !== locale;

  return (
    <Section
      tone="deep"
      aria-labelledby="how-title"
      decoration={
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-80">
          <AirflowLines tone="deep" drift />
        </div>
      }
    >
      <SectionHeader id="how-title" eyebrow={t('how.eyebrow')} title={t('how.title')} />
      <ol
        lang={fallback ? steps.lang : undefined}
        dir={fallback ? 'auto' : undefined}
        className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8"
      >
        {steps.value.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-3 border-t border-line-on-deep pt-5">
            <span
              className="text-h2 leading-none font-light text-on-deep-accent tabular-nums"
              aria-hidden="true"
            >
              <Ltr>{formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}</Ltr>
            </span>
            <h3 className="text-lead font-medium text-on-deep">{step.title}</h3>
            <p className="text-body text-pretty text-on-deep-muted">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
