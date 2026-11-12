// All price arithmetic lives here (CLAUDE.md rule 4): pure functions over a serializable config
// built from price items, packages and pricing rules. No formatting, no UI strings.
import type {
  BundlePackage,
  Package,
  PriceItem,
  PriceUnit,
  PricingRulesRecord,
} from '@/lib/validation/content';
import type { I18nText } from '@/lib/i18n/text';

export type PriceTier = { fromQty: number; price: number; itemKey: string };

/** One orderable line of the price list; quantity tiers of the same line are merged. */
export type PriceLine = {
  id: string;
  serviceSlug: string;
  unit: PriceUnit;
  /** Minimum charge: fewer units are billed as this many. */
  minQty: number;
  /** Ascending by fromQty; the first tier starts at 1. */
  tiers: PriceTier[];
  name: I18nText;
  note: I18nText;
  sort: number;
};

export type BundleOffer = {
  slug: string;
  price: number;
  comparePrice: number | null;
  /** line id → quantity covered by the bundle price */
  includes: Record<string, number>;
  highlighted: boolean;
};

export type PricingRules = {
  rounding: number;
  vatRate: number;
  diagnosticsCreditedToRepair: boolean;
  diagnosticsItemKey: string;
  quoteOnlyServices: string[];
  /** Lines that already are a diagnosis (a leak test): no diagnostics fee is added next to them. */
  diagnosticLineIds: string[];
  suggestBundleWhenCheaper: boolean;
};

export type PricingConfig = { lines: PriceLine[]; bundles: BundleOffer[]; rules: PricingRules };

/** line id → quantity */
export type Selection = Record<string, number>;

export type VatState = { registered: boolean; included: boolean };

export type QuoteLine = {
  lineId: string;
  serviceSlug: string;
  unit: PriceUnit;
  qty: number;
  billableQty: number;
  minApplied: boolean;
  unitPrice: number;
  total: number;
  role: 'item' | 'diagnostics';
};

export type Quote = {
  /** `estimate` when any selected line is priced "from" (repairs, refrigerant refill). */
  kind: 'fixed' | 'estimate';
  lines: QuoteLine[];
  bundle: { slug: string; price: number; covers: Selection; comparePrice: number | null } | null;
  /** À-la-carte sum of the fixed lines before any bundle. */
  subtotal: number;
  /** What the customer pays now for the fixed part (bundle applied, diagnostics included). */
  total: number;
  savings: number;
  estimate: { fromLines: { lineId: string; from: number }[]; credited: boolean } | null;
  vat: { mode: 'none' | 'included' | 'added'; amount: number; totalWithVat: number };
};

export type BundleSuggestion = {
  slug: string;
  /** What to add to the current selection to reach the bundle. */
  add: Selection;
  addCost: number;
  savings: number;
};

const MAX_QTY = 999;

export function sanitizeQty(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), MAX_QTY);
}

