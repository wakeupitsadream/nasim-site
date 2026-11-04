import type { ComponentPropsWithoutRef } from 'react';
import type { Locale } from '@/lib/i18n/routing';
import type { Localized } from '@/lib/i18n/text';

type Props = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  value: Localized;
  locale: Locale;
};

/** Content text that marks itself as EN when the page locale fell back to it (BRIEF §15, a11y). */
export function LocalizedText({ value, locale, ...props }: Props) {
  const fallback = value.lang !== locale;
  return (
    <span {...props} lang={fallback ? value.lang : undefined} dir={fallback ? 'auto' : undefined}>
      {value.text}
    </span>
  );
}
