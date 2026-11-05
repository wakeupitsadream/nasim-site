import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonSchemaFor, parseJsonObject } from '@/lib/ai/gateway';
import { diagnosisSchema } from '@/lib/validation/diagnose';

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

/** An OpenAI-style completion whose assistant text is `content`. */
const completion = (content: string, extra: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content }, ...extra }] }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );

const fetchMock = vi.fn<typeof fetch>();

describe('diagnose() through the OpenAI-compatible gateway', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('POLZA_API_KEY', 'pza_test');
    vi.stubEnv('AI_MODEL', '');
    vi.stubEnv('AI_BASE_URL', '');
    vi.stubEnv('AI_EFFORT', '');
    vi.stubEnv('AI_API_KEY', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('throws a typed error without a key and never calls the gateway', async () => {
    vi.stubEnv('POLZA_API_KEY', '');
    const { diagnose, AiNotConfiguredError, isAiConfigured } = await import('@/lib/ai');
    expect(isAiConfigured()).toBe(false);
    await expect(
      diagnose({ locale: 'en', text: 'smell' }, 'Nasim', catalogue),
    ).rejects.toBeInstanceOf(AiNotConfiguredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts a strict-JSON request to Polza with the photo first and trims the answer', async () => {
    vi.stubEnv('AI_EFFORT', 'low');
    fetchMock.mockResolvedValue(completion(JSON.stringify(answer)));
    const { diagnose } = await import('@/lib/ai');
    const result = await diagnose(
      { locale: 'ru', text: 'плохо пахнет', image: { mediaType: 'image/jpeg', data: 'QUJD' } },
      'Nasim',
      catalogue,
    );

    expect(result.causes).toHaveLength(4);
    expect(result.questions).toHaveLength(3);
    expect(result.service).toBe('ac-cleaning');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://polza.ai/api/v1/chat/completions');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).authorization).toBe('Bearer pza_test');
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(body.model).toBe('anthropic/claude-opus-5.5');
    expect(body.reasoning).toEqual({ effort: 'low' });
    const format = body.response_format as {
      type: string;
      json_schema: { name: string; strict: boolean; schema: Record<string, unknown> };
    };
    expect(format.type).toBe('json_schema');
    expect(format.json_schema.strict).toBe(true);
    expect(format.json_schema.schema.additionalProperties).toBe(false);
    expect(format.json_schema.schema.$schema).toBeUndefined();
    const messages = body.messages as { role: string; content: unknown }[];
    expect(messages[0]?.role).toBe('system');
    expect(String(messages[0]?.content)).toContain('slug: ac-cleaning');
    const parts = messages[1]?.content as {
      type: string;
      image_url?: { url: string };
      text?: string;
    }[];
    expect(parts[0]?.type).toBe('image_url');
    expect(parts[0]?.image_url?.url).toBe('data:image/jpeg;base64,QUJD');
    expect(parts[1]?.text).toContain('плохо пахнет');
    expect(parts[1]?.text).toContain('Russian');
  });

  it('honours AI_BASE_URL, AI_MODEL, AI_API_KEY and an empty AI_EFFORT', async () => {
    vi.stubEnv('POLZA_API_KEY', '');
    vi.stubEnv('AI_API_KEY', 'other-key');
    vi.stubEnv('AI_BASE_URL', 'https://gateway.example/v1/');
    vi.stubEnv('AI_MODEL', 'anthropic/claude-haiku-5.5');
    fetchMock.mockResolvedValue(completion(JSON.stringify(answer)));
    const { diagnose } = await import('@/lib/ai');
    await diagnose({ locale: 'en', text: 'bad smell' }, 'Nasim', catalogue);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://gateway.example/v1/chat/completions');
    expect((init?.headers as Record<string, string>).authorization).toBe('Bearer other-key');
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(body.model).toBe('anthropic/claude-haiku-5.5');
    expect(body.reasoning).toBeUndefined();
  });

  it('accepts fenced JSON and drops a service slug that is not in the catalogue', async () => {
    fetchMock.mockResolvedValue(
      completion('```json\n' + JSON.stringify({ ...answer, service: 'made-up' }) + '\n```'),
    );
    const { diagnose } = await import('@/lib/ai');
    const result = await diagnose({ locale: 'en', text: 'bad smell' }, 'Nasim', catalogue);
    expect(result.service).toBeNull();
    expect(result.summary).toBe(answer.summary);
  });

  it('maps refusals, off-schema answers, gateway errors and network failures to typed errors', async () => {
    const { diagnose, AiRefusedError, AiParseError, AiUpstreamError, AiNetworkError } =
      await import('@/lib/ai');
    const ask = () => diagnose({ locale: 'en', text: 'bad smell' }, 'Nasim', catalogue);

    fetchMock.mockResolvedValueOnce(completion('', { finish_reason: 'content_filter' }));
    await expect(ask()).rejects.toBeInstanceOf(AiRefusedError);

    fetchMock.mockResolvedValueOnce(completion('Sorry, I cannot help with that.'));
    await expect(ask()).rejects.toBeInstanceOf(AiParseError);

    fetchMock.mockResolvedValueOnce(completion(JSON.stringify({ summary: 'only this' })));
    await expect(ask()).rejects.toBeInstanceOf(AiParseError);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'insufficient_balance' } }), { status: 402 }),
    );
    await expect(ask()).rejects.toMatchObject({
      name: 'AiUpstreamError',
      status: 402,
      code: 'insufficient_balance',
    });
    expect(AiUpstreamError.name).toBe('AiUpstreamError');

    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(ask()).rejects.toBeInstanceOf(AiNetworkError);
  });
});

describe('gateway helpers', () => {
  it('turns the zod schema into a strict JSON schema the gateway accepts', () => {
    const schema = jsonSchemaFor(diagnosisSchema) as {
      type: string;
      required: string[];
      additionalProperties: boolean;
      properties: Record<string, { type?: unknown; items?: { additionalProperties?: boolean } }>;
    };
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required.sort()).toEqual(Object.keys(diagnosisSchema.shape).sort());
    expect(schema.properties.service?.type).toEqual(['string', 'null']);
    expect(schema.properties.causes?.items?.additionalProperties).toBe(false);
  });

  it('finds the JSON object inside prose or fences', () => {
    expect(parseJsonObject('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJsonObject('{"a":{"b":[1,2]}} trailing')).toEqual({ a: { b: [1, 2] } });
    expect(parseJsonObject('no json here')).toBeUndefined();
    expect(parseJsonObject('{broken')).toBeUndefined();
  });
});
