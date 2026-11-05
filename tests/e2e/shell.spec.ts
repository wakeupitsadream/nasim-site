import { expect, test } from '@playwright/test';
import { DESKTOP, MOBILE, msg } from './helpers';

test.describe('language switcher', () => {
  test('static HTML already links the same page in every locale', async ({ request }) => {
    const html = await (await request.get('/en/services/ac-cleaning')).text();
    expect(html).toContain('href="/ar/services/ac-cleaning"');
    expect(html).toContain('href="/ru/services/ac-cleaning"');
  });

  test('keeps the path when switching', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/en/pricing');
    // getByRole skips hidden nodes: Next keeps the previous locale's tree mounted in a hidden <Activity>.
    const header = page.getByRole('banner');
    await header.locator('a[hreflang="ar"]').click();
    await expect(page).toHaveURL(/\/ar\/pricing$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await header.locator('a[hreflang="ru"]').click();
    await expect(page).toHaveURL(/\/ru\/pricing$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
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

  test('fallback-EN settings on /ar are marked as English', async ({ page }) => {
    await page.goto('/ar');
    const hours = page.locator('footer [lang="en"]', { hasText: 'Daily 8:00–20:00' });
    await expect(hours).toHaveAttribute('dir', 'auto');
  });
});

test.describe('inner pages', () => {
  for (const path of ['/en/pricing', '/en/services/ac-cleaning', '/ar/contact', '/ru/services']) {
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
    const html = await (await request.get('/en')).text();
    expect(html).toContain('Every 4–6 months for a unit that runs daily');
    await page.goto('/en');
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
