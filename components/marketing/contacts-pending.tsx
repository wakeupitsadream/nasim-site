import { ArrowRightIcon, MessageSquareDashedIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/navigation';

/** Honest state while the owner has not provided a phone or WhatsApp number (DECISIONS №22). */
export async function ContactsPending() {
  const t = await getTranslations('Contact');
  return (
    <div
      data-testid="contacts-pending"
      className="reveal-fade flex flex-col gap-6 rounded-panel bg-mist p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-card text-highlight-ink"
        >
          <MessageSquareDashedIcon strokeWidth={1.5} className="size-6" />
        </span>
        <p className="max-w-[40rem] text-lead text-pretty text-foreground">{t('pending')}</p>
      </div>
      <Button size="lg" asChild className="shrink-0">
        <Link href="/pricing#book">
          {t('pendingCta')}
          <ArrowRightIcon className="rtl:-scale-x-100" />
        </Link>
      </Button>
    </div>
  );
}
