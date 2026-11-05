import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { cn } from '@/lib/utils';

type Props = {
  /** id of the heading, for `aria-labelledby` on the section. */
  id: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  as?: 'h1' | 'h2';
  size?: 'display' | 'h1' | 'h2';
  align?: 'start' | 'center';
  actions?: ReactNode;
  className?: string;
  /** Language of the title when it fell back to EN (LocalizedText semantics). */
  titleLang?: string;
};

const SIZE = { display: 'text-display', h1: 'text-h1', h2: 'text-h2' } as const;

/** Eyebrow → heading → lead, with the section rhythm below (`mb-stack`). */
export function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  as: Tag = 'h2',
  size,
  align = 'start',
  actions,
  className,
  titleLang,
}: Props) {
  const sizeClass = SIZE[size ?? (Tag === 'h1' ? 'h1' : 'h2')];
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'mb-stack flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between',
        centered && 'items-center text-center lg:flex-col lg:items-center',
        className,
      )}
    >
      <div className={cn('flex max-w-[42rem] flex-col gap-4', centered && 'items-center')}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Tag
          id={id}
          lang={titleLang}
          dir={titleLang ? 'auto' : undefined}
          className={cn(sizeClass, 'text-balance text-primary in-[.tone-deep]:text-on-deep')}
        >
          {title}
        </Tag>
        {lead ? <p className="text-lead text-pretty text-muted-foreground">{lead}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
