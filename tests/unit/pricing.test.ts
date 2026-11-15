import { describe, expect, it } from 'vitest';
import { seedPackages, seedPriceItems, seedPricingRules, seedServices } from '@/lib/content/seed';
import {
  annualPlanComparison,
  billableQty,
  buildPricingConfig,
  bundleSavings,
  estimateFloor,
  findLine,
  linesForService,
  priceFrom,
  quote,
  sanitizeQty,
  suggestBundle,
  tierRanges,
  unitPrice,
  type Selection,
} from '@/lib/pricing';
import type { PriceItem } from '@/lib/validation/content';

const items = seedPriceItems();
const packages = seedPackages();
const rules = seedPricingRules();
const cfg = buildPricingConfig(items, packages, rules);
const noVat = { registered: false, included: false };
const line = (id: string) => findLine(cfg, id)!;
const total = (sel: Selection) => quote(cfg, sel, noVat).total;

describe('buildPricingConfig', () => {
  it('merges quantity tiers into lines', () => {
    expect(line('ac_clean').tiers.map((t) => [t.fromQty, t.price])).toEqual([
      [1, 299],
      [2, 279],
      [4, 249],
    ]);
    expect(line('ac_deep').tiers.map((t) => [t.fromQty, t.price])).toEqual([
      [1, 549],
      [2, 499],
    ]);
    expect(linesForService(cfg, 'mattress-cleaning').map((l) => l.id)).toEqual([
      'mattress_single',
      'mattress_double',
      'mattress_king',
    ]);
    // Misha's table of 15.11.2026: three services have a third rate from the fourth unit.
    expect(line('fcu_service').tiers.map((t) => [t.fromQty, t.price])).toEqual([
      [1, 349],
      [2, 329],
      [4, 299],
    ]);
    expect(line('duct_clean').tiers.map((t) => t.price)).toEqual([649, 599, 549]);
    expect(line('full_system').tiers.map((t) => t.price)).toEqual([899, 849, 799]);
    // Fan coil deep cleaning costs the same from the second unit on, like the split deep clean.
    expect(line('fcu_deep').tiers.map((t) => t.price)).toEqual([599, 549]);
    expect(line('fcu_service').minQty).toBe(1);
  });

  it('rejects broken tier groups', () => {
    const base = items.find((i) => i.key === 'ac_clean_1')!;
    const dup: PriceItem[] = [base, { ...base, key: 'x', tier_group: 'ac_clean' }];
    expect(() => buildPricingConfig(dup, packages, rules)).toThrow(/duplicate tier/);
    const mixed: PriceItem[] = [
      base,
      { ...base, key: 'y', tier_group: 'ac_clean', tier_from_qty: 2, unit: 'fcu' },
    ];
    expect(() => buildPricingConfig(mixed, packages, rules)).toThrow(/mixes units/);
    const noBase: PriceItem[] = [{ ...base, tier_from_qty: 2 }];
    expect(() => buildPricingConfig(noBase, packages, rules)).toThrow(/no tier starting at 1/);
    expect(() =>
      buildPricingConfig(items, packages, { ...rules, diagnostics_item_key: 'nope' }),
    ).toThrow(/diagnostics item/);
  });
});

describe('tiers and minimums', () => {
  it('prices every unit at the tier of the total quantity', () => {
    expect([1, 2, 3, 4, 10].map((q) => unitPrice(line('ac_clean'), q))).toEqual([
      299, 279, 279, 249, 249,
    ]);
    expect(total({ ac_clean: 3 })).toBe(837);
    expect(total({ ac_clean: 4 })).toBe(996);
    expect(total({ ac_deep: 2 })).toBe(998);
    // The services that were priced on request until 12.11.2026.
    expect(total({ fcu_service: 1 })).toBe(349);
    expect(total({ fcu_service: 3 })).toBe(987);
    expect(total({ fcu_service: 4 })).toBe(1196);
    expect(total({ fcu_deep: 2 })).toBe(1098);
    expect(total({ fcu_deep: 5 })).toBe(2745);
    expect(total({ duct_clean: 1 })).toBe(649);
    expect(total({ duct_clean: 4 })).toBe(2196);
    expect(total({ full_system: 2 })).toBe(1698);
    expect(total({ full_system: 4 })).toBe(3196);
  });

  it('bills minimum charges and flags them', () => {
    expect(billableQty(line('sofa_seat'), 1)).toBe(3);
    const q = quote(cfg, { sofa_seat: 1 }, noVat);
    expect(q.total).toBe(267);
    expect(q.lines[0]?.minApplied).toBe(true);
    expect(total({ sofa_seat: 2 })).toBe(267);
    expect(total({ sofa_seat: 5 })).toBe(445);
    expect(total({ carpet_sqm: 4 })).toBe(150);
    expect(total({ carpet_sqm: 10 })).toBe(250);
    expect(total({ mattress_single: 1, mattress_king: 1 })).toBe(498);
  });

  it('describes tier ranges', () => {
    expect(tierRanges(line('ac_clean'))).toEqual([
      { from: 1, to: 1, price: 299 },
      { from: 2, to: 3, price: 279 },
      { from: 4, to: null, price: 249 },
    ]);
  });
});

