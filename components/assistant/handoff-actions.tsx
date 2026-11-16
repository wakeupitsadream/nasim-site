'use client';

import { MessageSquareIcon, PhoneIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WhatsAppIcon } from '@/components/icons/brand';
import { CtaLink } from '@/components/marketing/cta-link';
import { Button } from '@/components/ui/button';
import { callTarget, whatsappTarget } from '@/lib/cta';
import { Link } from '@/lib/i18n/navigation';

export type HandoffContacts = { phone: string; whatsapp: string };

// Long labels (German, French) wrap inside the button instead of widening the chat bubble.
const WRAP = 'h-auto min-h-9 max-w-full py-1.5 text-start whitespace-normal';

type Props = {
  contacts: HandoffContacts;
  /** Prefilled WhatsApp text: what the visitor asked and what the assistant suggested. */
  message?: string;
  /** Without a phone or a WhatsApp number: link to the contact page (default) or render nothing. */
  fallback?: boolean;
  size?: 'sm' | 'default';
};

/**
 * Where the assistant hands a conversation over to a person (DECISIONS №84): WhatsApp with the
 * question already typed, and an ordinary phone call (rule 16 — never a WhatsApp call). Until the
 * owner fills in the contacts, one link to the contact page instead of dead buttons.
 */
export function HandoffActions({ contacts, message, fallback = true, size = 'sm' }: Props) {
  const t = useTranslations('Cta');
  const tDiagnose = useTranslations('Diagnose');
  const tCommon = useTranslations('Common');
  const whatsapp = whatsappTarget(contacts, message);
  const call = callTarget(contacts);

  if (whatsapp.kind === 'internal' && call.kind === 'internal') {
    return fallback ? (
      <Button variant="outline" size={size} className={WRAP} asChild>
        <Link href="/contact">
          <MessageSquareIcon />
          {tDiagnose('result.contact')}
        </Link>
      </Button>
    ) : null;
  }
  return (
    <>
      {whatsapp.kind === 'external' ? (
        <CtaLink
          target={whatsapp}
          newTabHint={tCommon('opensInNewTab')}
          variant="outline"
          size={size}
          className={WRAP}
          data-handoff="whatsapp"
        >
          <WhatsAppIcon className="text-whatsapp" />
          {t('whatsapp')}
        </CtaLink>
      ) : null}
      {call.kind === 'external' ? (
        <CtaLink
          target={call}
          newTabHint={tCommon('opensInNewTab')}
          variant="outline"
          size={size}
          className={WRAP}
          data-handoff="call"
        >
          <PhoneIcon strokeWidth={1.75} />
          {t('call')}
        </CtaLink>
      ) : null}
    </>
  );
}

/** True when there is a real channel to hand over to, not just the contact page. */
export const hasDirectContact = (contacts: HandoffContacts): boolean =>
  whatsappTarget(contacts).kind === 'external' || callTarget(contacts).kind === 'external';
