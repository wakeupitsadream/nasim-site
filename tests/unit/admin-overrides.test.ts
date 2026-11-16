import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Overrides } from '@/lib/db/queries/overrides';

// The stored edits, per kind; the real module reads them from Postgres under 'use cache'.
const stored: Record<string, Overrides> = {};
vi.mock('@/lib/db/queries/overrides', () => ({
  getOverrides: async (kind: string) => stored[kind] ?? {},
  hasDatabase: () => true,
}));

const queries = await import('@/lib/content/queries');
const { getSiteSettings } = await import('@/lib/content/site');
const { priceFrom } = await import('@/lib/pricing');

beforeEach(() => {
  for (const kind of Object.keys(stored)) delete stored[kind];
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('content with the admin edits on top of the seed', () => {
  it('is the seed when nothing is stored', async () => {
    const item = (await queries.getPriceItems()).find((i) => i.key === 'ac_clean_1');
    expect(item?.price).toBe(299);
  });

  it('applies an edited price to tables, "from" prices and bundle comparisons', async () => {
    const before = (await queries.getPackages({ type: 'bundle' })).find(
      (p) => p.slug === 'fresh-home',
    );
    stored.price_item = { ac_clean_2_3: { price: 289 }, ac_clean_4plus: { price: 199 } };
    const items = await queries.getPriceItems({ serviceSlug: 'ac-cleaning' });
    expect(items.map((i) => i.price)).toEqual([299, 289, 199]);
    expect(priceFrom(await queries.getPricingConfig(), 'ac-cleaning')?.amount).toBe(199);
    // Fresh Home covers three split units: its "instead of" follows the 2–3 unit rate.
    const after = (await queries.getPackages({ type: 'bundle' })).find(
      (p) => p.slug === 'fresh-home',
    );
    expect(after?.compare_price).toBe((before?.compare_price ?? 0) + 3 * 10);
  });

  it('ignores a stored edit that no longer fits the schema', async () => {
    stored.price_item = { ac_clean_1: { price: -5 }, ac_clean_2_3: { price: 'free' } };
    const items = await queries.getPriceItems({ serviceSlug: 'ac-cleaning' });
    expect(items.map((i) => i.price)).toEqual([299, 279, 249]);
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('hides a service and brings a hidden one back', async () => {
    stored.service = {
      'curtain-cleaning': { status: 'hidden' },
      'preventive-ac-maintenance': { status: 'active' },
    };
    expect(await queries.getServiceBySlug('curtain-cleaning')).toBeNull();
    const slugs = (await queries.getServices()).map((s) => s.slug);
    expect(slugs).not.toContain('curtain-cleaning');
    expect(slugs).toContain('preventive-ac-maintenance');
  });

  it('puts the saved contacts and VAT over the defaults', async () => {
    expect((await getSiteSettings('en')).contacts.whatsapp).toBe('');
    stored.settings = {
      site: {
        contacts: { phone: '+971501234567', whatsapp: '+971501234567', telegram: '', email: '' },
        vat: { registered: true, included: true },
      },
    };
    const s = await getSiteSettings('ru');
    expect(s.contacts.whatsapp).toBe('+971501234567');
    expect(s.vat).toEqual({ registered: true, included: true });
    expect(s.legal.legalName).toBe('');
  });

  it('falls back to the defaults when the stored settings are malformed', async () => {
    stored.settings = { site: { contacts: { phone: 'call me' } } };
    expect((await getSiteSettings('en')).contacts.phone).toBe('');
  });
});
