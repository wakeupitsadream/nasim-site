'use client';

import { CircleAlert, CircleCheck } from 'lucide-react';
import {
  Fragment,
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { IDLE, type FormAction } from '@/lib/admin/form-state';
import { cn } from '@/lib/utils';

type Props = {
  action: FormAction;
  /** `dirty` carries `{n}`: the number of changed fields. */
  labels: { save: string; saving: string; dirty: string; clean: string; reset: string };
  children: ReactNode;
  className?: string;
};

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
const isField = (el: Element): el is Field =>
  el instanceof HTMLInputElement ||
  el instanceof HTMLTextAreaElement ||
  el instanceof HTMLSelectElement;

function changed(field: Field): boolean {
  if (field instanceof HTMLSelectElement)
    return [...field.options].some((o) => o.selected !== o.defaultSelected);
  if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio'))
    return field.checked !== field.defaultChecked;
  return field.value !== field.defaultValue;
}

/**
 * An admin edit form: the fields come from the server as children; a floating bar counts what
 * was changed, saves and reports. Changed fields carry `data-dirty` (the fields style it).
 * Submitted by hand so that a rejected save keeps what was typed (a form action would reset the
 * fields); after a successful save the fields remount with the stored values.
 */
export function ActionForm({ action, labels, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const [dirty, setDirty] = useState(0);
  const form = useRef<HTMLFormElement>(null);

  const recount = useCallback(() => {
    const names = new Set<string>();
    for (const field of form.current?.elements ?? []) {
      if (!isField(field) || !field.name || field.type === 'hidden') continue;
      const isChanged = changed(field);
      field.toggleAttribute('data-dirty', isChanged);
      if (isChanged) names.add(field.name);
    }
    setDirty(names.size);
  }, []);

  // After every answer: mark what was refused, and count again (a save remounts the fields).
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
    recount();
  }, [state, recount]);

  const failed = state.status === 'error' && state.message !== '';
  const message = pending
    ? labels.saving
    : failed
      ? state.message
      : dirty > 0
        ? labels.dirty.replace('{n}', String(dirty))
        : state.message || labels.clean;
  const done = !pending && !failed && dirty === 0 && state.status === 'ok';

  return (
    <form
      ref={form}
      action={formAction}
      noValidate
      className={className}
      onInput={recount}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <Fragment key={state.version}>{children}</Fragment>
      <div className="sticky bottom-[4.5rem] z-20 mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-card/95 py-2.5 ps-4 pe-2.5 shadow-float backdrop-blur lg:bottom-5">
        <p
          role="status"
          aria-live="polite"
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 text-small font-medium',
            failed ? 'text-danger-ink' : done ? 'text-success-ink' : 'text-muted-foreground',
            dirty > 0 && !failed && !pending && 'text-foreground',
          )}
        >
          {failed ? <CircleAlert aria-hidden="true" className="size-4.5 shrink-0" /> : null}
          {done ? <CircleCheck aria-hidden="true" className="size-4.5 shrink-0" /> : null}
          {dirty > 0 && !failed && !pending ? (
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand" />
          ) : null}
          <span className="min-w-0 text-pretty">{message}</span>
        </p>
        {dirty > 0 && !pending ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.current?.reset();
              recount();
            }}
          >
            {labels.reset}
          </Button>
        ) : null}
        <Button
          type="submit"
          variant={dirty === 0 && !pending ? 'secondary' : 'primary'}
          disabled={pending || dirty === 0}
          className="max-sm:basis-full"
        >
          {pending ? labels.saving : labels.save}
        </Button>
      </div>
    </form>
  );
}
