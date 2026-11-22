import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const LOCALES = [
  { locale: 'en', dir: 'ltr' },
  { locale: 'ar', dir: 'rtl' },
  { locale: 'ru', dir: 'ltr' },
  { locale: 'fr', dir: 'ltr' },
  { locale: 'de', dir: 'ltr' },
  { locale: 'es', dir: 'ltr' },
  { locale: 'zh', dir: 'ltr' },
  { locale: 'hi', dir: 'ltr' },
] as const;

const ROUTES = [
  '',
  '/services',
  '/services/ac-cleaning',
  '/pricing',
  '/annual-contracts',
  '/areas',
  '/areas/dubai-marina',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/thank-you',
];

// next/font may emit the family with spaces or underscores (hashed names).
const ARABIC_FONT = /IBM[ _]Plex[ _]Sans[ _]Arabic/i;

function homeTitle(locale: string): string {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'));
  return messages.Pages.home.title;
}

/** The hero h1 comes from the content block; AR falls back to EN and is marked as such. */
function heroTitle(locale: string): { text: string; lang: string } {
  const blocks = JSON.parse(readFileSync('content/seed/blocks.json', 'utf8')).blocks as {
    key: string;
    value: Record<string, string>;
  }[];
  const value = blocks.find((b) => b.key === 'home.hero.title')!.value;
  return value[locale] ? { text: value[locale], lang: locale } : { text: value.en, lang: 'en' };
}

for (const { locale, dir } of LOCALES) {
  test(`/${locale} sets lang, dir and the translated heading`, async ({ page }) => {
    const response = await page.goto(`/${locale}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', dir);
    await expect(page).toHaveTitle(new RegExp(homeTitle(locale)));
    const hero = heroTitle(locale);
    await expect(page.locator('h1')).toHaveText(hero.text);
    if (hero.lang !== locale) await expect(page.locator('h1')).toHaveAttribute('lang', hero.lang);
    await page.screenshot({ path: `test-results/screenshots/home-${locale}.png`, fullPage: true });
  });
}

test('Arabic font is used on /ar only', async ({ page }) => {
  await page.goto('/ar');
  await page.evaluate(() => document.fonts.ready);
  const arFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(arFamily).toMatch(ARABIC_FONT);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  );
  expect(loaded.some((family) => ARABIC_FONT.test(family))).toBe(true);

  await page.goto('/en');
  const enFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(enFamily.split(',')[0]).not.toMatch(ARABIC_FONT);
});

test('canonical and hreflang alternates are present', async ({ page }) => {
  await page.goto('/ru/pricing');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/ru\/pricing$/);
  for (const lang of ['en', 'ar', 'ru', 'x-default']) {
    await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveCount(1);
  }
});

for (const { locale } of LOCALES) {
  test(`every stub route answers 200 in /${locale}`, async ({ page }) => {
    for (const route of ROUTES) {
      const response = await page.goto(`/${locale}${route}`);
      expect(response?.status(), `/${locale}${route}`).toBe(200);
      await expect(page.locator('h1'), `/${locale}${route}`).not.toBeEmpty();
    }
  });
}

test('every service page answers 200 in every locale', async ({ request }) => {
  const seed = JSON.parse(readFileSync('content/seed/services.json', 'utf8')) as {
    services: { slug: string; status: string }[];
  };
  const slugs = seed.services.filter((s) => s.status !== 'hidden').map((s) => s.slug);
  expect(slugs.length).toBe(15);
  for (const { locale } of LOCALES) {
    for (const slug of slugs) {
      const response = await request.get(`/${locale}/services/${slug}`);
      expect(response.status(), `/${locale}/services/${slug}`).toBe(200);
    }
  }
});

test('/ redirects by Accept-Language', async ({ request }) => {
  const ar = await request.get('/', { headers: { 'Accept-Language': 'ar' }, maxRedirects: 0 });
  expect(ar.status()).toBe(307);
  expect(ar.headers().location).toMatch(/\/ar$/);

  const de = await request.get('/', { headers: { 'Accept-Language': 'de-CH' }, maxRedirects: 0 });
  expect(de.headers().location).toMatch(/\/de$/);

  // A language the site does not speak falls back to English.
  const fallback = await request.get('/', {
    headers: { 'Accept-Language': 'it' },
    maxRedirects: 0,
  });
  expect(fallback.headers().location).toMatch(/\/en$/);
});

test('unknown paths and slugs return a real 404', async ({ request }) => {
  for (const path of [
    '/en/does-not-exist',
    '/unknown.txt',
    '/ar/services/no-such-service',
    // unpublished area: only published areas get a page
    '/en/areas/mirdif',
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test('404 page is localized', async ({ page }) => {
  await page.goto('/ar/services/no-such-service');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveText('الصفحة غير موجودة');

  await page.goto('/ru/does-not-exist');
  await expect(page.locator('h1')).toHaveText('Страница не найдена');
});

// The owner's page copy of 22.11.2026 (DECISIONS №85).
test('service pages carry the owner\'s text: bold lead-ins, closing notes, no "not included"', async ({
  page,
}) => {
  await page.goto('/en/services/ac-repair');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AC Repairs & Diagnostics');
  await expect(
    page.getByText('Our technicians carry common replacement parts and complete most repairs'),
  ).toBeVisible();
  const included = page.locator('section', {
    has: page.getByRole('heading', { name: "What's included" }),
  });
  await expect(included.getByRole('listitem')).toHaveCount(4);
  await expect(included.locator('li strong').first()).toHaveText('Diagnosis.');
  await expect(
    included.getByText('For new AC installations or office VRF system repairs'),
  ).toBeVisible();
  await expect(page.getByText('Not included')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'When you need it' })).toHaveCount(0);

  await page.goto('/en/services/emergency-ac-repair');
  await expect(page.getByText('AED 199 per visit, including diagnostics.')).toBeVisible();
  await expect(page.getByText('For a same-day visit, contact us before 16:00.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Same-day visits' })).toHaveCount(0);

  // A service the document does not cover keeps its page, minus the "not included" list.
  await page.goto('/en/services/ac-cleaning');
  await expect(page.getByRole('heading', { name: "What's included" })).toBeVisible();
  await expect(page.getByText('Not included')).toHaveCount(0);

  await page.goto('/ar/services/ac-deep-cleaning');
  await expect(page.locator('#included-title ~ ul li strong').first()).toBeVisible();
});

test("/about follows the owner's text", async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Us');
  await expect(
    page.getByText('Before your visit, you receive a fixed price that includes the call-out.'),
  ).toBeVisible();
  const expect_ = page.locator('section', {
    has: page.getByRole('heading', { name: 'What to expect from your visit' }),
  });
  await expect(expect_.getByRole('listitem')).toHaveCount(4);
  await expect(expect_.locator('li strong').first()).toHaveText('A one-hour arrival window.');
  await expect(page.getByRole('heading', { name: 'Specialist work' })).toBeVisible();
  await expect(
    page.getByText('For mould removal from walls, we can arrange a licensed partner.'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Why we started with air conditioners' }),
  ).toHaveCount(0);
});
