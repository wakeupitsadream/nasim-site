import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DIAGNOSE_LIMITS } from '@/lib/diagnose/guard';
import { resetRateLimits } from '@/lib/ratelimit';

const diagnose = vi.fn();

vi.mock('@/lib/ai', async () => {
  class AiNotConfiguredError extends Error {}
  class AiRefusedError extends Error {}
  class AiParseError extends Error {}
  class AiNetworkError extends Error {}
  class AiUpstreamError extends Error {
    constructor(
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(`upstream ${status}`);
    }
  }
  return {
    diagnose,
    AiNotConfiguredError,
    AiRefusedError,
    AiParseError,
    AiNetworkError,
    AiUpstreamError,
    isAiConfigured: () => true,
    AI_MODEL: 'anthropic/claude-haiku-5.5',
  };
});

const post = async (body: unknown, ip = '203.0.113.9') => {
  const { POST } = await import('@/app/api/diagnose/route');
  return POST(
    new Request('http://localhost/api/diagnose', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
};

const diagnosis = {
  summary: 'Dirty coil.',
  causes: [{ title: 'Dust', detail: 'Film on the coil.', likelihood: 'likely' }],
  service: 'ac-cleaning',
  urgency: 'soon',
  safety: null,
  questions: [],
  outOfScope: false,
  confidence: 'medium',
};

describe('POST /api/diagnose', () => {
  beforeEach(() => {
    resetRateLimits();
    diagnose.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('rejects malformed and empty bodies', async () => {
    expect((await post('not json')).status).toBe(400);
    expect((await post({ locale: 'en', text: '' })).status).toBe(400);
    expect(diagnose).not.toHaveBeenCalled();
  });

  it('returns the diagnosis with the matched service and its price', async () => {
    diagnose.mockResolvedValue(diagnosis);
    const response = await post({ locale: 'ru', text: 'Пахнет при включении' });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const json = await response.json();
    expect(json.service).toMatchObject({
      slug: 'ac-cleaning',
      name: 'Стандартное обслуживание сплит-системы',
      href: '/services/ac-cleaning',
      priceFrom: { amount: 299, unit: 'unit' },
      estimate: false,
      comingSoon: false,
    });
    const catalogue = diagnose.mock.calls[0]?.[2] as { slug: string }[];
    expect(catalogue.map((c) => c.slug)).toContain('humidity-mould-check');
    // Hidden services are never offered to the model: the small AC services folded into the
    // repairs card (DECISIONS №79, №81) and preventive maintenance. 15 of 25 remain.
    expect(catalogue.length).toBe(15);
    expect(catalogue.map((c) => c.slug)).toContain('ac-repair');
    expect(catalogue.map((c) => c.slug)).not.toContain('thermostat-installation');
    // The model reads the owner's page copy as plain text: no markup in the prompt.
    const duct = diagnose.mock.calls[0]?.[2].find(
      (c: { slug: string }) => c.slug === 'ac-duct-cleaning',
    ) as { about: string; includes: string[] };
    expect(duct.about).toBe(
      'Choose this service if dust or debris has built up inside the ducts that carry air to and from your rooms.',
    );
    expect(duct.includes[0]).toMatch(/^Supply and return ducts\. We use mechanical cleaning tools/);
    expect(JSON.stringify(diagnose.mock.calls[0]?.[2])).not.toContain('<strong>');
  });

  it('marks estimate-priced and coming-soon services, and never links to a hidden one', async () => {
    diagnose.mockResolvedValueOnce({ ...diagnosis, service: 'ac-repair' });
    expect(
      (await (await post({ locale: 'en', text: 'does not start' })).json()).service.estimate,
    ).toBe(true);
    // A slug the model was not offered (a folded service) yields no service card.
    diagnose.mockResolvedValueOnce({ ...diagnosis, service: 'thermostat-installation' });
    expect((await (await post({ locale: 'en', text: 'thermostat' })).json()).service).toBeNull();
    diagnose.mockResolvedValueOnce({ ...diagnosis, service: 'humidity-mould-check' });
    const soon = (await (await post({ locale: 'en', text: 'mould in wardrobe' })).json()).service;
    expect(soon.comingSoon).toBe(true);
    expect(soon.priceFrom).toBeNull();
  });

  it('maps AI errors to honest statuses', async () => {
    const ai = await import('@/lib/ai');
    // A fresh visitor IP per call: nine requests from one address would hit the rate limit.
    let visitor = 0;
    const ask = () => post({ locale: 'en', text: 'drips water' }, `203.0.113.${(visitor += 1)}`);
    diagnose.mockRejectedValueOnce(new ai.AiNotConfiguredError());
    expect((await ask()).status).toBe(503);
    diagnose.mockRejectedValueOnce(new ai.AiRefusedError());
    expect((await ask()).status).toBe(422);
    // Key, balance and rate problems are ours: "unavailable", not "failed".
    for (const status of [401, 402, 403, 429]) {
      diagnose.mockRejectedValueOnce(new ai.AiUpstreamError(status));
      const response = await ask();
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: 'unavailable' });
    }
    diagnose.mockRejectedValueOnce(new ai.AiUpstreamError(500, 'server_error'));
    expect((await ask()).status).toBe(502);
    diagnose.mockRejectedValueOnce(new ai.AiNetworkError());
    expect((await ask()).status).toBe(502);
    diagnose.mockRejectedValueOnce(new ai.AiParseError());
    expect((await ask()).status).toBe(502);
    diagnose.mockRejectedValueOnce(new Error('boom'));
    expect((await ask()).status).toBe(500);
  });

  it('stops a burst from one visitor with rate_limited, and leaves other visitors alone', async () => {
    diagnose.mockResolvedValue(diagnosis);
    const ask = (ip: string) => post({ locale: 'en', text: 'drips water' }, ip);
    for (let i = 0; i < DIAGNOSE_LIMITS.burst.limit; i += 1)
      expect((await ask('198.51.100.1')).status).toBe(200);
    const refused = await ask('198.51.100.1');
    expect(refused.status).toBe(429);
    expect(refused.headers.get('retry-after')).toBe('60');
    expect(await refused.json()).toEqual({ error: 'rate_limited' });
    expect((await ask('198.51.100.2')).status).toBe(200);
    expect(diagnose).toHaveBeenCalledTimes(DIAGNOSE_LIMITS.burst.limit + 1);
  });

  it('answers quota once the hourly allowance of a visitor is spent, without calling the model', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T10:00:05Z'));
    diagnose.mockResolvedValue(diagnosis);
    const ask = (ip: string) => post({ locale: 'en', text: 'drips water' }, ip);
    // Twenty seconds apart: slow enough for the burst check, all inside one hour.
    for (let i = 0; i < DIAGNOSE_LIMITS.visitorHour.limit; i += 1) {
      expect((await ask('198.51.100.7')).status).toBe(200);
      vi.advanceTimersByTime(20_000);
    }
    const refused = await ask('198.51.100.7');
    expect(refused.status).toBe(429);
    expect(await refused.json()).toEqual({ error: 'quota' });
    expect(diagnose).toHaveBeenCalledTimes(DIAGNOSE_LIMITS.visitorHour.limit);
    // Another visitor is not affected; the first one is served again in the next hour.
    expect((await ask('198.51.100.8')).status).toBe(200);
    vi.setSystemTime(new Date('2026-11-16T11:00:05Z'));
    expect((await ask('198.51.100.7')).status).toBe(200);
  });

  it('caps the whole site per day (AI_DAILY_LIMIT), whoever is asking', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T10:00:05Z'));
    vi.stubEnv('AI_DAILY_LIMIT', '3');
    diagnose.mockResolvedValue(diagnosis);
    const ask = (ip: string) => post({ locale: 'en', text: 'drips water' }, ip);
    for (let i = 1; i <= 3; i += 1) expect((await ask(`192.0.2.${i}`)).status).toBe(200);
    const refused = await ask('192.0.2.4');
    expect(await refused.json()).toEqual({ error: 'quota' });
    expect(diagnose).toHaveBeenCalledTimes(3);
    // A malformed request never spends the allowance.
    expect((await post({ locale: 'en', text: '' }, '192.0.2.5')).status).toBe(400);
    vi.setSystemTime(new Date('2026-11-17T00:00:05Z'));
    expect((await ask('192.0.2.4')).status).toBe(200);
  });
});
