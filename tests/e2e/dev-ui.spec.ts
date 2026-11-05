import { expect, test } from '@playwright/test';
import { MOBILE, msg } from './helpers';

test('UI kit is reachable outside production and not indexed', async ({ page }) => {
  const response = await page.goto('/en/dev/ui');
  expect(response?.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('h1')).toHaveText(msg('en', 'DevUi.title'));
});

test('phone input formats as you type and outputs E.164', async ({ page }) => {
  await page.goto('/en/dev/ui');
  const input = page.getByLabel(msg('en', 'DevUi.samples.phoneLabel'));
  await input.pressSequentially('0501234567');
  await expect(page.getByTestId('e164')).toHaveText('+971501234567');
  await expect(input).toHaveValue(/\d \d/);
  await expect(page.getByText(`(${msg('en', 'DevUi.samples.valid')})`)).toBeVisible();
});

test('toast appears', async ({ page }) => {
  await page.goto('/en/dev/ui');
  await page.getByRole('button', { name: msg('en', 'DevUi.samples.toastButton') }).click();
  await expect(page.getByText(msg('en', 'DevUi.samples.toastMessage'))).toBeVisible();
});

for (const locale of ['ru', 'ar'] as const) {
  test(`/${locale}: three-button contact bar fits a 390px screen`, async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`/${locale}/dev/ui`);
    const links = page.getByTestId('sticky-bar-preview').getByRole('link');
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      const overflow = await link.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
      expect(overflow).toBe(false);
    }
  });
}
