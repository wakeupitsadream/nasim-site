import { test } from '@playwright/test';

// Visual record for PR review (CI uploads test-results/screenshots). Not a pixel diff.
const SHOTS: { path: string; name: string; widths: number[] }[] = [
  { path: '/en', name: 'home-en', widths: [390, 1280] },
  { path: '/ar', name: 'home-ar', widths: [390, 1024, 1280] },
  { path: '/ru', name: 'home-ru', widths: [1024] },
  { path: '/en/dev/ui', name: 'dev-ui-en', widths: [390, 1280] },
  { path: '/ar/dev/ui', name: 'dev-ui-ar', widths: [390, 1280] },
];

for (const { path, name, widths } of SHOTS) {
  for (const width of widths) {
    test(`screenshot ${name} at ${width}px`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `test-results/screenshots/${name}-${width}.png`,
        fullPage: true,
      });
    });
  }
}
