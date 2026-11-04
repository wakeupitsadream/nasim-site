/**
 * Class-name rules the TypeScript/ESLint toolchain cannot see. Runs as part of `pnpm lint`.
 * - CLAUDE.md rule 2: only logical CSS utilities, so layouts mirror correctly in Arabic (RTL).
 * - CLAUDE.md rule 13: no dark: variants (there is no dark theme in v1).
 * - Components import `cn` from @/lib/utils (token-aware config), never straight from "cn".
 * Scans app/ and components/. `checkSource` is exported for unit tests.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOTS = ['app', 'components'];
const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js', '.mdx']);

// Variant prefixes (md:, hover:, data-[…]: …) and the negative sign are allowed before the utility.
const PREFIX = String.raw`(?<=^|[\s"'\`{:(])-?`;

export const RULES = [
  ['ml-/mr-', String.raw`m[lr]-`, 'ms-/me-'],
  ['pl-/pr-', String.raw`p[lr]-`, 'ps-/pe-'],
  ['left-/right-', String.raw`(?:left|right)-`, 'inset-s-/inset-e-'],
  ['start-/end- (deprecated)', String.raw`(?:start|end)-`, 'inset-s-/inset-e-'],
  ['text-left/right', String.raw`text-(?:left|right)\b`, 'text-start/text-end'],
  ['rounded-l/r/tl/tr/bl/br', String.raw`rounded-(?:[lr]|tl|tr|bl|br)\b`, 'rounded-s/e/ss/se/es/ee'],
  ['border-l/r', String.raw`border-[lr]\b(?:-|(?=[\s"'\`]))`, 'border-s/border-e'],
  ['scroll-ml/mr/pl/pr', String.raw`scroll-[mp][lr]-`, 'scroll-ms/me/ps/pe'],
  ['float-left/right', String.raw`float-(?:left|right)\b`, 'float-start/float-end'],
  ['clear-left/right', String.raw`clear-(?:left|right)\b`, 'clear-start/clear-end'],
  ['bg-linear-to-l/r', String.raw`bg-(?:linear-)?(?:gradient-)?to-[lr]\b`, 'an rtl: counterpart or a logical layout'],
  ['dark: variant (no dark theme, rule 13)', String.raw`dark:`, 'delete the class'],
].map(([name, pattern, fix]) => ({ name, fix, re: new RegExp(PREFIX + pattern, 'g') }));

const CN_IMPORT = /from\s+['"]cn['"]/;

/** Problems in one file's text: `{ line, rule, fix, text }` per match. */
export function checkSource(source) {
  const problems = [];
  source.split('\n').forEach((text, i) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      if (rule.re.test(text)) problems.push({ line: i + 1, rule: rule.name, fix: rule.fix, text });
    }
    if (CN_IMPORT.test(text)) {
      problems.push({
        line: i + 1,
        rule: 'cn imported from "cn"',
        fix: "import { cn } from '@/lib/utils'",
        text,
      });
    }
  });
  return problems;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(path.extname(entry))) yield full;
  }
}

function main() {
  const report = [];
  for (const root of ROOTS) {
    let files;
    try {
      files = [...walk(root)];
    } catch {
      continue;
    }
    for (const file of files) {
      for (const p of checkSource(readFileSync(file, 'utf8'))) {
        report.push(`${file}:${p.line}  ${p.rule} → use ${p.fix}\n    ${p.text.trim()}`);
      }
    }
  }
  if (report.length > 0) {
    console.error(`[lint:css] ${report.length} forbidden class(es) found:\n${report.join('\n')}`);
    process.exit(1);
  }
  console.log('[lint:css] ok — logical CSS only, no dark: variants, cn from @/lib/utils');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
