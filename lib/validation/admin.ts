import { z } from 'zod';

// Schemas the admin's server actions start with (CLAUDE.md rule 6). A form arrives as text
// fields; lib/admin/forms.ts turns them into the typed entities and validates those with the
// same schemas the site reads its content with (lib/validation/content.ts, settings.ts).

/** Every field of a submitted admin form: text only (no files), bounded. */
export const formFieldsSchema = z.record(z.string().max(80), z.string().max(4000));
export type FormFields = z.infer<typeof formFieldsSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(120).pipe(z.email()),
  password: z.string().min(1).max(200),
});

export const adminLocaleSchema = z.enum(['ru', 'en']);

/** A price typed by the owner: whole dirhams or two decimals, comma or dot. */
export const amountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}(?:[.,]\d{1,2})?$/)
  .transform((v) => Number(v.replace(',', '.')))
  .refine((n) => n >= 1);
