import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANSWER_SHAPE,
  buildDiagnosisSystemPrompt,
  buildDiagnosisUserContent,
  type CatalogueEntry,
} from '@/lib/ai/diagnose-prompt';
import { seedServices } from '@/lib/content/seed';
import { allow, clientIp, hashIp, resetRateLimits } from '@/lib/ratelimit';
import { priceUnitSchema } from '@/lib/validation/content';
import {
  DIAGNOSE_MAX_TEXT,
  DIAGNOSE_PRICE_UNITS,
  diagnoseRequestSchema,
  diagnosisSchema,
} from '@/lib/validation/diagnose';

const catalogue: CatalogueEntry[] = seedServices()
  .filter((s) => s.status !== 'hidden')
  .map((s) => ({
    slug: s.slug,
    category: s.category,
    status: s.status === 'coming_soon' ? 'coming_soon' : 'active',
    name: s.name.en,
    short: s.short.en,
    symptoms: s.symptoms.map((x) => x.en),
    includes: s.includes.map((x) => x.en),
  }));

const png = Buffer.from('fake-image-bytes').toString('base64');

describe('diagnose request schema', () => {
  it('needs a description or a photo', () => {
    expect(diagnoseRequestSchema.safeParse({ locale: 'en', text: '' }).success).toBe(false);
    expect(diagnoseRequestSchema.safeParse({ locale: 'en', text: 'ok' }).success).toBe(false);
    expect(diagnoseRequestSchema.safeParse({ locale: 'en', text: 'It drips' }).success).toBe(true);
    expect(
      diagnoseRequestSchema.safeParse({
        locale: 'ar',
        image: { mediaType: 'image/png', data: png },
      }).success,
    ).toBe(true);
  });

  it('rejects oversized text, bad base64 and unknown media types', () => {
    expect(
      diagnoseRequestSchema.safeParse({ locale: 'en', text: 'x'.repeat(DIAGNOSE_MAX_TEXT + 1) })
        .success,
    ).toBe(false);
    expect(
      diagnoseRequestSchema.safeParse({
        locale: 'en',
        image: { mediaType: 'image/png', data: '%%%' },
      }).success,
    ).toBe(false);
    expect(
      diagnoseRequestSchema.safeParse({
        locale: 'en',
        image: { mediaType: 'image/gif', data: png },
      }).success,
    ).toBe(false);
    expect(
      diagnoseRequestSchema.safeParse({
        locale: 'en',
        image: { mediaType: 'image/jpeg', data: 'A'.repeat(4 * 1024 * 1024 + 4) },
      }).success,
    ).toBe(false);
  });

  it('keeps the model output schema inside the structured-outputs subset', () => {
    const sample = {
      summary: 'Likely a clogged drain line.',
      causes: [{ title: 'Drain', detail: 'Silted drain line.', likelihood: 'likely' }],
      service: 'ac-cleaning',
      urgency: 'soon',
      safety: null,
      questions: ['How old is the unit?'],
      outOfScope: false,
      confidence: 'medium',
    };
    expect(diagnosisSchema.safeParse(sample).success).toBe(true);
  });

  it('mirrors the catalogue price units without importing the content schemas', () => {
    expect([...DIAGNOSE_PRICE_UNITS]).toEqual(priceUnitSchema.options);
  });
});

describe('diagnosis prompt', () => {
  const system = buildDiagnosisSystemPrompt('Nasim Home Care', catalogue);

  it('lists every catalogue slug and the price rule', () => {
    for (const entry of catalogue) expect(system).toContain(`slug: ${entry.slug}`);
    expect(system).toMatch(/Never state prices/);
    expect(system).toContain('coming soon');
    expect(system).toContain('Nasim Home Care');
  });

  it('spells out every field of the answer schema', () => {
    expect(system).toContain(ANSWER_SHAPE);
    for (const key of Object.keys(diagnosisSchema.shape)) {
      expect(ANSWER_SHAPE, key).toContain(`"${key}"`);
    }
  });

  it('puts the photo before the text and names the answer language', () => {
    const blocks = buildDiagnosisUserContent({
      locale: 'ru',
      text: 'Капает вода из блока',
      image: { mediaType: 'image/jpeg', data: png },
    });
    expect(blocks[0]?.type).toBe('image_url');
    expect(blocks[0]?.type === 'image_url' && blocks[0].image_url.url).toBe(
      `data:image/jpeg;base64,${png}`,
    );
    expect(blocks[1]?.type).toBe('text');
    const text = blocks[1]?.type === 'text' ? blocks[1].text : '';
    expect(text).toContain('Russian');
    expect(text).toContain('Капает вода из блока');
  });

  it('explains a photo-only request', () => {
    const blocks = buildDiagnosisUserContent({
      locale: 'en',
      text: '',
      image: { mediaType: 'image/png', data: png },
    });
    expect(blocks).toHaveLength(2);
    expect(blocks[1]?.type === 'text' && blocks[1].text).toContain('only a photo');
  });
});

describe('rate limit', () => {
  beforeEach(() => resetRateLimits());
  afterEach(() => vi.unstubAllEnvs());

  it('allows up to the limit inside the window, then refuses, then recovers', () => {
    const rule = { limit: 2, windowMs: 1000 };
    expect(allow('k', rule, 0)).toBe(true);
    expect(allow('k', rule, 100)).toBe(true);
    expect(allow('k', rule, 200)).toBe(false);
    expect(allow('other', rule, 200)).toBe(true);
    expect(allow('k', rule, 1101)).toBe(true);
  });

  it('hashes IPs with the salt and reads the first forwarded address', () => {
    vi.stubEnv('IP_HASH_SALT', 'salt');
    const a = hashIp('203.0.113.7');
    vi.stubEnv('IP_HASH_SALT', 'other');
    expect(hashIp('203.0.113.7')).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toContain('203');
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe(
      '203.0.113.7',
    );
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
