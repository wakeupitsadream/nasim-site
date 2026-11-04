import { getTranslations } from 'next-intl/server';
import { BreezeMark } from '@/components/marketing/breeze-mark';
import { Link } from '@/lib/i18n/navigation';
import type { Localized } from '@/lib/i18n/text';
import { cn } from '@/lib/utils';

/**
 * Latin names: the first «i» of the first word becomes a dotless «ı» with a small breeze stroke
 * as its dot (BRIEF §3). Arabic names are shown as they are. The wordmark is decorative —
 * the link carries the name in aria-label. Never an h1.
 */
function FirstWord({ word, latin }: { word: string; latin: boolean }) {
  const i = latin ? word.indexOf('i') : -1;
  if (i < 0) return <>{word}</>;
  return (
    <span dir="ltr">
      {word.slice(0, i)}
      <span className="relative inline-block">
        ı
        <svg
          viewBox="0 0 10 4"
          fill="none"
          className="absolute inset-x-0 -top-[0.08em] mx-auto w-[0.55em] text-highlight"
        >
          <path
            d="M1 2.6c1.3-1.3 2.7-1.3 4 0s2.7 1.3 4 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {word.slice(i + 1)}
    </span>
  );
}

export async function Logo({ brandName, className }: { brandName: Localized; className?: string }) {
  const t = await getTranslations('Header');
  const [first = '', ...rest] = brandName.text.split(' ');
  const latin = /^[A-Za-z]/.test(first);

  return (
    <Link
      href="/"
      aria-label={t('homeLabel', { brand: brandName.text })}
      className={cn(
        'inline-flex min-h-tap shrink-0 items-center gap-2 rounded-lg text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <BreezeMark className="size-8 shrink-0" />
      <span aria-hidden="true" lang={brandName.lang} className="flex items-baseline gap-1.5">
        <span className="text-logo leading-none font-semibold">
          <FirstWord word={first} latin={latin} />
        </span>
        {rest.length > 0 ? (
          <span className="text-small leading-none whitespace-nowrap text-muted-foreground">
            {rest.join(' ')}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
