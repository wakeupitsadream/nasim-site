import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const parse = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {}
  class RateLimitError extends APIError {}
  class AuthenticationError extends APIError {}
  class APIConnectionError extends Error {}
  class Anthropic {
    static APIError = APIError;
    static RateLimitError = RateLimitError;
    static AuthenticationError = AuthenticationError;
    static APIConnectionError = APIConnectionError;
    beta = { messages: { parse } };
  }
  return { default: Anthropic };
});

const catalogue = [
  {
    slug: 'ac-cleaning',
    category: 'ac' as const,
    status: 'active' as const,
    name: 'AC Cleaning',
    short: 'Standard clean',
    symptoms: ['Smell'],
    includes: ['Filters'],
  },
];

const answer = {
  summary: 'Probably a dirty coil.',
  causes: [
    { title: 'Dust', detail: 'Coil film.', likelihood: 'likely' },
    { title: 'Mould', detail: 'Wet coil.', likelihood: 'possible' },
    { title: 'Drain', detail: 'Silt.', likelihood: 'possible' },
    { title: 'Fan', detail: 'Dirty blower.', likelihood: 'unlikely' },
    { title: 'Extra', detail: 'Too many.', likelihood: 'unlikely' },
  ],
  service: 'ac-cleaning',
  urgency: 'soon',
  safety: null,
  questions: ['a', 'b', 'c', 'd'],
  outOfScope: false,
  confidence: 'high',
};

describe('diagnose()', () => {
  beforeEach(() => {
    vi.resetModules();
    parse.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('throws a typed error without an API key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const { diagnose, AiNotConfiguredError } = await import('@/lib/ai');
    await expect(
      diagnose({ locale: 'en', text: 'smell' }, 'Nasim', catalogue),
    ).rejects.toBeInstanceOf(AiNotConfiguredError);
    expect(parse).not.toHaveBeenCalled();
  });

  it('calls structured outputs with fallbacks and trims the answer', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    parse.mockResolvedValue({ stop_reason: 'end_turn', parsed_output: answer });
    const { diagnose } = await import('@/lib/ai');
    const result = await diagnose({ locale: 'en', text: 'bad smell' }, 'Nasim', catalogue);

    expect(result.causes).toHaveLength(4);
    expect(result.questions).toHaveLength(3);
    expect(result.service).toBe('ac-cleaning');

    const params = parse.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(params.model).toBe('claude-opus-5-5');
    expect(params.fallbacks).toBe('default');
    expect(params.betas).toContain('server-side-fallback-2026-07-01');
    expect((params.output_config as { effort: string }).effort).toBe('low');
    expect((params.output_config as { format: unknown }).format).toBeTruthy();
    const system = (params.system as { text: string }[])[0]!.text;
    expect(system).toContain('slug: ac-cleaning');
    expect(JSON.stringify(params.messages)).toContain('bad smell');
  });

  it('drops a service slug that is not in the catalogue', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    parse.mockResolvedValue({
      stop_reason: 'end_turn',
      parsed_output: { ...answer, service: 'made-up' },
    });
    const { diagnose } = await import('@/lib/ai');
    const result = await diagnose({ locale: 'en', text: 'bad smell' }, 'Nasim', catalogue);
    expect(result.service).toBeNull();
  });

  it('maps refusals and unparsable answers to typed errors', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    const { diagnose, AiRefusedError, AiParseError } = await import('@/lib/ai');
    parse.mockResolvedValueOnce({ stop_reason: 'refusal', parsed_output: null });
    await expect(
      diagnose({ locale: 'en', text: 'bad smell' }, 'Nasim', catalogue),
    ).rejects.toBeInstanceOf(AiRefusedError);
    parse.mockResolvedValueOnce({ stop_reason: 'end_turn', parsed_output: null });
    await expect(
      diagnose({ locale: 'en', text: 'bad smell' }, 'Nasim', catalogue),
    ).rejects.toBeInstanceOf(AiParseError);
  });
});