describe('bundles', () => {
  it('applies Fresh Home when it is cheaper than the items', () => {
    const q = quote(cfg, { ac_clean: 3, sofa_seat: 3 }, noVat);
    expect(q.subtotal).toBe(1104);
    expect(q.total).toBe(1099);
    expect(q.savings).toBe(5);
    expect(q.bundle?.slug).toBe('fresh-home');
  });

  it('keeps à la carte when the bundle path costs more', () => {
    const q = quote(cfg, { ac_clean: 4, sofa_seat: 3 }, noVat);
    expect(q.total).toBe(1263);
    expect(q.bundle).toBeNull();
  });

  it('prices the remainder at the full-quantity tier', () => {
    const q = quote(cfg, { ac_clean: 3, sofa_seat: 4 }, noVat);
    expect(q.total).toBe(1188);
    expect(q.bundle?.slug).toBe('fresh-home');
  });

  it('reports the seed savings', () => {
    expect(bundleSavings(cfg.bundles[0]!)).toBe(5);
  });
});

describe('suggestBundle', () => {
  it('offers the missing part when it makes the bundle cheaper', () => {
    expect(suggestBundle(cfg, { ac_clean: 3 })).toEqual({
      slug: 'fresh-home',
      add: { sofa_seat: 3 },
      addCost: 262,
      savings: 5,
    });
    expect(suggestBundle(cfg, { sofa_seat: 3 })?.addCost).toBe(832);
  });

  it('stays quiet when there is no overlap, no gain, or the bundle already applies', () => {
    expect(suggestBundle(cfg, { ac_deep: 2 })).toBeNull();
    expect(suggestBundle(cfg, { ac_clean: 5 })).toBeNull();
    expect(suggestBundle(cfg, { ac_clean: 3, sofa_seat: 3 })).toBeNull();
    const off = buildPricingConfig(items, packages, {
      ...rules,
      suggest_bundle_when_cheaper: false,
    });
    expect(suggestBundle(off, { ac_clean: 3 })).toBeNull();
  });
});

describe('estimates', () => {
  it('books a repair as diagnostics plus an estimate', () => {
    const q = quote(cfg, { repair_labour: 1 }, noVat);
    expect(q.kind).toBe('estimate');
    expect(q.lines.map((l) => [l.role, l.total])).toEqual([['diagnostics', 199]]);
    expect(q.total).toBe(199);
    expect(q.estimate).toEqual({
      fromLines: [{ lineId: 'repair_labour', from: 249 }],
      credited: true,
    });
  });

  it('keeps fixed refrigerant lines and the refill as "from"', () => {
    const q = quote(cfg, { leak_test: 2, refill: 1 }, noVat);
    expect(q.kind).toBe('estimate');
    expect(q.total).toBe(598);
    expect(q.lines.every((l) => l.role === 'item')).toBe(true);
    expect(q.estimate?.fromLines).toEqual([{ lineId: 'refill', from: 449 }]);
  });

  it('treats a leak test as the diagnosis: a recharge alone adds diagnostics, with a test it does not', () => {
    const alone = quote(cfg, { refill: 1 }, noVat);
    expect(alone.lines.map((l) => [l.role, l.total])).toEqual([['diagnostics', 199]]);
    const withTest = quote(cfg, { leak_test: 1, refill: 1 }, noVat);
    expect(withTest.lines.map((l) => l.role)).toEqual(['item']);
    expect(withTest.total).toBe(299);
    expect(linesForService(cfg, 'refrigerant-leak-detection').map((l) => l.id)).toEqual([
      'leak_test',
    ]);
    expect(linesForService(cfg, 'refrigerant-recharge').map((l) => l.id)).toEqual(['refill']);
    expect(linesForService(cfg, 'ac-sanitisation')).toEqual([]);
  });

  it('prices an emergency call-out as fixed', () => {
    const q = quote(cfg, { emergency_callout: 1 }, noVat);
    expect(q.kind).toBe('fixed');
    expect(q.total).toBe(199);
  });

  it('prices the services that were on request until the price list of 16.11.2026', () => {
    expect(total({ filter_grille: 2 })).toBe(398);
    expect(total({ outdoor_unit: 1 })).toBe(199);
    expect(total({ diagnostics_visit: 1 })).toBe(199);
    expect(quote(cfg, { diagnostics_visit: 1 }, noVat).kind).toBe('fixed');
  });

  it('starts a drain or thermostat job at its "from" price, with nothing fixed up front', () => {
    const drain = quote(cfg, { drain_unblocking: 1 }, noVat);
    expect(drain.kind).toBe('estimate');
    expect(drain.lines).toEqual([]);
    expect(drain.total).toBe(0);
    expect(estimateFloor(drain)).toBe(299);
    expect(estimateFloor(quote(cfg, { thermostat_labour: 1 }, noVat))).toBe(249);
    // A repair is booked with a fixed diagnostics fee, so its total is that fee, not a floor.
    expect(estimateFloor(quote(cfg, { repair_labour: 1 }, noVat))).toBeNull();
    expect(estimateFloor(quote(cfg, { ac_clean: 1 }, noVat))).toBeNull();
  });
});

