'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type NavItem = { href: string; label: string; icon: ReactNode };

type Props = {
  items: NavItem[];
  label: string;
  /** `side`: the list in the dark sidebar; `tabs`: the bar at the bottom of a phone screen. */
  variant: 'side' | 'tabs';
  className?: string;
};

/** Section links of the admin; the current section is marked for sight and for screen readers. */
export function AdminNav({ items, label, variant, className }: Props) {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href);

  if (variant === 'tabs')
    return (
      <nav
        aria-label={label}
        className={cn(
          'grid auto-cols-fr grid-flow-col border-t border-border bg-card pb-[env(safe-area-inset-bottom)]',
          className,
        )}
      >
        {items.map(({ href, label: text, icon }) => {
          const current = isCurrent(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium outline-none focus-visible:bg-muted [&_svg]:size-5',
                current ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {current ? (
                <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand" />
              ) : null}
              {icon}
              {text}
            </Link>
          );
        })}
      </nav>
    );

  return (
    <nav aria-label={label} className={cn('grid gap-1', className)}>
      {items.map(({ href, label: text, icon }) => {
        const current = isCurrent(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'relative flex min-h-tap items-center gap-3 rounded-lg px-3 text-body font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring [&_svg]:size-5 [&_svg]:shrink-0',
              current
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {current ? (
              <span className="absolute inset-y-2.5 -inset-s-3 w-1 rounded-e-full bg-brand" />
            ) : null}
            {icon}
            {text}
          </Link>
        );
      })}
    </nav>
  );
}
