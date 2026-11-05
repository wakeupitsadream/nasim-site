/** wa.me link for an E.164 number, or null when the number is missing. */
export function waMeUrl(phoneE164: string, text?: string): string | null {
  const digits = phoneE164.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export type TemplateVars = Record<string, string | number | null | undefined>;

const isEmpty = (v: unknown) => v === undefined || v === null || String(v).trim() === '';

/**
 * Fills a `wa.template.*` block: `{x}` is replaced by vars.x; a parenthesised group whose
 * placeholders are all empty is dropped together with its brackets (seed convention).
 */
export function fillTemplate(template: string, vars: TemplateVars): string {
  const withGroups = template.replace(/\(([^()]*)\)/g, (_, group: string) => {
    const keys = [...group.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
    if (keys.length === 0) return `(${group})`;
    return keys.every((k) => isEmpty(vars[k])) ? '' : group;
  });
  return withGroups
    .replace(/\{(\w+)\}/g, (_, key: string) => (isEmpty(vars[key]) ? '' : String(vars[key])))
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export type QuoteMessageInput = {
  template: string;
  brand: string;
  lines: string[];
  total: string;
  area?: string | null;
  time?: string | null;
  page?: string;
};

/** The WhatsApp text for a calculator quote (`wa.template.quote`). */
export function buildQuoteMessage(input: QuoteMessageInput): string {
  return fillTemplate(input.template, {
    brand: input.brand,
    quote_lines: input.lines.join(', '),
    total: input.total,
    area: input.area,
    time: input.time,
    page: input.page ?? 'calculator',
  });
}
