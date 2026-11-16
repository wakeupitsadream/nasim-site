// Public-content getters with the signatures of the future lib/db/queries (PHASES, phase 2).
// TEMPORARY bodies read the validated seed (lib/content/seed.ts); phase 2 replaces them with
// 'use cache' + cacheTag queries and nothing above this layer changes. All functions are async
// for that reason, and none read cookies, headers or the clock (ensureStatic pages depend on it).
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
import type { Locale } from '@/lib/i18n/routing';
import { pickLocalized } from '@/lib/i18n/text';
import { buildPricingConfig, type PricingConfig } from '@/lib/pricing';
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

export type ServiceFilter = {
  status?: ServiceStatus[];
  category?: ServiceCategory;
  group?: ServiceGroup;
};

/** Services in display order. Hidden ones are never returned unless asked for by status. */
export async function getServices(filter: ServiceFilter = {}): Promise<Service[]> {
  const status = filter.status ?? ['active', 'coming_soon'];
  return seedServices().filter(
    (s) =>
      status.includes(s.status) &&
      (!filter.category || s.category === filter.category) &&
      (!filter.group || s.group === filter.group),
  );
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return seedServices().find((s) => s.slug === slug && s.status !== 'hidden') ?? null;
}

/** "Usually booked together": nearest active services of the same category, then one from the other. */
export async function getRelatedServices(slug: string, limit = 3): Promise<Service[]> {
  const all = seedServices().filter((s) => s.status === 'active' && s.slug !== slug);
  const current = seedServices().find((s) => s.slug === slug);
  if (!current) return all.slice(0, limit);
  const same = all
    .filter((s) => s.category === current.category)
    .sort((a, b) => Math.abs(a.sort - current.sort) - Math.abs(b.sort - current.sort));
  const other = all.filter((s) => s.category !== current.category);
  const picked = [...same.slice(0, Math.max(limit - 1, 0)), ...other.slice(0, 1)];
  return [...picked, ...same.slice(Math.max(limit - 1, 0))].slice(0, limit);
}

export async function getPriceItems(filter: { serviceSlug?: string } = {}): Promise<PriceItem[]> {
  return seedPriceItems().filter((p) => !filter.serviceSlug || p.service_slug === filter.serviceSlug);
}

export async function getPackages(filter: { type?: Package['type'] } = {}): Promise<Package[]> {
  return seedPackages().filter((p) => p.published && (!filter.type || p.type === filter.type));
}

export async function getPricingRules(): Promise<PricingRulesRecord> {
  return seedPricingRules();
}

/** Serializable config for lib/pricing.ts (the booking wizard receives it as a prop). */
export async function getPricingConfig(): Promise<PricingConfig> {
  return buildPricingConfig(seedPriceItems(), seedPackages(), seedPricingRules());
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
export type Photo = { url: string; alt: string; width: number; height: number };

/** The first photo of a kind, picked for the locale, or null. */
export async function getPhoto(filter: MediaFilter, locale: Locale): Promise<Photo | null> {
  const [item] = await getMedia(filter);
  if (!item) return null;
  return {
    url: item.url,
    alt: pickLocalized(item.alt, locale).text,
    width: item.width,
    height: item.height,
  };
}
