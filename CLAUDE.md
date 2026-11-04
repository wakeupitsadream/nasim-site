# nasim-site — CLAUDE.md

Сайт сервисной компании в Дубае (чистка/ремонт кондиционеров + химчистка мебели) на EN / AR / RU с собственной админкой. Бриф — `docs/BRIEF.md`, фазы — `docs/PHASES.md`, журнал решений — `docs/DECISIONS.md`. Перед любой задачей прочитай все три.

## Стек

Next.js 16 (App Router, TypeScript strict, React 19) · Tailwind CSS v4 + shadcn/ui · next-intl v4 · Drizzle ORM + Neon Postgres · Auth.js v5 (Credentials) · Vercel (Blob, Web Analytics, регион функций `fra1`) · Resend · Telegram Bot API (fetch) · Cloudflare Turnstile · Tiptap · zod · Vitest · Playwright · `@anthropic-ai/sdk` (только на сервере).

## Команды

```
pnpm dev            # локально
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint + prettier --check
pnpm test           # vitest (unit)
pnpm e2e            # playwright (нужен запущенный dev или BASE_URL)
pnpm build          # применяет миграции (scripts/migrate-if-db.mjs), затем next build
pnpm db:generate    # drizzle-kit generate — после каждого изменения lib/db/schema.ts
pnpm db:migrate     # применить миграции к DATABASE_URL
pnpm seed           # идемпотентный сид из content/seed/*.json
```

Перед коммитом: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — зелёные.

## Жёсткие правила

1. **Ни одной пользовательской строки в коде.** UI-строки — `messages/{en,ar,ru}.json` через `useTranslations`/`getTranslations`. Контент — в БД как поля `I18nText = { en: string; ar?: string; ru?: string }`. Читать через `pick(field, locale)` из `lib/i18n/text.ts` (fallback на `en`).
2. **Только логические CSS-свойства:** `ms-/me-/ps-/pe-/start-/end-/text-start/text-end`, никаких `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right`. Направленные иконки (стрелки, шевроны) — класс `rtl:-scale-x-100`. Телефоны, цены, email, URL, коды — всегда внутри `<span dir="ltr">` (компонент `<Ltr>`).
3. **Числа и валюта** — только через `lib/i18n/format.ts` (`formatAED`, `formatNumber`); арабская локаль использует латинские цифры (`ar-AE-u-nu-latn`).
4. **Все цены считаются в `lib/pricing.ts`** чистыми функциями с unit-тестами. Ни калькулятор, ни страницы не содержат арифметики цен.
5. **Данные публичных страниц** — только через `lib/db/queries/*` с `unstable_cache`/`cacheTag` (теги `content`, `service:{slug}`, `area:{slug}`, `settings`). Публичные страницы — статические (`revalidate = false`), инвалидация тегами из админки. Админка и API — динамические.
6. **Валидация на границе:** все `route.ts` и server actions начинаются с zod-схемы из `lib/validation/`. Один и тот же zod на клиенте и сервере.
7. **PII не логируем.** В логах и `track_events` — никаких телефонов, имён, email. IP — только `sha256(ip + IP_HASH_SALT)`.
8. **Админка закрыта middleware/proxy** на `/admin/*` и `/api/admin/*`; роли `owner`/`staff` проверяются в server actions, не только в UI.
9. **HTML из редактора** всегда проходит `lib/sanitize.ts` при рендере.
10. **Клиентские компоненты** (`'use client'`) — только где есть интерактив: калькулятор, форма, слайдер до/после, аккордеон, переключатель языка, админка. Маркетинговые страницы — серверные.
11. **AI (Anthropic SDK)** вызывается только из `lib/ai.ts` на сервере, модель из `process.env.AI_MODEL ?? 'claude-opus-5-5'`, structured outputs через `output_config.format`, результат никогда не записывается в БД без подтверждения пользователя в UI.
12. **Новая зависимость** — только с записью в `docs/DECISIONS.md` (зачем, альтернативы).
13. **Тёмной темы нет** в v1. Не добавлять `dark:`-классы.
14. **Контент-сид** (`content/seed/*.json`) — источник правды для первого наполнения; `pnpm seed` не перезаписывает записи, изменённые в админке (`updated_at` > `seeded_at`).

## Карта репо

```
app/[locale]/…            публичные страницы (см. BRIEF §5)
app/admin/…               админка (без локали в URL, UI RU/EN по cookie)
app/api/leads|track|auth|admin
components/marketing|admin|ui
lib/db/{client,schema,queries}  lib/i18n/{routing,navigation,request,format,text}
lib/{pricing,whatsapp,telegram,email,ai,auth,ratelimit,seo,sanitize}.ts
lib/validation/*          zod-схемы
messages/{en,ar,ru}.json  UI-строки
content/seed/*.json       стартовый контент
drizzle/                  миграции    scripts/{seed.ts,migrate-if-db.mjs}
tests/unit  tests/e2e     docs/{BRIEF,PHASES,DECISIONS,RUNBOOK}.md
```

## Definition of Done для любого PR

- typecheck, lint, unit, build — зелёные; e2e — зелёные, если затронуты страницы/формы/админка.
- Новые строки добавлены во все три `messages/*.json` (AR можно черновиком с пометкой `// TODO ar-review` в DECISIONS, не в JSON).
- Скриншот (или Playwright-снимок) EN и AR для любого нового визуального блока.
- Запись в `docs/DECISIONS.md`, если принималось архитектурное решение или добавлялась зависимость.
- Миграция сгенерирована и применяется на пустой БД.

## Переменные окружения

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM`, `TELEGRAM_BOT_TOKEN`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `AI_MODEL`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, `IP_HASH_SALT`. Контакты, WhatsApp, Telegram chat id, лицензия — в таблице `settings`, не в env.

## Коммиты

Небольшие, по одной теме, в настоящем времени: `feat(admin): inbox filters`, `fix(i18n): ar number format`, `chore: bump next`. Без упоминания моделей и инструментов в сообщениях.
