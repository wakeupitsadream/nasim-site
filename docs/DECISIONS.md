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

## Фаза 1 — дизайн-система и оболочка

### 19. Деплой на Hobby-команде Максима (пересматривает №15 в части Vercel)
- **Решение (Максим, 04.11.2026):** проект `nasim-site` создан на Hobby-команде Максима, продакшен — https://nasim-site.vercel.app (Node 24.x, `fra1`, Git-подключение к `wakeupitsadream/nasim-site`). Цель — показывать Мише результат по ссылке уже сейчас.
- **Риск:** fair use Vercel запрещает коммерческие сайты на Hobby, проект могут ограничить. До коммерческого запуска (свой домен, реклама, заявки клиентов) — Pro-команда и перенос проекта (Settings → Transfer, без даунтайма), Миша — Billing.

### 20. Превью открытые, продакшен вне поиска до своего домена
- **Превью без Vercel Authentication** (`ssoProtection: null`): на Hobby Мишу нельзя добавить в команду, а ссылка-исключение одна на аккаунт. Vercel сам ставит превью `X-Robots-Tag: noindex`.
- **Продакшен `*.vercel.app` — `noindex, follow`**, пока не задан `NEXT_PUBLIC_SITE_URL` (`hasCanonicalDomain()` в `lib/env.ts`): технический адрес не должен попасть в индекс и конкурировать с будущим доменом. `/ar` дополнительно закрыт флагом `settings.flags.ar_noindex`, пока арабские тексты — черновики (BRIEF §9.8).
- **`siteUrl()`** (`lib/env.ts`): `NEXT_PUBLIC_SITE_URL` → на продакшене `VERCEL_PROJECT_PRODUCTION_URL` → на превью `VERCEL_BRANCH_URL`, затем `VERCEL_URL` → `localhost`. Так canonical/hreflang корректны без ручной переменной. `lib/seo.ts` реэкспортирует её.

### 21. Галерея `/[locale]/dev/ui`
- Все компоненты дизайн-системы в LTR и RTL, длинные строки, числа и цены в `<Ltr>`, превью мобильной панели с тремя кнопками. Доступна локально и на превью; на продакшене — настоящий 404 (`VERCEL_ENV` известен при сборке, маршрут пререндерится как 404). `noindex`, в sitemap фазы 3 не включать.
- Панель с Telegram проверяется через превью в галерее (`<StickyBar preview={{ telegram: true }} />`), а не через тестовый override настроек — в продакшен-коде нет веток «только для тестов».

### 22. Контакты не выдумываем: пустое значение → CTA ведёт на `/contact`
- `lib/content/site.ts` — **временный** источник настроек до фазы 2: читает `settings.defaults` из `content/seed/blocks.json` через zod-схему `lib/validation/settings.ts` (не приведением типов). Сигнатура `getSiteSettings(locale)` и тип `SiteSettings` в фазе 2 не меняются — меняется тело на кешированный запрос.
- Телефон, WhatsApp, Telegram, email, соцсети и юрданные пустые, пока Миша не ответит на анкету. Пустые блоки скрыты; кнопки WhatsApp/Позвонить/Telegram ведут на `/contact` (`lib/cta.ts`). Закреплено в unit- и e2e-тестах (на страницах нет `tel:`, `wa.me`, `t.me`).
- Значения настроек хранят язык, из которого взяты (`pickLocalized`); упавшие на EN-фолбэк на `/ar` и `/ru` выводятся с `lang="en" dir="auto"` (`<LocalizedText>`).
- **zod 4.6** добавлен в фазе 1, а не 2: он и так в стеке (CLAUDE.md), а схема нужна уже для сида настроек. Альтернатива — ручная проверка типов — дублировала бы схему фазы 2.

### 23. `cn` с учётом наших токенов
- **Проблема (проверено запуском):** `cn` из пакета `cn` (его ставит shadcn 4.23) не знает `text-small/body/lead/h1…`, `shadow-card`, `h-tap` и т. п. и при слиянии с цветом выкидывает размер шрифта (`cn('text-body', 'text-primary')` → `text-primary`).
- **Решение:** `lib/utils.ts` строит `cn` через `createCn` из `cn/config` с `extend` (spacing `tap/gutter/gutter-lg/sticky-bar/header`, font-size `small/body/lead/logo/h1/h2/h3`, shadow `card/float`). Все компоненты импортируют `cn` только из `@/lib/utils`; импорт `from "cn"` в `app/` и `components/` ловит `pnpm lint`. Новый токен шрифта/отступа — добавить и в `lib/utils.ts`.

### 24. Адаптация компонентов shadcn
- **Sheet:** логические стороны `inline-start`/`inline-end` (по умолчанию `inline-end`: справа в EN, слева в AR), `left`/`right` принимаются как алиасы и маппятся по направлению (понадобится `sidebar` в фазе 5). `dir` — из `useDirection()`. Обязательный проп `closeLabel` (строка из messages). Ширина задаётся вариантом `data-[side=inline-end]:w-…`, обычный `w-…` его не перебивает.
- **Select:** `dir` в портал Radix берёт из `DirectionProvider` сам — явная передача безвредна, но не нужна. Индикатор — `inset-e-2`.
- **Table:** серверный компонент; контейнер — `role="region"` с `tabIndex={0}` и именем (`labelledBy` на caption или `label`), иначе axe `scrollable-region-focusable`; проп `stickyFirstColumn` для таблиц цен на мобильном.
- **Breadcrumb:** обязательный `label` (имя landmark из messages), `BreadcrumbEllipsis` удалён. JSON-LD BreadcrumbList — в фазе 3 вместе с SEO-слоем.
- **Sonner:** без `next-themes` (тёмной темы нет, зависимость удалена), `theme="light"`, `top-center`, `dir`. `<Toaster />` монтируется только на страницах с уведомлениями (сейчас — dev/ui, в фазе 4 — формы), не в корневом layout.
- **Размеры:** интерактивные элементы ≥ 44px (`h-tap`), текст полей `text-body` (17px — iOS не зумит). `sm`/`xs` у кнопок — только для плотной админки.

