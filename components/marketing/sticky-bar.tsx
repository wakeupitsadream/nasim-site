import { PhoneIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { TelegramIcon, WhatsAppIcon } from '@/components/icons/brand';
import { CtaLink } from '@/components/marketing/cta-link';
import { getSiteSettings } from '@/lib/content/site';
import {
  callTarget,
  showTelegramCta,
  telegramTarget,
  whatsappTarget,
  type CtaTarget,
} from '@/lib/cta';

type Item = {
  key: string;
  target: CtaTarget;
  variant: 'whatsapp' | 'telegram' | 'primary';
  icon: React.ReactNode;
  label: string;
};

/**
 * Mobile-only bottom bar: WhatsApp (message) + Call (plain tel:), plus Telegram on /ru when the
 * owner enables it. WhatsApp is never «call» — WhatsApp calls are blocked in the UAE (rule 16).
 */
export async function StickyBar({ preview }: { preview?: { telegram: boolean } } = {}) {
  const locale = await getLocale();
  const [t, tBar, tCommon, settings] = await Promise.all([
    getTranslations('Cta'),
    getTranslations('StickyBar'),
    getTranslations('Common'),
    getSiteSettings(locale),
  ]);
  const c = settings.contacts;
  const items: Item[] = [
    {
      key: 'whatsapp',
      target: whatsappTarget(c),
      variant: 'whatsapp',
      icon: <WhatsAppIcon />,
      label: t('whatsappShort'),
    },
    ...((preview ? preview.telegram : showTelegramCta(locale, settings))
      ? [
          {
            key: 'telegram',
            target: telegramTarget(c),
            variant: 'telegram' as const,
            icon: <TelegramIcon />,
            label: t('telegramShort'),
          },
        ]
      : []),
    {
      key: 'call',
      target: callTarget(c),
      variant: 'primary',
      icon: <PhoneIcon />,
      label: t('call'),
    },
  ];

  const list = (
    <ul className="mx-auto flex max-w-page gap-2">
      {items.map((item) => (
        <li key={item.key} className="min-w-0 flex-1">
          <CtaLink
            target={item.target}
            newTabHint={tCommon('opensInNewTab')}
            variant={item.variant}
            className="h-12 w-full flex-col gap-0.5 px-2 text-small"
          >
            {item.icon}
            <span className="max-w-full truncate">{item.label}</span>
          </CtaLink>
        </li>
      ))}
    </ul>
  );

  // UI kit preview: same buttons in place, not fixed, not a second landmark with the same name.
  if (preview) {
    return (
      <div
        data-testid="sticky-bar-preview"
        className="w-full max-w-sm rounded-xl border bg-background p-2"
      >
        {list}
      </div>
    );
  }

  return (
    // Slides up after the page has settled; anchored during page transitions (styles/motion.css).
    <nav
      aria-label={tBar('label')}
      style={{ viewTransitionName: 'site-sticky-bar' }}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-gutter pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-float backdrop-blur motion-safe:animate-in motion-safe:duration-(--nasim-dur-slow) motion-safe:fill-mode-both motion-safe:[animation-delay:400ms] motion-safe:fade-in motion-safe:slide-in-from-bottom-6 md:hidden"
    >
      {list}
    </nav>
  );
}