export function buildPricingConfig(
  items: PriceItem[],
  packages: Package[],
  rules: PricingRulesRecord,
): PricingConfig {
  const groups = new Map<string, PriceItem[]>();
  for (const item of items) {
    const id = item.tier_group ?? item.key;
    groups.set(id, [...(groups.get(id) ?? []), item]);
  }
  const lines: PriceLine[] = [];
  for (const [id, group] of groups) {
    const sorted = group.slice().sort((a, b) => a.tier_from_qty - b.tier_from_qty);
    const base = sorted[0]!;
    if (base.tier_from_qty !== 1)
      throw new Error(`pricing: line "${id}" has no tier starting at 1`);
    for (let i = 1; i < sorted.length; i += 1) {
      const tier = sorted[i]!;
      if (tier.tier_from_qty === sorted[i - 1]!.tier_from_qty) {
        throw new Error(`pricing: line "${id}" has duplicate tier ${tier.tier_from_qty}`);
      }
      if (tier.unit !== base.unit || tier.service_slug !== base.service_slug) {
        throw new Error(`pricing: line "${id}" mixes units or services`);
      }
    }
    lines.push({
      id,
      serviceSlug: base.service_slug,
      unit: base.unit,
      minQty: base.min_qty,
      tiers: sorted.map((t) => ({ fromQty: t.tier_from_qty, price: t.price, itemKey: t.key })),
      name: base.name,
      note: base.note,
      sort: base.sort,
    });
  }
  lines.sort((a, b) => a.sort - b.sort);

  const lineIds = new Set(lines.map((l) => l.id));
  const bundles = packages
    .filter((p): p is BundlePackage => p.type === 'bundle' && p.published)
    .map((p) => {
      for (const key of Object.keys(p.includes)) {
        if (!lineIds.has(key))
          throw new Error(`pricing: bundle "${p.slug}" includes unknown line "${key}"`);
      }
      return {
        slug: p.slug,
        price: p.price,
        comparePrice: p.compare_price,
        includes: p.includes,
        highlighted: p.highlighted,
      };
    });

  if (!items.some((i) => i.key === rules.diagnostics_item_key)) {
    throw new Error(`pricing: diagnostics item "${rules.diagnostics_item_key}" is missing`);
  }

  return {
    lines,
    bundles,
    rules: {
      rounding: rules.rounding,
      vatRate: rules.vat_rate,
      diagnosticsCreditedToRepair: rules.diagnostics_credited_to_repair,
      diagnosticsItemKey: rules.diagnostics_item_key,
      quoteOnlyServices: rules.quote_only_services,
      diagnosticLineIds: rules.diagnostic_line_ids ?? [],
      suggestBundleWhenCheaper: rules.suggest_bundle_when_cheaper,
    },
  };
}

export const linesForService = (cfg: PricingConfig, slug: string): PriceLine[] =>
  cfg.lines.filter((l) => l.serviceSlug === slug);

export const findLine = (cfg: PricingConfig, id: string): PriceLine | undefined =>
  cfg.lines.find((l) => l.id === id);

/** The tier that applies to all `qty` units: the one with the largest fromQty ≤ qty. */
export function unitPrice(line: PriceLine, qty: number): number {
  const q = Math.max(1, qty);
  let price = line.tiers[0]!.price;
  for (const tier of line.tiers) if (tier.fromQty <= q) price = tier.price;
  return price;
}

export const billableQty = (line: PriceLine, qty: number): number =>
  qty > 0 ? Math.max(qty, line.minQty) : 0;

export function tierRanges(line: PriceLine): { from: number; to: number | null; price: number }[] {
  return line.tiers.map((tier, i) => ({
    from: tier.fromQty,
    to: i + 1 < line.tiers.length ? line.tiers[i + 1]!.fromQty - 1 : null,
    price: tier.price,
  }));
}

/** Lowest price among a service's lines (what "from AED …" shows). */
export function priceFrom(
  cfg: PricingConfig,
  slug: string,
): { amount: number; unit: PriceUnit } | null {
  let best: { amount: number; unit: PriceUnit } | null = null;
  for (const line of linesForService(cfg, slug)) {
    for (const tier of line.tiers) {
      if (!best || tier.price < best.amount) best = { amount: tier.price, unit: line.unit };
    }
  }
  return best;
}

export const bundleSavings = (bundle: BundleOffer): number | null =>
  bundle.comparePrice === null ? null : bundle.comparePrice - bundle.price;

/** The lines an annual plan's visits are priced against: one standard and one deep clean of split units. */
export const ANNUAL_PLAN_LINES = { standard: 'ac_clean', deep: 'ac_deep' } as const;

export type AnnualPlanTerms = {
  price: number | null;
  includes: { units_max: number | null; visits: number; deep_units: number };
};

