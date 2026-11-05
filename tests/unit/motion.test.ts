import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { seedServices } from '@/lib/content/seed';
import { ICON_MOTION, stagger } from '@/lib/motion';

const css = readFileSync('styles/motion.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Top-level blocks of a stylesheet: `selector { … }` with balanced braces. */
function blocks(source: string): { head: string; body: string }[] {
  const out: { head: string; body: string }[] = [];
  let depth = 0;
  let start = -1;
  let headStart = 0;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        out.push({ head: source.slice(headStart, start).trim(), body: source.slice(start + 1, i) });
        headStart = i + 1;
      }
    }
  }
  return out;
}

describe('styles/motion.css', () => {
  const top = blocks(css);

  it('keeps every motion class behind prefers-reduced-motion: no-preference', () => {
    const components = top.find((b) => b.head === '@layer components')!;
    for (const block of blocks(components.body)) {
      const animated = /animation(?!-range|-timeline)[^;]*:|transition[^;]*:/.test(block.body);
      if (!animated) continue;
      if (block.head.startsWith('@media (prefers-reduced-motion: no-preference)')) continue;
      // Nested the other way round (@supports → @media) is fine too.
      if (
        block.head.startsWith('@supports') &&
        block.body.includes('prefers-reduced-motion: no-preference')
      )
        continue;
      throw new Error(`unguarded motion block: ${block.head}`);
    }
  });

  it('uses scroll-driven timelines only inside @supports', () => {
    const lines = css.split('\n');
    lines.forEach((line, i) => {
      // The @supports condition itself names the property; only declarations count.
      if (!line.includes('animation-timeline:') || line.trim().startsWith('@supports')) return;
      const before = lines.slice(0, i).join('\n');
      const opens = (before.match(/@supports \(animation-timeline/g) ?? []).length;
      expect(opens, `line ${i + 1} is outside @supports (animation-timeline …)`).toBeGreaterThan(0);
    });
  });

  it('silences view transitions under reduced motion and mirrors the curtain in RTL', () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*::view-transition-old\(\*\)/);
    expect(css).toMatch(/:root\[dir='rtl'\] \{\s*--nasim-curtain-dir: -1;/);
    // Page groups never tween their geometry between pages of different heights.
    expect(css).toMatch(/::view-transition-group\(\.page-fade\),[\s\S]*?animation: none;/);
  });

  it('drives the van by time where the browser has no view timelines', () => {
    expect(css).toMatch(
      /@supports not \(animation-timeline: view\(\)\) \{\s*\.van-drive\[data-driven\] \{\s*animation: nasim-drive-in/,
    );
  });

  it('animates only compositor-friendly properties', () => {
    const keyframes = css.match(/@keyframes[\s\S]*?\n}/g) ?? [];
    expect(keyframes.length).toBeGreaterThan(5);
    const allowed =
      /^(opacity|translate|scale|rotate|stroke-dashoffset|background-position|border-color|box-shadow)$/;
    for (const frame of keyframes) {
      const props = [...frame.matchAll(/^\s+([a-z-]+):/gm)].map((m) => m[1]!);
      for (const prop of props) expect(prop, frame.split('\n')[0]).toMatch(allowed);
    }
  });
});

describe('lib/motion', () => {
  it('exposes the stagger index as a custom property', () => {
    expect(stagger(3)).toEqual({ '--i': 3 });
  });

  it('gives every seeded service an icon motion', () => {
    for (const s of seedServices().filter((x) => x.status !== 'hidden')) {
      expect(ICON_MOTION[s.slug], s.slug).toBeDefined();
    }
  });
});
