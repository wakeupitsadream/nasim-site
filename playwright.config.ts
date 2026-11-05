import { defineConfig, devices } from '@playwright/test';

// @playwright/test is pinned to 1.63.0 to match the browser preinstalled in the dev container
// (/opt/pw-browsers/chromium-1243). CI installs its own browser. Bump both together.
const PORT = Number(process.env.PORT ?? 3100);
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // The site scrolls anchors smoothly (styles/motion.css). Playwright scrolls, checks stability
    // and clicks; under load the click can land before a smooth scroll settles and miss. Scrolls
    // stay instant for the automation only (the CSS value itself is still asserted in motion.spec).
    launchOptions: { args: ['--disable-smooth-scrolling'] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Runs against the production build: `pnpm build` first, or pass BASE_URL.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm start -p ${PORT}`,
        url: `${baseURL}/en`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
