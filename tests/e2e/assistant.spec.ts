import { expect, test } from '@playwright/test';
import {
  assistantReady,
  diagnosisSample,
  mockDiagnose,
  openAssistant,
  TINY_PNG,
} from './assistant-fixture';
import { DESKTOP, MOBILE, msg } from './helpers';

// Seed FAQ (content/seed/faqs.json): the question is a chip, the answer comes back instantly.
const FAQ_QUESTION = 'How often should I clean my AC in Dubai?';
const FAQ_ANSWER = 'Every 4–6 months for a unit that runs daily';

test.describe('floating assistant', () => {
  test('/en: an example chip → mocked verdict with the price and a booking link; Escape closes, the talk stays', async ({
    page,
  }) => {
    const requests = await mockDiagnose(page);
    await page.setViewportSize(DESKTOP);
    await page.goto('/en');
    const dialog = await openAssistant(page);
    await expect(dialog.getByRole('textbox')).toBeFocused();
    const example = msg('en', 'Diagnose.form.examples.smell');

    await dialog.getByRole('button', { name: example }).click();
    await expect(dialog.getByText(example, { exact: true }).last()).toBeVisible(); // the user bubble
    const result = dialog.getByTestId('diagnose-result');
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

    // Escape closes the window and hands focus back to the launcher; the talk is kept.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('assistant-launcher')).toBeFocused();
    await page.getByTestId('assistant-launcher').click();
    await expect(page.getByTestId('assistant-panel').getByTestId('diagnose-result')).toBeVisible();
  });

  test('a FAQ chip, or a typed question close to one, is answered from the FAQ without a request', async ({
    page,
  }) => {
    const requests = await mockDiagnose(page);
    await page.goto('/en');
    const dialog = await openAssistant(page);
    await dialog.getByRole('button', { name: FAQ_QUESTION }).click();
    const answers = dialog.getByTestId('assistant-faq-answer');
    await expect(answers).toHaveCount(1);
    await expect(answers.first()).toContainText(FAQ_ANSWER);

    await dialog.getByRole('textbox').fill('how often should I clean the AC?');
    await page.keyboard.press('Enter');
    await expect(answers).toHaveCount(2);
    await expect(dialog.getByRole('textbox')).toHaveValue('');
    expect(requests).toEqual([]);
  });

  test('a photo is shrunk to JPEG in the browser and sent with the text', async ({ page }) => {
    const requests = await mockDiagnose(page);
    await page.goto('/en');
    const dialog = await openAssistant(page);
    await dialog.getByTestId('assistant-photo').setInputFiles({
      name: 'unit.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(
      dialog.getByRole('img', { name: msg('en', 'Diagnose.form.photoAlt') }),
    ).toBeVisible();
    await dialog.getByRole('textbox').fill('Ice on the pipe');
    await dialog.getByRole('button', { name: msg('en', 'Assistant.send') }).click();
    await expect(dialog.getByTestId('diagnose-result')).toBeVisible();

    const sent = requests[0] as { text: string; image?: { mediaType: string; data: string } };
    expect(sent.text).toBe('Ice on the pipe');
    expect(sent.image?.mediaType).toBe('image/jpeg');
    expect(sent.image?.data.length).toBeGreaterThan(100);
  });

  test('an empty send shows an inline error and sends nothing', async ({ page }) => {
    const requests = await mockDiagnose(page);
    await page.goto('/en');
    const dialog = await openAssistant(page);
    await dialog.getByRole('button', { name: msg('en', 'Assistant.send') }).click();
    await expect(dialog.getByRole('alert')).toHaveText(msg('en', 'Diagnose.errors.empty'));
    await expect(dialog.getByRole('textbox')).toBeFocused();
    expect(requests).toEqual([]);
  });

  test('503 shows the honest "not switched on yet" answer; example chips still show a labelled example verdict', async ({
    page,
  }) => {
    await mockDiagnose(page, { error: 'unavailable' }, 503);
    await page.goto('/en');
    const dialog = await openAssistant(page);
    await dialog.getByRole('textbox').fill('Drips water inside');
    await dialog.getByRole('button', { name: msg('en', 'Assistant.send') }).click();
    const unavailable = dialog.getByText(msg('en', 'Diagnose.errors.unavailable'));
    await expect(unavailable).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: msg('en', 'Diagnose.calculatorCta') }),
    ).toHaveAttribute('href', '/en/pricing#book');
    await expect(
      dialog.getByRole('link', { name: msg('en', 'Diagnose.result.contact') }),
    ).toHaveAttribute('href', '/en/contact');

    await dialog.getByRole('button', { name: msg('en', 'Diagnose.form.examples.stain') }).click();
    const result = dialog.getByTestId('diagnose-result');
    await expect(result.getByTestId('diagnose-demo')).toHaveText(
      msg('en', 'Diagnose.result.demoBadge'),
    );
    await expect(result.getByText(msg('en', 'Diagnose.demo.stain.summary'))).toBeVisible();
    await expect(result.getByText('Stain & Odour Removal')).toBeVisible();
    await expect(
      result.getByRole('link', { name: msg('en', 'Diagnose.result.book') }),
    ).toHaveAttribute('href', '/en/services/stain-odour-removal#book');
    // Typed text never gets a canned answer: the honest error comes back again.
    await dialog.getByRole('textbox').fill('Coffee stain on a light sofa, but typed differently');
    await dialog.getByRole('button', { name: msg('en', 'Assistant.send') }).click();
    await expect(unavailable).toHaveCount(2);
  });

  test('/en/services: the "not sure" strip opens the window; 429 asks to wait, out-of-scope points to the contact page', async ({
    page,
  }) => {
    await mockDiagnose(page, { error: 'rate_limited' }, 429);
    await page.goto('/en/services');
    await assistantReady(page);
    await page.getByRole('button', { name: msg('en', 'Services.notSure.ask') }).click();
    const dialog = page.getByTestId('assistant-panel');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox').fill('Drips water inside');
    await dialog.getByRole('button', { name: msg('en', 'Assistant.send') }).click();
    await expect(dialog.getByText(msg('en', 'Diagnose.errors.rateLimited'))).toBeVisible();

    await page.unroute('**/api/diagnose');
    await mockDiagnose(page, {
      ...diagnosisSample,
      service: null,
      outOfScope: true,
      summary: 'This looks like a wall mould problem, not an AC fault.',
    });
    await dialog.getByRole('textbox').fill('Black spots on the bedroom wall');
    await dialog.getByRole('button', { name: msg('en', 'Assistant.send') }).click();
    const result = dialog.getByTestId('diagnose-result');
    await expect(result.getByText(msg('en', 'Diagnose.result.outOfScope'))).toBeVisible();
    await expect(
      result.getByRole('link', { name: msg('en', 'Diagnose.result.contact') }),
    ).toHaveAttribute('href', '/en/contact');
    await expect(result.getByRole('link', { name: msg('en', 'Diagnose.result.book') })).toHaveCount(
      0,
    );
  });

  test('the hero link opens the window; a link inside an answer navigates and closes it', async ({
    page,
  }) => {
    await mockDiagnose(page);
    await page.setViewportSize(DESKTOP);
    await page.goto('/en');
    await assistantReady(page);
    await page.getByRole('button', { name: msg('en', 'Home.hero.diagnoseCta') }).click();
    const dialog = page.getByTestId('assistant-panel');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: msg('en', 'Diagnose.form.examples.smell') }).click();
    await dialog
      .getByTestId('diagnose-result')
      .getByRole('link', { name: msg('en', 'Diagnose.result.details') })
      .click();
    await expect(page).toHaveURL(/\/en\/services\/ac-cleaning$/);
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('assistant-launcher')).toBeVisible();
  });

  test('/ar: the window fills the phone screen; the verdict renders in RTL with Latin digits inside an LTR span', async ({
    page,
  }) => {
    await mockDiagnose(page);
    await page.setViewportSize(MOBILE);
    await page.goto('/ar');
    const dialog = await openAssistant(page);
    const box = (await dialog.boundingBox())!;
    expect(box.width).toBe(MOBILE.width);
    await expect(page.locator('html')).toHaveAttribute('data-assistant-open', '');

    await dialog.getByRole('button', { name: msg('ar', 'Diagnose.form.examples.drip') }).click();
    const result = dialog.getByTestId('diagnose-result');
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

    await dialog.getByRole('button', { name: msg('ar', 'Assistant.close') }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('html')).not.toHaveAttribute('data-assistant-open', '');
  });
});
