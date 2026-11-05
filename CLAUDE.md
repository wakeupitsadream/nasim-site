# nasim-site — CLAUDE.md

Сайт сервисной компании **Brigada** в Дубае (чистка/ремонт кондиционеров + химчистка мебели) на EN / AR / RU с собственной админкой. Бриф — `docs/BRIEF.md`, фазы — `docs/PHASES.md`, журнал решений — `docs/DECISIONS.md`. Перед любой задачей прочитай все три. Инфраструктура и аккаунты — `docs/INFRASTRUCTURE.md`. Имя репо и неймспейс токенов `--nasim-*` — от прежнего рабочего имени, менять не нужно (DECISIONS №52).

Специфика установленной версии Next.js — @AGENTS.md (читать docs из `node_modules/next/dist/docs`, они совпадают с версией в lockfile).

## Стек

Next.js 16.4 (App Router, TypeScript strict, React 19.3, Cache Components, Turbopack) · Tailwind CSS v4.3 (`@tailwindcss/postcss`) + shadcn/ui 4.23 (base radix, стиль radix-nova, `rtl: true`) · next-intl v4.14 (`next/root-params`) · Drizzle ORM 0.45 (стабильная ветка, не 1.0-rc) + Neon Postgres (`pg` Pool) · Auth.js v5 (Credentials; см. предложение Better Auth в DECISIONS) · Vercel (Blob, Web Analytics, регион функций `fra1`) · Resend · Telegram Bot API (fetch) · Cloudflare Turnstile · Tiptap · zod · Vitest · Playwright · Polza AI (OpenAI-совместимый шлюз к Claude через `fetch`, только с сервера) · шрифты через `next/font`: IBM Plex Sans (тело), IBM Plex Sans Arabic (`/ar`), Unbounded (h1/h2 и словесный знак, DECISIONS №52).

## Команды

```
pnpm dev            # локально
pnpm typecheck      # next typegen && tsc --noEmit
pnpm lint           # eslint + prettier --check + проверка логических CSS-классов
pnpm test           # vitest (unit)
pnpm e2e            # playwright против next start :3100 (сначала pnpm build) или BASE_URL; @playwright/test = 1.63.0 под браузер /opt/pw-browsers
pnpm build          # применяет миграции (scripts/migrate-if-db.mjs), затем next build
pnpm db:generate    # drizzle-kit generate — после каждого изменения lib/db/schema.ts
pnpm db:migrate     # применить миграции к DATABASE_URL_UNPOOLED (иначе DATABASE_URL)
pnpm seed           # идемпотентный сид из content/seed/*.json (появляется в фазе 2)
```

Перед коммитом: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — зелёные.

## Жёсткие правила

