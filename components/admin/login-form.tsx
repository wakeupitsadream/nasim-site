'use client';

import { CircleAlert } from 'lucide-react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IDLE, type FormAction } from '@/lib/admin/form-state';

type Props = {
  action: FormAction;
  labels: { email: string; password: string; submit: string; pending: string };
};

export function LoginForm({ action, labels }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const failed = !pending && state.message !== '';
  return (
    // Next keeps a page it navigated away from, hidden, with its DOM: the typed password must not
    // stay there after signing in, so the fields are cleared when the page is hidden.
    <form ref={(form) => () => form?.reset()} action={formAction} className="grid gap-4">
      <label className="grid gap-1.5 text-small font-medium">
        {labels.email}
        <Input
          name="email"
          type="email"
          autoComplete="username"
          required
          dir="ltr"
          aria-invalid={state.status === 'error' || undefined}
        />
      </label>
      <label className="grid gap-1.5 text-small font-medium">
        {labels.password}
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          aria-invalid={state.status === 'error' || undefined}
        />
      </label>
      <p
        role="alert"
        className={
          failed
            ? 'flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-small text-pretty text-danger-ink'
            : 'sr-only'
        }
      >
        {failed ? <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : null}
        {failed ? state.message : ''}
      </p>
      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        {pending ? labels.pending : labels.submit}
      </Button>
    </form>
  );
}
