import type { Locale } from '@/lib/i18n/routing';
import type { Localized } from '@/lib/i18n/text';
import { sanitizeHtmlContent } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

const PROSE =
  '[&_p]:text-pretty [&_p+p]:mt-4 [&_strong]:font-semibold [&_strong]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:ps-5 [&_li+li]:mt-1.5 [&_h2]:mt-8 [&_h2]:text-h3 [&_h2]:text-primary [&_h3]:mt-6 [&_h3]:text-lead [&_h3]:font-medium [&_blockquote]:border-s-2 [&_blockquote]:border-highlight [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground';

type Props = { value: Localized; locale: Locale; className?: string };

/** Editor HTML from the seed or the admin: sanitised (rule 9), with the fallback language marked. */
export function RichText({ value, locale, className }: Props) {
  const fallback = value.lang !== locale;
  return (
    <div
      lang={fallback ? value.lang : undefined}
      dir={fallback ? 'auto' : undefined}
      className={cn(PROSE, className)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(value.text) }}
    />
  );
}
