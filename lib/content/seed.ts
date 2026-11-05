// TEMPORARY (until phase 2): synchronous, memoised readers of content/seed/*.json, validated with
// the zod schemas from lib/validation/content.ts. The async getters in lib/content/queries.ts wrap
// these and carry the names of the future lib/db/queries, so pages do not change in phase 2.
// Server-only: client components must not import this module (enforced by pnpm lint).
import areasJson from '@/content/seed/areas.json';
import blocksJson from '@/content/seed/blocks.json';
import faqsJson from '@/content/seed/faqs.json';
import pricesJson from '@/content/seed/prices.json';
import servicesJson from '@/content/seed/services.json';
import {
  areasFileSchema,
  blockSchemas,
  blocksFileSchema,
  faqsFileSchema,
  pricesFileSchema,
  servicesFileSchema,
  type Area,
  type BlockKey,
  type BlockValue,
  type Faq,
  type Package,
  type PriceItem,
  type PricingRulesRecord,
  type Service,
} from '@/lib/validation/content';

function memo<T>(load: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= load());
}

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

export const seedServices = memo((): Service[] =>
  servicesFileSchema.parse(servicesJson).services.slice().sort(bySort),
);

const prices = memo(() => pricesFileSchema.parse(pricesJson));
export const seedPriceItems = memo((): PriceItem[] => prices().price_items.slice().sort(bySort));
export const seedPackages = memo((): Package[] => prices().packages.slice().sort(bySort));
export const seedPricingRules = (): PricingRulesRecord => prices().pricing_rules;

export const seedAreas = memo((): Area[] => areasFileSchema.parse(areasJson).areas.slice().sort(bySort));
export const seedFaqs = memo((): Faq[] => faqsFileSchema.parse(faqsJson).faqs.slice().sort(bySort));

const blocks = memo(() => {
  const list = blocksFileSchema.parse(blocksJson).blocks;
  return new Map(list.map((b) => [b.key, b.value]));
});

/** A typed content block. Throws when the seed lacks the key or its value has the wrong shape. */
export function seedBlock<K extends BlockKey>(key: K): BlockValue<K> {
  const raw = blocks().get(key);
  if (raw === undefined) throw new Error(`content/seed/blocks.json: block "${key}" is missing`);
  return blockSchemas[key].parse(raw) as BlockValue<K>;
}

export const seedBlockKeys = (): string[] => [...blocks().keys()];
