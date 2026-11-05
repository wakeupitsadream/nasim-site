import { describe, expect, it, vi } from 'vitest';
import { DIAGNOSE_ENDPOINT, requestDiagnosis } from '@/lib/diagnose/client';

const diagnosis = {
  summary: 'Dirty coil.',
  causes: [{ title: 'Dust', detail: 'Film on the coil.', likelihood: 'likely' }],
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
  questions: [],
  outOfScope: false,
  confidence: 'medium',
};

const reply = (status: number, body: unknown) =>
  vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );

describe('requestDiagnosis()', () => {
  it('rejects an empty request locally without calling the API', async () => {
    const fetchImpl = reply(200, diagnosis);
    expect(await requestDiagnosis({ locale: 'en', text: '' }, fetchImpl)).toEqual({
      ok: false,
      error: 'invalid',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts the trimmed request and returns the validated diagnosis', async () => {
    const fetchImpl = reply(200, diagnosis);
    const result = await requestDiagnosis({ locale: 'ru', text: '  Капает вода  ' }, fetchImpl);
    expect(result).toEqual({ ok: true, data: diagnosis });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(DIAGNOSE_ENDPOINT);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ locale: 'ru', text: 'Капает вода' });
  });

  it('maps route errors, unknown statuses and malformed bodies', async () => {
    const ask = (fetchImpl: typeof fetch) =>
      requestDiagnosis({ locale: 'en', text: 'drips water' }, fetchImpl);
    expect(await ask(reply(503, { error: 'unavailable' }))).toEqual({
      ok: false,
      error: 'unavailable',
    });
    expect(await ask(reply(429, null))).toEqual({ ok: false, error: 'rate_limited' });
    expect(await ask(reply(422, { error: 'refused' }))).toEqual({ ok: false, error: 'refused' });
    expect(await ask(reply(500, 'oops'))).toEqual({ ok: false, error: 'failed' });
    expect(await ask(reply(200, { summary: 'half a body' }))).toEqual({
      ok: false,
      error: 'failed',
    });
  });

  it('reports a network failure separately', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await requestDiagnosis({ locale: 'en', text: 'drips water' }, fetchImpl)).toEqual({
      ok: false,
      error: 'network',
    });
  });
});
