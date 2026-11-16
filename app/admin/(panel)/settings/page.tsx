import { ActionForm } from '@/components/admin/action-form';
import { BadgePercent, Eye, Phone, Scale, Share2 } from 'lucide-react';
import { formLabels, PageHeader, Panel, TextField, ToggleField } from '@/components/admin/fields';
import { adminI18n } from '@/lib/admin/i18n';
import { requireRole } from '@/lib/auth';
import { getEditableSettings } from '@/lib/content/site';
import { formatPhoneForDisplay } from '@/lib/validation/phone';
import { saveSettings } from './actions';

export default async function SettingsPage() {
  await requireRole('owner');
  const [{ m }, s] = await Promise.all([adminI18n(), getEditableSettings()]);
  const t = m.settings;
  const phone = (value: string) => (value ? formatPhoneForDisplay(value) : '');
  return (
    <>
      <PageHeader title={t.title} lead={t.lead} />
      <ActionForm action={saveSettings} labels={formLabels(m)}>
        <div className="grid items-start gap-5 md:grid-cols-2">
          <Panel
            title={t.contacts.title}
            hint={t.contacts.phoneHint}
            icon={<Phone aria-hidden="true" />}
          >
            <TextField
              label={t.contacts.phone}
              name="contacts.phone"
              type="tel"
              dir="ltr"
              autoComplete="off"
              defaultValue={phone(s.contacts.phone)}
            />
            <TextField
              label={t.contacts.whatsapp}
              name="contacts.whatsapp"
              type="tel"
              dir="ltr"
              autoComplete="off"
              defaultValue={phone(s.contacts.whatsapp)}
            />
            <TextField
              label={t.contacts.telegram}
              name="contacts.telegram"
              dir="ltr"
              autoComplete="off"
              defaultValue={s.contacts.telegram}
            />
            <TextField
              label={t.contacts.email}
              name="contacts.email"
              type="email"
              dir="ltr"
              autoComplete="off"
              defaultValue={s.contacts.email}
            />
          </Panel>
          <Panel title={t.social.title} hint={t.social.hint} icon={<Share2 aria-hidden="true" />}>
            {(['instagram', 'facebook', 'tiktok'] as const).map((key) => (
              <TextField
                key={key}
                label={t.social[key]}
                name={`social.${key}`}
                type="url"
                dir="ltr"
                autoComplete="off"
                defaultValue={s.social[key]}
              />
            ))}
          </Panel>
          <Panel title={t.legal.title} hint={t.legal.hint} icon={<Scale aria-hidden="true" />}>
            <TextField
              label={t.legal.legalName}
              name="legal.legalName"
              defaultValue={s.legal.legalName}
            />
            <TextField
              label={t.legal.licenseNo}
              name="legal.licenseNo"
              dir="ltr"
              defaultValue={s.legal.licenseNo}
            />
            <TextField label={t.legal.trn} name="legal.trn" dir="ltr" defaultValue={s.legal.trn} />
            <TextField
              label={t.legal.address}
              name="legal.address"
              defaultValue={s.legal.address}
            />
          </Panel>
          <div className="grid content-start gap-5">
            <Panel title={t.vat.title} hint={t.vat.hint} icon={<BadgePercent aria-hidden="true" />}>
              <ToggleField
                label={t.vat.registered}
                name="vat.registered"
                defaultChecked={s.vat.registered}
              />
              <ToggleField
                label={t.vat.included}
                name="vat.included"
                defaultChecked={s.vat.included}
              />
            </Panel>
            <Panel title={t.flags.title} icon={<Eye aria-hidden="true" />}>
              {(['emergencyEnabled', 'showReviews', 'telegramCtaRu'] as const).map((key) => (
                <ToggleField
                  key={key}
                  label={t.flags[key]}
                  name={`flags.${key}`}
                  defaultChecked={s.flags[key]}
                />
              ))}
            </Panel>
          </div>
        </div>
      </ActionForm>
    </>
  );
}
