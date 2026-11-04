'use client';

import { MenuIcon } from 'lucide-react';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { LangSwitcher } from '@/components/marketing/lang-switcher';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Link } from '@/lib/i18n/navigation';

type Props = {
  items: { href: string; label: string }[];
  labels: { open: string; close: string; title: string; nav: string };
  cta: ReactNode;
  className?: string;
};

/** Navigation in a sheet from the inline end (right in LTR, left in RTL) below the xl breakpoint. */
export function MobileMenu({ items, labels, cta, className }: Props) {
  const [open, setOpen] = useState(false);

  // The layout persists across navigations, so close on any link click inside the sheet.
  const closeOnLink = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.open} className={className}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="inline-end"
        closeLabel={labels.close}
        aria-describedby={undefined}
        onClickCapture={closeOnLink}
        className="gap-2 data-[side=inline-end]:w-[min(22rem,85vw)]"
      >
        <SheetHeader>
          <SheetTitle>{labels.title}</SheetTitle>
        </SheetHeader>
        <nav aria-label={labels.nav} className="px-2">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-tap items-center rounded-lg px-3 text-lead outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Sheet content mounts only on the client after opening, so no Suspense is needed. */}
        <div className="border-t px-2 pt-2">
          <LangSwitcher />
        </div>
        <SheetFooter>{cta}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