export type AnnualComparison = {
  units: number;
  visits: number;
  /** Units deep-cleaned during one of the visits, in place of their standard clean. */
  deepUnits: number;
  /** All the plan's visits booked one by one (before VAT). */
  separate: number;
  plan: number;
  saving: number;
  savingPct: number;
};

const NO_VAT: VatState = { registered: false, included: false };

/**
 * What an annual plan's visits would cost booked one by one, for the plan's number of split
 * units. One visit may deep-clean some of the units instead of their standard clean; the rest of
 * that visit is priced at the tier of the units that remain standard. Null when the plan is
 * quoted after an inspection (no price or no unit count), has no visits, or the price list lacks
 * a line it needs.
 */
export function annualPlanComparison(
  cfg: PricingConfig,
  plan: AnnualPlanTerms,
  lines: { standard: string; deep: string } = ANNUAL_PLAN_LINES,
): AnnualComparison | null {
  const { units_max: unitsMax, visits } = plan.includes;
  if (plan.price === null || unitsMax === null || visits <= 0) return null;
  const units = Math.max(1, Math.floor(unitsMax));
  const deepUnits = Math.min(Math.max(0, Math.floor(plan.includes.deep_units)), units);
  if (!findLine(cfg, lines.standard)) return null;
  if (deepUnits > 0 && !findLine(cfg, lines.deep)) return null;
  const standardVisit = quote(cfg, { [lines.standard]: units }, NO_VAT).total;
  const mixedVisit =
    deepUnits > 0
      ? quote(cfg, { [lines.standard]: units - deepUnits, [lines.deep]: deepUnits }, NO_VAT).total
      : standardVisit;
  const separate = (visits - 1) * standardVisit + mixedVisit;
  const saving = separate - plan.price;
  return {
    units,
    visits,
    deepUnits,
    separate,
    plan: plan.price,
    saving,
    savingPct: separate > 0 ? Math.round((saving / separate) * 100) : 0,
  };
}

function round(cfg: PricingConfig, value: number): number {
  const step = cfg.rules.rounding;
  return Math.round(value / step) * step;
}

function cleanSelection(cfg: PricingConfig, selection: Selection): Selection {
  const out: Selection = {};
  for (const [id, qty] of Object.entries(selection)) {
    const n = sanitizeQty(qty);
    if (n > 0 && findLine(cfg, id)) out[id] = n;
  }
  return out;
}

function lineTotal(line: PriceLine, qty: number): Omit<QuoteLine, 'role'> {
  const billable = billableQty(line, qty);
  const price = unitPrice(line, billable);
  return {
    lineId: line.id,
    serviceSlug: line.serviceSlug,
    unit: line.unit,
    qty,
    billableQty: billable,
    minApplied: billable > qty,
    unitPrice: price,
    total: price * billable,
  };
}

/** Bundle price plus the remainder priced at the tier of the full quantity (customer-favourable). */
function bundlePath(
  cfg: PricingConfig,
  bundle: BundleOffer,
  selection: Selection,
): { total: number; covers: Selection } | null {
  for (const [id, needed] of Object.entries(bundle.includes)) {
    if ((selection[id] ?? 0) < needed) return null;
  }
  let total = bundle.price;
  for (const [id, qty] of Object.entries(selection)) {
    const line = findLine(cfg, id)!;
    if (line.unit === 'from') continue;
    const covered = bundle.includes[id] ?? 0;
    const remainder = qty - covered;
    if (remainder > 0) total += unitPrice(line, billableQty(line, qty)) * remainder;
  }
  return { total, covers: { ...bundle.includes } };
}

