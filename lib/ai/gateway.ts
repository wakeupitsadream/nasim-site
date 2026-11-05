// OpenAI-compatible chat completions over plain fetch (DECISIONS №51). Provider-agnostic: Polza AI
// today (a roubles-billed gateway to Claude that works from Russia), any compatible gateway
// tomorrow — only the base URL and the key change. No SDK: the gateway has none, and the surface we
// need is one endpoint. Pure apart from `fetch`, which tests inject.
import { z } from 'zod';

export type GatewayConfig = {
  /** e.g. https://polza.ai/api/v1 (a trailing slash is tolerated). */
  baseUrl: string;
  apiKey: string;
  /** Gateway model id, e.g. anthropic/claude-opus-5.5. */
  model: string;
  /** Reasoning effort hint (`reasoning.effort`); null leaves the provider default. */
  effort: 'low' | 'medium' | 'high' | null;
  timeoutMs: number;
};

export type ContentPart =
  { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

export type ChatJsonRequest<T> = {
  system: string;
  user: ContentPart[];
  /** The answer must satisfy this schema; it is also sent as a strict JSON schema. */
  schema: z.ZodType<T>;
  schemaName: string;
  maxTokens: number;
};

export type ChatJsonResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'refused' }
  /** No usable JSON came back (empty, truncated, off-schema). */
  | { kind: 'unparsable' };

/** The gateway answered with an HTTP error: key (401/403), balance (402), rate (429), outage (5xx). */
export class AiUpstreamError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(`AI gateway responded ${status}${code ? ` (${code})` : ''}`);
    this.name = 'AiUpstreamError';
  }
}

/** The request never completed: DNS, TLS, reset, or our own timeout. */
export class AiNetworkError extends Error {
  constructor(cause?: unknown) {
    super(cause instanceof Error ? cause.name : 'fetch failed');
    this.name = 'AiNetworkError';
  }
}

/**
 * zod → JSON Schema in the strict dialect gateways and providers agree on: zod 4 already emits
 * `additionalProperties: false`, every property required and nullables as `["string","null"]`.
 * `$schema` is dropped (some validators reject unknown keywords).
 */
export function jsonSchemaFor(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/** An OpenAI-style message body: a string, or an array of typed parts. */
type MessageContent = string | { type?: string; text?: string }[] | null | undefined;

type Completion = {
  choices?: {
    finish_reason?: string | null;
    message?: { content?: MessageContent; refusal?: string | null };
  }[];
};

/** Text of a message: the string itself, or its text parts joined. */
const textOf = (content: MessageContent): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => (part?.type === 'text' ? (part.text ?? '') : '')).join('');
  }
  return '';
};

/** The first {...} object in the text, fences and prose around it ignored; undefined if none parses. */
export function parseJsonObject(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return undefined;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown;
  } catch {
    return undefined;
  }
}

const errorCode = (payload: unknown): string | undefined => {
  const error = (payload as { error?: { code?: unknown; type?: unknown } } | null)?.error;
  const code = error?.code ?? error?.type;
  return typeof code === 'string' ? code.slice(0, 64) : undefined;
};

/**
 * One chat completion that must come back as JSON matching `schema`. The schema goes out as a
 * strict `response_format` and is repeated by the caller in the system prompt; the answer is
 * validated with zod regardless, so a gateway that ignores either cannot slip an off-schema
 * object through. Nothing from the request or the answer is logged here.
 */
export async function chatJson<T>(
  config: GatewayConfig,
  request: ChatJsonRequest<T>,
  fetchImpl: typeof fetch = fetch,
): Promise<ChatJsonResult<T>> {
  const body = {
    model: config.model,
    max_tokens: request.maxTokens,
    ...(config.effort ? { reasoning: { effort: config.effort } } : {}),
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: request.schemaName,
        strict: true,
        schema: jsonSchemaFor(request.schema),
      },
    },
    messages: [
      { role: 'system', content: request.system },
      { role: 'user', content: request.user },
    ],
  };

  let response: Response;
  try {
    response = await fetchImpl(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (error) {
    throw new AiNetworkError(error);
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new AiUpstreamError(response.status, errorCode(payload));
  }

  const payload = (await response.json().catch(() => null)) as Completion | null;
  const choice = payload?.choices?.[0];
  if (!choice) return { kind: 'unparsable' };
  if (choice.finish_reason === 'content_filter' || choice.message?.refusal) {
    return { kind: 'refused' };
  }
  const parsed = parseJsonObject(textOf(choice.message?.content));
  const checked = parsed === undefined ? null : request.schema.safeParse(parsed);
  return checked?.success ? { kind: 'ok', data: checked.data } : { kind: 'unparsable' };
}
