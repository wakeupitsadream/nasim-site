import { describe, expect, it } from 'vitest';
import { seedAreas, seedBlock, seedFaqs, seedServices } from '@/lib/content/seed';
import { plainText, sanitizeHtmlContent, sanitizeInlineHtml } from '@/lib/sanitize';

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

describe('inline emphasis and plain text', () => {
  it('keeps a bold lead-in and nothing else in a list item', () => {
    expect(
      sanitizeInlineHtml(
        '<strong>Diagnosis.</strong> We <a href="https://x.test">look</a><p>inside</p>',
      ),
    ).toBe('<strong>Diagnosis.</strong> We lookinside');
    expect(sanitizeInlineHtml('<img src=x onerror=alert(1)>Plain')).toBe('Plain');
  });

  it('every seeded "included" item survives the inline sanitiser unchanged', () => {
    for (const service of seedServices())
      for (const item of service.includes)
        for (const [locale, text] of Object.entries(item))
          expect(sanitizeInlineHtml(text), `${service.slug} ${locale}`).toBe(text);
  });

  it('turns editor HTML into one line of text for the assistant', () => {
    expect(
      plainText(
        '<p>Choose <strong>FCU Deep Coil &amp; Blower Cleaning</strong>.</p><p>Second.</p>',
      ),
    ).toBe('Choose FCU Deep Coil & Blower Cleaning. Second.');
    expect(plainText('')).toBe('');
  });
});
