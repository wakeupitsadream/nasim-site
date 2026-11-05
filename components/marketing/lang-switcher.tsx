'use client';

import { CheckIcon, ChevronDownIcon, LanguagesIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { getDirection, routing } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

type Props = { className?: string };

/**
 * The current page in every locale. Reads the URL, so always render it inside <Suspense>
 * (Cache Components); the fallbacks (`LangLinks` / `LangMenuFor` with pathname="/") link each
 * locale's home page until the real pathname streams in.
 */
export function LangSwitcher(props: Props) {
  return <LangLinks pathname={usePathname()} {...props} />;
}

/** The header button: one control for all seven languages (DECISIONS №57). */
export function LangMenu(props: Props) {
  return <LangMenuFor pathname={usePathname()} {...props} />;
}

/** The plain list with native names (footer): every link is in the static HTML. */
export function LangLinks({ pathname, className }: Props & { pathname: string }) {
  const locale = useLocale();
  const t = useTranslations('LangSwitcher');

  return (
    <ul aria-label={t('label')} className={cn('flex flex-wrap items-center gap-1', className)}>
      {routing.locales.map((l) => (
        <li key={l}>
          <Link
            href={pathname}
            locale={l}
            hrefLang={l}
            lang={l}
            dir={getDirection(l)}
            aria-current={l === locale ? 'true' : undefined}
            className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-lg px-3 text-body font-medium text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring aria-[current=true]:text-foreground aria-[current=true]:underline aria-[current=true]:underline-offset-4"
          >
            {t(`names.${l}`)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Globe button with the current language code; the menu lists the native names. */
export function LangMenuFor({ pathname, className }: Props & { pathname: string }) {
  const locale = useLocale();
  const t = useTranslations('LangSwitcher');
  const dir = getDirection(locale);

  return (
    <DropdownMenu dir={dir}>
      {/* The visible code stays part of the accessible name (WCAG 2.5.3 label-in-name):
          "Language: EN — English". */}
      <DropdownMenuTrigger
        data-testid="lang-menu"
        className={cn(
          'inline-flex h-tap items-center gap-1.5 rounded-lg px-2.5 text-small font-medium text-foreground transition-colors duration-(--nasim-dur-fast) outline-none select-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring aria-expanded:bg-accent',
          className,
        )}
      >
        <LanguagesIcon aria-hidden="true" strokeWidth={1.75} className="size-5" />
        <span className="sr-only">{t('label')}: </span>
        <span lang={locale}>{t(`short.${locale}`)}</span>
        <span className="sr-only"> — {t(`names.${locale}`)}</span>
        <ChevronDownIcon
          aria-hidden="true"
          strokeWidth={1.75}
          className="size-4 text-muted-foreground"
        />
      </DropdownMenuTrigger>
      {/* Radix writes the root `dir` onto the portalled content element (rule 2). */}
      <DropdownMenuContent align="end" className="min-w-48">
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <Link
              href={pathname}
              locale={l}
              hrefLang={l}
              lang={l}
              dir={getDirection(l)}
              aria-current={l === locale ? 'true' : undefined}
              className="aria-[current=true]:font-semibold"
            >
              <span className="flex-1">{t(`names.${l}`)}</span>
              {l === locale ? (
                <CheckIcon aria-hidden="true" strokeWidth={2} className="size-4 text-brand" />
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
