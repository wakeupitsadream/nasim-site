import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { WhatsAppIcon } from '@/components/icons/brand';
import { AirflowLines } from '@/components/marketing/airflow-lines';
import { CtaLink } from '@/components/marketing/cta-link';
import { Section } from '@/components/marketing/section';
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

/** The closing dark band: one primary action plus WhatsApp. */
export async function FinalCta({ id = 'final-cta', title, lead, primary, whatsapp }: Props) {
  const t = await getTranslations('Common');
  return (
    <Section
      tone="deep"
      aria-labelledby={`${id}-title`}
      decoration={
        <div className="absolute inset-0">
          <AirflowLines tone="deep" drift />
        </div>
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
