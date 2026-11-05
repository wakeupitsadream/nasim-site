/**
 * Class-name rules the TypeScript/ESLint toolchain cannot see. Runs as part of `pnpm lint`.
 * - CLAUDE.md rule 2: only logical CSS utilities, so layouts mirror correctly in Arabic (RTL).
 * - CLAUDE.md rule 13: no dark: variants (there is no dark theme in v1).
 * - Components import `cn` from @/lib/utils (token-aware config), never straight from "cn".
 * - Client components never import the seed or the content layer (server data stays on the server).
 * - No zero-argument `new Date()` / `Date.now()` in app/ and components/: pages are prerendered,
 *   and the current time is sync IO under Cache Components. Clocks are read in event handlers only
 *   (allowlist below) and passed down as values.
 * Scans app/ and components/. `checkSource(source, file?)` is exported for unit tests.
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
  [
    'rounded-l/r/tl/tr/bl/br',
    String.raw`rounded-(?:[lr]|tl|tr|bl|br)\b`,
    'rounded-s/e/ss/se/es/ee',
  ],
  ['border-l/r', String.raw`border-[lr]\b(?:-|(?=[\s"'\`]))`, 'border-s/border-e'],
  ['scroll-ml/mr/pl/pr', String.raw`scroll-[mp][lr]-`, 'scroll-ms/me/ps/pe'],
  ['float-left/right', String.raw`float-(?:left|right)\b`, 'float-start/float-end'],
  ['clear-left/right', String.raw`clear-(?:left|right)\b`, 'clear-start/clear-end'],
  [
    'bg-linear-to-l/r',
    String.raw`bg-(?:linear-)?(?:gradient-)?to-[lr]\b`,
    'an rtl: counterpart or a logical layout',
  ],
  ['dark: variant (no dark theme, rule 13)', String.raw`dark:`, 'delete the class'],
].map(([name, pattern, fix]) => ({ name, fix, re: new RegExp(PREFIX + pattern, 'g') }));

const CN_IMPORT = /from\s+['"]cn['"]/;
const SERVER_DATA_IMPORT =
  /from\s+['"]@\/(?:content\/seed|lib\/content|lib\/ai|lib\/sanitize|lib\/ratelimit)(?:\/|['"])/;
const USE_CLIENT = /^\s*['"]use client['"]/m;
const WALL_CLOCK = /\bnew Date\(\s*\)|\bDate\.now\(\)/;
/** Files allowed to read the wall clock (inside event handlers only). */
export const CLOCK_ALLOWLIST = new Set(['components/booking/wizard.tsx']);

/** Problems in one file's text: `{ line, rule, fix, text }` per match. `file` enables file rules. */
export function checkSource(source, file = '') {
  const problems = [];
  const isClient = USE_CLIENT.test(source);
  const clockAllowed = CLOCK_ALLOWLIST.has(file.split(path.sep).join('/'));
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
    if (isClient && SERVER_DATA_IMPORT.test(text)) {
      problems.push({
        line: i + 1,
        rule: 'client component imports server content',
        fix: 'load the data in a server component and pass it as props',
        text,
      });
    }
    if (!clockAllowed && WALL_CLOCK.test(text)) {
      problems.push({
        line: i + 1,
        rule: 'wall clock read during render',
        fix: 'read the time in an event handler (see CLOCK_ALLOWLIST) and pass it as a value',
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
      for (const p of checkSource(readFileSync(file, 'utf8'), file)) {
        report.push(`${file}:${p.line}  ${p.rule} → use ${p.fix}\n    ${p.text.trim()}`);
      }
    }
  }
  if (report.length > 0) {
    console.error(`[lint:css] ${report.length} forbidden class(es) found:\n${report.join('\n')}`);
    process.exit(1);
  }
  console.log(
    '[lint:css] ok — logical CSS only, no dark: variants, cn from @/lib/utils, no server data or clocks in client code',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
