import { expect, test, type Locator } from '@playwright/test';
import { DESKTOP, MOBILE, msg } from './helpers';

// Dubai is UTC+4: 05:30Z is 09:30 (today still open), 13:00Z is 17:00 (after the 16:00 cut-off).
const MORNING = new Date('2026-11-05T05:30:00Z');
const LATE = new Date('2026-11-05T13:00:00Z');

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Radios are visually hidden inside their labels: click the label, assert the radio. Labels are
 * matched from their start ("Today…" but not "Too late for today").
 */
const option = (scope: Locator, text: string) =>
  scope.locator('label', { hasText: new RegExp(`^${escape(text)}`) });

test.describe('booking request wizard', () => {
  test('/en: two cards → details with live price → time → message', async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    await page.setViewportSize(DESKTOP);
    await page.goto('/en');
    const book = page.locator('#book');

    await book.getByRole('button', { name: msg('en', 'Booking.category.ac.title') }).click();
    await expect(
      book.getByRole('heading', { level: 3, name: msg('en', 'Booking.details.acQuestion') }),
    ).toBeFocused();
    await expect(book.getByRole('radio', { name: /^Standard Split AC Service/ })).toBeChecked();

    // The services sit in the three sections of the price list, each with its price at every
    // quantity before it is chosen.
    const servicing = book.getByRole('group', { name: msg('en', 'Services.group.service') });
    const cleaning = book.getByRole('group', { name: msg('en', 'Services.group.cleaning') });
    const other = book.getByRole('group', { name: msg('en', 'Services.group.other') });
    await expect(servicing.getByRole('radio')).toHaveCount(2);
    await expect(cleaning.getByRole('radio')).toHaveCount(4);
    await expect(book.getByText(msg('en', 'Booking.details.tiersHint'))).toHaveCount(1);
    await expect(option(servicing, 'Standard Split AC Service')).toContainText('4+: AED 249');
    const ducted = option(servicing, 'Ducted AC & Fan Coil Service');
    await expect(ducted).toContainText('2–3: AED 329');
    await expect(ducted).toContainText('4+: AED 299');
    await expect(option(cleaning, 'Split AC Deep Cleaning')).toContainText('2+: AED 499');
    await expect(other.getByRole('radio', { name: /^AC Repairs/ })).toBeVisible();

    // The chosen card opens with what the service is…
    await expect(servicing.getByText(/^For wall-mounted ACs\./)).toBeVisible();
    await expect(book.getByText(/^For concealed ceiling units\./)).toHaveCount(0);

    // …and holds its own quantity row: the price per unit follows the number of units.
    await expect(servicing.getByText('1 × AED 299')).toBeVisible();
    const add = book.getByRole('button', { name: /^Add one: Standard Split AC Service/ });
    await add.click();
    await add.click();
    await expect(servicing.getByText('3 × AED 279')).toBeVisible();
    await expect(book.getByText('AED 837').first()).toBeVisible();
    await expect(book.getByText(/Fresh Home/).first()).toBeVisible();

    // First-booking offer: AED 50 off cleaning from AED 500, once the customer ticks the box.
    await book.getByRole('checkbox', { name: msg('en', 'Booking.firstBooking.apply') }).check();
    await expect(book.getByText('AED 787').first()).toBeVisible();
    // A package is sold at its own price, so the "add a sofa" suggestion steps aside.
    await expect(
      book.getByRole('button', { name: msg('en', 'Booking.offer.add'), exact: true }),
    ).toHaveCount(0);

    await book.getByRole('button', { name: msg('en', 'Booking.nav.toTime') }).click();
    await expect(option(book, msg('en', 'Booking.time.today'))).toBeVisible();
    await option(book, msg('en', 'Booking.time.tomorrow')).click();
    await option(book, msg('en', 'Booking.time.windows.afternoon')).click();
    await expect(book.getByRole('radio', { name: /Afternoon/ })).toBeChecked();

    await book.getByRole('button', { name: msg('en', 'Booking.nav.toSend') }).click();
    const message = book.getByText(/^Hi Brigada!/);
    await expect(message).toContainText('Standard Split AC Service × 3');
    await expect(message).toContainText('First booking offer −AED 50');
    await expect(message).toContainText('AED 787');
    await expect(message).toContainText('Fri, 6 Nov');
    await expect(message).toContainText('Afternoon');
    await expect(
      book.getByRole('link', { name: msg('en', 'Booking.send.contact') }),
    ).toHaveAttribute('href', '/en/contact');
    expect(await page.content()).not.toContain('wa.me');
  });

  test('/ar: the same journey in RTL with Latin digits', async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    await page.setViewportSize(MOBILE);
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const book = page.locator('#book');

    await book.getByRole('button', { name: msg('ar', 'Booking.category.ac.title') }).click();
    const add = book.getByRole('button', {
      name: new RegExp(`^${msg('ar', 'Booking.details.inc').split('{item}')[0]}`),
    });
    await add.first().click();
    await add.first().click();
    const total = book.locator('[dir="ltr"]', { hasText: '837' }).first();
    await expect(total).toBeVisible();
    await expect(total).toContainText('د.إ');

    const next = book.getByRole('button', { name: msg('ar', 'Booking.nav.toTime') });
    // Tailwind 4 mirrors with the CSS `scale` property (rtl:-scale-x-100), not `transform`.
    const scale = await next.locator('svg').evaluate((el) => getComputedStyle(el).scale);
    expect(scale).toMatch(/^-1\b/);
    await next.click();
    await expect(option(book, msg('ar', 'Booking.time.tomorrow'))).toBeVisible();
    await option(book, msg('ar', 'Booking.time.windows.morning')).click();
    await book.getByRole('button', { name: msg('ar', 'Booking.nav.toSend') }).click();
    await expect(book.getByText(/بريجادا/).first()).toBeVisible();
    expect(await page.content()).not.toContain('wa.me');
  });

  test('after the cut-off today disappears, except for emergencies', async ({ page }) => {
    await page.clock.setFixedTime(LATE);
    await page.goto('/en/pricing');
    const book = page.locator('#book');
    await book.getByRole('button', { name: msg('en', 'Booking.category.ac.title') }).click();
    await book.getByRole('button', { name: msg('en', 'Booking.nav.toTime') }).click();
    await expect(option(book, msg('en', 'Booking.time.today'))).toHaveCount(0);
    await expect(option(book, msg('en', 'Booking.time.tomorrow'))).toBeVisible();

    await page.goto('/en/services/emergency-ac-repair');
    const emergency = page.locator('#book');
    await emergency.getByRole('button', { name: msg('en', 'Booking.nav.toTime') }).click();
    await expect(option(emergency, msg('en', 'Booking.time.windows.asap'))).toBeVisible();
    await expect(option(emergency, msg('en', 'Booking.time.today'))).toBeVisible();
  });

  test('service pages preselect their service', async ({ page }) => {
    await page.goto('/en/services/ac-deep-cleaning');
    const book = page.locator('#book');
    await expect(
      book.getByRole('heading', { level: 3, name: msg('en', 'Booking.details.acQuestion') }),
    ).toBeVisible();
    await expect(book.getByRole('radio', { name: /^Split AC Deep Cleaning/ })).toBeChecked();
    await expect(book.getByText('AED 549').first()).toBeVisible();

    await page.goto('/en/services/ac-repair');
    const repair = page.locator('#book');
    await expect(repair.getByText(msg('en', 'Booking.summary.diagnostics')).first()).toBeVisible();
    await expect(repair.getByText(msg('en', 'Booking.summary.estimateNote'))).toBeVisible();
    await expect(repair.getByText('AED 199').first()).toBeVisible();

    // A job with nothing fixed up front totals "from …", never "AED 0".
    await page.goto('/en/services/ac-water-leak-drain-repair');
    const drain = page.locator('#book');
    await expect(
      drain.getByRole('radio', { name: /^AC Water Leak & Drain Repairs/ }),
    ).toBeChecked();
    await expect(drain.getByText('from AED 299').first()).toBeVisible();
    await expect(drain.getByText('AED 0')).toHaveCount(0);
  });

  test('an empty upholstery selection cannot continue', async ({ page }) => {
    await page.goto('/en');
    const book = page.locator('#book');
    await book
      .getByRole('button', { name: msg('en', 'Booking.category.upholstery.title') })
      .click();
    await book.getByRole('button', { name: msg('en', 'Booking.nav.toTime') }).click();
    await expect(book.getByRole('alert')).toHaveText(msg('en', 'Booking.details.empty'));
    await book.getByRole('button', { name: /^Add one: Sofa/ }).click();
    await expect(book.getByText('AED 267').first()).toBeVisible(); // 3-seat minimum charge
  });

  test('coming-soon services have a waitlist instead of the wizard', async ({ page }) => {
    await page.goto('/en/services/humidity-mould-check');
    await expect(page.locator('#book')).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: msg('en', 'Service.comingSoon.waitlist') }),
    ).toHaveAttribute('href', '/en/contact');
  });
});
