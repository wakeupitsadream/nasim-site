import { z } from 'zod';

// Shapes of content/seed/*.json (snake_case, as stored). Phase 2 reuses these schemas for the
// seed script and the admin forms; the DB rows carry the same fields.

/**
 * Localized text as stored: EN is the source, every other locale (lib/i18n/routing.ts, in the
 * same order) may be empty until translated. Spelled out so the admin forms and the DB rows have
 * one explicit shape; tests/unit/content.test.ts checks the keys against the routing.
 */
export const i18nText = z.object({
  en: z.string(),
  ar: z.string().optional(),
  ru: z.string().optional(),
  fr: z.string().optional(),
  de: z.string().optional(),
  zh: z.string().optional(),
  hi: z.string().optional(),
});
export const i18nTextRequired = i18nText.extend({ en: z.string().min(1) });

/** Localized structured value (array or object). Locale variants may be missing or empty. */
export const i18nValue = <T extends z.ZodTypeAny>(schema: T) => {
  const variant = z.union([schema, z.object({}).strict(), z.array(z.never())]).optional();
  return z.object({
    en: schema,
    ar: variant,
    ru: variant,
    fr: variant,
    de: variant,
    zh: variant,
    hi: variant,
  });
};

export const serviceCategorySchema = z.enum(['ac', 'upholstery', 'coming_soon']);
export const serviceStatusSchema = z.enum(['active', 'coming_soon', 'hidden']);
export const pricingUnitSchema = z.enum([
  'unit',
  'fcu',
  'visit',
  'seat',
  'item',
  'sqm',
  'from',
  'quote',
]);
export const priceUnitSchema = z.enum(['unit', 'fcu', 'visit', 'seat', 'item', 'sqm', 'from']);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

export const serviceGroupSchema = z.enum(['cleaning', 'addon', 'service']);
export type ServiceGroup = z.infer<typeof serviceGroupSchema>;

export const serviceSchema = z.object({
  slug: z.string().min(1),
  category: serviceCategorySchema,
  /** Sub-section of the AC catalogue (DECISIONS №61); other categories have none. */
  group: serviceGroupSchema.optional(),
  status: serviceStatusSchema,
  sort: z.number().int(),
  name: i18nTextRequired,
  short: i18nText,
  description_html: i18nText,
  includes: z.array(i18nText),
  excludes: z.array(i18nText),
  symptoms: z.array(i18nText),
  visit_steps: z.array(i18nText),
  duration_min: z.number().int().positive().nullable(),
  price_from: z.number().nonnegative().nullable(),
  pricing_unit: pricingUnitSchema,
  available_from: isoDate.nullable(),
  seo_title: i18nText,
  seo_description: i18nText,
});

export const priceItemSchema = z.object({
  service_slug: z.string().min(1),
  key: z.string().min(1),
  /** Items that are quantity tiers of one line share a group; the group is the line id. */
  tier_group: z.string().min(1).optional(),
  name: i18nTextRequired,
  unit: priceUnitSchema,
  price: z.number().nonnegative(),
  /** Minimum charge: fewer units are billed as this many. */
  min_qty: z.number().int().positive(),
  tier_from_qty: z.number().int().positive(),
  note: i18nText,
  sort: z.number().int(),
});

const packageBase = {
  slug: z.string().min(1),
  sort: z.number().int(),
  highlighted: z.boolean(),
  published: z.boolean(),
  name: i18nTextRequired,
  description: i18nText,
  price: z.number().nonnegative(),
  compare_price: z.number().nonnegative().nullable(),
};
export const bundlePackageSchema = z.object({
  ...packageBase,
  type: z.literal('bundle'),
  /** line id → quantity covered by the bundle price */
  includes: z.record(z.string(), z.number().int().positive()),
});
export const annualPackageSchema = z.object({
  ...packageBase,
  type: z.literal('annual'),
  /** Null = quoted after an inspection (the Villa plan, DECISIONS №61). */
  price: z.number().nonnegative().nullable(),
  includes: z.object({
    /** Split units covered; null when the plan is sized at the inspection. */
    units_max: z.number().int().positive().nullable(),
    visits: z.number().int().positive(),
    /** Units that get a deep clean during one visit, in place of their standard clean. */
    deep_units: z.number().int().nonnegative(),
    /** Priority scheduling (earlier slots, no promised response time). */
    priority: z.boolean(),
    /** Discount on repair labour, per cent. */
    repair_discount_pct: z.number().int().nonnegative(),
  }),
});
export const packageSchema = z.discriminatedUnion('type', [
  bundlePackageSchema,
  annualPackageSchema,
]);

export const pricingRulesSchema = z.object({
  currency: z.literal('AED'),
  rounding: z.number().positive(),
  vat_rate: z.number().min(0).max(1),
  diagnostics_credited_to_repair: z.boolean(),
  diagnostics_item_key: z.string().min(1),
  quote_only_services: z.array(z.string()),
  /** Lines that are a diagnosis in themselves: no separate diagnostics fee next to them. */
  diagnostic_line_ids: z.array(z.string()).default([]),
  suggest_bundle_when_cheaper: z.boolean(),
});

export const areaSchema = z.object({
  slug: z.string().min(1),
  featured: z.boolean(),
  published: z.boolean(),
  sort: z.number().int(),
  eta_minutes: z.number().int().positive(),
  name: i18nTextRequired,
  intro_html: i18nText,
});

