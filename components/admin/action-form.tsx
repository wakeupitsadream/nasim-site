'use client';

import {
  Fragment,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { IDLE, type FormAction } from '@/lib/admin/form-state';
import { cn } from '@/lib/utils';

type Props = {
  action: FormAction;
  labels: { save: string; saving: string };
  children: ReactNode;
  className?: string;
};

/**
 * An admin edit form: the fields come from the server as children, the save bar stays in view.
 * Submitted by hand so that a rejected save keeps what was typed (a form action would reset the
 * fields); after a successful save the fields remount with the stored values.
 */
export function ActionForm({ action, labels, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const el = form.current;
    if (!el) return;
    for (const field of el.querySelectorAll('[aria-invalid="true"]'))
      field.removeAttribute('aria-invalid');
    const invalid = state.fields
      .map((name) => el.elements.namedItem(name))
      .filter((f): f is HTMLInputElement => f instanceof HTMLElement);
    for (const field of invalid) field.setAttribute('aria-invalid', 'true');
    invalid[0]?.focus();
  }, [state]);

  return (
    <form
      ref={form}
      action={formAction}
      noValidate
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <Fragment key={state.version}>{children}</Fragment>
      <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button type="submit" variant="ink" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </Button>
        <p
          role="status"
          aria-live="polite"
          className={cn(
            'min-w-0 flex-1 text-small',
            state.status === 'error' ? 'text-danger-ink' : 'text-success-ink',
          )}
        >
          {pending ? '' : state.message}
        </p>
      </div>
    </form>
  );
}
