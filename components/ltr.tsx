import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

/** Phones, prices, emails, URLs and codes keep LTR order inside RTL text (CLAUDE.md rule 2). */
export function Ltr({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span {...props} dir="ltr" className={cn('ltr', className)} />;
}