export function quote(cfg: PricingConfig, rawSelection: Selection, vat: VatState): Quote {
  const selection = cleanSelection(cfg, rawSelection);
  const lines: QuoteLine[] = [];
  const fromLines: { lineId: string; from: number }[] = [];
  const fixedByService = new Map<string, boolean>();

  for (const [id, qty] of Object.entries(selection)) {
    const line = findLine(cfg, id)!;
    if (line.unit === 'from') {
      fromLines.push({ lineId: id, from: unitPrice(line, qty) });
      fixedByService.set(line.serviceSlug, fixedByService.get(line.serviceSlug) ?? false);
    } else {
      lines.push({ ...lineTotal(line, qty), role: 'item' });
      fixedByService.set(line.serviceSlug, true);
    }
  }

  // A quote-only service with nothing fixed selected is booked as diagnostics + estimate.
  const diagnosticsLine = cfg.lines.find((l) =>
    l.tiers.some((t) => t.itemKey === cfg.rules.diagnosticsItemKey),
  );
  const alreadyDiagnosed = lines.some((l) => cfg.rules.diagnosticLineIds.includes(l.lineId));
  const needsDiagnostics =
    !alreadyDiagnosed &&
    [...fixedByService].some(
      ([slug, hasFixed]) => !hasFixed && cfg.rules.quoteOnlyServices.includes(slug),
    );
  if (needsDiagnostics && diagnosticsLine && !selection[diagnosticsLine.id]) {
    lines.push({ ...lineTotal(diagnosticsLine, 1), role: 'diagnostics' });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  let total = subtotal;
  let bundle: Quote['bundle'] = null;
  for (const offer of cfg.bundles) {
    const path = bundlePath(cfg, offer, selection);
    const diagnostics = lines
      .filter((l) => l.role === 'diagnostics')
      .reduce((s, l) => s + l.total, 0);
    if (path && path.total + diagnostics < total) {
      total = path.total + diagnostics;
      bundle = {
        slug: offer.slug,
        price: offer.price,
        covers: path.covers,
        comparePrice: offer.comparePrice,
      };
    }
  }

  total = round(cfg, total);
  const roundedSubtotal = round(cfg, subtotal);
  const rate = cfg.rules.vatRate;
  let vatOut: Quote['vat'];
  if (!vat.registered) vatOut = { mode: 'none', amount: 0, totalWithVat: total };
  else if (vat.included) {
    const amount = round(cfg, total - total / (1 + rate));
    vatOut = { mode: 'included', amount, totalWithVat: total };
  } else {
    const amount = round(cfg, total * rate);
    vatOut = { mode: 'added', amount, totalWithVat: total + amount };
  }

  return {
    kind: fromLines.length > 0 ? 'estimate' : 'fixed',
    lines,
    bundle,
    subtotal: roundedSubtotal,
    total,
    savings: roundedSubtotal - total,
    estimate:
      fromLines.length > 0 ? { fromLines, credited: cfg.rules.diagnosticsCreditedToRepair } : null,
    vat: vatOut,
  };
}

/** Offer the bundle when the selection already overlaps it and completing it is cheaper. */
export function suggestBundle(
  cfg: PricingConfig,
  rawSelection: Selection,
): BundleSuggestion | null {
  if (!cfg.rules.suggestBundleWhenCheaper) return null;
  const selection = cleanSelection(cfg, rawSelection);
  const noVat: VatState = { registered: false, included: false };
  const before = quote(cfg, selection, noVat);
  if (before.bundle) return null;

  for (const offer of cfg.bundles) {
    const overlaps = Object.keys(offer.includes).some((id) => (selection[id] ?? 0) > 0);
    if (!overlaps) continue;
    const add: Selection = {};
    for (const [id, needed] of Object.entries(offer.includes)) {
      const missing = needed - (selection[id] ?? 0);
      if (missing > 0) add[id] = missing;
    }
    if (Object.keys(add).length === 0) continue;
    const merged: Selection = { ...selection };
    for (const [id, qty] of Object.entries(add)) merged[id] = (merged[id] ?? 0) + qty;
    const after = quote(cfg, merged, noVat);
    if (after.bundle?.slug === offer.slug && after.savings > 0) {
      return { slug: offer.slug, add, addCost: after.total - before.total, savings: after.savings };
    }
  }
  return null;
}
