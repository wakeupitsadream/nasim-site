'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string };

/** Section links of the admin; the current section is marked for sight and for screen readers. */
export function AdminNav({ items, label }: { items: Item[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto">
      {items.map(({ href, label: text }) => {
        const current = href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-2 text-small font-medium whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring',
              current
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {text}
          </Link>
        );
      })}
    </nav>
  );
}
