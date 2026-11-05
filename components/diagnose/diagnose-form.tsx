'use client';

import { CameraIcon, Loader2Icon, MessageSquareIcon, SparklesIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { DiagnoseResult } from '@/components/diagnose/diagnose-result';
import { ImageError, prepareImage, type PreparedImage } from '@/components/diagnose/image';
import { Ltr } from '@/components/ltr';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { requestDiagnosis, type DiagnoseFailure } from '@/lib/diagnose/client';
import { formatNumber } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { DIAGNOSE_MAX_TEXT, type DiagnoseResponse } from '@/lib/validation/diagnose';

type Props = {
  locale: Locale;
  calculatorHref: string;
  /** Example complaints that fill the textarea (UI strings, picked by the server wrapper). */
  examples: string[];
};

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; result: DiagnoseResponse }
  | { kind: 'error'; error: DiagnoseFailure | 'photoType' | 'photoSize' };

const ERROR_KEY = {
  invalid: 'empty',
  rate_limited: 'rateLimited',
  unavailable: 'unavailable',
  refused: 'refused',
  failed: 'failed',
  network: 'network',
  photoType: 'photoType',
  photoSize: 'photoSize',
} as const satisfies Record<DiagnoseFailure | 'photoType' | 'photoSize', string>;

/**
 * Client island of the AI triage: description, optional photo (shrunk in the browser), one
 * request, then the verdict card or an honest error. Nothing is stored anywhere; no clock, no
 * cookies, so the page around it stays prerendered.
 */
export function DiagnoseForm({ locale, calculatorHref, examples }: Props) {
  const t = useTranslations('Diagnose');
  const [text, setText] = useState('');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const textId = useId();
  const hintId = useId();
  const errorId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  // Thumbnails are object URLs: free them when the photo changes or the island unmounts.
  useEffect(() => () => (image ? URL.revokeObjectURL(image.previewUrl) : undefined), [image]);

  useEffect(() => {
    if (phase.kind !== 'done') return;
    const heading = resultRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [phase]);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setImage(await prepareImage(file));
      if (phase.kind === 'error') setPhase({ kind: 'idle' });
    } catch (error) {
      setImage(null);
      setPhase({
        kind: 'error',
        error: error instanceof ImageError && error.reason === 'size' ? 'photoSize' : 'photoType',
      });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase.kind === 'loading') return;
    const description = text.trim();
    if (description.length < 3 && !image) {
      setPhase({ kind: 'error', error: 'invalid' });
      textRef.current?.focus();
      return;
    }
    setPhase({ kind: 'loading' });
    const outcome = await requestDiagnosis({
      locale,
      text: description,
      ...(image ? { image: { mediaType: image.mediaType, data: image.data } } : {}),
    });
    setPhase(
      outcome.ok ? { kind: 'done', result: outcome.data } : { kind: 'error', error: outcome.error },
    );
  };

  const reset = () => {
    setPhase({ kind: 'idle' });
    setText('');
    setImage(null);
    // Return focus to the field so the next question starts where the first one did.
    requestAnimationFrame(() => textRef.current?.focus());
  };

  if (phase.kind === 'done') {
    return (
      <DiagnoseResult
        result={phase.result}
        locale={locale}
        calculatorHref={calculatorHref}
        headingRef={resultRef}
        onReset={reset}
        className="motion-safe:animate-in motion-safe:duration-(--nasim-dur) motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
      />
    );
  }

  const loading = phase.kind === 'loading';
  const error = phase.kind === 'error' ? phase.error : null;
  const fieldError = error === 'invalid';
  const showFallbacks = error === 'unavailable' || error === 'failed' || error === 'network';

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-busy={loading}
      data-testid="diagnose-form"
      className="flex flex-col gap-5 rounded-panel border border-border bg-card p-5 shadow-lift sm:p-6 lg:p-8"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={textId} className="text-body font-medium text-foreground">
          {t('form.label')}
        </label>
        <Textarea
          id={textId}
          ref={textRef}
          name="text"
          value={text}
          rows={4}
          maxLength={DIAGNOSE_MAX_TEXT}
          placeholder={t('form.placeholder')}
          aria-describedby={fieldError ? `${hintId} ${errorId}` : hintId}
          aria-invalid={fieldError || undefined}
          disabled={loading}
          onChange={(e) => {
            setText(e.target.value);
            if (fieldError) setPhase({ kind: 'idle' });
          }}
          className="min-h-32 bg-background"
        />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-small text-muted-foreground">
          <span id={hintId}>{t('privacy')}</span>
          <Ltr className="tabular-nums">
            {t('form.counter', {
              count: formatNumber(text.length, locale),
              max: formatNumber(DIAGNOSE_MAX_TEXT, locale),
            })}
          </Ltr>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-small text-muted-foreground">{t('form.examplesLabel')}</span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            disabled={loading}
            onClick={() => {
              setText(example);
              if (fieldError) setPhase({ kind: 'idle' });
              textRef.current?.focus();
            }}
            className="inline-flex min-h-9 items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-small text-foreground transition-colors outline-none hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="diagnose-photo"
          onChange={(e) => void pickPhoto(e.target.files?.[0])}
        />
        {image ? (
          <div className="flex items-center gap-3">
            <span className="relative inline-flex size-16 overflow-hidden rounded-xl border border-border bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- object URL thumbnail */}
              <img
                src={image.previewUrl}
                alt={t('form.photoAlt')}
                className="size-full object-cover"
              />
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => setImage(null)}
            >
              <XIcon />
              {t('form.removePhoto')}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
          >
            <CameraIcon />
            {t('form.photo')}
          </Button>
        )}
        <span className="text-small text-muted-foreground">{t('form.photoHint')}</span>
      </div>

      {error ? (
        <div
          role="alert"
          id={errorId}
          className="flex flex-col gap-3 rounded-card border border-danger-ink/20 bg-danger-soft p-4 text-small text-danger-ink"
        >
          <p>{t(`errors.${ERROR_KEY[error]}`)}</p>
          {showFallbacks ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                {calculatorHref.startsWith('#') ? (
                  <a href={calculatorHref}>{t('calculatorCta')}</a>
                ) : (
                  <Link href={calculatorHref}>{t('calculatorCta')}</Link>
                )}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/contact">
                  <MessageSquareIcon />
                  {t('result.contact')}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" disabled={loading} className="sm:min-w-52">
          {loading ? (
            <Loader2Icon className="motion-safe:animate-spin" />
          ) : (
            <SparklesIcon strokeWidth={1.75} />
          )}
          {loading ? t('form.submitting') : t('form.submit')}
        </Button>
        <p className="text-small text-muted-foreground sm:max-w-[22rem] sm:text-end">
          {t('form.disclaimer')}
        </p>
      </div>
      <p aria-live="polite" className="sr-only">
        {loading ? t('form.submitting') : null}
      </p>
    </form>
  );
}
