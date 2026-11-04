# DECISIONS

Журнал решений: дата, решение, почему, альтернативы. Новые записи — сверху вниз по дате.

Факты о версиях и платформах проверены 04.11.2026 по первоисточникам (документация, npm-реестр, условия сервисов).

---

## 2026-11-04 — Фаза 0 (каркас)

### 1. `proxy.ts` вместо `middleware.ts`
- **Решение:** файл `proxy.ts` в корне, `createMiddleware(routing)` из next-intl. Matcher исключает `api`, `admin`, `_next`, `_vercel` и файлы с точкой.
- **Почему:** в Next 16 `middleware` переименован в `proxy` и всегда работает на Node runtime (`runtime` в нём запрещён).
- **Дальше:** в фазе 5 для `/admin/*` и `/api/admin/*` добавить отдельную ветку прокси с оптимистичной проверкой cookie. Server Actions — это POST на маршрут страницы: если путь исключён из matcher, прокси их не видит, поэтому настоящая проверка прав — в каждом server action и route handler.

### 2. next-intl 4.14 на `next/root-params`
- **Решение:** корневой layout — `app/[locale]/layout.tsx`, файла `app/layout.tsx` нет. `lib/i18n/request.ts` берёт локаль из `next/root-params` по официальному шаблону next-intl. Неизвестная локаль → `notFound()`. `setRequestLocale` и параметр `requestLocale` не используем: они устарели с next-intl 4.13.5–4.13.6.
- **Почему:** это рекомендуемая схема для Next ≥ 16.3. Она совместима с Cache Components, а старая схема — нет (issue next-intl #1493).
- **Следствия:** в Server Actions и Route Handlers root-params недоступен — локаль передаётся явно (`getTranslations({ locale, namespace })`). Админка будет вторым корневым layout со своим `<html>`: переход между сайтом и админкой — полная перезагрузка страницы, это нормально.

### 3. Cache Components включены
- **Решение:** `cacheComponents: true` и `partialPrefetching: true` в `next.config.ts`. Правило 5 CLAUDE.md переписано: `'use cache'` + `cacheLife('max')` + `cacheTag`, инвалидация через `updateTag` в server actions и `revalidateTag(tag, 'max')` в route handlers.
- **Почему:** это дефолт create-next-app 16.4, и Next рекомендует его для всех новых приложений. `partialPrefetching` выставлен явно: ноябрьское security-исправление Next.js касается приложений с Cache Components без него.
- **Ограничения:** экспорты сегмента `revalidate`, `dynamic`, `dynamicParams`, `fetchCache`, `runtime` ломают сборку. `generateStaticParams` должен вернуть хотя бы одно значение. Как читать `params` в `[slug]`-страницах — см. №17.
- **Запасной вариант:** если внутренности next-intl несовместимы с Cache Components — выключить оба флага, вернуть `dynamicParams = false` в `[locale]/layout.tsx` и правило 5 на `unstable_cache`. Не понадобился: сборка и e2e проходят.

### 4. hreflang — только из metadata
- **Решение:** `alternateLinks: false` в routing. Canonical и hreflang (en, ar, ru, x-default = `/en/...`) отдаёт `generateMetadata` через `lib/seo.ts` (`alternatesFor`). Абсолютные URL строятся от `metadataBase` = `NEXT_PUBLIC_SITE_URL`. В фазе 3 добавляется `sitemap.ts`.
- **Почему:** один источник hreflang вместо HTTP-заголовка `Link` и метатегов; Google считает их равнозначными.

### 5. Tailwind через `@tailwindcss/postcss`
- **Решение:** `postcss.config.mjs` с `@tailwindcss/postcss` 4.3.4. Лоадер `@tailwindcss/turbopack`, который ставит create-next-app 16.4.5, убран.
- **Почему:** PostCSS — путь из официальных гайдов Tailwind и shadcn. Turbopack-лоадер вышел 2 ноября 2026, и совместимость shadcn с ним не описана.

### 6. shadcn/ui 4.23: Radix, `radix-nova`, RTL
- **Решение:** `shadcn init --base radix --preset nova --rtl`. В `components.json` `"rtl": true` и стиль `radix-nova`. `DirectionProvider` из `components/ui/direction.tsx` получает направление из локали.
- **Почему:** с июля 2026 shadcn по умолчанию ставит Base UI, а у него открыт баг RTL в dropdown (#9233). Автоконвертация в логические классы работает только для новых стилей, не для `new-york`. Radix-примитивы не читают `<html dir>` — нужен провайдер.
- **Правила на будущее:** портальные компоненты получают `dir={dir}`; `side` у Sheet выбирается по направлению; после каждого `shadcn add` — проверка на `rounded-l/r` (баг #12475) и устаревшие `start-/end-`. CLI `shadcn` лежит в devDependencies: в рантайме нужен только его CSS (`shadcn/tailwind.css`), который импортируется при сборке.

### 7. Токены дизайна и shadcn
- **Решение:** палитра бренда хранится в `styles/design-tokens.css` в неймспейсе `--nasim-*`. Семантические переменные shadcn (`--background`, `--primary`, `--accent`, …) ссылаются на них в `app/globals.css`. Свои утилиты: `bg-surface-2`, `bg-whatsapp`, `bg-telegram`, `text-highlight`, `text-h1`/`h2`/`h3`/`body`/`lead`/`small`, `shadow-card`, `max-w-page`, `px-gutter`.
- **Почему:** исходный файл токенов использовал имена `--color-*`, которые конфликтовали с переменными темы Tailwind и shadcn (`--color-primary`, `--radius-sm` и др.). Отдельный неймспейс убирает конфликт, а значения правятся в одном месте.
- **Конфликт «accent»:** у shadcn `accent` — фон наведения в меню, поэтому это мягкая бирюза `#d9f2ef`. Яркая бирюза бренда `#19b3a6` доступна как `highlight`.
- **Тёмная тема:** блок `.dark` удалён. `@custom-variant dark` оставлен страховкой: класс `.dark` никогда не ставится, поэтому `dark:`-классы из компонентов shadcn не срабатывают. Начиная с фазы 1 их вычищают из каждого добавленного компонента (правило 13).
- **Арабская типографика:** `[dir="rtl"]` увеличивает `--nasim-font-scale` до 1.06, и размеры `text-*` масштабируются автоматически.

### 8. Шрифты
- **Решение:** IBM Plex Sans (latin + cyrillic, вариативный) и IBM Plex Sans Arabic (400–700, subset arabic, `preload: false`) объявлены в корневом layout. `html[lang="ar"]` переключает `--nasim-font` на арабский.
- **Почему:** корневой layout не может выбирать шрифты по локали, не становясь динамическим. `preload: false` не даёт /en и /ru скачивать арабские файлы; e2e проверяет, что арабский шрифт загружается только на /ar.

### 9. Drizzle 0.45 + `pg` Pool
- **Решение:** drizzle-orm 0.45.4 и drizzle-kit 0.31.11 (стабильная ветка). Рантайм — `pg` Pool (`max: 5`) поверх pooled-строки Neon (`DATABASE_URL`, PgBouncer) с `attachDatabasePool` от `@vercel/functions`. Миграции — по `DATABASE_URL_UNPOOLED`, в `pnpm build` через `scripts/migrate-if-db.mjs` (по образцу daylik). Без URL сборка идёт дальше с предупреждением.
- **Почему:** Drizzle 1.0 пока только RC, хотя документация Drizzle уже написана под него. Отсюда правило 15: сниппеты из документации не копировать без проверки. Neon для Vercel Fluid рекомендует TCP-пул с `attachDatabasePool`. Выбор pooled-строки для рантайма документацией не зафиксирован; маленький клиентский пул поверх PgBouncer — консервативный вариант, пересмотреть при нагрузке.
- **Обязательно при подключении:** preview-ветки Neon включить до первого PR-деплоя, иначе превью-сборка мигрирует продакшен.
- **Схема фазы 0:** таблица `settings` — синглтон (`id = 1`, CHECK) с `brand_name` (I18nText) и `updated_at`. Миграция `0000_init_settings`. CI проверяет, что схема и миграции синхронны и что миграции идемпотентны.

### 10. Тесты
- **Решение:** Vitest 5.1 (`environment: node`, без jsdom — компонентных тестов пока нет). Playwright `@playwright/test` ровно 1.63.0.
- **Почему:** 1.63.0 совпадает с браузером, предустановленным в облачном контейнере разработки (chromium-1243); 1.64 ждёт другую ревизию. В CI браузер ставится через `playwright install`. Обновлять пин вместе с браузером контейнера.
- **e2e (smoke):** `lang`/`dir`/`h1` на трёх локалях, арабский шрифт только на /ar, canonical + hreflang, 12 маршрутов × 3 локали = 200, редирект `/` по `Accept-Language`, 404 для `/en/does-not-exist` и `/unknown.txt`. Скриншоты `home-en.png` и `home-ar.png` сохраняются в артефакт CI при каждом прогоне.

### 11. pnpm 10, Node 22.12–24
- **Решение:** `packageManager: pnpm@10.33.0`, `engines.node: ">=22.12 <25"`. CI на Node 24. На Vercel в настройках проекта выбрать Node 24.x.
- **Почему:** поддержка pnpm 11/12 на Vercel нестабильна (vercel/vercel#17434); pnpm 10.33 уже работает в daylik на Vercel. Жёсткий `"24.x"` ломает `pnpm install` в контейнере на Node 22. Node 26 — дефолт Vercel для новых проектов, но в нём встроенный `fetch` перешёл на HTTP/2; без проверки не берём. TypeScript остаётся на 5.9 (create-next-app ставит `^5`, хотя `latest` в npm — 7.0).
- **Postinstall-скрипты:** `@parcel/watcher`, `@swc/core`, `esbuild`, `sharp`, `unrs-resolver` перечислены в `ignoredBuiltDependencies`. Бинарники приходят через optionalDependencies, сборка и drizzle-kit работают без них.

### 12. `formatAED` и направление текста
- **Решение:** `formatAED` собирает подпись валюты сам: «AED 199» / «199 د.إ» / «199 AED», цифры латинские (`ar-AE-u-nu-latn`). Направление текста — по жёсткой карте (`ar` → rtl).
- **Почему:** ICU для арабского даёт `د.إ.` с RLM-символами и точкой — не соответствует BRIEF §8. `Intl.Locale#getTextInfo` в Node 22 отсутствует. Коды и символы валют — константы форматирования, не UI-строки.

### 13. Проверка логических CSS-классов в линте
- **Решение:** `scripts/check-logical-css.mjs` в `pnpm lint` падает на физических классах (`ml-`, `pr-`, `left-`, `text-right`, `rounded-tl`, `border-r`, устаревшие `start-`/`end-` и др.) в `app/` и `components/`.
- **Почему:** правило 2 CLAUDE.md критично для арабской версии, а ESLint такие классы не ловит.

### 14. AR-строки — черновики
- `messages/ar.json` написан без носителя языка. Ревью носителем — до снятия `noindex` с AR-версии (BRIEF §9.8). TODO ar-review.

### 15. Аккаунты и инфраструктура
- **Решение (Максим, 04.11.2026):** Vercel, Neon и Resend — на аккаунтах Максима. Миша платит картой ОАЭ в роли Billing у Vercel. Домен, DNS (Cloudflare) и Anthropic — на Мише. Хостинг: Vercel Inc. (США), функции `fra1`, Neon Frankfurt. Регион `dxb1` недоступен с марта 2026.
- **Почему:** российские карты сервисы не принимают; Anthropic не обслуживает Россию; домен должен принадлежать бизнесу. Детали и план выхода — `docs/INFRASTRUCTURE.md`.
- **Vercel-проект в фазе 0 не создан:** Hobby запрещён для коммерческого сайта даже на время разработки, а Pro-команды пока нет. После её создания проект подключается одним шагом (README → «Деплой на Vercel»).

### 16. ПРЕДЛОЖЕНИЕ (не принято): Better Auth вместо Auth.js v5 в фазе 5a
- **Суть:** Auth.js v5 (`next-auth@5`) всё ещё в beta (5.0.0-beta.32). С сентября 2025 Auth.js — часть Better Auth и получает только security-фиксы; мейнтейнеры рекомендуют Better Auth для новых проектов. Better Auth 1.7: email + пароль, admin-плагин с ролями, Drizzle-адаптер (поддерживает Drizzle 0.45), Next 16, документированный вариант на `proxy.ts`.
- **Что изменится:** `AUTH_SECRET`/`AUTH_URL` → `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`, таблицы сессий в БД, rate limit входа со `storage: 'database'` (инстансы Fluid не делят память).
- **Статус:** ждёт решения Максима до начала фазы 5a. Пока бриф, CLAUDE.md, PHASES.md и `.env.example` остаются на Auth.js.

### 17. Настоящий 404 для неизвестных slug: `ensureStatic = 'navigation'`
- **Проблема:** с `partialPrefetching` для slug вне `generateStaticParams` Next сначала отдаёт App Shell со статусом 200. `notFound()` срабатывает уже после начала стрима — получается «мягкий 404» (200 + `noindex`).
- **Решение:** страницы `services/[slug]` и `areas/[slug]` экспортируют `ensureStatic = 'navigation'` и проверяют slug до любого `<Suspense>`. Для незаявленного значения первый запрос ждёт полный рендер, поэтому `notFound()` даёт статус 404. Заодно Next проверяет при сборке, что маршрут целиком статический.
- **Проверено:** `/en/areas/mirdif` (неопубликованный район) и `/ar/services/no-such-service` → 404; в браузере — локализованная страница «не найдено» с правильными `lang`/`dir`. Закреплено в e2e.
- **Следствие для фазы 2–3:** данные этих страниц должны идти только через `'use cache'` с долгим `cacheLife` — некешируемые запросы к БД и runtime-данные `ensureStatic` не пропустит.

### 18. CI-workflow лежит в `docs/ci/ci.yml`
- **Проблема:** у GitHub-токена облачной сессии нет права `workflows`, поэтому GitHub отклоняет любой пуш с `.github/workflows/*` (ответ «Internal Server Error»; без этого файла та же ветка пушится).
- **Решение:** workflow хранится в `docs/ci/ci.yml`. Максим один раз переносит его в `.github/workflows/ci.yml` через веб-интерфейс GitHub (README → «CI»). До этого «CI зелёный» из DoD фазы 0 проверен локально тем же набором команд, но не в GitHub Actions.
- **Альтернатива:** выдать GitHub App право `workflows` — тогда облачные сессии смогут сами менять workflow.
