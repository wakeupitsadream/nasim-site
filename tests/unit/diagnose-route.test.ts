import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    AI_MODEL: 'anthropic/claude-opus-5.5',
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
      name: 'Чистка кондиционера',
      href: '/services/ac-cleaning',
      priceFrom: { amount: 149, unit: 'unit' },
      estimate: false,
      comingSoon: false,
    });
    const catalogue = diagnose.mock.calls[0]?.[2] as { slug: string }[];
    expect(catalogue.map((c) => c.slug)).toContain('humidity-mould-check');
    expect(catalogue.length).toBe(12);
  });

  it('marks estimate-priced and coming-soon services', async () => {
    diagnose.mockResolvedValueOnce({ ...diagnosis, service: 'ac-repair' });
    expect(
      (await (await post({ locale: 'en', text: 'does not start' })).json()).service.estimate,
    ).toBe(true);
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

  it('rate-limits a visitor after six requests a minute', async () => {
    diagnose.mockResolvedValue(diagnosis);
    for (let i = 0; i < 6; i += 1)
      expect((await post({ locale: 'en', text: 'drips water' }, '198.51.100.1')).status).toBe(200);
    expect((await post({ locale: 'en', text: 'drips water' }, '198.51.100.1')).status).toBe(429);
    expect((await post({ locale: 'en', text: 'drips water' }, '198.51.100.2')).status).toBe(200);
  });
});
