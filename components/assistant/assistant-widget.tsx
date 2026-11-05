import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { AssistantPanel, type DemoVerdict } from '@/components/assistant/assistant-panel';
import type { FaqEntry } from '@/lib/assistant/match';
import { getFaqs, getPricingConfig, getServices } from '@/lib/content/queries';
import { pick, pickLocalized } from '@/lib/i18n/text';
import { priceFrom } from '@/lib/pricing';
import { sanitizeHtmlContent } from '@/lib/sanitize';
import type { DiagnoseResponse } from '@/lib/validation/diagnose';

const EXAMPLES = ['smell', 'drip', 'weak', 'stain'] as const;
type ExampleKey = (typeof EXAMPLES)[number];

/**
 * Canned verdicts for the four example chips, shown (clearly labelled) while the assistant has no
 * API key (DECISIONS №50). Texts live in messages `Diagnose.demo.*`; service, name and price are real.
 */
const DEMO: Record<
  ExampleKey,
  {
    service: string;
    urgency: DiagnoseResponse['urgency'];
    confidence: DiagnoseResponse['confidence'];
  }
> = {
  smell: { service: 'ac-cleaning', urgency: 'soon', confidence: 'high' },
  drip: { service: 'ac-cleaning', urgency: 'soon', confidence: 'medium' },
  weak: { service: 'ac-deep-cleaning', urgency: 'soon', confidence: 'medium' },
  stain: { service: 'stain-odour-removal', urgency: 'routine', confidence: 'high' },
};

/**
 * Server half of the floating assistant, mounted once in the locale layout: picks the FAQs for the
 * locale (answers sanitised here, rule 9 — the client never imports lib/sanitize), builds the demo
 * verdicts with real prices, and hands everything to the client window inside its own scoped
 * message provider. Reads no cookies or clock, so pages stay prerendered.
 */
export async function AssistantWidget() {
  const locale = await getLocale();
  const [t, messages, globalFaqs, contractFaqs, services, pricing] = await Promise.all([
    getTranslations('Diagnose'),
    getMessages(),
    getFaqs('global'),
    getFaqs('contracts'),
    getServices({ status: ['active', 'coming_soon'] }),
    getPricingConfig(),
  ]);

  const faqs: FaqEntry[] = [...globalFaqs, ...contractFaqs].map((faq, i) => {
    const question = pickLocalized(faq.question, locale);
    const answer = pickLocalized(faq.answer_html, locale);
    return {
      id: `${faq.scope}-${i}`,
      question: question.text,
      answerHtml: sanitizeHtmlContent(answer.text),
      lang: answer.lang,
    };
  });

  const demos: DemoVerdict[] = EXAMPLES.map((key) => {
    const spec = DEMO[key];
    const service = services.find((s) => s.slug === spec.service);
    return {
      text: t(`form.examples.${key}`),
      result: {
        summary: t(`demo.${key}.summary`),
        causes: [
          {
            title: t(`demo.${key}.cause1`),
            detail: t(`demo.${key}.cause1Text`),
            likelihood: 'likely',
          },
          {
            title: t(`demo.${key}.cause2`),
            detail: t(`demo.${key}.cause2Text`),
            likelihood: 'possible',
          },
        ],
        service: service
          ? {
              slug: service.slug,
              name: pick(service.name, locale),
              href: `/services/${service.slug}`,
              priceFrom: priceFrom(pricing, service.slug),
              estimate: service.pricing_unit === 'from',
              comingSoon: service.status === 'coming_soon',
            }
          : null,
        urgency: spec.urgency,
        safety: null,
        questions: [t(`demo.${key}.question`)],
        outOfScope: false,
        confidence: spec.confidence,
      },
    };
  });

  return (
    <NextIntlClientProvider
      messages={{
        Assistant: messages.Assistant,
        Diagnose: messages.Diagnose,
        Price: messages.Price,
        Common: messages.Common,
      }}
    >
      <AssistantPanel
        locale={locale}
        calculatorHref="/pricing#book"
        faqs={faqs}
        examples={EXAMPLES.map((key) => t(`form.examples.${key}`))}
        demos={demos}
      />
    </NextIntlClientProvider>
  );
}
