import { describe, expect, it } from 'vitest';
import { checkSource } from '../../scripts/check-logical-css.mjs';

const rulesFor = (source: string) => (checkSource(source) as { rule: string }[]).map((p) => p.rule);

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

describe('check-logical-css file rules', () => {
  const clientSource = `'use client';\nimport { seedServices } from '@/lib/content/seed';\nimport seed from '@/content/seed/areas.json';\n`;
  const serverSource = `import { seedServices } from '@/lib/content/seed';\n`;

  it('forbids server content imports in client components only', () => {
    expect(rulesFor(clientSource)).toEqual([
      'client component imports server content',
      'client component imports server content',
    ]);
    expect(rulesFor(serverSource)).toEqual([]);
  });

  it('forbids reading the wall clock outside the allowlist', () => {
    const source = `const now = new Date();\nconst t = Date.now();\nconst d = new Date('2026-01-01');\n`;
    expect(rulesFor(source)).toEqual([
      'wall clock read during render',
      'wall clock read during render',
    ]);
    expect(checkSource(source, 'components/booking/wizard.tsx')).toEqual([]);
  });
});
