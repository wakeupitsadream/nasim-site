'use client';

import {
  CameraIcon,
  Loader2Icon,
  MessageSquareIcon,
  SendHorizontalIcon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  startTransition,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react';
import { ASSISTANT_OPEN_EVENT, type AssistantOpenDetail } from '@/components/assistant/events';
import { DiagnoseResult } from '@/components/diagnose/diagnose-result';
import { ImageError, prepareImage, type PreparedImage } from '@/components/diagnose/image';
import { Ltr } from '@/components/ltr';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { matchFaq, type FaqEntry } from '@/lib/assistant/match';
import { requestDiagnosis, type DiagnoseFailure } from '@/lib/diagnose/client';
import { formatNumber } from '@/lib/i18n/format';
import { Link, usePathname } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
import { DIAGNOSE_MAX_TEXT, type DiagnoseResponse } from '@/lib/validation/diagnose';

/** A canned verdict for one example chip, used only while the assistant answers "unavailable". */
export type DemoVerdict = { text: string; result: DiagnoseResponse };

type Props = {
  locale: Locale;
  /** The booking wizard for people who already know what they need. */
  calculatorHref: string;
  /** FAQs of the locale, answers already sanitised on the server (rule 9). */
  faqs: FaqEntry[];
  /** Example complaints (UI strings) shown as chips; each is sent as typed. */
  examples: string[];
  demos: DemoVerdict[];
};

type Failure = DiagnoseFailure | 'photoType' | 'photoSize';

type Draft =
  | { role: 'user'; text: string; photoUrl?: string }
  | { role: 'assistant'; kind: 'faq'; faq: FaqEntry }
  | { role: 'assistant'; kind: 'result'; result: DiagnoseResponse; demo: boolean }
  | { role: 'assistant'; kind: 'error'; error: Failure }
  | { role: 'assistant'; kind: 'pending' };

/** One line of the conversation; the id is handed out when the draft is pushed. */
type Entry = Draft & { id: number };

const subscribeNoop = () => () => {};

const ERROR_KEY = {
  invalid: 'empty',
  rate_limited: 'rateLimited',
  unavailable: 'unavailable',
  refused: 'refused',
  failed: 'failed',
  network: 'network',
  photoType: 'photoType',
  photoSize: 'photoSize',
} as const satisfies Record<Failure, string>;

const FALLBACK_ERRORS: ReadonlySet<Failure> = new Set(['unavailable', 'failed', 'network']);

const CHIP =
  'inline-flex min-h-9 items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-start text-small text-foreground transition-[border-color,background-color,scale] duration-(--nasim-dur-fast) outline-none hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 motion-safe:active:scale-95';

/**
 * The floating assistant (DECISIONS №55): one window at the bottom inline-end corner of every
 * page, for both the AI triage and the frequent questions. A FAQ chip, or a typed question that
 * covers a FAQ closely enough (lib/assistant/match.ts), is answered instantly from the FAQ; any
 * other text, or a photo, goes to POST /api/diagnose and comes back as the verdict card. The
 * conversation lives in the layout, so it survives navigations; nothing is stored anywhere, no
 * clock, no cookies, so every page around it stays prerendered.
 */
export function AssistantPanel({ locale, calculatorHref, faqs, examples, demos }: Props) {
  const t = useTranslations('Assistant');
  const tDiagnose = useTranslations('Diagnose');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [fieldError, setFieldError] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();
  const titleId = `${id}-title`;
  const textId = `${id}-text`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const nextId = useRef(1);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const wasOpen = useRef(false);
  const lastPath = useRef(pathname);
  // Hydration marker (data-ready) for the e2e tests: a click before React attaches would be lost.
  // The server snapshot is false, the client one true, so it flips exactly once.
  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  // Any element on a page can open the window (components/assistant/assistant-trigger.tsx).
  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<AssistantOpenDetail>).detail;
      if (detail?.prompt) setText(detail.prompt);
      setOpen(true);
    };
    window.addEventListener(ASSISTANT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, onOpen);
  }, []);

  // A link inside an answer navigates: the window closes, the conversation stays for next time.
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  // Focus follows the window: into the field on open, back to the launcher on close. On phones
  // the window covers the page, which must not scroll underneath (html[data-assistant-open]).
  useEffect(() => {
    if (open) {
      document.documentElement.setAttribute('data-assistant-open', '');
      textRef.current?.focus({ preventScroll: true });
    } else {
      document.documentElement.removeAttribute('data-assistant-open');
      if (wasOpen.current) launcherRef.current?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
    return () => document.documentElement.removeAttribute('data-assistant-open');
  }, [open]);

  // Thumbnails are object URLs: free them when the photo changes or the island unmounts.
  useEffect(() => () => (image ? URL.revokeObjectURL(image.previewUrl) : undefined), [image]);

  // New entries scroll into view; a verdict card also takes focus, so its heading is read first.
  useEffect(() => {
    if (!open || entries.length === 0) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const last = entries[entries.length - 1];
    if (last?.role === 'assistant' && last.kind === 'result' && resultRef.current) {
      resultRef.current.focus({ preventScroll: true });
      // The whole card from its top edge (badge row first), not just the focused heading.
      (resultRef.current.closest('article') ?? resultRef.current).scrollIntoView({
        block: 'start',
        behavior: reduce ? 'auto' : 'smooth',
      });
      return;
    }
    endRef.current?.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' });
  }, [entries, open]);

  const push = (...items: Draft[]) => {
    const withIds = items.map((item) => ({ ...item, id: nextId.current++ }) as Entry);
    startTransition(() => setEntries((prev) => [...prev, ...withIds]));
    return withIds;
  };

  const replacePending = (pendingId: number, item: Draft) => {
    startTransition(() =>
      setEntries((prev) =>
        prev.map((e) => (e.id === pendingId ? ({ ...item, id: e.id } as Entry) : e)),
      ),
    );
  };

  const answerFaq = (question: string, faq: FaqEntry) => {
    push({ role: 'user', text: question }, { role: 'assistant', kind: 'faq', faq });
  };

  /** Sends what is in the field (or a chip's text): FAQ match first, the model otherwise. */
  const send = async (raw: string, photo: PreparedImage | null) => {
    if (busy) return;
    const description = raw.trim();
    if (description.length < 3 && !photo) {
      setFieldError('invalid');
      textRef.current?.focus();
      return;
    }
    setFieldError(null);
    setText('');
    setImage(null);
    if (!photo) {
      const faq = matchFaq(description, faqs);
      if (faq) {
        answerFaq(description, faq);
        textRef.current?.focus();
        return;
      }
    }
    const [, pending] = push(
      { role: 'user', text: description, ...(photo ? { photoUrl: photo.previewUrl } : {}) },
      { role: 'assistant', kind: 'pending' },
    );
    setBusy(true);
    const outcome = await requestDiagnosis({
      locale,
      text: description,
      ...(photo ? { image: { mediaType: photo.mediaType, data: photo.data } } : {}),
    });
    setBusy(false);
    const demo =
      !outcome.ok && outcome.error === 'unavailable'
        ? demos.find((d) => d.text === description)
        : undefined;
    replacePending(
      pending!.id,
      demo
        ? { role: 'assistant', kind: 'result', result: demo.result, demo: true }
        : outcome.ok
          ? { role: 'assistant', kind: 'result', result: outcome.data, demo: false }
          : { role: 'assistant', kind: 'error', error: outcome.error },
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(text, image);
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setImage(await prepareImage(file));
      setFieldError(null);
    } catch (error) {
      setImage(null);
      setFieldError(
        error instanceof ImageError && error.reason === 'size' ? 'photoSize' : 'photoType',
      );
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const close = () => setOpen(false);
  const nearLimit = text.length >= DIAGNOSE_MAX_TEXT * 0.8;
  const lastResultId = [...entries]
    .reverse()
    .find((e) => e.role === 'assistant' && e.kind === 'result')?.id;

  if (!open) {
    return (
      <button
        ref={launcherRef}
        type="button"
        data-testid="assistant-launcher"
        data-ready={ready || undefined}
        aria-label={t('launcherLabel')}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        style={{ viewTransitionName: 'assistant-launcher' }}
        className="fixed inset-e-4 bottom-[calc(var(--nasim-sticky-bar-h)+env(safe-area-inset-bottom)+1rem)] z-50 inline-flex h-12 items-center gap-2 rounded-full bg-primary ps-4 pe-5 text-body font-medium text-primary-foreground shadow-lift transition-[background-color,translate] duration-(--nasim-dur-fast) outline-none select-none hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:hover:-translate-y-0.5 md:inset-e-6 md:bottom-6"
      >
        <SparklesIcon
          aria-hidden="true"
          strokeWidth={1.75}
          className="size-5 text-on-deep-accent"
        />
        {t('launcher')}
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-labelledby={titleId}
      data-testid="assistant-panel"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          close();
        }
      }}
      style={{ viewTransitionName: 'assistant-panel' }}
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground motion-safe:animate-in motion-safe:duration-(--nasim-dur) motion-safe:fill-mode-both motion-safe:fade-in motion-safe:slide-in-from-bottom-4 sm:inset-auto sm:inset-e-6 sm:bottom-6 sm:h-[min(42rem,calc(100dvh-5rem))] sm:w-[26rem] sm:overflow-clip sm:rounded-panel sm:border sm:border-border sm:shadow-lift"
    >
      <header className="flex items-start gap-3 border-b border-border bg-card px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-deep-accent"
        >
          <SparklesIcon strokeWidth={1.75} className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 id={titleId} className="text-body font-medium text-foreground">
            {t('title')}
          </h2>
          <p className="text-small text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('close')}
          onClick={close}
          className="-me-1.5 shrink-0"
        >
          <XIcon />
        </Button>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex flex-1 [scrollbar-width:thin] flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4"
      >
        <Bubble role="assistant">
          <p>{t('greeting')}</p>
        </Bubble>
        <div className="flex flex-col gap-3 ps-11">
          <ChipGroup label={t('faqGroup')}>
            {faqs.map((faq) => (
              <button
                key={faq.id}
                type="button"
                disabled={busy}
                lang={faq.lang !== locale ? faq.lang : undefined}
                dir={faq.lang !== locale ? 'auto' : undefined}
                onClick={() => {
                  answerFaq(faq.question, faq);
                  textRef.current?.focus();
                }}
                className={CHIP}
              >
                {faq.question}
              </button>
            ))}
          </ChipGroup>
          <ChipGroup label={t('examplesGroup')}>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                disabled={busy}
                onClick={() => void send(example, null)}
                className={CHIP}
              >
                {example}
              </button>
            ))}
          </ChipGroup>
        </div>

        {entries.map((entry) => {
          if (entry.role === 'user') {
            return (
              <Bubble key={entry.id} role="user">
                {entry.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- object URL thumbnail
                  <img
                    src={entry.photoUrl}
                    alt={tDiagnose('form.photoAlt')}
                    className="mb-2 max-h-40 w-full rounded-lg object-cover"
                  />
                ) : null}
                {entry.text ? <p dir="auto">{entry.text}</p> : null}
              </Bubble>
            );
          }
          if (entry.kind === 'pending') {
            return (
              <Bubble key={entry.id} role="assistant" busy>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Loader2Icon aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                  {tDiagnose('form.submitting')}
                </p>
              </Bubble>
            );
          }
          if (entry.kind === 'faq') {
            return (
              <Bubble key={entry.id} role="assistant">
                <div
                  data-testid="assistant-faq-answer"
                  lang={entry.faq.lang !== locale ? entry.faq.lang : undefined}
                  dir={entry.faq.lang !== locale ? 'auto' : undefined}
                  className="[&_a]:underline [&_a]:underline-offset-4 [&_p+p]:mt-3 [&_strong]:font-semibold [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:ps-5"
                  // Sanitised on the server (lib/sanitize.ts) before it reached the client.
                  dangerouslySetInnerHTML={{ __html: entry.faq.answerHtml }}
                />
                <p className="mt-3 text-small text-muted-foreground">{t('faqNote')}</p>
              </Bubble>
            );
          }
          if (entry.kind === 'error') {
            const showFallbacks = FALLBACK_ERRORS.has(entry.error);
            return (
              <Bubble key={entry.id} role="assistant" tone="error">
                <p>{tDiagnose(`errors.${ERROR_KEY[entry.error]}`)}</p>
                {showFallbacks ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={calculatorHref}>{tDiagnose('calculatorCta')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/contact">
                        <MessageSquareIcon />
                        {tDiagnose('result.contact')}
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </Bubble>
            );
          }
          return (
            <div
              key={entry.id}
              className="motion-safe:animate-in motion-safe:duration-(--nasim-dur) motion-safe:fill-mode-both motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              <DiagnoseResult
                result={entry.result}
                demo={entry.demo}
                locale={locale}
                calculatorHref={calculatorHref}
                headingRef={entry.id === lastResultId ? resultRef : undefined}
                className="p-4 shadow-none sm:p-4 lg:p-4"
              />
            </div>
          );
        })}
        <div ref={endRef} aria-hidden="true" />
      </div>

      <form
        noValidate
        onSubmit={submit}
        aria-busy={busy}
        className="flex flex-col gap-2 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="assistant-photo"
          onChange={(e) => void pickPhoto(e.target.files?.[0])}
        />
        {image ? (
          <div className="flex items-center gap-3 motion-safe:animate-in motion-safe:duration-(--nasim-dur) motion-safe:zoom-in-95 motion-safe:fade-in">
            <span className="relative inline-flex size-14 overflow-hidden rounded-lg border border-border bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- object URL thumbnail */}
              <img
                src={image.previewUrl}
                alt={tDiagnose('form.photoAlt')}
                className="size-full object-cover"
              />
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setImage(null)}
            >
              <XIcon />
              {tDiagnose('form.removePhoto')}
            </Button>
          </div>
        ) : null}
        <label htmlFor={textId} className="sr-only">
          {tDiagnose('form.label')}
        </label>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={tDiagnose('form.photo')}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="shrink-0"
          >
            <CameraIcon strokeWidth={1.75} />
          </Button>
          <Textarea
            id={textId}
            ref={textRef}
            name="text"
            value={text}
            rows={1}
            maxLength={DIAGNOSE_MAX_TEXT}
            placeholder={tDiagnose('form.placeholder')}
            aria-describedby={fieldError ? `${hintId} ${errorId}` : hintId}
            aria-invalid={fieldError === 'invalid' || undefined}
            disabled={busy}
            onChange={(e) => {
              setText(e.target.value);
              if (fieldError) setFieldError(null);
            }}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line — the chat convention.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(text, image);
              }
            }}
            className="max-h-32 min-h-tap flex-1 resize-none bg-background py-2.5"
          />
          <Button
            type="submit"
            size="icon"
            aria-label={busy ? tDiagnose('form.submitting') : t('send')}
            disabled={busy}
            className="shrink-0"
          >
            {busy ? (
              <Loader2Icon className="motion-safe:animate-spin" />
            ) : (
              <SendHorizontalIcon className="rtl:-scale-x-100" />
            )}
          </Button>
        </div>
        {fieldError ? (
          <p id={errorId} role="alert" className="text-small text-danger-ink">
            {tDiagnose(`errors.${ERROR_KEY[fieldError]}`)}
          </p>
        ) : null}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-small text-muted-foreground">
          <span id={hintId}>{tDiagnose('privacy')}</span>
          {nearLimit ? (
            <Ltr className="tabular-nums">
              {tDiagnose('form.counter', {
                count: formatNumber(text.length, locale),
                max: formatNumber(DIAGNOSE_MAX_TEXT, locale),
              })}
            </Ltr>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function Bubble({
  role,
  tone,
  busy,
  children,
}: {
  role: 'user' | 'assistant';
  tone?: 'error';
  busy?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations('Assistant');
  const user = role === 'user';
  return (
    <div
      aria-busy={busy}
      className={cn(
        'flex items-end gap-2 motion-safe:animate-in motion-safe:duration-(--nasim-dur) motion-safe:fill-mode-both motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
        user && 'flex-row-reverse',
      )}
    >
      {!user ? (
        <span
          aria-hidden="true"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-mist text-primary"
        >
          <SparklesIcon strokeWidth={1.75} className="size-4" />
        </span>
      ) : null}
      <div
        className={cn(
          'max-w-[85%] rounded-card px-4 py-3 text-body',
          user
            ? 'rounded-ee-sm bg-primary text-primary-foreground'
            : tone === 'error'
              ? 'rounded-es-sm border border-danger-ink/20 bg-danger-soft text-danger-ink'
              : 'rounded-es-sm bg-card text-foreground shadow-card',
        )}
      >
        <span className="sr-only">{user ? t('you') : t('assistant')}: </span>
        {children}
      </div>
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <p aria-hidden="true" className="text-small font-medium text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
