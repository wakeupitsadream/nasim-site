import { describe, expect, it } from 'vitest';
import { seedAreas, seedBlock, seedFaqs, seedServices } from '@/lib/content/seed';
import { sanitizeHtmlContent } from '@/lib/sanitize';

describe('sanitizeHtmlContent', () => {
  it('removes scripts, handlers, styles and javascript: links', () => {
    const dirty =
      '<p onclick="x()" style="color:red">Hi <script>alert(1)</script><a href="javascript:alert(1)">x</a></p>';
    expect(sanitizeHtmlContent(dirty)).toBe('<p>Hi <a>x</a></p>');
  });

  it('keeps allowed inline formatting and forces rel on new-tab links', () => {
    const html =
      '<p><strong>Cleaning:</strong> 30 days.<br>See <a href="https://x.y" target="_blank">terms</a></p>';
    expect(sanitizeHtmlContent(html)).toBe(
      '<p><strong>Cleaning:</strong> 30 days.<br />See <a href="https://x.y" target="_blank" rel="noopener noreferrer">terms</a></p>',
    );
  });

  it('allows mailto and tel links', () => {
    expect(sanitizeHtmlContent('<a href="mailto:a@b.c">m</a><a href="tel:+971">t</a>')).toBe(
      '<a href="mailto:a@b.c">m</a><a href="tel:+971">t</a>',
    );
  });

  it('leaves every seed HTML string unchanged', () => {
    const html: string[] = [];
    for (const s of seedServices()) html.push(s.description_html.en, s.description_html.ru ?? '');
    for (const f of seedFaqs()) html.push(f.answer_html.en, f.answer_html.ru ?? '');
    for (const a of seedAreas()) html.push(a.intro_html.en, a.intro_html.ru ?? '');
    html.push(
      seedBlock('guarantee.text').en,
      seedBlock('service.ducted-ac-fcu-service.vs_split').en,
    );
    // sanitize-html serialises void tags as <br />; nothing else may change.
    for (const h of html) expect(sanitizeHtmlContent(h)).toBe(h.replace(/<br\s*\/?>/g, '<br />'));
  });
});
