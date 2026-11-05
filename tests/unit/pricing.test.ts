import { describe, expect, it } from 'vitest';
import { seedPackages, seedPriceItems, seedPricingRules, seedServices } from '@/lib/content/seed';
import {
  billableQty,
  buildPricingConfig,
  bundleSavings,
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
      [1, 199],
      [2, 169],
      [4, 149],
    ]);
    expect(line('ac_deep').tiers.map((t) => [t.fromQty, t.price])).toEqual([
      [1, 399],
      [2, 349],
    ]);
    expect(linesForService(cfg, 'mattress-cleaning').map((l) => l.id)).toEqual([
      'mattress_single',
      'mattress_double',
      'mattress_king',
    ]);
    expect(line('fcu_service').minQty).toBe(2);
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
      199, 169, 169, 149, 149,
    ]);
    expect(total({ ac_clean: 3 })).toBe(507);
    expect(total({ ac_clean: 4 })).toBe(596);
    expect(total({ ac_deep: 2 })).toBe(698);
  });

  it('bills minimum charges and flags them', () => {
    expect(billableQty(line('fcu_service'), 1)).toBe(2);
    const q = quote(cfg, { fcu_service: 1 }, noVat);
    expect(q.total).toBe(498);
    expect(q.lines[0]?.minApplied).toBe(true);
    expect(total({ sofa_seat: 2 })).toBe(147);
    expect(total({ sofa_seat: 5 })).toBe(245);
    expect(total({ carpet_sqm: 4 })).toBe(150);
    expect(total({ carpet_sqm: 10 })).toBe(250);
    expect(total({ mattress_single: 1, mattress_king: 1 })).toBe(398);
  });

  it('describes tier ranges', () => {
    expect(tierRanges(line('ac_clean'))).toEqual([
      { from: 1, to: 1, price: 199 },
      { from: 2, to: 3, price: 169 },
      { from: 4, to: null, price: 149 },
    ]);
  });
});

describe('bundles', () => {
  it('applies Fresh Home when it is cheaper than the items', () => {
    const q = quote(cfg, { ac_clean: 3, sofa_seat: 3 }, noVat);
    expect(q.subtotal).toBe(654);
    expect(q.total).toBe(599);
    expect(q.savings).toBe(55);
    expect(q.bundle?.slug).toBe('fresh-home');
  });

  it('keeps à la carte when the bundle path costs more', () => {
    const q = quote(cfg, { ac_clean: 4, sofa_seat: 3 }, noVat);
    expect(q.total).toBe(743);
    expect(q.bundle).toBeNull();
  });

  it('prices the remainder at the full-quantity tier', () => {
    const q = quote(cfg, { ac_clean: 3, sofa_seat: 4 }, noVat);
    expect(q.total).toBe(648);
    expect(q.bundle?.slug).toBe('fresh-home');
  });

  it('reports the seed savings', () => {
    expect(bundleSavings(cfg.bundles[0]!)).toBe(55);
  });
});

describe('suggestBundle', () => {
  it('offers the missing part when it makes the bundle cheaper', () => {
    expect(suggestBundle(cfg, { ac_clean: 3 })).toEqual({
      slug: 'fresh-home',
      add: { sofa_seat: 3 },
      addCost: 92,
      savings: 55,
    });
    expect(suggestBundle(cfg, { sofa_seat: 3 })?.addCost).toBe(452);
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
    expect(q.lines.map((l) => [l.role, l.total])).toEqual([['diagnostics', 149]]);
    expect(q.total).toBe(149);
    expect(q.estimate).toEqual({
      fromLines: [{ lineId: 'repair_labour', from: 199 }],
      credited: true,
    });
  });

  it('keeps fixed refrigerant lines and the refill as "from"', () => {
    const q = quote(cfg, { leak_test: 2, refill: 1 }, noVat);
    expect(q.kind).toBe('estimate');
    expect(q.total).toBe(498);
    expect(q.lines.every((l) => l.role === 'item')).toBe(true);
    expect(q.estimate?.fromLines).toEqual([{ lineId: 'refill', from: 349 }]);
  });

  it('prices an emergency call-out as fixed', () => {
    const q = quote(cfg, { emergency_callout: 1 }, noVat);
    expect(q.kind).toBe('fixed');
    expect(q.total).toBe(149);
  });
});

describe('VAT', () => {
  it('is silent until registered', () => {
    expect(quote(cfg, { ac_clean: 3 }, noVat).vat).toEqual({
      mode: 'none',
      amount: 0,
      totalWithVat: 507,
    });
  });

  it('adds 5% when prices exclude it', () => {
    const vat = { registered: true, included: false };
    expect(quote(cfg, { ac_clean: 3 }, vat).vat).toEqual({
      mode: 'added',
      amount: 25,
      totalWithVat: 532,
    });
    expect(quote(cfg, { ac_clean: 3, sofa_seat: 3 }, vat).vat).toEqual({
      mode: 'added',
      amount: 30,
      totalWithVat: 629,
    });
  });

  it('extracts the amount when prices include it', () => {
    const q = quote(cfg, { ac_clean: 3 }, { registered: true, included: true });
    expect(q.vat).toEqual({ mode: 'included', amount: 24, totalWithVat: 507 });
  });
});

describe('bad input', () => {
  it('sanitises quantities', () => {
    expect([-1, 2.7, Number.NaN, 5000, '3', undefined].map(sanitizeQty)).toEqual([
      0, 2, 0, 999, 3, 0,
    ]);
  });

  it('ignores unknown lines', () => {
    expect(total({ nope: 3, ac_clean: 1 })).toBe(199);
  });
});

describe('seed consistency', () => {
  it('derives the same "from" price the services file states', () => {
    for (const s of seedServices().filter((x) => x.status === 'active')) {
      expect(priceFrom(cfg, s.slug)?.amount, s.slug).toBe(s.price_from);
    }
    expect(priceFrom(cfg, 'humidity-mould-check')).toBeNull();
  });

  it('keeps the bundle compare price equal to the à-la-carte sum', () => {
    const bundle = cfg.bundles[0]!;
    expect(quote(cfg, bundle.includes, noVat).subtotal).toBe(bundle.comparePrice);
  });
});
