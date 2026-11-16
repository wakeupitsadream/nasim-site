// What an admin server action answers with. Shared by the actions and the client form, so it
// imports nothing from the server.
export type FormState = {
  status: 'idle' | 'ok' | 'error';
  /** Ready to show, already in the admin's language. */
  message: string;
  /** Names of the form fields that did not pass. */
  fields: string[];
  /** Grows with every successful save: the form remounts its fields with the stored values. */
  version: number;
};

export const IDLE: FormState = { status: 'idle', message: '', fields: [], version: 0 };

export type FormAction = (prev: FormState, data: FormData) => Promise<FormState>;

export const saved = (prev: FormState, message: string): FormState => ({
  status: 'ok',
  message,
  fields: [],
  version: prev.version + 1,
});
export const unchanged = (prev: FormState, message: string): FormState => ({
  status: 'ok',
  message,
  fields: [],
  version: prev.version,
});
export const rejected = (prev: FormState, message: string, fields: string[] = []): FormState => ({
  status: 'error',
  message,
  fields,
  version: prev.version,
});
