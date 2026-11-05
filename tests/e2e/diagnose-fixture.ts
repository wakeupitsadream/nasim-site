import type { Page } from '@playwright/test';

/** A route-shaped diagnosis (the server attaches `service` with its price; the model never does). */
export const diagnosisSample = {
  summary:
    'Most likely the indoor coil is dirty: the musty smell when the fan starts points that way. A standard clean usually fixes it.',
  causes: [
    {
      title: 'Dust and mould on the coil',
      detail: 'A film that smells on start-up.',
      likelihood: 'likely',
    },
    { title: 'Silted drain line', detail: 'Water sits in the tray.', likelihood: 'possible' },
  ],
  service: {
    slug: 'ac-cleaning',
    name: 'AC Cleaning',
    href: '/services/ac-cleaning',
    priceFrom: { amount: 149, unit: 'unit' },
    estimate: false,
    comingSoon: false,
  },
  urgency: 'soon',
  safety: null,
  questions: ['How old is the unit?'],
  outOfScope: false,
  confidence: 'medium',
};

/**
 * Stub POST /api/diagnose so the journey is testable without an API key. Returns the captured
 * request bodies (parsed JSON) so a test can assert what the browser sent.
 */
export async function mockDiagnose(page: Page, body: unknown = diagnosisSample, status = 200) {
  const requests: unknown[] = [];
  await page.route('**/api/diagnose', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status, json: body });
  });
  return requests;
}

/** 1×1 red PNG, enough for the browser to decode and re-encode. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
);
