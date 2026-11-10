import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  getAreaBySlug,
  getAreas,
  getBlock,
  getFaqs,
  getMedia,
  getPackages,
  getPhoto,
  getPhotoCredits,
  getPriceItems,
  getRelatedServices,
  getServiceBySlug,
  getServices,
} from '@/lib/content/queries';
import {
  seedAreas,
  seedBlockKeys,
  seedFaqs,
  seedMedia,
  seedPackages,
  seedPriceItems,
  seedPricingRules,
  seedServices,
} from '@/lib/content/seed';
import { blockSchemas } from '@/lib/validation/content';

describe('seed files', () => {
  it('parse against the content schemas', () => {
    expect(seedServices().length).toBe(12);
    expect(seedPriceItems().length).toBe(17);
    expect(seedPackages().length).toBe(4);
    expect(seedAreas().length).toBe(16);
    expect(seedFaqs().length).toBe(19);
  });

  it('price items and FAQs point at existing services', () => {
    const slugs = new Set(seedServices().map((s) => s.slug));
    for (const item of seedPriceItems()) expect(slugs.has(item.service_slug), item.key).toBe(true);
    for (const faq of seedFaqs()) {
      if (faq.scope === 'service') expect(slugs.has(faq.service_slug), faq.question.en).toBe(true);
    }
    for (const slug of seedPricingRules().quote_only_services)
      expect(slugs.has(slug), slug).toBe(true);
  });

  it('bundle includes refer to price lines and the diagnostics item exists', () => {
    const lineIds = new Set(seedPriceItems().map((p) => p.tier_group ?? p.key));
    for (const pkg of seedPackages()) {
      if (pkg.type === 'bundle') {
        for (const id of Object.keys(pkg.includes)) expect(lineIds.has(id), id).toBe(true);
      }
    }
    expect(seedPriceItems().some((p) => p.key === seedPricingRules().diagnostics_item_key)).toBe(
      true,
    );
  });

  it('holds every typed block', () => {
    const keys = new Set(seedBlockKeys());
    for (const key of Object.keys(blockSchemas)) expect(keys.has(key), key).toBe(true);
  });

  it('media files exist, service photos point at real services, every active service has one', () => {
    const slugs = new Set(seedServices().map((s) => s.slug));
    const withPhoto = new Set<string>();
    for (const m of seedMedia()) {
      expect(existsSync(`public${m.url}`), m.url).toBe(true);
      // Stock photos carry a credit; the owner's own pictures (public/brand) carry none.
      if (m.credit) expect(m.credit.source.startsWith('https://'), m.url).toBe(true);
      else expect(m.url.startsWith('/brand/'), m.url).toBe(true);
      if (m.kind === 'service') {
        expect(m.service_slug && slugs.has(m.service_slug), m.url).toBe(true);
        withPhoto.add(m.service_slug!);
      }
      if (m.kind === 'category') expect(m.category, m.url).toBeDefined();
    }
    for (const s of seedServices().filter((x) => x.status === 'active'))
      expect(withPhoto.has(s.slug), s.slug).toBe(true);
  });
});

describe('content getters', () => {
  it('list active and coming-soon services in order, by category on request', async () => {
    const all = await getServices();
    expect(all.map((s) => s.status)).not.toContain('hidden');
    expect(all[0]?.slug).toBe('ac-cleaning');
    expect((await getServices({ category: 'upholstery' })).map((s) => s.slug)).toEqual([
      'sofa-cleaning',
      'mattress-cleaning',
      'carpet-cleaning',
      'stain-odour-removal',
    ]);
    expect((await getServices({ status: ['coming_soon'] })).length).toBe(2);
  });

  it('find a service by slug and return null for unknown ones', async () => {
    expect((await getServiceBySlug('ac-cleaning'))?.name.en).toBe('AC Cleaning');
    expect(await getServiceBySlug('no-such-service')).toBeNull();
  });

  it('relate nearest services of the same category plus one from the other', async () => {
    const related = await getRelatedServices('ac-cleaning');
    expect(related.map((s) => s.slug)).toEqual([
      'ac-deep-cleaning',
      'ducted-ac-fcu-service',
      'sofa-cleaning',
    ]);
    expect((await getRelatedServices('sofa-cleaning')).map((s) => s.category)).toEqual([
      'upholstery',
      'upholstery',
      'ac',
    ]);
  });

  it('filter price items by service and packages by type', async () => {
    expect((await getPriceItems({ serviceSlug: 'ac-cleaning' })).length).toBe(3);
    expect((await getPackages({ type: 'bundle' })).map((p) => p.slug)).toEqual(['fresh-home']);
    expect((await getPackages({ type: 'annual' })).length).toBe(3);
  });

  it('return only published areas', async () => {
    const areas = await getAreas();
    expect(areas.length).toBe(10);
    expect(areas.every((a) => a.published)).toBe(true);
    expect(await getAreaBySlug('mirdif')).toBeNull();
    expect((await getAreaBySlug('dubai-marina'))?.eta_minutes).toBe(30);
  });

  it('scope FAQs', async () => {
    expect((await getFaqs('global')).length).toBe(6);
    expect((await getFaqs('service', 'ac-cleaning')).length).toBe(3);
    expect((await getFaqs('service', 'carpet-cleaning')).length).toBe(0);
    expect((await getFaqs('contracts')).length).toBe(3);
  });

  it('return photos by kind, service and category, with the alt picked per locale', async () => {
    expect((await getMedia({ kind: 'why' })).length).toBe(1);
    expect((await getMedia({ kind: 'service', serviceSlug: 'ac-cleaning' })).length).toBe(1);
    expect((await getMedia({ kind: 'category', category: 'upholstery' })).length).toBe(1);
    expect((await getMedia({ kind: 'before_after' })).length).toBe(0);
    const ru = await getPhoto({ kind: 'band' }, 'ru');
    expect(ru?.url).toMatch(/^\/photos\/.+\.jpg$/);
    expect(ru?.alt).toMatch(/Дубай/);
    expect(await getPhoto({ kind: 'team' }, 'en')).toBeNull();
  });

  it('list each Creative Commons author once for the footer attribution line', async () => {
    const credits = await getPhotoCredits();
    expect(credits.map((c) => c.author)).toEqual(['Sofitel Dubai Downtown']);
    expect(credits[0]).toMatchObject({ license: 'CC BY 2.0, adapted' });
    expect(credits[0].source.startsWith('https://')).toBe(true);
    // Pexels pictures need no attribution, so they never reach the footer.
    expect(seedMedia().filter((m) => m.credit?.license.startsWith('CC ')).length).toBe(1);
  });

  it('return typed blocks', async () => {
    const steps = await getBlock('home.how.steps');
    expect(steps.en).toHaveLength(4);
    const readings = await getBlock('report.readings');
    expect(readings.en.before_c).toBeGreaterThan(readings.en.after_c);
    const template = await getBlock('wa.template.waitlist');
    expect(template.en).toContain('{service}');
  });
});
