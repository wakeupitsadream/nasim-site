import { existsSync, readFileSync } from 'node:fs';
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
import { routing } from '@/lib/i18n/routing';
import { blockSchemas } from '@/lib/validation/content';

const msgOf = (locale: string) =>
  JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as {
    Service: Record<string, unknown>;
  };

describe('seed files', () => {
  it('parse against the content schemas', () => {
    expect(seedServices().length).toBe(25);
    expect(seedPriceItems().length).toBe(49);
    expect(seedPackages().length).toBe(7);
    expect(seedAreas().length).toBe(16);
    expect(seedFaqs().length).toBe(16);
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

  it('offers the first-booking discount on the cleaning services only', () => {
    // Routine servicing is cleaning too (filters, coil, drain); repairs and diagnostics are not.
    expect(seedPricingRules().first_booking_offer).toEqual({
      discount: 50,
      min_total: 500,
      service_slugs: [
        'ac-cleaning',
        'ducted-ac-fcu-service',
        'ac-deep-cleaning',
        'fcu-deep-coil-cleaning',
        'ac-duct-cleaning',
        'full-ac-system-cleaning',
        'ac-filter-grille-cleaning',
        'ac-outdoor-unit-cleaning',
        'sofa-cleaning',
        'mattress-cleaning',
        'carpet-cleaning',
        'curtain-cleaning',
        'upholstery-extras',
      ],
    });
    // The minimum order is a rule of exactly the deep-cleaning services.
    expect(seedPricingRules().minimum_order).toEqual({
      amount: 229,
      service_slugs: seedServices()
        .filter((s) => s.category === 'upholstery')
        .map((s) => s.slug),
    });
    const priced = new Set(seedPriceItems().map((p) => p.service_slug));
    for (const slug of seedPricingRules().first_booking_offer!.service_slugs)
      expect(priced.has(slug), slug).toBe(true);
  });

  it('files the AC services under the three sections of the price list', () => {
    const groups = (key: string) =>
      seedServices()
        .filter((s) => s.category === 'ac' && s.group === key)
        .map((s) => s.slug);
    expect(groups('service')).toEqual([
      'ac-cleaning',
      'ducted-ac-fcu-service',
      'ac-repair',
      'emergency-ac-repair',
    ]);
    expect(groups('cleaning')).toEqual([
      'ac-deep-cleaning',
      'fcu-deep-coil-cleaning',
      'ac-duct-cleaning',
      'full-ac-system-cleaning',
    ]);
    expect(groups('other')).toHaveLength(10);
    // The owner took the "other" section off the site on 17.11.2026 (DECISIONS №79, №81): repairs
    // and the urgent call-out moved to the servicing section, the small services are hidden and
    // folded into the repairs card. Records and prices stay; bringing one back is its status.
    expect(seedServices().filter((s) => s.group === 'other' && s.status !== 'hidden')).toEqual([]);
    expect(seedServices().filter((s) => s.category === 'ac' && !s.group)).toEqual([]);
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

  it('media files exist, service photos point at real services, every described service has one', () => {
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
    // Services that only have the owner's short description so far (no visit steps written)
    // have no photo yet: their pages keep the placeholder art.
    for (const s of seedServices().filter((x) => x.status === 'active' && x.visit_steps.length > 0))
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
      'curtain-cleaning',
      'upholstery-extras',
    ]);
    expect((await getServices({ status: ['coming_soon'] })).length).toBe(2);
  });

  it('find a service by slug and return null for unknown ones', async () => {
    expect((await getServiceBySlug('ac-cleaning'))?.name.en).toBe('Standard Split AC Service');
    expect(await getServiceBySlug('no-such-service')).toBeNull();
  });

  it('relate nearest services of the same category plus one from the other', async () => {
    const related = await getRelatedServices('ac-cleaning');
    expect(related.map((s) => s.slug)).toEqual([
      'ducted-ac-fcu-service',
      'ac-deep-cleaning',
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
    expect((await getPackages({ type: 'bundle' })).map((p) => p.slug)).toEqual([
      'fresh-home',
      'sofa-and-mattress',
      'furniture-refresh',
      'full-home',
    ]);
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
    expect((await getFaqs('service', 'ac-cleaning')).length).toBe(2);
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

// The owner, 17.11.2026 (DECISIONS №78): no job durations on the site until the first orders
// are timed. Filling `duration_min` back in is all it takes to show them again.
describe('job durations', () => {
  it('are not stated for any service yet', () => {
    expect(seedServices().filter((s) => s.duration_min !== null)).toEqual([]);
  });
});

// One "Repairs and Diagnostics" card instead of eleven small ones (DECISIONS №81).
describe('services folded into one card', () => {
  const services = seedServices();
  const repairs = services.find((s) => s.slug === 'ac-repair')!;

  it('are existing hidden services, each folded once', () => {
    const covered = services.flatMap((s) => s.covers ?? []);
    expect(new Set(covered).size).toBe(covered.length);
    for (const slug of covered)
      expect(services.find((s) => s.slug === slug)?.status, slug).toBe('hidden');
    expect(repairs.covers).toHaveLength(8);
  });

  it('list their price rows under the card: its own first, on-request ones by name', async () => {
    const { getPriceRows } = await import('@/lib/content/queries');
    const rows = await getPriceRows('ac-repair');
    expect(rows.map((r) => r.key)).toEqual([
      'diagnostics_visit',
      'repair_labour',
      'filter_grille',
      'outdoor_unit',
      'drain_unblocking',
      'thermostat_labour',
      'leak_test',
      'leak_repair',
      'refill',
      'ac_sanitisation',
    ]);
    const onRequest = rows.filter((r) => r.on_request);
    expect(onRequest.map((r) => r.name.en)).toEqual([
      'Refrigerant leak repair',
      'Targeted AC sanitisation',
    ]);
    // A service that folds nothing keeps exactly its own rows.
    expect((await getPriceRows('ac-cleaning')).map((r) => r.key)).toEqual([
      'ac_clean_1',
      'ac_clean_2_3',
      'ac_clean_4plus',
    ]);
  });
});

// The owner's wording for the two visit cards (DECISIONS №82).
describe('catalogue cards with their own wording', () => {
  const card = (slug: string) => seedServices().find((s) => s.slug === slug)!.card!;

  it('carry the price unit, the note, the button and the link as he wrote them', () => {
    // The owner kept this name over the «Split AC Repair» of his later page copy (DECISIONS №85).
    expect(seedServices().find((s) => s.slug === 'ac-repair')!.name.en).toBe(
      'AC Repairs & Diagnostics',
    );
    expect(card('ac-repair').unit?.en).toBe('per diagnostic visit');
    expect(card('ac-repair').note?.en).toBe('Repairs and parts quoted separately.');
    expect(card('ac-repair').cta.en).toBe('Book a diagnostic visit');
    expect(card('ac-repair').link?.en).toBe('View repair services and prices');
    expect(card('emergency-ac-repair').cta.en).toBe('Check availability');
    expect(card('emergency-ac-repair').note?.en).toBe('Repairs and parts quoted separately.');
    expect(card('emergency-ac-repair').link).toBeUndefined();
  });

  it('are translated into every locale', () => {
    for (const slug of ['ac-repair', 'emergency-ac-repair'])
      for (const field of Object.values(card(slug)))
        expect(Object.values(field).filter(Boolean)).toHaveLength(routing.locales.length);
  });
});

// The owner's page copy of 22.11.2026, pasted as written (DECISIONS №85).
describe("the owner's service page copy", () => {
  const COPIED = [
    'ac-repair',
    'emergency-ac-repair',
    'ac-deep-cleaning',
    'fcu-deep-coil-cleaning',
    'ac-duct-cleaning',
    'full-ac-system-cleaning',
  ];
  const service = (slug: string) => seedServices().find((s) => s.slug === slug)!;

  it('keeps his sentences word for word, with the bold lead-ins', () => {
    expect(service('ac-repair').description_html.en).toBe(
      '<p>If your AC won’t start, switches off on its own or hums without the outdoor fan turning, we can help. Our technicians carry common replacement parts and complete most repairs in one visit.</p>',
    );
    expect(service('ac-repair').includes.map((i) => i.en)).toEqual([
      '<strong>Diagnosis.</strong> Your technician identifies the fault and explains what needs fixing.',
      '<strong>Repair.</strong> We replace the faulty part as needed. Common repairs include capacitors, temperature sensors, fan motors, control boards and drain pumps.',
      '<strong>Testing.</strong> After the repair, we run the AC and check its operating readings to confirm it works properly.',
      '<strong>90-day repair warranty.</strong> We cover parts and labour for 90 days.',
    ]);
    expect(service('emergency-ac-repair').description_html.en).toContain(
      '<p><strong>AED 199 per visit, including diagnostics.</strong> If we complete the repair during the same visit, we deduct the full AED 199 from the repair bill.</p>',
    );
    expect(service('emergency-ac-repair').notes_html?.en).toBe(
      '<p><strong>For a same-day visit, contact us before 16:00.</strong> The emergency line stays open until 22:00. Call or WhatsApp to confirm the earliest appointment.</p>',
    );
    expect(service('ac-duct-cleaning').notes_html?.en).toBe(
      '<p>If you also want the cooling coil and fan inside your concealed AC unit cleaned, choose <strong>FCU Deep Coil &amp; Blower Cleaning</strong> as a separate service.</p>',
    );
    expect(service('ac-deep-cleaning').notes_html?.en).toContain(
      '<p>Repairs and refrigerant work are separate services.</p>',
    );
    expect(service('full-ac-system-cleaning').includes).toHaveLength(4);
    expect(service('fcu-deep-coil-cleaning').notes_html).toBeUndefined();
  });

  it('is translated into every locale with the same shape', () => {
    for (const slug of COPIED) {
      const s = service(slug);
      for (const locale of routing.locales) {
        expect(s.description_html[locale], `${slug} description ${locale}`).toMatch(/^<p>.+<\/p>$/);
        for (const item of s.includes)
          expect(item[locale], `${slug} included ${locale}`).toMatch(/^<strong>.+<\/strong>/);
        if (s.notes_html) expect(s.notes_html[locale], `${slug} notes ${locale}`).toMatch(/^<p>/);
      }
      // The old "When you need it" and "How the service goes" lists are part of his text now.
      expect(s.symptoms).toEqual([]);
      expect(s.visit_steps).toEqual([]);
    }
  });

  it('shows no "not included" list on any page a visitor can open', () => {
    for (const s of seedServices().filter((x) => x.status !== 'hidden'))
      expect(s.excludes, s.slug).toEqual([]);
    for (const locale of routing.locales)
      expect(msgOf(locale).Service.excluded, locale).toBeUndefined();
  });

  it('uses the price and the hours that the site itself runs on', () => {
    // His text names AED 199, 16:00 and 22:00: if the price list or the booking hours change,
    // this text has to be edited with them.
    const callout = seedPriceItems().find((i) => i.key === 'emergency_callout')!;
    expect(callout.price).toBe(199);
  });
});
