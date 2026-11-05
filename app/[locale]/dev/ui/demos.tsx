'use client';

import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Ltr } from '@/components/ltr';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhone } from '@/lib/validation/phone';

type PhoneDemoLabels = {
  label: string;
  placeholder: string;
  hint: string;
  savedAs: string;
  valid: string;
  invalid: string;
};

/** Controlled PhoneInput with its E.164 output and validity, as the lead form will use it. */
export function PhoneInputDemo({ labels }: { labels: PhoneDemoLabels }) {
  const [value, setValue] = useState('');
  const id = useId();
  const valid = value !== '' && isValidPhone(value);

  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor={id}>{labels.label}</Label>
      <PhoneInput
        id={id}
        value={value}
        onChange={setValue}
        placeholder={labels.placeholder}
        aria-describedby={`${id}-hint`}
        aria-invalid={value !== '' && !valid ? true : undefined}
      />
      <p id={`${id}-hint`} className="text-small text-muted-foreground">
        {labels.hint}
      </p>
      <p className="text-small">
        {labels.savedAs}: <Ltr data-testid="e164">{value || '—'}</Ltr>{' '}
        <span className={valid ? 'text-success-ink' : 'text-muted-foreground'}>
          ({valid ? labels.valid : labels.invalid})
        </span>
      </p>
    </div>
  );
}

export function ToastDemo({ label, message }: { label: string; message: string }) {
  return (
    <Button variant="secondary" onClick={() => toast.success(message)}>
      {label}
    </Button>
  );
}
