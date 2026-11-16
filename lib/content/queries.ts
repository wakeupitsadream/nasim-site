// Public-content getters. The content is the validated seed (lib/content/seed.ts) with the
// admin's edits on top (lib/db/queries/overrides.ts, cached with 'use cache' + tags); without a
// database the seed alone is served. All functions are async and none read cookies, headers or
// the clock (ensureStatic pages depend on it).
import {
  seedAreas,
  seedBlock,
  seedFaqs,
  seedMedia,
  seedPackages,
  seedPriceItems,
  seedPricingRules,
  seedServices,
} from '@/lib/content/seed';
import { getOverrides, type Overrides } from '@/lib/db/queries/overrides';
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import { buildPricingConfig, quote, type PricingConfig } from '@/lib/pricing';
import {
  packageSchema,
  priceItemSchema,
  serviceSchema,
} from '@/lib/validation/content';
import type {
  Area,
  BlockKey,
  BlockValue,
  Faq,
  FaqScope,
  MediaKind,
  MediaRecord,
  Package,
  PriceItem,
  PricingRulesRecord,
  Service,
  ServiceCategory,
  ServiceGroup,
  ServiceStatus,
} from '@/lib/validation/content';

type Parser<T> = { safeParse: (v: unknown) => { success: true; data: T } | { success: false } };

/** Seed entity + the admin's edited fields; an edit that no longer fits the schema is ignored. */
function withOverride<T extends object>(schema: Parser<T>, base: T, patch: unknown, id: string): T {
  if (!patch) return base;
  const merged = schema.safeParse({ ...base, ...(patch as object) });
  if (merged.success) return merged.data;
  console.error(`[content] stored edit of "${id}" does not match the schema; the seed is shown`);
  return base;
}

const edited = (o: Overrides): boolean => Object.keys(o).length > 0;
const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

/** Every service, hidden ones included (the admin lists them). */
export async function allServices(): Promise<Service[]> {
  const over = await getOverrides('service');
  if (!edited(over)) return seedServices();
  return seedServices()
    .map((s) => withOverride(serviceSchema, s, over[s.slug], `service:${s.slug}`))
    .sort(bySort);
}

export async function allPriceItems(): Promise<PriceItem[]> {
  const over = await getOverrides('price_item');
  if (!edited(over)) return seedPriceItems();
  return seedPriceItems().map((p) =>
    withOverride(priceItemSchema, p, over[p.key], `price_item:${p.key}`),
  );
}

/**
 * Every package. A bundle's "instead of" price is never stored: it is the à-la-carte sum of
 * what the bundle covers at today's prices, so it follows a price edit by itself.
 */
export async function allPackages(): Promise<Package[]> {
  const [over, items] = await Promise.all([getOverrides('package'), allPriceItems()]);
  const packages = edited(over)
    ? seedPackages().map((p) => withOverride(packageSchema, p, over[p.slug], `package:${p.slug}`))
    : seedPackages();
  const cfg = buildPricingConfig(items, packages, seedPricingRules());
  const noVat = { registered: false, included: false };
  return packages.map((p) =>
    p.type === 'bundle'
      ? { ...p, compare_price: quote({ ...cfg, bundles: [] }, p.includes, noVat).subtotal }
      : p,
  );
}

export type ServiceFilter = {
  status?: ServiceStatus[];
  category?: ServiceCategory;
  group?: ServiceGroup;
};

/** Services in display order. Hidden ones are never returned unless asked for by status. */
export async function getServices(filter: ServiceFilter = {}): Promise<Service[]> {
  const status = filter.status ?? ['active', 'coming_soon'];
  return (await allServices()).filter(
    (s) =>
      status.includes(s.status) &&
      (!filter.category || s.category === filter.category) &&
      (!filter.group || s.group === filter.group),
  );
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return (await allServices()).find((s) => s.slug === slug && s.status !== 'hidden') ?? null;
}

/** "Usually booked together": nearest active services of the same category, then one from the other. */
export async function getRelatedServices(slug: string, limit = 3): Promise<Service[]> {
  const services = await allServices();
  const all = services.filter((s) => s.status === 'active' && s.slug !== slug);
  const current = services.find((s) => s.slug === slug);
  if (!current) return all.slice(0, limit);
  const same = all
    .filter((s) => s.category === current.category)
    .sort((a, b) => Math.abs(a.sort - current.sort) - Math.abs(b.sort - current.sort));
  const other = all.filter((s) => s.category !== current.category);
  const picked = [...same.slice(0, Math.max(limit - 1, 0)), ...other.slice(0, 1)];
  return [...picked, ...same.slice(Math.max(limit - 1, 0))].slice(0, limit);
}

export async function getPriceItems(filter: { serviceSlug?: string } = {}): Promise<PriceItem[]> {
  return (await allPriceItems()).filter(
    (p) => !filter.serviceSlug || p.service_slug === filter.serviceSlug,
  );
}

