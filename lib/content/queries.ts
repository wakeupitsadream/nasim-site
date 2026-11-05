// Public-content getters with the signatures of the future lib/db/queries (PHASES, phase 2).
// TEMPORARY bodies read the validated seed (lib/content/seed.ts); phase 2 replaces them with
// 'use cache' + cacheTag queries and nothing above this layer changes. All functions are async
// for that reason, and none read cookies, headers or the clock (ensureStatic pages depend on it).
import {
  seedAreas,
  seedBlock,
  seedFaqs,
  seedPackages,
  seedPriceItems,
  seedPricingRules,
  seedServices,
} from '@/lib/content/seed';
import { buildPricingConfig, type PricingConfig } from '@/lib/pricing';
import type {
  Area,
  BlockKey,
  BlockValue,
  Faq,
  FaqScope,
  Package,
  PriceItem,
  PricingRulesRecord,
  Service,
  ServiceCategory,
  ServiceStatus,
} from '@/lib/validation/content';

export type ServiceFilter = { status?: ServiceStatus[]; category?: ServiceCategory };

/** Services in display order. Hidden ones are never returned unless asked for by status. */
export async function getServices(filter: ServiceFilter = {}): Promise<Service[]> {
  const status = filter.status ?? ['active', 'coming_soon'];
  return seedServices().filter(
    (s) => status.includes(s.status) && (!filter.category || s.category === filter.category),
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
export type MediaKind = 'before_after' | 'team' | 'hero' | 'service';
export type MediaItem = { url: string; alt: string; width: number; height: number; kind: MediaKind };

/** No reviews yet: sections that need them render nothing (never invented, BRIEF §6.1). */
export async function getReviews(): Promise<Review[]> {
  return [];
}

/** No photos yet (BRIEF §15.6): media frames render their placeholder treatment. */
export async function getMedia(_filter: { kind: MediaKind; serviceSlug?: string }): Promise<MediaItem[]> {
  return [];
}
