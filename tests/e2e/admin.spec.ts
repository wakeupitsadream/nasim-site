import { expect, test } from '@playwright/test';

// The admin (DECISIONS №68). The guard is checked on every run; the signed-in path needs a
// database with an owner account and runs when E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are set:
//   E2E_ADMIN_EMAIL=owner@brigada.test E2E_ADMIN_PASSWORD=… pnpm e2e admin
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe('admin guard', () => {
  test('sends a visitor without a session to the sign-in page', async ({ page, request }) => {
    for (const path of [
      '/admin',
      '/admin/prices',
      '/admin/settings',
      '/admin/services/ac-cleaning',
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect((await request.get('/api/admin/anything')).status()).toBe(401);
  });

  test('does not trust a made-up session cookie', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'brigada_admin', value: 'e30.forged', url: baseURL! }]);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('answers a wrong password without saying which part is wrong', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('input[name="email"]').fill('nobody@example.test');
    await page.locator('input[name="password"]').fill('not-the-password');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

test.describe('admin, signed in', () => {
  test.skip(!EMAIL || !PASSWORD, 'needs a database and E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD');
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('input[name="email"]').fill(EMAIL!);
    await page.locator('input[name="password"]').fill(PASSWORD!);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  // A row no other spec asserts, so a parallel run never sees the price in between.
  const FIELD = 'input[name="item:footstool"]';
  const save = (page: import('@playwright/test').Page) =>
    page.locator('form:has([role="status"]) button[type="submit"]').click();
  const status = (page: import('@playwright/test').Page) => page.locator('form [role="status"]');

  test('a saved price is on the site at once, a typo is refused', async ({ page, request }) => {
    await page.goto('/admin/prices');
    const input = page.locator(FIELD);
    const original = await input.inputValue();
    const edited = String(Number(original) + 2);
    const priceOnSite = async (price: string) =>
      (await (await request.get('/en/pricing')).text()).includes(`AED ${price}<`);

    await input.fill(edited);
    await save(page);
    await expect(status(page)).toHaveText(/\S/);
    await expect(input).toHaveValue(edited);
    await expect.poll(() => priceOnSite(edited)).toBe(true);

    await input.fill('abc');
    await save(page);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveValue('abc'); // what was typed is kept for fixing
    expect(await priceOnSite(edited)).toBe(true);

    await input.fill(original);
    await save(page);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect.poll(() => priceOnSite(edited)).toBe(false);
  });

  test('the interface switches between Russian and English', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    const before = await heading.innerText();
    await page.locator('[data-action="language"]:visible').click();
    await expect(heading).not.toHaveText(before);
    await page.locator('[data-action="language"]:visible').click();
    await expect(heading).toHaveText(before);
  });

  test('signing out closes the admin', async ({ page }) => {
    await page.locator('[data-action="sign-out"]:visible').click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    // The sign-in page is the one kept from before: the password typed then is gone.
    await expect(page.locator('input[name="password"]:visible')).toHaveValue('');
    await page.goto('/admin/prices');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
