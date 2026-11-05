// Browser side of the AI triage: validate with the same zod as the route (CLAUDE.md rule 6), post,
// and map every failure to a key the UI can explain honestly. Pure apart from `fetch`, so it is
// unit-tested with a fake; the client component only renders what comes back.
import {
  DIAGNOSE_ERRORS,
  diagnoseRequestSchema,
  diagnoseResponseSchema,
  type DiagnoseError,
  type DiagnoseResponse,
} from '@/lib/validation/diagnose';

export const DIAGNOSE_ENDPOINT = '/api/diagnose';

/** Route error keys plus the one only the browser can see. */
export type DiagnoseFailure = DiagnoseError | 'network';

export type DiagnoseOutcome =
  { ok: true; data: DiagnoseResponse } | { ok: false; error: DiagnoseFailure };

const isDiagnoseError = (value: unknown): value is DiagnoseError =>
  typeof value === 'string' && (DIAGNOSE_ERRORS as readonly string[]).includes(value);

const fromStatus = (status: number): DiagnoseFailure => {
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'unavailable';
  if (status === 422) return 'refused';
  if (status === 400) return 'invalid';
  return 'failed';
};

export async function requestDiagnosis(
  input: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<DiagnoseOutcome> {
  const parsed = diagnoseRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  let response: Response;
  try {
    response = await fetchImpl(DIAGNOSE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { ok: false, error: 'network' };
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: unknown } | null)?.error;
    return { ok: false, error: isDiagnoseError(error) ? error : fromStatus(response.status) };
  }
  const data = diagnoseResponseSchema.safeParse(body);
  return data.success ? { ok: true, data: data.data } : { ok: false, error: 'failed' };
}
