// The only module that talks to the Claude API (CLAUDE.md rule 11). Server-only. Results are
// shown to the visitor and never written anywhere; nothing the customer sends is logged.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import {
  buildDiagnosisSystemPrompt,
  buildDiagnosisUserContent,
  type CatalogueEntry,
} from '@/lib/ai/diagnose-prompt';
import { diagnosisSchema, type DiagnoseRequest, type Diagnosis } from '@/lib/validation/diagnose';

export const AI_MODEL = process.env.AI_MODEL ?? 'claude-opus-5-5';

export class AiNotConfiguredError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not set');
    this.name = 'AiNotConfiguredError';
  }
}
export class AiRefusedError extends Error {
  constructor() {
    super('The model declined the request');
    this.name = 'AiRefusedError';
  }
}
export class AiParseError extends Error {
  constructor() {
    super('The model answer did not match the schema');
    this.name = 'AiParseError';
  }
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiNotConfiguredError();
  // One short attempt: the visitor is waiting, and the route maps failures to a friendly state.
  client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });
  return client;
}

export const isAiConfigured = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY);

const MAX_CAUSES = 4;
const MAX_QUESTIONS = 3;

/**
 * Triage a customer's description and optional photo against the service catalogue. Structured
 * output keeps the answer to the schema; refusals fall back server-side to another model.
 */
export async function diagnose(
  input: DiagnoseRequest,
  brand: string,
  catalogue: CatalogueEntry[],
): Promise<Diagnosis> {
  const response = await getClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 2048,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(diagnosisSchema) },
    system: [
      {
        type: 'text',
        text: buildDiagnosisSystemPrompt(brand, catalogue),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: buildDiagnosisUserContent(input) }],
  });

  if (response.stop_reason === 'refusal') throw new AiRefusedError();
  const parsed = response.parsed_output;
  if (!parsed) throw new AiParseError();

  const slugs = new Set(catalogue.map((s) => s.slug));
  return {
    ...parsed,
    service: parsed.service && slugs.has(parsed.service) ? parsed.service : null,
    causes: parsed.causes.slice(0, MAX_CAUSES),
    questions: parsed.questions.slice(0, MAX_QUESTIONS),
  };
}

/** Typed error classes of the SDK, re-exported so route handlers never import the SDK themselves. */
export const AiErrors = {
  RateLimit: Anthropic.RateLimitError,
  Authentication: Anthropic.AuthenticationError,
  Connection: Anthropic.APIConnectionError,
  Api: Anthropic.APIError,
} as const;
