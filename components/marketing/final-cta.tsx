import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { WhatsAppIcon } from '@/components/icons/brand';
import { AirflowLines } from '@/components/marketing/airflow-lines';
import { CtaLink } from '@/components/marketing/cta-link';
import { Section } from '@/components/marketing/section';
import { SpeedLines } from '@/components/marketing/speed-lines';
import { Van } from '@/components/marketing/van';
import { Button } from '@/components/ui/button';
import type { CtaTarget } from '@/lib/cta';
import { Link } from '@/lib/i18n/navigation';

type Props = {
  id?: string;
  title: ReactNode;
  lead?: ReactNode;
  primary: { href: string; label: ReactNode };
  whatsapp: { target: CtaTarget; label: ReactNode };
};

/**
 * The closing dark band: one primary action plus WhatsApp. The van rolls in along the bottom edge
 * as the band scrolls into view (components/marketing/van.tsx); it lives in the band's bottom
 * padding, so it never sits under the buttons.
 */
export async function FinalCta({ id = 'final-cta', title, lead, primary, whatsapp }: Props) {
  const t = await getTranslations('Common');
  return (
    <Section
      tone="deep"
      aria-labelledby={`${id}-title`}
      className="pb-[calc(var(--nasim-section-y)+1.5rem)]"
      decoration={
        <>
          <div className="absolute inset-0">
            <AirflowLines tone="deep" drift />
          </div>
          <div className="absolute inset-s-[4%] top-8 w-40 text-on-deep-accent opacity-60 lg:w-56">
            <SpeedLines />
          </div>
          <div className="absolute inset-e-[4%] bottom-2 w-36 text-on-deep sm:w-52 lg:w-72">
            <Van className="van-drive w-full" />
          </div>
        </>
      }
    >
      <div className="reveal flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-[40rem] flex-col gap-4">
          <h2 id={`${id}-title`} className="text-h2 text-balance text-on-deep">
            {title}
          </h2>
          {lead ? <p className="text-lead text-pretty text-on-deep-muted">{lead}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="inverse" size="lg" asChild>
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
          <CtaLink
            target={whatsapp.target}
            newTabHint={t('opensInNewTab')}
            variant="whatsapp"
            size="lg"
          >
            <WhatsAppIcon />
            {whatsapp.label}
          </CtaLink>
        </div>
      </div>
    </Section>
  );
}