describe('first-booking offer', () => {
  const first = (sel: Selection) => quote(cfg, sel, noVat, { firstBooking: true });

  it('takes AED 50 off a cleaning booking of AED 500 or more once the customer says it is their first', () => {
    const plain = quote(cfg, { ac_clean: 2 }, noVat);
    expect(plain.total).toBe(558);
    expect(plain.offer).toEqual({ discount: 50, minTotal: 500, eligible: true, applied: false });
    const q = first({ ac_clean: 2 });
    expect(q.offer?.applied).toBe(true);
    expect(q.total).toBe(508);
    expect(q.savings).toBe(50);
  });

  it('works on top of quantity rates and for upholstery', () => {
    expect(first({ ac_clean: 4 }).total).toBe(946); // 4 × 249 − 50
    expect(first({ full_system: 1 }).total).toBe(849);
    expect(first({ sofa_seat: 6 }).total).toBe(484); // 6 × 89 − 50
  });

  it('stays out below the minimum and for servicing and repairs', () => {
    const small = first({ ac_clean: 1 });
    expect(small.offer).toEqual({ discount: 50, minTotal: 500, eligible: false, applied: false });
    expect(small.total).toBe(299);
    // Two leak tests cost 598, but testing is not cleaning: no offer at all.
    expect(first({ leak_test: 2 }).offer).toBeNull();
    expect(first({ leak_test: 2 }).total).toBe(598);
    expect(first({ repair_labour: 1 }).offer).toBeNull();
    // Only the cleaning part counts towards the minimum: 299 of 598 here.
    expect(first({ ac_clean: 1, leak_test: 1 }).total).toBe(598);
  });

  it('never stacks with a bundle: the customer gets the cheaper of the two', () => {
    const sel = { ac_clean: 3, sofa_seat: 3 };
    expect(quote(cfg, sel, noVat).bundle?.slug).toBe('fresh-home');
    // À la carte 1104 − 50 beats the package at 1099, so the package steps aside.
    const q = first(sel);
    expect(q.bundle).toBeNull();
    expect(q.total).toBe(1054);
    // With a package that really is cheaper, the package stays and the offer is not available.
    const cheaper = buildPricingConfig(
      items,
      packages.map((p) => (p.slug === 'fresh-home' ? { ...p, price: 999 } : p)),
      rules,
    );
    const kept = quote(cheaper, sel, noVat, { firstBooking: true });
    expect(kept.bundle?.slug).toBe('fresh-home');
    expect(kept.total).toBe(999);
    expect(kept.offer).toEqual({ discount: 50, minTotal: 500, eligible: false, applied: false });
  });

  it('charges VAT on the discounted total and is off without the rule', () => {
    const q = quote(
      cfg,
      { ac_clean: 2 },
      { registered: true, included: false },
      { firstBooking: true },
    );
    expect(q.vat).toEqual({ mode: 'added', amount: 25, totalWithVat: 533 });
    const off = buildPricingConfig(items, packages, { ...rules, first_booking_offer: null });
    const none = quote(off, { ac_clean: 2 }, noVat, { firstBooking: true });
    expect(none.offer).toBeNull();
    expect(none.total).toBe(558);
  });
});

