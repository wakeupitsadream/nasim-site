import { expect, test } from '@playwright/test';
import { diagnoseReady, diagnosisSample, mockDiagnose, TINY_PNG } from './diagnose-fixture';
import { DESKTOP, MOBILE, msg } from './helpers';

test.describe('AI diagnosis', () => {
  test('/en: an example complaint → mocked verdict with the price and a booking link', async ({
    page,
  }) => {
    const requests = await mockDiagnose(page);
    await page.setViewportSize(DESKTOP);
    await page.goto('/en');
    const section = page.locator('#diagnose');
    await diagnoseReady(page);
    const example = msg('en', 'Diagnose.form.examples.smell');

    await section.getByRole('button', { name: example }).click();
    await expect(section.getByRole('textbox')).toHaveValue(example);
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.submit') }).click();

    const result = section.getByTestId('diagnose-result');
    await expect(result.getByRole('heading', { level: 3 })).toHaveText(diagnosisSample.summary);
    await expect(result.getByRole('heading', { level: 3 })).toBeFocused();
    await expect(result.getByText('AED 149')).toBeVisible();
    await expect(result.getByText(msg('en', 'Diagnose.result.urgency.soon'))).toBeVisible();
    await expect(result.getByText('Dust and mould on the coil')).toBeVisible();
    await expect(result.getByText('How old is the unit?')).toBeVisible();
    await expect(
      result.getByRole('link', { name: msg('en', 'Diagnose.result.book') }),
    ).toHaveAttribute('href', '/en/services/ac-cleaning#book');
    expect(requests).toEqual([{ locale: 'en', text: example }]);

    await result.getByRole('button', { name: msg('en', 'Diagnose.result.again') }).click();
    await expect(section.getByRole('textbox')).toHaveValue('');
  });

  test('a photo is shrunk to JPEG in the browser and sent with the text', async ({ page }) => {
    const requests = await mockDiagnose(page);
    await page.goto('/en');
    const section = page.locator('#diagnose');
    await diagnoseReady(page);
    await section.getByTestId('diagnose-photo').setInputFiles({
      name: 'unit.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(
      section.getByRole('img', { name: msg('en', 'Diagnose.form.photoAlt') }),
    ).toBeVisible();
    await section.getByRole('textbox').fill('Ice on the pipe');
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.submit') }).click();
    await expect(section.getByTestId('diagnose-result')).toBeVisible();

    const sent = requests[0] as { text: string; image?: { mediaType: string; data: string } };
    expect(sent.text).toBe('Ice on the pipe');
    expect(sent.image?.mediaType).toBe('image/jpeg');
    expect(sent.image?.data.length).toBeGreaterThan(100);
  });

  test('an empty form shows an inline error and sends nothing', async ({ page }) => {
    const requests = await mockDiagnose(page);
    await page.goto('/en');
    const section = page.locator('#diagnose');
    await diagnoseReady(page);
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.submit') }).click();
    await expect(section.getByRole('alert')).toHaveText(msg('en', 'Diagnose.errors.empty'));
    await expect(section.getByRole('textbox')).toBeFocused();
    expect(requests).toEqual([]);
  });

  test('503 shows the honest "not switched on yet" state with the calculator link', async ({
    page,
  }) => {
    await mockDiagnose(page, { error: 'unavailable' }, 503);
    await page.goto('/en');
    const section = page.locator('#diagnose');
    await diagnoseReady(page);
    await section.getByRole('textbox').fill('Drips water inside');
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.submit') }).click();
    const alert = section.getByRole('alert');
    await expect(alert).toContainText(msg('en', 'Diagnose.errors.unavailable'));
    await expect(
      alert.getByRole('link', { name: msg('en', 'Diagnose.calculatorCta') }),
    ).toHaveAttribute('href', '#book');
    await expect(
      alert.getByRole('link', { name: msg('en', 'Diagnose.result.contact') }),
    ).toHaveAttribute('href', '/en/contact');
  });

  test('while the assistant is off, an example chip still shows a labelled example verdict', async ({
    page,
  }) => {
    await mockDiagnose(page, { error: 'unavailable' }, 503);
    await page.goto('/en');
    const section = page.locator('#diagnose');
    await diagnoseReady(page);
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.examples.stain') }).click();
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.submit') }).click();
    const result = section.getByTestId('diagnose-result');
    await expect(result.getByTestId('diagnose-demo')).toHaveText(
      msg('en', 'Diagnose.result.demoBadge'),
    );
    await expect(result.getByText(msg('en', 'Diagnose.demo.stain.summary'))).toBeVisible();
    await expect(result.getByText('Stain & Odour Removal')).toBeVisible();
    await expect(
      result.getByRole('link', { name: msg('en', 'Diagnose.result.book') }),
    ).toHaveAttribute('href', '/en/services/stain-odour-removal#book');
    // Typed text never gets a canned answer: the honest error stays.
    await result.getByRole('button', { name: msg('en', 'Diagnose.result.again') }).click();
    await section.getByRole('textbox').fill('Coffee stain on a light sofa, but typed differently');
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.submit') }).click();
    await expect(section.getByRole('alert')).toContainText(
      msg('en', 'Diagnose.errors.unavailable'),
    );
  });

  test('429 asks to wait, out-of-scope verdicts point to the contact page', async ({ page }) => {
    await mockDiagnose(page, { error: 'rate_limited' }, 429);
    await page.goto('/en/services');
    const section = page.locator('#diagnose');
    await diagnoseReady(page);
    await section.getByRole('textbox').fill('Drips water inside');
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.submit') }).click();
    await expect(section.getByRole('alert')).toHaveText(msg('en', 'Diagnose.errors.rateLimited'));

    await page.unroute('**/api/diagnose');
    await mockDiagnose(page, {
      ...diagnosisSample,
      service: null,
      outOfScope: true,
      summary: 'This looks like a wall mould problem, not an AC fault.',
    });
    await section.getByRole('button', { name: msg('en', 'Diagnose.form.submit') }).click();
    const result = section.getByTestId('diagnose-result');
    await expect(result.getByText(msg('en', 'Diagnose.result.outOfScope'))).toBeVisible();
    await expect(
      result.getByRole('link', { name: msg('en', 'Diagnose.result.contact') }),
    ).toHaveAttribute('href', '/en/contact');
    await expect(result.getByRole('link', { name: msg('en', 'Diagnose.result.book') })).toHaveCount(
      0,
    );
  });

  test('/ar: the verdict renders in RTL with Latin digits inside an LTR span', async ({ page }) => {
    await mockDiagnose(page);
    await page.setViewportSize(MOBILE);
    await page.goto('/ar');
    const section = page.locator('#diagnose');
    await diagnoseReady(page);
    await section.getByRole('button', { name: msg('ar', 'Diagnose.form.examples.drip') }).click();
    await section.getByRole('button', { name: msg('ar', 'Diagnose.form.submit') }).click();
    const result = section.getByTestId('diagnose-result');
    const price = result.locator('[dir="ltr"]', { hasText: '149' }).first();
    await expect(price).toBeVisible();
    await expect(price).toContainText('د.إ');
    await expect(
      result.getByRole('link', { name: msg('ar', 'Diagnose.result.book') }),
    ).toHaveAttribute('href', '/ar/services/ac-cleaning#book');
    const arrow = result
      .getByRole('link', { name: msg('ar', 'Diagnose.result.book') })
      .locator('svg');
    expect(await arrow.evaluate((el) => getComputedStyle(el).scale)).toMatch(/^-1\b/);
  });
});
