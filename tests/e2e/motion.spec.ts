import { expect, test, type Locator } from '@playwright/test';
import { DESKTOP, MOBILE, msg } from './helpers';

/** Names of the CSS animations currently attached to an element (empty when none run). */
const animationNames = (locator: Locator) =>
  locator.evaluate((el) =>
    el.getAnimations().map((a) => (a as CSSAnimation).animationName ?? a.id),
  );

test.describe('motion (styles/motion.css)', () => {
  test('reduced motion: nothing animates, nothing is hidden, anchors jump', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(DESKTOP);
    await page.goto('/en');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCSS('opacity', '1');
    expect(await animationNames(h1)).toEqual([]);
    // A reveal far below the fold is fully visible without scrolling.
    const faq = page.locator('[aria-labelledby="faq-title"] .reveal').first();
    await expect(faq).toHaveCSS('opacity', '1');
    expect(await faq.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await page.locator('html').evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe(
      'auto',
    );
  });

  test('hero rises in on load and reveals follow the scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize(DESKTOP);
    await page.goto('/en');
    const h1 = page.getByRole('heading', { level: 1 });
    expect(await animationNames(h1)).toContain('nasim-rise');
    await expect(h1).toHaveCSS('opacity', '1');
    // Smooth anchors, but Next resets them during SPA navigation (data-scroll-behavior).
    await expect(page.locator('html')).toHaveAttribute('data-scroll-behavior', 'smooth');

    const faq = page.locator('[aria-labelledby="faq-title"] .reveal').first();
    await expect(faq).toHaveCSS('opacity', '0'); // scrubbed by a view timeline, not yet entered
    await faq.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 300);
    await expect(faq).toHaveCSS('opacity', '1');
  });

  test('the header gains its hairline only after scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize(DESKTOP);
    await page.goto('/en/services');
    const header = page.locator('header').first();
    const border = () => header.evaluate((el) => getComputedStyle(el).borderBottomColor);
    expect(await border()).toBe('rgba(0, 0, 0, 0)');
    await page.mouse.wheel(0, 400);
    await expect.poll(border).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      await header.evaluate(
        (el) => (getComputedStyle(el) as CSSStyleDeclaration).viewTransitionName,
      ),
    ).toBe('site-header');
  });

  test('catalogue → service page is a forward view transition; breadcrumbs go back', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/en/services');
    expect(await page.evaluate(() => typeof document.startViewTransition)).toBe('function');
    const card = page.getByRole('link', { name: 'AC Cleaning' }).first();
    await card.click();
    await expect(page).toHaveURL(/\/en\/services\/ac-cleaning$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('AC Cleaning');
    await page
      .getByLabel(msg('en', 'Common.breadcrumbLabel'))
      .getByRole('link', { name: msg('en', 'Services.category.ac') })
      .click();
    await expect(page).toHaveURL(/\/en\/services$/);
  });

  test('service icons move on hover and the wizard progress fills step by step', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize(DESKTOP);
    await page.goto('/en/services');
    const card = page.locator('article', { hasText: 'Ducted AC & Fan Coil Service' }).first();
    const icon = card.locator('[data-motion="spin"] svg');
    expect(await animationNames(icon)).toEqual([]);
    await card.hover();
    await expect.poll(() => animationNames(icon)).toContain('nasim-spin');

    await page.goto('/en/pricing');
    const book = page.locator('#book');
    const fills = book
      .getByRole('list', { name: msg('en', 'Booking.progressLabel') })
      .locator('li > span[aria-hidden]');
    await expect(fills.nth(0)).toHaveCSS('scale', '1');
    await expect(fills.nth(1)).toHaveCSS('scale', '0 1');
    await book.getByRole('button', { name: msg('en', 'Booking.category.ac.title') }).click();
    await expect(fills.nth(1)).toHaveCSS('scale', '1');
    await expect(fills.nth(2)).toHaveCSS('scale', '0 1');
  });

  test('Brigada: the ticker runs and pauses, panels tilt, the van rolls in, the curtain waits', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize(DESKTOP);
    await page.goto('/en');

    // The red band is a marquee that pauses under the pointer. (mouse.move, not hover(): the
    // track never settles, so Playwright's stability wait would time out.)
    const ticker = page.locator('.ticker');
    expect(await animationNames(ticker)).toContain('nasim-ticker');
    const band = (await page.locator('.ticker-band').boundingBox())!;
    await page.mouse.move(band.x + band.width / 2, band.y + band.height / 2);
    await expect
      .poll(() => ticker.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe('paused');

    // The page curtain is parked off-screen, named for view transitions.
    const curtain = page.locator('.page-curtain');
    expect(
      await curtain.evaluate(
        (el) => (getComputedStyle(el) as CSSStyleDeclaration).viewTransitionName,
      ),
    ).toBe('page-curtain');
    expect(await curtain.evaluate((el) => getComputedStyle(el).translate)).toMatch(
      /^-(100%|1280px)/,
    );

    // The hero panel tilts after a fine pointer and settles when it leaves.
    const panel = page.locator('[data-tilt]').first();
    const box = (await panel.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.25);
    await expect
      .poll(() => panel.evaluate((el) => el.style.getPropertyValue('--tx')))
      .toMatch(/deg$/);
    await page.mouse.move(4, 4);
    await expect.poll(() => panel.evaluate((el) => el.style.getPropertyValue('--tx'))).toBe('');

    // The van drives into the closing band on a view timeline; the wheels share it.
    const van = page.locator('.van-drive');
    await van.scrollIntoViewIfNeeded();
    expect(await animationNames(van)).toContain('nasim-drive-in');
    expect(await animationNames(van.locator('.van__wheel').first())).toContain('nasim-wheel');
  });

  test('link navigations carry a view-transition type, so only they pull the curtain', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/en/services');
    await page.evaluate(() => {
      const w = window as Window & { __vt?: unknown[] };
      w.__vt = [];
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = ((options: { types?: string[] }) => {
        w.__vt!.push(options?.types ?? null);
        return original(options as never);
      }) as typeof document.startViewTransition;
    });
    await page.getByRole('link', { name: 'AC Cleaning' }).first().click();
    await expect(page).toHaveURL(/\/en\/services\/ac-cleaning$/);
    await page
      .getByRole('banner')
      .getByRole('link', { name: msg('en', 'Nav.pricing') })
      .click();
    await expect(page).toHaveURL(/\/en\/pricing$/);
    const types = await page.evaluate(() => (window as Window & { __vt?: unknown[] }).__vt);
    expect(types?.[0]).toContain('nav-forward');
    expect(types?.at(-1)).toContain('nav-page');
  });

  test('/ar: the same motion mirrors its origin', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize(MOBILE);
    await page.goto('/ar/services/ac-cleaning');
    const line = page.locator('.reveal-line').first();
    const origin = await line.evaluate((el) => {
      const { transformOrigin } = getComputedStyle(el);
      // offsetWidth: the bounding rect is 0 while the line is still scaled down by its reveal.
      return parseFloat(transformOrigin) / (el as HTMLElement).offsetWidth;
    });
    expect(origin).toBeCloseTo(1, 1); // 100% in RTL, 0% in LTR
    // The curtain waits on the other side and the van starts from there too.
    await page.goto('/ar');
    expect(
      await page.locator('.page-curtain').evaluate((el) => getComputedStyle(el).translate),
    ).toMatch(/^(100%|390px)/);
    expect(
      await page
        .locator('.van-drive')
        .evaluate((el) => getComputedStyle(el).getPropertyValue('--nasim-drive-from').trim()),
    ).toBe('70vw');
  });
});