describe('VAT', () => {
  it('is silent until registered', () => {
    expect(quote(cfg, { ac_clean: 3 }, noVat).vat).toEqual({
      mode: 'none',
      amount: 0,
      totalWithVat: 837,
    });
  });

  it('adds 5% when prices exclude it', () => {
    const vat = { registered: true, included: false };
    expect(quote(cfg, { ac_clean: 3 }, vat).vat).toEqual({
      mode: 'added',
      amount: 42,
      totalWithVat: 879,
    });
    expect(quote(cfg, { ac_clean: 3, sofa_seat: 3 }, vat).vat).toEqual({
      mode: 'added',
      amount: 55,
      totalWithVat: 1154,
    });
  });

  it('extracts the amount when prices include it', () => {
    const q = quote(cfg, { ac_clean: 3 }, { registered: true, included: true });
    expect(q.vat).toEqual({ mode: 'included', amount: 40, totalWithVat: 837 });
  });
});

describe('bad input', () => {
  it('sanitises quantities', () => {
    expect([-1, 2.7, Number.NaN, 5000, '3', undefined].map(sanitizeQty)).toEqual([
      0, 2, 0, 999, 3, 0,
    ]);
  });

  it('ignores unknown lines', () => {
    expect(total({ nope: 3, ac_clean: 1 })).toBe(299);
  });
});

describe('seed consistency', () => {
  it('derives the same "from" price the services file states', () => {
    for (const s of seedServices().filter((x) => x.status === 'active')) {
      // Services priced on request have no price lines and no "from" price.
      expect(priceFrom(cfg, s.slug)?.amount ?? null, s.slug).toBe(s.price_from);
    }
    expect(priceFrom(cfg, 'humidity-mould-check')).toBeNull();
  });

  it('marks one fixed price as exact; tiers, several lines and estimates stay "from"', () => {
    expect(priceFrom(cfg, 'emergency-ac-repair')).toEqual({
      amount: 199,
      unit: 'visit',
      exact: true,
    });
    expect(priceFrom(cfg, 'ac-filter-grille-cleaning')?.exact).toBe(true);
    expect(priceFrom(cfg, 'ac-cleaning')).toEqual({ amount: 249, unit: 'unit', exact: false });
    expect(priceFrom(cfg, 'ac-repair')).toEqual({ amount: 249, unit: 'from', exact: false });
    expect(priceFrom(cfg, 'sofa-cleaning')?.exact).toBe(false);
  });

  it('keeps the bundle compare price equal to the à-la-carte sum', () => {
    const bundle = cfg.bundles[0]!;
    expect(quote(cfg, bundle.includes, noVat).subtotal).toBe(bundle.comparePrice);
  });
});

describe('annualPlanComparison', () => {
  const plan = (slug: string) => {
    const p = packages.find((x) => x.slug === slug);
    if (!p || p.type !== 'annual') throw new Error(slug);
    return p;
  };

  it('prices the plan visits one by one for the plan number of split units', () => {
    // Essential: 2 visits × 3 units × 279 = 1674; the owner's stated saving is 175.
    expect(annualPlanComparison(cfg, plan('essential'))).toEqual({
      units: 3,
      visits: 2,
      deepUnits: 0,
      separate: 1674,
      plan: 1499,
      saving: 175,
      savingPct: 10,
    });
    // Comfort: one visit is 5 × 249 = 1245; in the other, one unit is deep-cleaned (549) and
    // the four standard ones still get the 4+ rate (996). 1245 + 1545 − 2499 = 291.
    expect(annualPlanComparison(cfg, plan('comfort'))).toEqual({
      units: 5,
      visits: 2,
      deepUnits: 1,
      separate: 2790,
      plan: 2499,
      saving: 291,
      savingPct: 10,
    });
  });

  it('returns null for a plan quoted after inspection, without visits or without its lines', () => {
    expect(plan('villa').price).toBeNull();
    expect(annualPlanComparison(cfg, plan('villa'))).toBeNull();
    expect(
      annualPlanComparison(cfg, plan('essential'), { standard: 'nope', deep: 'ac_deep' }),
    ).toBeNull();
    expect(
      annualPlanComparison(cfg, {
        price: 100,
        includes: { units_max: 2, visits: 0, deep_units: 0 },
      }),
    ).toBeNull();
  });
});