/**
 * A service's rows in price tables: its own, then those of the hidden services folded into it
 * (`covers`). A folded service priced on request gets one "on request" row under its own name.
 */
export async function getPriceRows(serviceSlug: string): Promise<PriceItem[]> {
  const [services, items] = await Promise.all([allServices(), allPriceItems()]);
  const service = services.find((s) => s.slug === serviceSlug);
  if (!service) return [];
  const own = items.filter((i) => i.service_slug === serviceSlug);
  const folded = (service.covers ?? []).flatMap((slug): PriceItem[] => {
    const covered = services.find((s) => s.slug === slug);
    if (!covered) return [];
    const rows = items.filter((i) => i.service_slug === slug);
    if (rows.length > 0) return rows;
    return [
      {
        service_slug: slug,
        key: `on-request:${slug}`,
        name: covered.name,
        unit: 'visit',
        price: 0,
        min_qty: 1,
        tier_from_qty: 1,
        note: { en: '' },
        sort: 0,
        on_request: true,
      },
    ];
  });
  return [...own, ...folded];
}

export async function getPackages(filter: { type?: Package['type'] } = {}): Promise<Package[]> {
  return (await allPackages()).filter((p) => p.published && (!filter.type || p.type === filter.type));
}

export async function getPricingRules(): Promise<PricingRulesRecord> {
  return seedPricingRules();
}

/** Serializable config for lib/pricing.ts (the booking wizard receives it as a prop). */
export async function getPricingConfig(): Promise<PricingConfig> {
  const [items, packages] = await Promise.all([allPriceItems(), allPackages()]);
  return buildPricingConfig(items, packages, seedPricingRules());
}

/** Published areas only (BRIEF §5: unpublished drafts never get a page or a link). */
export async function getAreas(filter: { featured?: boolean } = {}): Promise<Area[]> {
  return seedAreas().filter(
    (a) => a.published && (filter.featured === undefined || a.featured === filter.featured),
  );
}

export async function getAreaBySlug(slug: string): Promise<Area | null> {
  return seedAreas().find((a) => a.slug === slug && a.published) ?? null;
}

/** FAQs of one scope; `ref` is the service or area slug for scoped questions. */
export async function getFaqs(scope: FaqScope, ref?: string): Promise<Faq[]> {
  return seedFaqs().filter((f) => {
    if (f.scope !== scope) return false;
    if (f.scope === 'service') return f.service_slug === ref;
    if (f.scope === 'area') return f.area_slug === ref;
    return true;
  });
}

export async function getBlock<K extends BlockKey>(key: K): Promise<BlockValue<K>> {
  return seedBlock(key);
}

export type Review = { author: string; source: 'google' | 'whatsapp'; text: string; rating: number };
export type MediaItem = MediaRecord;
export type MediaFilter = { kind: MediaKind; serviceSlug?: string; category?: 'ac' | 'upholstery' };

/** No reviews yet: sections that need them render nothing (never invented, BRIEF §6.1). */
export async function getReviews(): Promise<Review[]> {
  return [];
}

/**
 * Photos of one kind, in order (content/seed/media.json: licensed stock as stand-ins until the
 * owner's own photos arrive through the admin, DECISIONS №53). Frames without a photo keep their
 * placeholder treatment (BRIEF §15.6).
 */
export async function getMedia(filter: MediaFilter): Promise<MediaItem[]> {
  return seedMedia().filter(
    (m) =>
      m.kind === filter.kind &&
      (filter.serviceSlug === undefined || m.service_slug === filter.serviceSlug) &&
      (filter.category === undefined || m.category === filter.category),
  );
}

/** An attribution the licence obliges us to show (Creative Commons BY): one line per author. */
export type PhotoCredit = { author: string; source: string; license: string };

/** Distinct CC-licensed authors across the media library, for the footer line (DECISIONS №57). */
export async function getPhotoCredits(): Promise<PhotoCredit[]> {
  const byAuthor = new Map<string, PhotoCredit>();
  for (const { credit } of seedMedia()) {
    if (!credit || !credit.license.startsWith('CC ')) continue;
    if (!byAuthor.has(credit.author)) byAuthor.set(credit.author, { ...credit });
  }
  return [...byAuthor.values()];
}

/** A photo as components render it: the locale's alt already picked. */
export type Photo = {
  url: string;
  alt: string;
  width: number;
  height: number;
  /** The frame the picture asks for on a service page (media.json `frame`). */
  frame?: MediaRecord['frame'];
};

/** The first photo of a kind, picked for the locale, or null. */
export async function getPhoto(filter: MediaFilter, locale: Locale): Promise<Photo | null> {
  const [item] = await getMedia(filter);
  if (!item) return null;
  return {
    url: item.url,
    alt: pickLocalized(item.alt, locale).text,
    width: item.width,
    height: item.height,
    frame: item.frame,
  };
}
