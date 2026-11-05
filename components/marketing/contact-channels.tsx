import { MailIcon, PhoneIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { TelegramIcon, WhatsAppIcon } from '@/components/icons/brand';
import { Ltr } from '@/components/ltr';
import { CtaLink } from '@/components/marketing/cta-link';
import type { SiteSettings } from '@/lib/content/site';
import {
  callTarget,
  showTelegramCta,
  telegramTarget,
  whatsappTarget,
  type CtaTarget,
} from '@/lib/cta';
import type { Locale } from '@/lib/i18n/routing';
import { formatPhoneForDisplay } from '@/lib/validation/phone';

type Channel = {
  key: 'whatsapp' | 'phone' | 'email' | 'telegram';
  icon: ReactNode;
  value: string;
  target: CtaTarget;
  variant: 'whatsapp' | 'telegram' | 'primary' | 'outline';
  action: 'message' | 'call' | 'email';
};

/** One card per filled-in channel. Renders nothing while every contact is empty. */
export async function ContactChannels({
  settings,
  locale,
}: {
  settings: SiteSettings;
  locale: Locale;
}) {
  const [t, tCommon] = await Promise.all([getTranslations('Contact'), getTranslations('Common')]);
  const c = settings.contacts;
  const wa = whatsappTarget(c);
  const call = callTarget(c);
  const tg = telegramTarget(c);

  const channels: Channel[] = [];
  if (wa.kind === 'external') {
    channels.push({
      key: 'whatsapp',
      icon: <WhatsAppIcon className="size-6" />,
      value: formatPhoneForDisplay(c.whatsapp),
      target: wa,
      variant: 'whatsapp',
      action: 'message',
    });
  }
  if (call.kind === 'external') {
    channels.push({
      key: 'phone',
      icon: <PhoneIcon aria-hidden="true" strokeWidth={1.5} className="size-6" />,
      value: formatPhoneForDisplay(c.phone),
      target: call,
      variant: 'primary',
      action: 'call',
    });
  }
  if (showTelegramCta(locale, settings) && tg.kind === 'external') {
    channels.push({
      key: 'telegram',
      icon: <TelegramIcon className="size-6" />,
      value: `@${c.telegram.replace(/^@|^https?:\/\/t\.me\//, '')}`,
      target: tg,
      variant: 'telegram',
      action: 'message',
    });
  }
  if (c.email) {
    channels.push({
      key: 'email',
      icon: <MailIcon aria-hidden="true" strokeWidth={1.5} className="size-6" />,
      value: c.email,
      target: { kind: 'external', href: `mailto:${c.email}`, newTab: false },
      variant: 'outline',
      action: 'email',
    });
  }
  if (channels.length === 0) return null;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {channels.map((channel) => (
        <li
          key={channel.key}
          className="flex flex-col gap-4 rounded-card border border-border bg-card p-6 shadow-card"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-12 items-center justify-center rounded-xl bg-mist text-highlight-ink"
          >
            {channel.icon}
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-small text-muted-foreground">{t(`channels.${channel.key}`)}</h3>
            <p className="text-lead font-medium text-foreground">
              <Ltr>{channel.value}</Ltr>
            </p>
          </div>
          <CtaLink
            target={channel.target}
            newTabHint={tCommon('opensInNewTab')}
            variant={channel.variant}
            className="mt-auto self-start"
          >
            {t(`actions.${channel.action}`)}
          </CtaLink>
        </li>
      ))}
    </ul>
  );
}
