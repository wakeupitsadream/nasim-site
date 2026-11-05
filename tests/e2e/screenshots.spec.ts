import { test } from '@playwright/test';
import { diagnosisSample, mockDiagnose } from './diagnose-fixture';
import { msg } from './helpers';

// Visual record for PR review (CI uploads test-results/screenshots). Not a pixel diff.
const SHOTS: { path: string; name: string; widths: number[] }[] = [
  { path: '/en', name: 'home-en', widths: [390, 1280] },
  { path: '/ar', name: 'home-ar', widths: [390, 1024, 1280] },
  { path: '/ru', name: 'home-ru', widths: [1024] },
  { path: '/en/dev/ui', name: 'dev-ui-en', widths: [390, 1280] },
  { path: '/ar/dev/ui', name: 'dev-ui-ar', widths: [390, 1280] },
  { path: '/en/services', name: 'services-en', widths: [390, 1280] },
  { path: '/ar/services', name: 'services-ar', widths: [390, 1280] },
  { path: '/en/services/ac-cleaning', name: 'service-ac-cleaning-en', widths: [390, 1280] },
  { path: '/ar/services/ac-cleaning', name: 'service-ac-cleaning-ar', widths: [390, 1280] },
  { path: '/en/services/emergency-ac-repair', name: 'service-emergency-en', widths: [1280] },
  { path: '/en/services/humidity-mould-check', name: 'service-coming-soon-en', widths: [390] },
  { path: '/en/pricing', name: 'pricing-en', widths: [390, 1280] },
  { path: '/ar/pricing', name: 'pricing-ar', widths: [390, 1280] },
  { path: '/en/contact', name: 'contact-en', widths: [390] },
  { path: '/ar/contact', name: 'contact-ar', widths: [390] },
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

for (const locale of ['en', 'ar'] as const) {
  test(`screenshot booking wizard steps on /${locale} at 390px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.setFixedTime(new Date('2026-11-05T05:30:00Z'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const book = page.locator('#book');
    await book.getByRole('button', { name: msg(locale, 'Booking.category.ac.title') }).click();
    await book.screenshot({ path: `test-results/screenshots/wizard-details-${locale}.png` });
    await book.getByRole('button', { name: msg(locale, 'Booking.nav.toTime') }).click();
    await book.screenshot({ path: `test-results/screenshots/wizard-time-${locale}.png` });
    await book.getByRole('button', { name: msg(locale, 'Booking.nav.toSend') }).click();
    await book.screenshot({ path: `test-results/screenshots/wizard-send-${locale}.png` });
  });

  test(`screenshot AI diagnosis verdict on /${locale} at 390px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await mockDiagnose(page, { ...diagnosisSample, safety: 'Switch the unit off at the breaker.' });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#diagnose');
    await section
      .getByRole('button', { name: msg(locale, 'Diagnose.form.examples.smell') })
      .click();
    await section.getByRole('button', { name: msg(locale, 'Diagnose.form.submit') }).click();
    await section.getByTestId('diagnose-result').waitFor();
    await section.screenshot({ path: `test-results/screenshots/diagnose-result-${locale}.png` });
  });
}
