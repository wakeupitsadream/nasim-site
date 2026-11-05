import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { LangLinks, LangSwitcher } from '@/components/marketing/lang-switcher';
import { Logo } from '@/components/marketing/logo';
import { getSiteSettings, hasAny } from '@/lib/content/site';
import { callTarget, telegramTarget, whatsappTarget } from '@/lib/cta';
import { Link } from '@/lib/i18n/navigation';
import { LEGAL_NAV, MAIN_NAV } from '@/lib/nav';
import { stagger } from '@/lib/motion';
import { formatPhoneForDisplay } from '@/lib/validation/phone';

const linkClass =
  'inline-flex min-h-tap items-center rounded-md underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring';
const headingClass = 'text-eyebrow text-foreground';

// Server component; no cookies/headers. Empty settings are hidden, never filled with placeholders.
// No copyright year: reading the clock during prerender is a sync-IO error under Cache Components.
export async function Footer() {
  const locale = await getLocale();
  const [t, tNav, s] = await Promise.all([
    getTranslations('Footer'),
    getTranslations('Nav'),
    getSiteSettings(locale),
  ]);
  const { contacts, social, legal } = s;
  const wa = whatsappTarget(contacts);
  const tg = telegramTarget(contacts);
  const call = callTarget(contacts);

  const socialLinks = (['instagram', 'facebook', 'tiktok'] as const).filter((k) => social[k]);
  const legalRows = (
    [
      ['legalName', legal.legalName],
      ['licenseNo', legal.licenseNo],
      ['trn', legal.trn],
      ['address', legal.address],
    ] as const
  ).filter(([, value]) => value.trim() !== '');

  return (
    <footer className="border-t bg-surface-2 text-muted-foreground">
      <div className="mx-auto grid max-w-page gap-10 px-gutter py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-gutter-lg">
        <div className="reveal-fade flex flex-col gap-3" style={stagger(0)}>
          <Logo brandName={s.brandName} />
          <p>{t('tagline')}</p>
          <p>
            <span className="font-medium text-foreground">{t('serviceAreaTitle')}: </span>
            <LocalizedText value={s.serviceAreaNote} locale={locale} />
          </p>
        </div>

        <section
          aria-labelledby="footer-hours"
          className="reveal-fade flex flex-col gap-3"
          style={stagger(1)}
        >
          <h2 id="footer-hours" className={headingClass}>
            {t('hoursTitle')}
          </h2>
          <p>
            <LocalizedText value={s.hours} locale={locale} />
          </p>
          {s.flags.emergencyEnabled ? (
            <p>
              <span className="font-medium text-foreground">{t('emergencyTitle')}: </span>
              <LocalizedText value={s.emergencyHours} locale={locale} />
            </p>
          ) : null}
          <p>
            <Link href="/contact" className={`${linkClass} font-medium text-primary underline`}>
              {t('contactPage')}
            </Link>
          </p>
        </section>

        {hasAny(contacts) ? (
          <section aria-labelledby="footer-contacts" className="flex flex-col gap-1">
            <h2 id="footer-contacts" className={`${headingClass} mb-2`}>
              {t('contactsTitle')}
            </h2>
            <ul>
              {call.kind === 'external' ? (
                <li>
                  {t('phone')}:{' '}
                  <a href={call.href} className={linkClass}>
                    <Ltr>{formatPhoneForDisplay(contacts.phone)}</Ltr>
                  </a>
                </li>
              ) : null}
              {wa.kind === 'external' ? (
                <li>
                  {t('whatsapp')}:{' '}
                  <a href={wa.href} target="_blank" rel="noopener" className={linkClass}>
                    <Ltr>{formatPhoneForDisplay(contacts.whatsapp)}</Ltr>
                  </a>
                </li>
              ) : null}
              {tg.kind === 'external' ? (
                <li>
                  {t('telegram')}:{' '}
                  <a href={tg.href} target="_blank" rel="noopener" className={linkClass}>
                    <Ltr>@{contacts.telegram.replace(/^@|^https?:\/\/t\.me\//, '')}</Ltr>
                  </a>
                </li>
              ) : null}
              {contacts.email ? (
                <li>
                  {t('email')}:{' '}
                  <a href={`mailto:${contacts.email}`} className={linkClass}>
                    <Ltr>{contacts.email}</Ltr>
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        <nav
          aria-label={t('navLabel')}
          className="reveal-fade flex flex-col gap-1"
          style={stagger(2)}
        >
          <h2 className={`${headingClass} mb-2`}>{t('linksTitle')}</h2>
          <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
            {[...MAIN_NAV, ...LEGAL_NAV].map(({ key, href }) => (
              <li key={href}>
                <Link href={href} className={linkClass}>
                  {tNav(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section
          aria-labelledby="footer-language"
          className="reveal-fade flex flex-col gap-1"
          style={stagger(3)}
        >
          <h2 id="footer-language" className={`${headingClass} mb-2`}>
            {t('languageTitle')}
          </h2>
          <Suspense fallback={<LangLinks pathname="/" className="-ms-3" />}>
            <LangSwitcher className="-ms-3" />
          </Suspense>
        </section>

        {socialLinks.length > 0 ? (
          <section aria-labelledby="footer-social" className="flex flex-col gap-1">
            <h2 id="footer-social" className={`${headingClass} mb-2`}>
              {t('socialTitle')}
            </h2>
            <ul>
              {socialLinks.map((k) => (
                <li key={k}>
                  <a href={social[k]} target="_blank" rel="noopener" className={linkClass}>
                    {t(k)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-page flex-col gap-4 px-gutter py-6 text-small sm:flex-row sm:items-start sm:justify-between lg:px-gutter-lg">
          {legalRows.length > 0 ? (
            <section aria-labelledby="footer-legal">
              <h2 id="footer-legal" className="sr-only">
                {t('legalTitle')}
              </h2>
              <dl className="flex flex-wrap gap-x-6 gap-y-1">
                {legalRows.map(([key, value]) => (
                  <div key={key} className="flex gap-1">
                    <dt>{t(key)}:</dt>
                    <dd>{key === 'address' ? value : <Ltr>{value}</Ltr>}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          <p className="sm:ms-auto">{t('copyright', { brand: s.brandName.text })}</p>
        </div>
      </div>
    </footer>
  );
}
