import { getTranslations } from 'next-intl/server';
import { BrandMark } from '@/components/marketing/brand-mark';
import { Link } from '@/lib/i18n/navigation';
import type { Localized } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';

type Props = {
  brandName: Localized;
  /** Show the "HVAC & Deep Cleaning · Dubai" line under the wordmark (footer, 404). */
  tagline?: boolean;
  /** Set `--brand-mark-surface` here when the logo sits on something other than the page background. */
  className?: string;
};

/**
 * Brigada lock-up: the mark plus the wordmark in the display face (DECISIONS №52). The wordmark
 * is a drawing, not copy: always Latin, always LTR and in Unbounded whatever the locale, and
 * hidden from assistive tech — the accessible name is the localized brand name from settings.
 * Stretched link over the whole lock-up; never an h1.
 */
export async function Logo({ brandName, tagline = false, className }: Props) {
  const t = await getTranslations('Header');

  return (
    // dir="ltr": the lock-up is one drawing — the mark stays left of the wordmark on /ar too.
    <div
      dir="ltr"
      className={cn(
        'group relative inline-flex min-h-tap w-fit shrink-0 items-center gap-2.5',
        className,
      )}
    >
      <Link
        href="/"
        aria-label={t('homeLabel', { brand: brandName.text })}
        className="rounded-lg text-brand outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
      >
        <BrandMark animated className="h-8 w-[2.4rem] shrink-0" />
      </Link>
      <span aria-hidden="true" className="flex flex-col leading-none">
        <span
          dir="ltr"
          className="-skew-x-6 font-wordmark text-logo font-extrabold tracking-tight text-brand uppercase"
        >
          Brigada
        </span>
        {tagline ? (
          <span className="mt-1.5 text-xs tracking-wide text-muted-foreground uppercase">
            {t('tagline')}
          </span>
        ) : null}
      </span>
    </div>
  );
}
