import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const LOCALES = [
  { locale: 'en', dir: 'ltr' },
  { locale: 'ar', dir: 'rtl' },
  { locale: 'ru', dir: 'ltr' },
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
  expect(slugs.length).toBe(12);
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

  const fallback = await request.get('/', {
    headers: { 'Accept-Language': 'de' },
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
