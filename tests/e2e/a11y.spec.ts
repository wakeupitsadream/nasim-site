import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { DESKTOP, MOBILE, msg } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function seriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

for (const path of ['/en', '/ar', '/en/dev/ui', '/ar/dev/ui']) {
  for (const viewport of [MOBILE, DESKTOP]) {
    test(`${path} at ${viewport.width}px has no serious axe violations`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(viewport);
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
}

test('/ar mobile menu open has no serious axe violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(MOBILE);
  await page.goto('/ar');
  await page.getByRole('button', { name: msg('ar', 'Header.openMenu') }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});
