import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs script without type declarations
import { checkSource } from '../../scripts/check-logical-css.mjs';

const rulesFor = (source: string) =>
  (checkSource(source) as { rule: string }[]).map((p) => p.rule);

describe('check-logical-css', () => {
  it.each([
    'ml-2',
    'hover:pr-3',
    'end-3',
    'data-[side=left]:left-0',
    'rounded-tl-lg',
    'dark:bg-input/30',
    'md:dark:hover:bg-muted',
    'float-right',
    'bg-linear-to-r',
    'text-left',
    'border-r',
  ])('flags %s', (cls) => {
    expect(rulesFor(`<div className="${cls}" />`)).not.toHaveLength(0);
  });

  it.each([
    'ms-2',
    'inset-e-3',
    'rtl:rotate-180',
    'rtl:-scale-x-100',
    'justify-end',
    'items-start',
    'col-start-2',
    'slide-in-from-end-10',
    'data-[side=inline-end]:inset-e-0',
    'border-s',
    'text-start',
    'float-start',
  ])('allows %s', (cls) => {
    expect(rulesFor(`<div className="${cls}" />`)).toHaveLength(0);
  });

  it('flags cn imported straight from the package', () => {
    expect(rulesFor(`import { cn } from "cn"`)).toContain('cn imported from "cn"');
    expect(rulesFor(`import { cn } from '@/lib/utils'`)).toHaveLength(0);
  });
});
