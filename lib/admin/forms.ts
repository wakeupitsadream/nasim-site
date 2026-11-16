// Admin forms → typed edits. Pure functions: no database, no next/*; unit-tested.
import { routing } from '@/lib/i18n/routing';
import { buildPricingConfig } from '@/lib/pricing';
import { amountSchema, type FormFields } from '@/lib/validation/admin';
import {
  packageSchema,
  priceItemSchema,
  serviceSchema,
  type Package,
  type PriceItem,
  type PricingRulesRecord,
  type Service,
} from '@/lib/validation/content';
import { toE164 } from '@/lib/validation/phone';
import { siteOverrideSchema, type SiteOverride } from '@/lib/validation/settings';

export type Parsed<T> = { ok: true; data: T } | { ok: false; fields: string[] };
export type Patch = Record<string, unknown>;
export type EntityPatch = { key: string; patch: Patch };

const text = (f: FormFields, name: string): string => (f[name] ?? '').trim();
const checked = (f: FormFields, name: string): boolean => f[name] === 'on';
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const paths = (issues: { path: PropertyKey[] }[]): string[] => [
  ...new Set(issues.map((i) => i.path.map(String).join('.'))),
];

/** The text fields of a submitted form, without React's own `$ACTION_…` entries. */
export const fieldsOf = (data: FormData): Record<string, FormDataEntryValue> =>
  Object.fromEntries([...data.entries()].filter(([name]) => !name.startsWith('$')));

// ---- Settings ----

/** Field names are the paths of `SiteOverride`: `contacts.phone`, `vat.registered`, … */
export function settingsFromForm(f: FormFields): Parsed<SiteOverride> {
  // A national number («050 123 4567») is read as a UAE one; what cannot be read stays as typed
  // and fails the E.164 check below, so the owner sees which field to fix.
  const phone = (name: string) => {
    const v = text(f, name);
    return v === '' ? '' : (toE164(v) ?? v);
  };
  const parsed = siteOverrideSchema.safeParse({
    contacts: {
      phone: phone('contacts.phone'),
      whatsapp: phone('contacts.whatsapp'),
      telegram: text(f, 'contacts.telegram').replace(/^@/, ''),
      email: text(f, 'contacts.email'),
    },
    social: {
      instagram: text(f, 'social.instagram'),
      facebook: text(f, 'social.facebook'),
      tiktok: text(f, 'social.tiktok'),
    },
    legal: {
      legalName: text(f, 'legal.legalName'),
      licenseNo: text(f, 'legal.licenseNo'),
      trn: text(f, 'legal.trn'),
      address: text(f, 'legal.address'),
    },
    vat: { registered: checked(f, 'vat.registered'), included: checked(f, 'vat.included') },
    flags: {
      emergencyEnabled: checked(f, 'flags.emergencyEnabled'),
      showReviews: checked(f, 'flags.showReviews'),
      telegramCtaRu: checked(f, 'flags.telegramCtaRu'),
    },
  });
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, fields: paths(parsed.error.issues) };
}

/** Only the groups that differ: an untouched group keeps following the defaults. */
export function changedSettings(current: SiteOverride, next: SiteOverride): Partial<SiteOverride> {
  const out: Patch = {};
  for (const group of Object.keys(next) as (keyof SiteOverride)[])
    if (!same(current[group], next[group])) out[group] = next[group];
  return out as Partial<SiteOverride>;
}

// ---- Prices ----

export const itemField = (key: string) => `item:${key}`;
export const packageField = (slug: string) => `pkg:${slug}`;

/** A row the admin can price: not "on request" (its price is never shown). */
export const itemEditable = (item: PriceItem): boolean => !item.on_request;
export const packageEditable = (p: Package): boolean => p.price !== null;

export type PriceEdits = { items: EntityPatch[]; packages: EntityPatch[] };

/**
 * The changed prices. A field the form did not send is left alone; a field that is not a price
 * is reported by name. The edited price list must still build a pricing config (tiers, bundles).
 */
