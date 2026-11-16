import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Page heading of an admin section. */
export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="mb-8 grid gap-2">
      <h1 className="font-sans text-h3 font-semibold tracking-normal">{title}</h1>
      {lead ? <p className="max-w-2xl text-pretty text-muted-foreground">{lead}</p> : null}
    </header>
  );
}

/** A titled group of fields on a white card. */
export function Panel({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-card border border-border bg-card p-5 shadow-card', className)}>
      <h2 className="font-sans text-lead font-semibold tracking-normal">{title}</h2>
      {hint ? <p className="mt-1 text-small text-muted-foreground">{hint}</p> : null}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

type TextFieldProps = { label: string; hint?: string } & ComponentProps<typeof Input>;

export function TextField({ label, hint, className, ...input }: TextFieldProps) {
  return (
    <label className={cn('grid gap-1.5 text-small font-medium', className)}>
      {label}
      <Input {...input} />
      {hint ? <span className="font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function CheckField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex min-h-tap items-center gap-3 text-body">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-5 shrink-0 rounded-sm accent-primary outline-none focus-visible:ring-3 focus-visible:ring-ring"
      />
      {label}
    </label>
  );
}
