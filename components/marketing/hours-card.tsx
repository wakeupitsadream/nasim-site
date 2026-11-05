import { ClockIcon, MapPinIcon, SirenIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { LocalizedText } from '@/components/localized-text';
import { AreaChips } from '@/components/marketing/area-chips';
import type { SiteSettings } from '@/lib/content/site';
import type { Locale } from '@/lib/i18n/routing';
import type { Area } from '@/lib/validation/content';

type Props = { settings: SiteSettings; areas: Area[]; locale: Locale };

/** Working hours, urgent-visit hours (when enabled) and the service area with its area pills. */
export async function HoursCard({ settings, areas, locale }: Props) {
  const [t, tHome] = await Promise.all([getTranslations('Contact'), getTranslations('Home')]);

  const row = (icon: ReactNode, title: string, body: ReactNode) => (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-small text-muted-foreground">{title}</h3>
        <div className="text-lead text-foreground">{body}</div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-8 rounded-panel border border-border bg-card p-6 shadow-card lg:grid-cols-3 lg:gap-10 lg:p-10">
      {row(
        <ClockIcon strokeWidth={1.5} className="size-6" />,
        t('hours'),
        <LocalizedText value={settings.hours} locale={locale} />,
      )}
      {settings.flags.emergencyEnabled
        ? row(
            <SirenIcon strokeWidth={1.5} className="size-6" />,
            t('emergency'),
            <LocalizedText value={settings.emergencyHours} locale={locale} />,
          )
        : null}
      {row(
        <MapPinIcon strokeWidth={1.5} className="size-6" />,
        t('area'),
        <LocalizedText value={settings.serviceAreaNote} locale={locale} />,
      )}
      <div className="lg:col-span-3">
        <AreaChips
          areas={areas}
          locale={locale}
          all={{ label: tHome('areas.all') }}
          label={tHome('areas.title')}
        />
      </div>
    </div>
  );
}
