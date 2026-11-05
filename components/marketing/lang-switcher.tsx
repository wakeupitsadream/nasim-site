'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { getDirection, routing } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

type Props = { className?: string; compact?: boolean };

/**
 * The current page in every locale. Reads the URL, so always render it inside <Suspense>
 * (Cache Components); the fallback is <LangLinks pathname="/" /> (each locale's home page).
 */
export function LangSwitcher(props: Props) {
  return <LangLinks pathname={usePathname()} {...props} />;
}

/** `compact` shows EN · ع · RU with the full language name for screen readers (header). */
export function LangLinks({ pathname, className, compact = false }: Props & { pathname: string }) {
  const locale = useLocale();
  const t = useTranslations('LangSwitcher');

  return (
    <ul aria-label={t('label')} className={cn('flex flex-wrap items-center gap-1', className)}>
      {routing.locales.map((l) => (
        <li key={l}>
          <Link
            href={pathname}
            locale={l}
            lang={l}
            dir={getDirection(l)}
            aria-current={l === locale ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-tap min-w-tap items-center justify-center rounded-lg px-3 font-medium text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring aria-[current=true]:text-foreground aria-[current=true]:underline aria-[current=true]:underline-offset-4',
              compact ? 'px-2 text-small' : 'text-body',
            )}
          >
            {compact ? (
              <>
                <span aria-hidden="true">{t(`short.${l}`)}</span>
                <span className="sr-only">{t(`names.${l}`)}</span>
              </>
            ) : (
              t(`names.${l}`)
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
