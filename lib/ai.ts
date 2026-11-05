// The only module that talks to the AI gateway (CLAUDE.md rule 11). Server-only. Results are
// shown to the visitor and never written anywhere; nothing the customer sends is logged.
import { AiNetworkError, AiUpstreamError, chatJson, type GatewayConfig } from '@/lib/ai/gateway';
import {
  buildDiagnosisSystemPrompt,
  buildDiagnosisUserContent,
  type CatalogueEntry,
} from '@/lib/ai/diagnose-prompt';
import { diagnosisSchema, type DiagnoseRequest, type Diagnosis } from '@/lib/validation/diagnose';

export { AiNetworkError, AiUpstreamError };

/** Polza AI: OpenAI-compatible, billed in roubles, reachable from Russia (DECISIONS №51). */
export const AI_DEFAULT_BASE_URL = 'https://polza.ai/api/v1';
/** Gateway model ids carry the vendor prefix and a dotted version. */
export const AI_DEFAULT_MODEL = 'anthropic/claude-opus-5.5';
export const AI_MODEL = process.env.AI_MODEL ?? AI_DEFAULT_MODEL;

const EFFORTS = new Set(['low', 'medium', 'high']);

/**
 * Gateway settings from the environment, or null when no key is set. `POLZA_API_KEY` is the
 * documented name; `AI_API_KEY` works for any other OpenAI-compatible gateway behind `AI_BASE_URL`.
 * `AI_EFFORT` defaults to low — the triage is short and the visitor is waiting; an empty value
 * leaves the provider default.
 */
export function resolveAiConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig | null {
  const apiKey = env.POLZA_API_KEY?.trim() || env.AI_API_KEY?.trim();
  if (!apiKey) return null;
  const effort = env.AI_EFFORT === undefined ? 'low' : env.AI_EFFORT.trim();
  return {
    baseUrl: env.AI_BASE_URL?.trim() || AI_DEFAULT_BASE_URL,
    apiKey,
    model: env.AI_MODEL?.trim() || AI_DEFAULT_MODEL,
    effort: EFFORTS.has(effort) ? (effort as GatewayConfig['effort']) : null,
    // One attempt within the route's budget: the route maps failures to a friendly state.
    timeoutMs: 45_000,
  };
}

export const isAiConfigured = (): boolean => resolveAiConfig() !== null;

export class AiNotConfiguredError extends Error {
  constructor() {
    super('POLZA_API_KEY (or AI_API_KEY) is not set');
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

const MAX_CAUSES = 4;
const MAX_QUESTIONS = 3;

/**
 * Triage a customer's description and optional photo against the service catalogue. The answer
 * is requested and validated as strict JSON; the service slug is checked against the catalogue
 * once more here, so the UI never links to a service the model made up.
 */
export async function diagnose(
  input: DiagnoseRequest,
  brand: string,
  catalogue: CatalogueEntry[],
): Promise<Diagnosis> {
  const config = resolveAiConfig();
  if (!config) throw new AiNotConfiguredError();

  const result = await chatJson(config, {
    system: buildDiagnosisSystemPrompt(brand, catalogue),
    user: buildDiagnosisUserContent(input),
    schema: diagnosisSchema,
    schemaName: 'diagnosis',
    maxTokens: 2048,
  });
  if (result.kind === 'refused') throw new AiRefusedError();
  if (result.kind === 'unparsable') throw new AiParseError();

  const slugs = new Set(catalogue.map((s) => s.slug));
  const parsed = result.data;
  return {
    ...parsed,
    service: parsed.service && slugs.has(parsed.service) ? parsed.service : null,
    causes: parsed.causes.slice(0, MAX_CAUSES),
    questions: parsed.questions.slice(0, MAX_QUESTIONS),
  };
}
