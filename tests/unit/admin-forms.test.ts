import { describe, expect, it } from 'vitest';
import {
  changedSettings,
  fieldsOf,
  itemField,
  packageField,
  pricesFromForm,
  serviceFromForm,
  settingsFromForm,
} from '@/lib/admin/forms';
import { describeChange } from '@/lib/admin/changes';
import { dictionary, fill } from '@/lib/admin/i18n';
import { seedPackages, seedPriceItems, seedPricingRules, seedServices } from '@/lib/content/seed';
import { formFieldsSchema, loginSchema } from '@/lib/validation/admin';

const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

describe('admin dictionaries', () => {
  it('have the same keys and placeholders in Russian and English', () => {
    const ru = dictionary('ru');
    const en = dictionary('en');
    expect(keys(ru).sort()).toEqual(keys(en).sort());
    const flat = (o: object) =>
      JSON.stringify(o)
        .match(/\{\w+\}/g)
        ?.sort();
    expect(flat(ru)).toEqual(flat(en));
  });

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(fill('от {n} шт.', { n: 4 })).toBe('от 4 шт.');
    expect(fill('{a} и {b}', { a: 'x' })).toBe('x и {b}');
  });
});

describe('admin form fields', () => {
  it('drops the framework entries and refuses files', () => {
    const data = new FormData();
    data.set('$ACTION_ID_1', 'x');
    data.set('status', 'active');
    expect(fieldsOf(data)).toEqual({ status: 'active' });
    data.set('upload', new Blob(['x']));
    expect(formFieldsSchema.safeParse(fieldsOf(data)).success).toBe(false);
  });

  it('normalises the sign-in email', () => {
    const parsed = loginSchema.parse({ email: '  Owner@Example.TEST ', password: 'x' });
    expect(parsed.email).toBe('owner@example.test');
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
  });
});

describe('settings form', () => {
  const empty = settingsFromForm({});

  it('reads an empty form as empty contacts and switched-off flags', () => {
    expect(empty).toMatchObject({
      ok: true,
      data: { contacts: { phone: '', whatsapp: '' }, vat: { registered: false } },
    });
  });

  it('stores phones in E.164, reading national numbers as UAE ones', () => {
    const parsed = settingsFromForm({
      'contacts.phone': '050 123 4567',
      'contacts.whatsapp': '+971 50 123 4567',
      'contacts.telegram': '@brigada',
      'vat.registered': 'on',
    });
    expect(parsed).toMatchObject({
      ok: true,
      data: {
        contacts: { phone: '+971501234567', whatsapp: '+971501234567', telegram: 'brigada' },
        vat: { registered: true, included: false },
      },
    });
  });

  it('names the fields that did not pass', () => {
    const parsed = settingsFromForm({
      'contacts.phone': '12',
      'contacts.email': 'not-an-email',
      'social.instagram': 'http://insecure.example',
    });
    expect(parsed).toEqual({
      ok: false,
      fields: ['contacts.phone', 'contacts.email', 'social.instagram'],
    });
  });

  it('patches only the groups that changed', () => {
    if (!empty.ok) throw new Error('unreachable');
    const next = { ...empty.data, vat: { registered: true, included: true } };
    expect(changedSettings(empty.data, next)).toEqual({ vat: next.vat });
    expect(changedSettings(empty.data, empty.data)).toEqual({});
  });
});

describe('prices form', () => {
  const items = seedPriceItems();
  const packages = seedPackages();
  const rules = seedPricingRules();
  const parse = (f: Record<string, string>) => pricesFromForm(f, items, packages, rules);

  it('returns only the prices that changed', () => {
    const same = Object.fromEntries(
      items.filter((i) => !i.on_request).map((i) => [itemField(i.key), String(i.price)]),
    );
    expect(parse(same)).toEqual({ ok: true, data: { items: [], packages: [] } });
    expect(
      parse({ ...same, [itemField('ac_clean_1')]: '305', [packageField('fresh-home')]: '1149,50' }),
    ).toEqual({
      ok: true,
      data: {
        items: [{ key: 'ac_clean_1', patch: { price: 305 } }],
        packages: [{ key: 'fresh-home', patch: { price: 1149.5 } }],
      },
    });
  });

  it('refuses what is not a price and names the field', () => {
    for (const bad of ['abc', '', '0', '-5', '1e3', '12.345', '1234567'])
      expect(parse({ [itemField('ac_clean_1')]: bad })).toEqual({
        ok: false,
        fields: [itemField('ac_clean_1')],
      });
  });

  it('never prices a row or a plan that is quoted on request', () => {
    const onRequest = items.find((i) => i.on_request)!;
    const quoted = packages.find((p) => p.price === null)!;
    expect(
      parse({ [itemField(onRequest.key)]: '500', [packageField(quoted.slug)]: '500' }),
    ).toEqual({ ok: true, data: { items: [], packages: [] } });
  });
});

describe('service form', () => {
  const service = seedServices().find((s) => s.slug === 'ac-cleaning')!;
  const form = (over: Record<string, string> = {}) => ({
    status: service.status,
    ...Object.fromEntries(
      (['name', 'short'] as const).flatMap((field) =>
        Object.entries(service[field]).map(([locale, v]) => [`${field}.${locale}`, v ?? '']),
      ),
    ),
    ...over,
  });

  it('finds no change in an untouched form', () => {
    expect(serviceFromForm(form(), service)).toEqual({ ok: true, data: {} });
  });

  it('patches the status and an edited text, dropping an emptied translation', () => {
    const parsed = serviceFromForm(form({ status: 'hidden', 'name.ru': '  ' }), service);
    if (!parsed.ok) throw new Error('unreachable');
    expect(Object.keys(parsed.data).sort()).toEqual(['name', 'status']);
    expect(parsed.data.status).toBe('hidden');
    expect(parsed.data.name).not.toHaveProperty('ru');
    expect(parsed.data.name).toMatchObject({ en: service.name.en });
  });

  it('requires the English name and a known status', () => {
    expect(serviceFromForm(form({ 'name.en': '' }), service)).toEqual({
      ok: false,
      fields: ['name.en'],
    });
    expect(serviceFromForm(form({ status: 'deleted' }), service)).toEqual({
      ok: false,
      fields: ['status'],
    });
    expect(serviceFromForm(form({ 'short.de': 'x'.repeat(401) }), service)).toEqual({
      ok: false,
      fields: ['short.de'],
    });
  });
});

describe('audit entries in words', () => {
  const m = dictionary('ru');

  it('shows a price change against the seed, then against the previous edit', () => {
    const first = { kind: 'price_item', before: null, after: { price: 305 } };
    expect(describeChange(m, first, () => 299)).toBe('299 → 305');
    const second = { kind: 'price_item', before: { price: 305 }, after: { price: 299 } };
    expect(describeChange(m, second, () => 299)).toBe('305 → 299');
  });

  it('names statuses and changed texts, and only what changed in this edit', () => {
    const entry = {
      kind: 'service',
      before: { status: 'hidden' },
      after: { status: 'active', name: { en: 'New name' } },
    };
    expect(describeChange(m, entry, () => 'x')).toBe('Скрыта → На сайте · Название');
    const untouched = {
      kind: 'service',
      before: { status: 'active' },
      after: { status: 'active' },
    };
    expect(describeChange(m, untouched, () => 'x')).toBe('');
  });

  it('lists the groups of settings that were saved', () => {
    const entry = { kind: 'settings', before: null, after: { contacts: {}, vat: {} } };
    expect(describeChange(m, entry, () => undefined)).toBe('Контакты · VAT');
  });
});