1. **Ни одной пользовательской строки в коде.** UI-строки — `messages/{en,ar,ru}.json` через `useTranslations`/`getTranslations`. Контент — в БД как поля `I18nText = { en: string; ar?: string; ru?: string }`. Читать через `pick(field, locale)` из `lib/i18n/text.ts` (fallback на `en`).
2. **Только логические CSS-свойства:** `ms-/me-/ps-/pe-/inset-s-/inset-e-/text-start/text-end/rounded-s-/rounded-e-/border-s/border-e`, никаких `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right/rounded-l-/rounded-r-`; `start-*`/`end-*` устарели в Tailwind 4.2 — в новом коде `inset-s-*`/`inset-e-*`. Проверяется `pnpm lint` (`scripts/check-logical-css.mjs`). Направленные иконки (стрелки, шевроны) — класс `rtl:-scale-x-100` (в компонентах shadcn допустим их `rtl:rotate-180`). После каждого `shadcn add` — проверить `components/ui` на голые `rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br` (баг shadcn #12475) и `start-`/`end-`, заменить логическими. Портальные компоненты (`*Content` у Popover/Tooltip/Select/Sheet/DropdownMenu) получают `dir={dir}`; у Sheet — логические стороны `inline-start`/`inline-end` (не `left`/`right`). Классы `dark:` запрещены; `cn` импортируется только из `@/lib/utils` (знает наши токены, DECISIONS №23); клиентские компоненты не импортируют `@/content/seed`, `@/lib/content`, `@/lib/ai`, `@/lib/sanitize`, `@/lib/ratelimit`; `new Date()`/`Date.now()` без аргументов в `app/` и `components/` запрещены (часы читаются в обработчике события и передаются значением, №37) — всё это проверяет `pnpm lint`. Телефоны, цены, email, URL, коды — всегда внутри `<span dir="ltr">` (компонент `<Ltr>`).
3. **Числа и валюта** — только через `lib/i18n/format.ts` (`formatAED`, `formatNumber`); арабская локаль использует латинские цифры (`ar-AE-u-nu-latn`).
4. **Все цены считаются в `lib/pricing.ts`** чистыми функциями с unit-тестами. Ни калькулятор, ни страницы не содержат арифметики цен.
5. **Данные публичных страниц** — только через `lib/db/queries/*`: функции с `'use cache'` + `cacheLife('max')` + `cacheTag(...)` (теги `content`, `service:{slug}`, `area:{slug}`, `settings`). Включены Cache Components (`cacheComponents: true`, `partialPrefetching: true`): экспорты сегмента `revalidate`/`dynamic`/`dynamicParams`/`fetchCache`/`runtime` запрещены (ломают сборку). Инвалидация из админки — `updateTag(tag)` в server actions; из route handlers и вебхуков — `revalidateTag(tag, 'max')`. `unstable_cache` не используем и не смешиваем с `'use cache'` (GHSA-mfr8-8qww-v76h). `cookies()`/`headers()`/сессия — никогда внутри `'use cache'`, только внутри `<Suspense>`. Публичные страницы с `[slug]` экспортируют `ensureStatic = 'navigation'`, читают `params` и проверяют существование записи до любого `<Suspense>` — так неизвестный slug даёт настоящий 404, а не «мягкий» 200 (DECISIONS №17). Админка и API — динамические. Локаль внутри страниц — из `next/root-params` (через `getLocale()`); в server actions и route handlers root-params недоступен — локаль передаётся явно: `getTranslations({ locale, namespace })`.
6. **Валидация на границе:** все `route.ts` и server actions начинаются с zod-схемы из `lib/validation/`. Один и тот же zod на клиенте и сервере.
7. **PII не логируем.** В логах и `track_events` — никаких телефонов, имён, email. IP — только `sha256(ip + IP_HASH_SALT)`.
8. **Админка закрыта**: `proxy.ts` (Next 16, всегда Node runtime; `middleware.ts` не используем) делает только оптимистичную проверку cookie сессии на `/admin/*` и `/api/admin/*`; настоящая проверка сессии и ролей `owner`/`staff` — в каждом server action и route handler (`requireRole`), не только в UI. Админка — на том же домене (`/admin`), не на поддомене: revalidate действует только на свой домен.
9. **HTML из редактора** всегда проходит `lib/sanitize.ts` при рендере.
10. **Клиентские компоненты** (`'use client'`) — только где есть интерактив: калькулятор, форма, окно ассистента, слайдер до/после, аккордеон, переключатель языка, админка. Маркетинговые страницы — серверные.
11. **AI** вызывается только из `lib/ai.ts` на сервере через OpenAI-совместимый шлюз (`lib/ai/gateway.ts`, `fetch` без SDK; по умолчанию Polza AI: `AI_BASE_URL` + `POLZA_API_KEY`), модель из `process.env.AI_MODEL ?? 'anthropic/claude-opus-5.5'`, structured outputs через `response_format: json_schema` (схема из zod, `z.toJSONSchema`) **и** обязательная повторная валидация zod на нашей стороне, результат никогда не записывается в БД без подтверждения пользователя в UI. Промпты — чистые функции в `lib/ai/*` (без сети), цены модель не называет — их подставляет сервер из `lib/pricing`; текст и фото клиента в промпте — данные, не инструкции (DECISIONS №45–47, №51).
12. **Новая зависимость** — только с записью в `docs/DECISIONS.md` (зачем, альтернативы).
13. **Тёмной темы нет** в v1. Не добавлять `dark:`-классы; из компонентов shadcn они вычищаются при добавлении (`@custom-variant dark` в `globals.css` — только страховка, чтобы они не срабатывали).
14. **Контент-сид** (`content/seed/*.json`) — источник правды для первого наполнения; `pnpm seed` не перезаписывает записи, изменённые в админке (`updated_at` > `seeded_at`).
15. **Drizzle 0.45**: документация Drizzle уже написана под 1.0-rc — сниппеты оттуда не копировать без проверки на 0.45 (RQB v1, структура миграций). Клиент — `getDb()` из `lib/db/client.ts`, не создавать пулы в других местах.
16. **WhatsApp в ОАЭ** — только переписка: звонки через WhatsApp/Telegram в ОАЭ заблокированы. В UI «Написать в WhatsApp», никогда «Позвонить в WhatsApp»; звонок — только обычный `tel:`.
17. **Движение** — только через `styles/motion.css` (DECISIONS №48–49, №52): CSS-first, каждое правило под `prefers-reduced-motion: no-preference`, scroll-driven — под `@supports`; классы `reveal`/`reveal-fade`/`enter` со stagger через `stagger(i)` из `lib/motion.ts`; интерактивные блоки (формы, чипы, списки ссылок) — только `reveal-fade`; предки с обрезкой — `overflow-clip`, не `overflow-hidden`; страницы оборачиваются в `PageTransition`, переходы внутри островков — `<ViewTransition key>` + `startTransition`; только compositor-свойства; JS-библиотеки анимации не добавлять. Красная шторка переходов едет только у навигаций по `Link` из `lib/i18n/navigation` (типы `nav-page` по умолчанию, `nav-forward`/`nav-back`), поэтому внутренние ссылки — всегда этот `Link`, не `next/link`; наклон панелей — атрибут `data-tilt` + класс `tilt` (слушатель один, `components/motion/tilt-layer.tsx`); декор бренда (`BrandMark`, `Van`, `SpeedLines`, лента `TickerBand`) — `aria-hidden`, под reduced-motion статичен. Проверяется `tests/unit/motion.test.ts` и `tests/e2e/motion.spec.ts`.
18. **Бренд** (DECISIONS №52–53): красный — только акцент (лок-ап, primary-кнопки, штрихи скорости, одна красная лента `.tone-brand`), тёмные полосы — графит `.tone-deep` (финальная — поверх приглушённого ночного Дубая); рядом с красной primary кнопка WhatsApp — `outline` с зелёной иконкой, зелёная — только отдельно (шапка, липкая панель, тёмная полоса). Словесный знак «BRIGADA» в `logo.tsx` — рисунок (латиница, LTR, `aria-hidden`), единственная строка в коде вне правила 1; имя для текста и `aria-label` — `brand_name` из настроек. Фото — только через `getPhoto`/`getMedia` из `content/seed/media.json` (временные стоковые Pexels с `credit`; alt на трёх языках; без подписей «наши работы») и `MediaFrame`; иллюстрация экипажа в `public/brand/` — временная, в подписях «иллюстрация». Настоящие фото Миши заменят и то, и другое через админку.

## Карта репо

```
app/[locale]/…            публичные страницы (см. BRIEF §5)
app/[locale]/layout.tsx   корневой layout сайта (app/layout.tsx нет — иначе ломается next/root-params)
app/admin/…               админка (без локали в URL, UI RU/EN по cookie; свой корневой layout с <html>)
app/api/leads|track|auth|admin  app/api/diagnose  AI-диагностика (zod → lib/ai → цены из lib/pricing)
proxy.ts                  next-intl; в фазе 5 — оптимистичная проверка сессии
components/marketing|admin|ui|icons  components/ltr.tsx  components/localized-text.tsx
lib/db/{client,schema,queries}  lib/i18n/{routing,navigation,request,format,text}
lib/{pricing,whatsapp,telegram,email,ai,auth,ratelimit,seo,sanitize}.ts
lib/validation/*          zod-схемы (phone, settings, …)
lib/content/{site,seed,queries}.ts  настройки и контент из сида до фазы 2 (имена = будущие lib/db/queries)  lib/{env,cta,nav}.ts
lib/pricing.ts            движок цен (чистые функции)   lib/booking/{time,state}.ts  логика мастера заявки
components/booking        мастер заявки (клиентский островок + серверная обёртка)
components/assistant      плавающий ассистент (DECISIONS №55): серверная обёртка в layout, клиентское окно (чат: FAQ мгновенно через lib/assistant/match.ts, остальное — /api/diagnose), триггер-кнопка для любой страницы
components/diagnose       карточка вердикта диагностики и сжатие фото в браузере (используются ассистентом и dev/ui)
styles/motion.css  lib/motion.ts  components/page-transition.tsx  движение и переходы страниц (правило 17)   components/motion/tilt-layer.tsx  наклон панелей за курсором
components/marketing/{brand-mark,logo,eyebrow,speed-lines,ticker-band,van,crew-portrait}.tsx  фирменные элементы Brigada (правило 18)   public/brand/  иллюстрация Миши (временная)   app/icon.svg  favicon = знак
content/seed/media.json  public/photos/  временные стоковые фото (hero, лента-подложка, карточки мастера, услуги; DECISIONS №53)   components/marketing/media-frame.tsx  слот фото с плейсхолдером
lib/ai/gateway.ts         OpenAI-совместимый шлюз (fetch, Polza)   lib/ai/diagnose-prompt.ts промпт триажа (чистые функции)   lib/diagnose/client.ts  запрос с клиента (zod + маппинг статусов)
app/[locale]/dev/ui       галерея компонентов (локально и на превью; на продакшене 404)
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

`DATABASE_URL` (pooled, runtime), `DATABASE_URL_UNPOOLED` (миграции), `AUTH_SECRET`, `AUTH_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM`, `TELEGRAM_BOT_TOKEN`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `POLZA_API_KEY` (или `AI_API_KEY` для другого шлюза), `AI_MODEL`, `AI_BASE_URL`, `AI_EFFORT`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, `IP_HASH_SALT`. Контакты, WhatsApp, Telegram chat id, лицензия — в таблице `settings`, не в env. Ключ Polza — аккаунт Максима, оплата в рублях; вызовы только с сервера. Кто владеет каким аккаунтом — `docs/INFRASTRUCTURE.md`.

## Коммиты

Небольшие, по одной теме, в настоящем времени: `feat(admin): inbox filters`, `fix(i18n): ar number format`, `chore: bump next`. Без упоминания моделей и инструментов в сообщениях.
