import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import type { AdminMessages } from '@/lib/admin/i18n';
import { cn } from '@/lib/utils';

/** The labels of the save bar, the same on every edit screen. */
export const formLabels = (m: AdminMessages) => ({
  save: m.form.save,
  saving: m.form.saving,
  dirty: m.form.dirty,
  clean: m.form.unchanged,
  reset: m.form.reset,
});

/** A changed field (ActionForm sets `data-dirty`) gets a red edge until it is saved. */
export const dirtyMark = 'data-dirty:border-brand data-dirty:bg-brand-soft/50';

/** Page heading of an admin section. */
export function PageHeader({
  title,
  lead,
  eyebrow,
}: {
  title: string;
  lead?: string;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="mb-7 grid gap-2">
      {eyebrow ? <div className="text-small text-muted-foreground">{eyebrow}</div> : null}
      <h1 className="font-wordmark text-h3 font-bold tracking-tight text-balance">{title}</h1>
      {lead ? <p className="max-w-2xl text-pretty text-muted-foreground">{lead}</p> : null}
    </header>
  );
}

/** A titled group of fields on a white card; `icon` sits in a tile next to the title. */
export function Panel({
  title,
  hint,
  icon,
  aside,
  children,
  className,
  id,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  /** Right of the title: a status chip, a link. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 rounded-card border border-border bg-card p-5 shadow-card',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-foreground [&_svg]:size-5">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-lead font-semibold tracking-normal text-balance">
            {title}
          </h2>
          {hint ? (
            <p className="mt-0.5 text-small text-pretty text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {aside}
      </div>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

type TextFieldProps = { label: ReactNode; hint?: string } & ComponentProps<typeof Input>;

export function TextField({ label, hint, className, ...input }: TextFieldProps) {
  return (
    <label className="grid gap-1.5 text-small font-medium">
      {label}
      <Input {...input} className={cn(dirtyMark, className)} />
      {hint ? <span className="font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

/** A switch: a native checkbox, so the form posts it and the keyboard works as usual. */
export function ToggleField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex min-h-tap cursor-pointer items-center justify-between gap-4 text-body">
      <span className="text-pretty">{label}</span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        defaultChecked={defaultChecked}
        className="relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-line-strong transition-colors outline-none after:absolute after:inset-s-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-card after:shadow-card after:transition-transform checked:bg-primary checked:after:translate-x-5 focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 data-dirty:ring-2 data-dirty:ring-brand"
      />
    </label>
  );
}

/** A small coloured chip with a dot: service status, user role. */
export function StatusChip({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'muted';
  children: ReactNode;
}) {
  const tones = {
    success: 'bg-success-soft text-success-ink [--dot:var(--nasim-success)]',
    warning: 'bg-warning-soft text-warning-ink [--dot:var(--nasim-warning)]',
    muted: 'bg-surface-2 text-muted-foreground [--dot:var(--nasim-ink-muted)]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        tones[tone],
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-(--dot)" />
      {children}
    </span>
  );
}

export const STATUS_TONE = { active: 'success', coming_soon: 'warning', hidden: 'muted' } as const;
