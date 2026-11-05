# nasim-site

Сайт сервисной компании в Дубае: чистка, ремонт и обслуживание кондиционеров, химчистка мебели. Три языка (EN / AR с RTL / RU), лидогенерация через WhatsApp и форму, собственная админка.

Документы:

- `CLAUDE.md` — правила проекта для разработки (читать перед любой задачей).
- `docs/BRIEF.md` — полный бриф: страницы, админка, схема БД, дизайн, SEO.
- `docs/PHASES.md` — фазы сборки и готовые промпты.
- `docs/DECISIONS.md` — журнал архитектурных решений.
- `docs/INFRASTRUCTURE.md` — хостинг, домен, аккаунты, кто платит; работа из РФ.
- `docs/MISHA-QUESTIONNAIRE.md` — анкета владельца; ответы — в `docs/MISHA-ANSWERS.md`.

## Стек

Next.js 16.4 (App Router, Cache Components) · React 19.3 · TypeScript · Tailwind CSS 4.3 + shadcn/ui (Radix, RTL) · next-intl 4.14 · Drizzle ORM 0.45 + Neon Postgres · Vitest 5 · Playwright · Vercel (`fra1`).

## Требования

- Node.js 22.12+ (CI и Vercel — Node 24).
- pnpm 10 (версия закреплена в `packageManager`; pnpm скачает её сам).

## Локальный запуск

```bash
pnpm install
cp .env.example .env.local   # для страниц сайта значения пока не нужны
pnpm dev                     # http://localhost:3000 → редирект на /en, /ar или /ru
```

## Команды

```bash
pnpm typecheck   # next typegen && tsc --noEmit
pnpm lint        # eslint + prettier --check + проверка логических CSS-классов (RTL)
pnpm format      # prettier --write
pnpm test        # unit-тесты (vitest)
pnpm build       # миграции БД (если задан DATABASE_URL) + next build
pnpm e2e         # Playwright против собранного приложения (сначала pnpm build)
pnpm db:generate # новая миграция после изменения lib/db/schema.ts
pnpm db:migrate  # применить миграции
```

### CI (GitHub Actions) — включить вручную

Workflow лежит в `docs/ci/ci.yml`, а не в `.github/workflows/`: у токена облачной сессии разработки нет права `workflows`, и GitHub отклоняет пуш файлов workflow. Включить один раз через веб-интерфейс GitHub:

1. Открыть `docs/ci/ci.yml` в нужной ветке → карандаш «Edit».
2. В поле имени файла заменить путь на `.github/workflows/ci.yml` (GitHub перенесёт файл).
3. Commit changes.

После этого CI запускается на каждый PR и пуш в `main`: typecheck, lint, unit, build, e2e и отдельный job с миграциями на Postgres 16. Дальнейшие правки workflow — тоже через веб-интерфейс или с локальной машины.

`@playwright/test` закреплён на 1.63.0 под браузер, предустановленный в облачном контейнере разработки. В CI браузер ставится свой. Обновлять версию — вместе с браузером контейнера.

## Структура

```
app/[locale]/      публичные страницы; app/[locale]/layout.tsx — корневой layout (app/layout.tsx нет)
app/not-found.tsx  глобальный 404 для адресов вне локалей
proxy.ts           next-intl: локаль в URL, редирект с /
lib/i18n/          routing, navigation, request (next/root-params), text (pick), format (formatAED)
lib/content/site.ts  настройки сайта (временно из сида)   lib/{env,cta,nav,whatsapp}.ts   lib/validation/  zod
components/marketing  шапка, футер, меню, панель связи    components/ui  shadcn с правками   components/icons
app/[locale]/dev/ui  галерея компонентов (превью и локально)
lib/db/            schema, client (pg Pool)          drizzle/  миграции
messages/          UI-строки en/ar/ru                content/seed/  стартовый контент
styles/design-tokens.css  палитра и типографика; app/globals.css — Tailwind + shadcn поверх токенов
tests/unit, tests/e2e
```

## Деплой на Vercel

Проект `nasim-site` подключён к репозиторию на **Hobby-команде Максима — временно** (DECISIONS №19): Hobby запрещён для коммерческих сайтов, до запуска рекламы и приёма заявок проект переносится в Pro-команду (Миша — Billing). Роли и аккаунты — `docs/INFRASTRUCTURE.md`.

- Продакшен: https://nasim-site.vercel.app — собирается из `main`. Пока не задан `NEXT_PUBLIC_SITE_URL`, все страницы отдают `noindex` (технический адрес не должен попасть в поиск).
- Превью: каждая ветка и PR получают свою ссылку. **Превью открытые** (без Vercel Authentication), чтобы ссылку можно было переслать Мише; Vercel сам закрывает их от индексации. Галерея компонентов — `/{en,ar,ru}/dev/ui` на превью; на продакшене она отдаёт 404.
- Настройки проекта: Node.js 24.x; Install/Build Command не переопределять (иначе Vercel возьмёт pnpm 6), Corepack не включать; регион функций `fra1` — в `vercel.json`.
- Canonical и hreflang берут адрес из системных переменных Vercel (`lib/env.ts`), ручная переменная не нужна.

Дальше по фазам:

1. Neon через Vercel Marketplace в той же команде: регион Frankfurt (`aws-eu-central-1`), preview-ветки базы включить до первого PR-деплоя. Интеграция добавит `DATABASE_URL` и `DATABASE_URL_UNPOOLED`.
2. Свой домен (на Мише): подключить в Vercel и задать `NEXT_PUBLIC_SITE_URL` — после этого снимется `noindex`.
3. Остальные переменные — по `.env.example` по мере фаз.

Проверка после деплоя: `/en`, `/ar`, `/ru` открываются; на `/ar` `dir="rtl"` и арабский шрифт; `/` редиректит по языку браузера; `/en/xyz` → 404; `/en/dev/ui` на продакшене → 404.

## Работа из России

Посетителей в Дубае это не касается. Для разработки из РФ: дашборды за Cloudflare (Cloudflare, консоль Neon, Turnstile) троттлятся, кастомные домены Vercel иногда не открываются, превью `*.vercel.app` обычно работают. Падение Turnstile при локальной проверке из РФ — не баг продукта. Подробнее — `docs/INFRASTRUCTURE.md`.
