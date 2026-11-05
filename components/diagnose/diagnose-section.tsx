import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { DiagnoseForm } from '@/components/diagnose/diagnose-form';
import { Ltr } from '@/components/ltr';
import { Section, type SectionTone } from '@/components/marketing/section';
import { SectionHeader } from '@/components/marketing/section-header';
import { formatNumber } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';

type Props = {
  tone: SectionTone;
  /** The booking wizard for people who already know what they need. */
  calculatorHref: string;
  id?: string;
};

const EXAMPLES = ['smell', 'drip', 'weak', 'stain'] as const;
const STEPS = ['describe', 'cause', 'book'] as const;

/**
 * Server half of the AI triage block: the pitch, the three-step explainer and the client form in
 * its own scoped message provider (DECISIONS: client bundle). Reads no cookies or clock.
 */
export async function DiagnoseSection({ tone, calculatorHref, id = 'diagnose' }: Props) {
  const locale = await getLocale();
  const [t, messages] = await Promise.all([getTranslations('Diagnose'), getMessages()]);
  const titleId = `${id}-title`;

  return (
    <Section id={id} tone={tone} aria-labelledby={titleId}>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <SectionHeader
            id={titleId}
            eyebrow={t('eyebrow')}
            title={t('title')}
            lead={t('lead')}
            className="mb-0"
          />
          <ol className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-baseline gap-4">
                <Ltr
                  aria-hidden="true"
                  className="w-8 shrink-0 text-h3 font-light text-highlight-ink tabular-nums"
                >
                  {formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}
                </Ltr>
                <span className="text-body text-foreground">{t(`steps.${step}`)}</span>
              </li>
            ))}
          </ol>
          <p className="text-small text-muted-foreground">
            {t('calculator')}{' '}
            {calculatorHref.startsWith('#') ? (
              <a
                href={calculatorHref}
                className="rounded-sm font-medium text-highlight-ink underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
              >
                {t('calculatorCta')}
              </a>
            ) : (
              <Link
                href={calculatorHref}
                className="rounded-sm font-medium text-highlight-ink underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
              >
                {t('calculatorCta')}
              </Link>
            )}
          </p>
        </div>
        <div className="lg:col-span-7">
          <NextIntlClientProvider
            messages={{
              Diagnose: messages.Diagnose,
              Price: messages.Price,
              Common: messages.Common,
            }}
          >
            <DiagnoseForm
              locale={locale}
              calculatorHref={calculatorHref}
              examples={EXAMPLES.map((key) => t(`form.examples.${key}`))}
            />
          </NextIntlClientProvider>
        </div>
      </div>
    </Section>
  );
}
