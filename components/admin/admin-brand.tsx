import { BrandMark } from '@/components/marketing/brand-mark';
import { Wordmark } from '@/components/marketing/logo';
import { cn } from '@/lib/utils';

/** The Brigada lock-up with the word «Админка» under it; `title` is its accessible name. */
export function AdminBrand({
  label,
  title,
  onDark = false,
  className,
}: {
  label: string;
  title: string;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={title}
      dir="ltr"
      className={cn('flex items-center gap-2.5', className)}
    >
      <BrandMark className="h-8 w-[2.4rem] shrink-0 text-brand" />
      <span aria-hidden="true" className="flex flex-col leading-none">
        <Wordmark className={onDark ? 'text-on-deep' : undefined} />
        <span className="mt-1.5 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </span>
      </span>
    </div>
  );
}
