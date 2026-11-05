import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { routing } from '@/lib/i18n/routing';

type Tree = { [key: string]: string | Tree };

const load = (locale: string): Tree =>
  JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Tree;

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

/** ICU arguments ({brand}) and rich-text tags (<price>) — must match across locales. */
const tokens = (value: string): string[] =>
  [...value.matchAll(/\{(\w+)\}|<\/?(\w+)>/g)].map((m) => m[1] ?? `<${m[2]}>`).sort();

const messages = Object.fromEntries(routing.locales.map((l) => [l, flatten(load(l))]));
const en = messages.en!;

describe('messages', () => {
  it.each(routing.locales.filter((l) => l !== 'en'))('%s has exactly the EN keys', (locale) => {
    expect([...messages[locale]!.keys()].sort()).toEqual([...en.keys()].sort());
  });

  it.each(['en', 'ru'])('%s has no empty values', (locale) => {
    const empty = [...messages[locale]!].filter(([, v]) => v.trim() === '').map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it.each(routing.locales.filter((l) => l !== 'en'))(
    '%s uses the same placeholders and tags as EN',
    (locale) => {
      const mismatched = [...en]
        .filter(([key, value]) => {
          const other = messages[locale]!.get(key);
          return other !== undefined && tokens(other).join() !== tokens(value).join();
        })
        .map(([key]) => key);
      expect(mismatched).toEqual([]);
    },
  );

  it.each(routing.locales)(
    '%s never formats numbers through ICU (Latin digits, rule 3)',
    (locale) => {
      const offenders = [...messages[locale]!]
        .filter(([, v]) => v.includes('#') || /,\s*number/.test(v))
        .map(([k]) => k);
      expect(offenders).toEqual([]);
    },
  );
});