const faqBase = { sort: z.number().int(), question: i18nTextRequired, answer_html: i18nText };
export const faqSchema = z.discriminatedUnion('scope', [
  z.object({ ...faqBase, scope: z.literal('global') }),
  z.object({ ...faqBase, scope: z.literal('contracts') }),
  z.object({ ...faqBase, scope: z.literal('service'), service_slug: z.string().min(1) }),
  z.object({ ...faqBase, scope: z.literal('area'), area_slug: z.string().min(1) }),
]);
export const faqScopeSchema = z.enum(['global', 'contracts', 'service', 'area']);

const titledItem = z.object({ title: z.string(), text: z.string() });
/** A locale variant of `report.readings`: only the label is translated, the numbers are EN's. */
const readingsLabel = z.object({ label: z.string() }).partial().optional();

/**
 * Typed content blocks by key. Only blocks the pages read are listed; the seed may hold more
 * (templates for phase 4, legal drafts). `kind` matches the seed; values are localized.
 */
export const blockSchemas = {
  'home.hero.title': i18nTextRequired,
  'home.hero.subtitle': i18nText,
  'home.hero.cta_primary': i18nText,
  'home.hero.cta_secondary': i18nText,
  'home.trust.items': i18nValue(z.array(z.string())),
  'home.how.steps': i18nValue(z.array(titledItem)),
  'home.why.title': i18nText,
  'home.why.items': i18nValue(z.array(titledItem)),
  'guarantee.text': i18nText,
  'report.mockup': i18nValue(z.object({ header: z.string(), lines: z.array(z.string()) })),
  'report.readings': z.object({
    en: z.object({ before_c: z.number(), after_c: z.number(), label: z.string() }),
    ru: readingsLabel,
    ar: readingsLabel,
    fr: readingsLabel,
    de: readingsLabel,
    zh: readingsLabel,
    hi: readingsLabel,
  }),
  'service.ac-deep-cleaning.age_note': i18nText,
  'service.refrigerant-leak-refill.principle': i18nValue(z.array(titledItem)),
  'service.ducted-ac-fcu-service.vs_split': i18nText,
  'pricing.factors': i18nValue(z.array(titledItem)),
  'about.body': i18nText,
  'about.not_doing': i18nText,
  'contact.response_note': i18nText,
  'thankyou.title': i18nText,
  'thankyou.text': i18nText,
  'wa.template.generic': i18nText,
  'wa.template.emergency': i18nText,
  'wa.template.quote': i18nText,
  'wa.template.contract': i18nText,
  'wa.template.waitlist': i18nText,
} as const;

export type BlockKey = keyof typeof blockSchemas;
export type BlockValue<K extends BlockKey> = z.infer<(typeof blockSchemas)[K]>;

export const blockRecordSchema = z.object({
  key: z.string().min(1),
  kind: z.enum(['text', 'html', 'json']),
  value: z.unknown(),
});

/**
 * Photos (content/seed/media.json until the phase-2 media library). `hero`: the home hero;
 * `band`: a dimmed backdrop of the closing band; `category`: the two wizard cards; `service`: the
 * photo slot of one service page; `team` / `before_after`: reserved for real photos later.
 */
export const mediaKindSchema = z.enum([
  'hero',
  'why',
  'band',
  'category',
  'catalogue',
  'pricing',
  'service',
  'team',
  'before_after',
]);
export const mediaRecordSchema = z.object({
  kind: mediaKindSchema,
  service_slug: z.string().min(1).optional(),
  category: z.enum(['ac', 'upholstery']).optional(),
  /** Site-relative path under public/ (DB rows will carry Blob URLs instead). */
  url: z.string().regex(/^\/[^\s]+\.(jpe?g|png|webp|avif)$/, 'site-relative image path'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: i18nTextRequired,
  /**
   * Where a stock photo came from (credits line in the footer when the licence asks for it,
   * and for replacing stock with our own). Absent on the owner's own pictures.
   */
  credit: z
    .object({
      author: z.string().min(1),
      source: z.string().url(),
      license: z.string().min(1),
    })
    .optional(),
  sort: z.number().int(),
});

// Seed file wrappers. `_comment` is documentation for editors; looseObject lets it through.
export const servicesFileSchema = z.looseObject({ services: z.array(serviceSchema) });
export const pricesFileSchema = z.looseObject({
  price_items: z.array(priceItemSchema),
  packages: z.array(packageSchema),
  pricing_rules: pricingRulesSchema,
});
export const areasFileSchema = z.looseObject({ areas: z.array(areaSchema) });
export const faqsFileSchema = z.looseObject({ faqs: z.array(faqSchema) });
export const blocksFileSchema = z.looseObject({ blocks: z.array(blockRecordSchema) });
export const mediaFileSchema = z.looseObject({ media: z.array(mediaRecordSchema) });

export type Service = z.infer<typeof serviceSchema>;
export type ServiceCategory = z.infer<typeof serviceCategorySchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type PricingUnit = z.infer<typeof pricingUnitSchema>;
export type PriceUnit = z.infer<typeof priceUnitSchema>;
export type PriceItem = z.infer<typeof priceItemSchema>;
export type Package = z.infer<typeof packageSchema>;
export type BundlePackage = z.infer<typeof bundlePackageSchema>;
export type AnnualPackage = z.infer<typeof annualPackageSchema>;
export type PricingRulesRecord = z.infer<typeof pricingRulesSchema>;
export type Area = z.infer<typeof areaSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type FaqScope = z.infer<typeof faqScopeSchema>;
export type MediaKind = z.infer<typeof mediaKindSchema>;
export type MediaRecord = z.infer<typeof mediaRecordSchema>;
