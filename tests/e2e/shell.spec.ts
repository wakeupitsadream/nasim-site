import { expect, test } from '@playwright/test';
import { DESKTOP, MOBILE, msg } from './helpers';

test.describe('language switcher', () => {
  test('static HTML already links the same page in every locale', async ({ request }) => {
    const html = await (await request.get('/en/services/ac-cleaning')).text();
    expect(html).toContain('href="/ar/services/ac-cleaning"');
    expect(html).toContain('href="/ru/services/ac-cleaning"');
  });

  test('keeps the path when switching through the header menu', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/en/pricing');
    // getByRole skips hidden nodes: Next keeps the previous locale's tree mounted in a hidden <Activity>.
    const header = page.getByRole('banner');
    // The menu is one button for all seven languages; its items are the same page in each locale.
    await header.getByTestId('lang-menu').click();
    const menu = page.getByRole('menu');
    const ar = menu.locator('a[hreflang="ar"]');
    await expect(ar).toHaveAttribute('href', '/ar/pricing');
    await ar.click();
    await expect(page).toHaveURL(/\/ar\/pricing$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await header.getByTestId('lang-menu').click();
    const ru = page.getByRole('menu').locator('a[hreflang="ru"]');
    await expect(ru).toHaveAttribute('href', '/ru/pricing');
    await ru.click();
    await expect(page).toHaveURL(/\/ru\/pricing$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    // The footer list keeps every locale in the static HTML (SEO + no-JS).
    const footer = page.getByRole('contentinfo');
    await expect(footer.locator('a[hreflang="zh"]')).toHaveAttribute('href', '/zh/pricing');
  });

  test('every locale renders its own fonts and direction', async ({ page }) => {
    for (const [locale, dir] of [
      ['fr', 'ltr'],
      ['de', 'ltr'],
      ['zh', 'ltr'],
      ['hi', 'ltr'],
      ['ar', 'rtl'],
    ] as const) {
      await page.goto(`/${locale}`);
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', locale);
      await expect(html).toHaveAttribute('dir', dir);
      await expect(page.getByRole('banner').getByTestId('lang-menu')).toBeVisible();
    }
  });
});

test.describe('sticky contact bar', () => {
  for (const locale of ['en', 'ru'] as const) {
    test(`/${locale}: WhatsApp + Call on mobile, hidden on desktop`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(`/${locale}`);
      const bar = page.getByRole('navigation', { name: msg(locale, 'StickyBar.label') });
      await expect(bar).toBeVisible();
      await expect(bar.getByRole('link')).toHaveCount(2);
      await expect(bar.getByRole('link', { name: msg(locale, 'Cta.call') })).toBeVisible();
      await page.setViewportSize(DESKTOP);
      await expect(bar).toBeHidden();
    });
  }
});

test.describe('mobile menu', () => {
  for (const { locale, side } of [
    { locale: 'en', side: 'right' },
    { locale: 'ar', side: 'left' },
  ] as const) {
    test(`/${locale}: opens from the ${side} and closes on navigation`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(MOBILE);
      await page.goto(`/${locale}`);
      await page.getByRole('button', { name: msg(locale, 'Header.openMenu') }).click();
      const dialog = page.getByRole('dialog', { name: msg(locale, 'Header.menuTitle') });
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box).not.toBeNull();
      if (side === 'right') expect(Math.round(box!.x + box!.width)).toBe(MOBILE.width);
      else expect(Math.round(box!.x)).toBe(0);

      await dialog.getByRole('link', { name: msg(locale, 'Nav.pricing') }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/pricing$`));
      await expect(dialog).toBeHidden();
    });
  }
});

test.describe('no invented contacts', () => {
  for (const locale of ['en', 'ar', 'ru'] as const) {
    test(`/${locale}: CTAs lead to /contact while contacts are empty`, async ({
      page,
      request,
    }) => {
      const html = await (await request.get(`/${locale}`)).text();
      expect(html).not.toMatch(/href="(tel:|https:\/\/wa\.me|https:\/\/t\.me)/);

      await page.setViewportSize(DESKTOP);
      await page.goto(`/${locale}`);
      const whatsapp = page
        .locator('header')
        .getByRole('link', { name: msg(locale, 'Cta.whatsapp') });
      await expect(whatsapp).toHaveAttribute('href', `/${locale}/contact`);

      const footer = page.locator('footer');
      await expect(
        footer.getByRole('heading', { name: msg(locale, 'Footer.contactsTitle') }),
      ).toHaveCount(0);
      await expect(
        footer.getByRole('heading', { name: msg(locale, 'Footer.legalTitle') }),
      ).toHaveCount(0);
      await expect(
        footer.getByRole('link', { name: msg(locale, 'Footer.contactPage') }),
      ).toBeVisible();
    });
  }

  test('/ar footer shows the Arabic settings and nothing falls back to English', async ({
    page,
  }) => {
    await page.goto('/ar');
    const footer = page.locator('footer');
    await expect(footer.getByText('يوميًا 8:00–20:00')).toBeVisible();
    // The language switcher names "English" in English on purpose; nothing else may be English.
    await expect(footer.locator('[lang="en"]:not([hreflang])')).toHaveCount(0);
  });
});

test.describe('inner pages', () => {
  for (const path of [
    '/en/pricing',
    '/en/services/ac-cleaning',
    '/ar/contact',
    '/ru/services',
    '/en/annual-contracts',
    '/ru/about',
  ]) {
    test(`${path} has no tel, wa.me or t.me links while contacts are empty`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text();
      expect(html).not.toMatch(/href="(tel:|https:\/\/wa\.me|https:\/\/t\.me)/);
    });
  }

  test('/en/contact shows the pending notice and points to the calculator', async ({ page }) => {
    await page.goto('/en/contact');
    const pending = page.getByTestId('contacts-pending');
    await expect(pending).toBeVisible();
    await expect(pending.getByRole('link')).toHaveAttribute('href', '/en/pricing#book');
  });

  test('FAQ answers are in the HTML and <details> toggles', async ({ page, request }) => {
    const html = await (await request.get('/en/annual-contracts')).text();
    expect(html).toContain('priority call-out within the hours of your plan');
    await page.goto('/en/annual-contracts');
    const first = page.locator('details').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
  });
});

test('skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/en');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: msg('en', 'Common.skipToContent') });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('pages have exactly one main landmark and one h1', async ({ page }) => {
  for (const path of ['/en', '/ar/pricing', '/ru/services/ac-cleaning']) {
    await page.goto(path);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('unknown slug under the new shell is still a real 404', async ({ request }) => {
  expect((await request.get('/en/services/no-such-service')).status()).toBe(404);
});

test('production stays out of search until the own domain is set', async ({ request }) => {
  const html = await (await request.get('/en')).text();
  expect(html).toMatch(/<meta name="robots" content="noindex/);
});

// The lock-up is one stretched link: a click on the skewed letters (which paint above the link's
// ::after) must still go home, in the header and in the footer, on every locale.
for (const [path, home] of [
  ['/en/services', '/en'],
  ['/ar/pricing', '/ar'],
  ['/ru/services/ac-cleaning', '/ru'],
] as const) {
  test(`${path}: clicking the wordmark goes to ${home}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    for (const scope of ['header', 'footer'] as const) {
      await page.goto(path);
      const word = page.locator(`${scope} span[dir="ltr"]`).first();
      await word.scrollIntoViewIfNeeded();
      const box = (await word.boundingBox())!;
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height / 2);
      await expect(page).toHaveURL(new RegExp(`${home}$`));
    }
  });
}
