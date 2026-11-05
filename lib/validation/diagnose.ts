import { z } from 'zod';

// Boundary schemas for the AI triage feature (CLAUDE.md rule 6). The request schema runs on the
// client before sending and in the route handler; the diagnosis schema is also the structured
// output format the model must satisfy, so it stays within the structured-outputs JSON subset
// (objects, strings, enums, booleans, arrays, nullable — no length or numeric constraints).

export const DIAGNOSE_MAX_TEXT = 600;
/** Decoded image bytes; the client resizes photos to ~1280px JPEG, which lands far below this. */
export const DIAGNOSE_MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export const diagnoseImageSchema = z.object({
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  data: z
    .string()
    .regex(BASE64, 'base64')
    .refine((s) => (s.length * 3) / 4 <= DIAGNOSE_MAX_IMAGE_BYTES, 'image too large'),
});

export const diagnoseRequestSchema = z
  .object({
    locale: z.enum(['en', 'ar', 'ru']),
    text: z.string().trim().max(DIAGNOSE_MAX_TEXT).default(''),
    image: diagnoseImageSchema.optional(),
  })
  .refine((v) => v.text.length >= 3 || v.image !== undefined, {
    message: 'describe the problem or attach a photo',
    path: ['text'],
  });

export type DiagnoseRequest = z.infer<typeof diagnoseRequestSchema>;

/** What the model returns. Prices are never part of it: the server attaches them from lib/pricing. */
export const diagnosisSchema = z.object({
  /** One or two plain sentences on what is most likely going on. */
  summary: z.string(),
  causes: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      likelihood: z.enum(['likely', 'possible', 'unlikely']),
    }),
  ),
  /** Exactly one service slug from the catalogue, or null when none fits. */
  service: z.string().nullable(),
  urgency: z.enum(['routine', 'soon', 'today']),
  /** Immediate safety advice (switch off at the breaker, stop using the unit), or null. */
  safety: z.string().nullable(),
  /** Up to three short clarifying questions the technician would ask. */
  questions: z.array(z.string()),
  /** True when the problem is outside what the company does (installation, ducts, walls…). */
  outOfScope: z.boolean(),
  confidence: z.enum(['low', 'medium', 'high']),
});

export type Diagnosis = z.infer<typeof diagnosisSchema>;

export const diagnoseServiceSchema = z.object({
  slug: z.string(),
  name: z.string(),
  href: z.string(),
  priceFrom: z.object({ amount: z.number(), unit: z.string() }).nullable(),
  /** Repairs are priced as diagnostics plus an estimate, not a fixed sum. */
  estimate: z.boolean(),
  comingSoon: z.boolean(),
});

/** The route's successful JSON body: the diagnosis plus the matched service with its price. */
export const diagnoseResponseSchema = diagnosisSchema.extend({
  service: diagnoseServiceSchema.nullable(),
});

export type DiagnoseResponse = z.infer<typeof diagnoseResponseSchema>;

export const DIAGNOSE_ERRORS = [
  'invalid',
  'rate_limited',
  'unavailable',
  'refused',
  'failed',
] as const;
export type DiagnoseError = (typeof DIAGNOSE_ERRORS)[number];
