/**
 * CLAUDE.md rule 2: only logical CSS utilities, so layouts mirror correctly in Arabic (RTL).
 * Fails on physical Tailwind classes in app/ and components/. Runs as part of `pnpm lint`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOTS = ['app', 'components'];
const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js', '.mdx']);

// Variant prefixes (md:, hover:, rtl: …) and the negative sign are allowed before the utility.
const PREFIX = String.raw`(?<=^|[\s"'\`{:(])-?`;
const FORBIDDEN = [
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
].map(([name, pattern, fix]) => ({ name, fix, re: new RegExp(PREFIX + pattern, 'g') }));

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(path.extname(entry))) yield full;
  }
}

const problems = [];
for (const root of ROOTS) {
  let files;
  try {
    files = [...walk(root)];
  } catch {
    continue;
  }
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const rule of FORBIDDEN) {
        rule.re.lastIndex = 0;
        if (rule.re.test(line)) {
          problems.push(`${file}:${i + 1}  ${rule.name} → use ${rule.fix}\n    ${line.trim()}`);
        }
      }
    });
  }
}

if (problems.length > 0) {
  console.error(
    `[lint:rtl] ${problems.length} physical CSS class(es) found:\n${problems.join('\n')}`,
  );
  process.exit(1);
}
console.log('[lint:rtl] ok — only logical CSS utilities');