export function pricesFromForm(
  f: FormFields,
  items: PriceItem[],
  packages: Package[],
  rules: PricingRulesRecord,
): Parsed<PriceEdits> {
  const bad: string[] = [];
  const read = (name: string, current: number): number | null => {
    if (f[name] === undefined) return null;
    const parsed = amountSchema.safeParse(f[name]);
    if (!parsed.success) {
      bad.push(name);
      return null;
    }
    return parsed.data === current ? null : parsed.data;
  };

  const edits: PriceEdits = { items: [], packages: [] };
  for (const item of items.filter(itemEditable)) {
    const price = read(itemField(item.key), item.price);
    if (price !== null) edits.items.push({ key: item.key, patch: { price } });
  }
  for (const p of packages.filter(packageEditable)) {
    const price = read(packageField(p.slug), p.price ?? 0);
    if (price !== null) edits.packages.push({ key: p.slug, patch: { price } });
  }
  if (bad.length > 0) return { ok: false, fields: bad };

  const itemPatch = new Map(edits.items.map((e) => [e.key, e.patch]));
  const packagePatch = new Map(edits.packages.map((e) => [e.key, e.patch]));
  const nextItems = items.map((i) => priceItemSchema.safeParse({ ...i, ...itemPatch.get(i.key) }));
  const nextPackages = packages.map((p) =>
    packageSchema.safeParse({ ...p, ...packagePatch.get(p.slug) }),
  );
  const broken = [
    ...items.filter((_, n) => !nextItems[n]!.success).map((i) => itemField(i.key)),
    ...packages.filter((_, n) => !nextPackages[n]!.success).map((p) => packageField(p.slug)),
  ];
  if (broken.length > 0) return { ok: false, fields: broken };
  try {
    buildPricingConfig(
      nextItems.map((r) => r.data!),
      nextPackages.map((r) => r.data!),
      rules,
    );
  } catch {
    return { ok: false, fields: [] };
  }
  return { ok: true, data: edits };
}

// ---- Services ----

export const SERVICE_TEXT_FIELDS = ['name', 'short'] as const;
export type ServiceTextField = (typeof SERVICE_TEXT_FIELDS)[number];
export const SERVICE_TEXT_MAX: Record<ServiceTextField, number> = { name: 120, short: 400 };
export const serviceTextField = (field: ServiceTextField, locale: string) => `${field}.${locale}`;

const compact = (value: Record<string, string | undefined>): Record<string, string> =>
  Object.fromEntries(
    routing.locales.flatMap((l) => (l === 'en' || value[l] ? [[l, value[l] ?? '']] : [])),
  );

/** The changed fields of one service (status, name, short description). */
export function serviceFromForm(f: FormFields, service: Service): Parsed<Patch> {
  const bad: string[] = [];
  const next: Patch = { status: f.status ?? service.status };
  for (const field of SERVICE_TEXT_FIELDS) {
    // English always; another locale only when filled in, so an empty one falls back to English.
    const value: Record<string, string> = { en: text(f, serviceTextField(field, 'en')) };
    for (const locale of routing.locales) {
      const name = serviceTextField(field, locale);
      const v = text(f, name);
      if (v.length > SERVICE_TEXT_MAX[field]) bad.push(name);
      if (locale !== 'en' && v !== '') value[locale] = v;
    }
    next[field] = value;
  }
  if (bad.length > 0) return { ok: false, fields: bad };

  const merged = serviceSchema.safeParse({ ...service, ...next });
  if (!merged.success) return { ok: false, fields: paths(merged.error.issues) };

  // Compared without empty translations: the seed stores them as "", the form leaves them out.
  const patch: Patch = {};
  if (merged.data.status !== service.status) patch.status = merged.data.status;
  for (const field of SERVICE_TEXT_FIELDS)
    if (!same(compact(service[field]), compact(merged.data[field])))
      patch[field] = merged.data[field];
  return { ok: true, data: patch };
}