### 25. Контраст и фокус
- Кнопки WhatsApp/Telegram — тёмный текст (`--nasim-ink`): белый на #25D366 ≈ 1.9:1, на #2AABEE ≈ 2.6:1. С тёмным — 8.9:1 и 6.7:1.
- `--ring` = `--nasim-teal-deep` (бирюза на песке ≈ 2.4:1 — мало для индикатора фокуса, WCAG 1.4.11); у брендовых кнопок `ring-offset`.
- Статусные бейджи — мягкий фон + тёмные чернила: `success-ink` #14532d, `warning-ink` #7c3d05, `danger-ink` #9a3412 (`#c2410c` на своём мягком фоне даёт 4.47:1 — axe падал). `text-highlight` (бирюза) — только для декоративных иконок.
- `scroll-padding-top/bottom` под липкую шапку и мобильную панель.

### 26. Телефон: `libphonenumber-js` 1.13 (`/min`)
- **Зачем:** форматирование при вводе и проверка номера любой страны с выходом в E.164; без кода страны номер считается номером ОАЭ. Одна и та же проверка на клиенте и сервере (правило 6). `^` — метаданные обновляются патчами, lockfile фиксирует версию.
- **Альтернативы:** `react-phone-number-input` (свой UI выбора страны, флаги и CSS, конфликтует с нашим Input и RTL), `intl-tel-input` (тяжёлый, DOM-ориентированный).
- `min`-метаданные (~80 КБ): `isValid()` проверяет длину и страну — достаточно для формы обратного звонка.

### 27. Проверки доступности: `@axe-core/playwright` 4.14.0 + `playwright-core` 1.63.0
- `tests/e2e/a11y.spec.ts`: `/en`, `/ar`, `/en/dev/ui`, `/ar/dev/ui` при 390 и 1280 px и `/ar` с открытым меню — без нарушений `critical`/`serious` по WCAG 2.2 AA + best-practice.
- Обе версии закреплены точно: `@axe-core/playwright` тянет `playwright-core` как peer, и без явной версии pnpm поставил бы новее браузера в контейнере (`/opt/pw-browsers`). Обновлять вместе с `@playwright/test`.

### 28. Оболочка: шапка, переключатель языка, логотип
- **Шапка без cookies/headers** — иначе `[slug]`-страницы с `ensureStatic` (№17) перестают собираться. Десктопная навигация — с `xl:` (на 1024px RU/AR-пункты не влезают рядом с логотипом и CTA); ниже — меню в Sheet.
- **LangSwitcher** читает `usePathname()`, поэтому всегда в `<Suspense>` с фолбэком — ссылки на главные страницы локалей. Для статических маршрутов путь известен при пререндере: в HTML уже ссылки на ту же страницу (проверено e2e). В шапке компактный вид `EN · ع · RU` (полное имя для скринридеров), в футере и меню — полные названия. На `/en` и `/ru` «العربية» рисуется системным шрифтом: арабский шрифт грузится только на `/ar` (№8).
- **Смена локали — мягкая навигация:** Next 16 держит дерево предыдущей локали смонтированным в скрытом `<Activity>`. В e2e ищем элементы через `getByRole` (скрытые не учитываются), а не голым CSS-селектором.
- **Логотип** — «растянутая ссылка»: ссылка содержит только знак и имя в `aria-label`, её `::after` накрывает весь логотип. Видимое «Nasım» (безточечная ı с бризом вместо точки, BRIEF §3) вне ссылки, поэтому доступное имя не обязано совпадать со стилизованными буквами (WCAG 2.5.3; axe `label-content-name-mismatch` падал). Арабское «نسيم» — только на `/ar`. `app/icon.svg` — тот же знак, `favicon.ico` оставлен для старых клиентов.
- **Футер без года** в копирайте: `new Date()` при пререндере — ошибка sync IO под Cache Components.
- **Клиентские сообщения:** `NextIntlClientProvider` получает только `LangSwitcher` и `Common` — остальные строки остаются на сервере и не попадают в бандл. Клиентским компонентам, которым нужны другие строки (меню, демо галереи), тексты передаются пропсами.
- **Skip-link** и единственный `<main id="main">` в layout; `PageStub` использует `<div>`.

### 29. Линт: `dark:` и новые физические классы
- `scripts/check-logical-css.mjs` дополнительно запрещает `dark:` (правило 13), `float-left/right`, `clear-left/right`, `bg-(linear-)to-l/r`, `scroll-m/p` по горизонтали и импорт `from "cn"`; экспортирует `checkSource()` с unit-тестом на разрешённые и запрещённые классы.

### 30. AR-строки фазы 1 — черновики
- Неймспейсы `Nav`, `Header`, `Cta`, `StickyBar`, `Footer`, `LangSwitcher`, `Common`, `PhoneInput`, `DevUi` в `messages/ar.json` написаны без носителя. TODO ar-review — вместе с №14, до снятия `ar_noindex`. Unit-тест сверяет ключи, ICU-плейсхолдеры и rich-теги во всех трёх файлах.
