import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import type { CtaTarget } from '@/lib/cta';
import { Link } from '@/lib/i18n/navigation';

type Props = { target: CtaTarget; newTabHint: string } & Omit<
  ComponentProps<typeof Button>,
  'asChild'
>;

/**
 * A contact CTA as a button-styled link. Internal targets (/contact while contacts are empty)
 * use the locale-aware Link; external ones open WhatsApp/Telegram in a new tab and say so to
 * screen readers. No hooks: usable from server and client components.
 */
export function CtaLink({
  target,
  newTabHint,
  children,
  'aria-label': ariaLabel,
  ...button
}: Props) {
  const newTab = target.kind === 'external' && target.newTab;
  const label = ariaLabel && newTab ? `${ariaLabel} ${newTabHint}` : ariaLabel;

  return (
    <Button asChild aria-label={label} {...button}>
      {target.kind === 'internal' ? (
        <Link href={target.href}>{children}</Link>
      ) : (
        <a href={target.href} {...(newTab ? { target: '_blank', rel: 'noopener' } : {})}>
          {children}
          {newTab && !ariaLabel ? <span className="sr-only">{newTabHint}</span> : null}
        </a>
      )}
    </Button>
  );
}
