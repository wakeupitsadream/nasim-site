# PHASES.md — задания для Opus 5.5 по фазам

Одна фаза = одна сессия Claude Code (Opus 5.5) в репо `nasim-site`. Промпт ниже вставляется первым сообщением сессии. Перед вставкой убедись, что в репо лежат `CLAUDE.md`, `docs/BRIEF.md`, `docs/PHASES.md`, `docs/DECISIONS.md` (может быть пустым), `content/seed/*.json`, `styles/design-tokens.css`.

## Ритуал каждой сессии

**Старт (входит в каждый промпт):** прочитать `CLAUDE.md`, `docs/BRIEF.md`, `docs/DECISIONS.md`, затем `git log --oneline -20`. Работать на ветке `phase-N/<slug>`, маленькие коммиты.
**Финиш:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` зелёные; запись в `docs/DECISIONS.md` (дата, решение, почему); короткий отчёт: что сделано, что не вошло, что проверить вручную на Vercel preview; открыть PR в `main` (без автомерджа).

Когда звать Fable: после фазы 2 (ревью схемы и запросов), после фазы 3 (ревью текстов EN/RU, постановка задачи AR-ревьюеру), после фазы 5 (аудит админки и безопасности), при любом расхождении брифа с реальностью Next 16 / next-intl / Auth.js.

---

## Фаза 0 — Каркас

**Цель:** пустой, но полностью настроенный проект, который деплоится на Vercel в трёх локалях.

**Статус:** выполнена 04.11.2026 (ветка `phase-0/scaffold`), кроме подключения Vercel-проекта и Neon — ждут Pro-команду (см. `docs/INFRASTRUCTURE.md`) — и включения GitHub Actions: workflow лежит в `docs/ci/ci.yml` и переносится в `.github/workflows/` вручную (README → «CI», DECISIONS №18). Фактический состав и отклонения — в `docs/DECISIONS.md`. Промпт ниже оставлен для истории и обновлён под проверенные факты.

**Промпт:**

> Прочитай CLAUDE.md, docs/BRIEF.md (особенно §9, §13, §14) и docs/DECISIONS.md. Задача фазы 0 — каркас проекта.
>
> 1. Инициализируй Next.js 16 (App Router, TypeScript strict, Tailwind v4, без `src/`, pnpm). Подключи shadcn/ui 4.23 (`init --base radix --preset nova --rtl`: стиль radix-nova, нейтральная база, `rtl: true` — new-york не получает RTL-конвертацию), ESLint + Prettier, Vitest, Playwright 1.63.0 (chromium; версия = браузер в /opt/pw-browsers), GitHub Actions `ci.yml` (typecheck, lint, test, build на PR и push в main).
> 2. next-intl v4: `lib/i18n/routing.ts` (en/ar/ru, default en, localePrefix always), `navigation.ts`, `request.ts`, `proxy.ts` (имя для Next 16; запиши в DECISIONS); `request.ts` берёт локаль из `next/root-params`. `app/[locale]/layout.tsx` ставит `lang` и `dir`, грузит IBM Plex Sans для en/ru и IBM Plex Sans Arabic для ar через next/font (subsets по локали). Подключи `styles/design-tokens.css` в `app/globals.css`. Пустые страницы по карте BRIEF §5 с заголовком из `messages/*.json`.
> 3. Drizzle + Neon: `lib/db/client.ts`, пустая `schema.ts` с таблицей `settings` (id=1, brand_name i18n), `drizzle.config.ts`, `scripts/migrate-if-db.mjs` (как в BRIEF: миграции применяются в `pnpm build`, если есть DATABASE_URL), `.env.example` со всеми переменными из CLAUDE.md.
> 4. `lib/i18n/text.ts` (`pick`), `lib/i18n/format.ts` (`formatAED`, `formatNumber` с `nu-latn` для ar) + unit-тесты; компонент `<Ltr>`.
> 5. Vercel: `vercel.json` с `regions: ["fra1"]` для функций; README с шагами подключения проекта, Neon (Frankfurt) и env.
>
> DoD: три локали открываются, на /ar `dir="rtl"` и арабский шрифт, CI зелёный, `pnpm build` проходит без DATABASE_URL (миграции пропускаются с предупреждением). Не делай страницы контентными — это фаза 3.

---

## Фаза 1 — Дизайн-система и оболочка

**Промпт:**

> Прочитай CLAUDE.md, docs/BRIEF.md §9, §15 и docs/DECISIONS.md. Фаза 1 — дизайн-система и оболочка сайта.
>
> 1. Настрой токены из `styles/design-tokens.css` в Tailwind (`@theme inline`), типографическую шкалу, контейнер, отступы.
> 2. Компоненты `components/ui` (shadcn + доработки): Button (варианты primary / secondary / ghost / whatsapp / telegram), Card, Pill/Chip, Accordion, Table (с липкой первой колонкой на мобильном), Input/Select/Textarea/Checkbox, PhoneInput (маска +971, любые страны, E.164 на выходе), Badge, Skeleton, Toast.
> 3. Оболочка `components/marketing`: Header (лого-плейсхолдер из settings, меню, LangSwitcher с сохранением пути, WhatsApp-кнопка), Footer (контакты, часы, юр. блок — поля скрываются, если пустые), StickyBar (мобильная панель WhatsApp + Call, на ru + Telegram при включённом флаге), Breadcrumbs.
> 4. Страница `/[locale]/dev/ui` (только в development) со всеми компонентами, длинными строками на ar/ru, числами и телефонами внутри `<Ltr>`.
> 5. Playwright: скриншоты `/en/dev/ui` и `/ar/dev/ui` на 390px и 1280px; axe-core проверка без критических нарушений.
>
> Правила: только логические CSS-свойства, иконки со стрелками зеркалятся в RTL, тап-зоны ≥ 44px, без тёмной темы. DoD по CLAUDE.md.

---

## Фаза 2 — Данные и сид

**Промпт:**

> Прочитай CLAUDE.md, docs/BRIEF.md §8, §11 и docs/DECISIONS.md, посмотри `content/seed/*.json`. Фаза 2 — схема данных, запросы, сид.
>
> 1. Реализуй полную схему BRIEF §11 в `lib/db/schema.ts` (JSONB для i18n-полей с типом `I18nText`, enum'ы, индексы). Сгенерируй миграции.
> 2. `lib/validation/content.ts` — zod-схемы всех сущностей (включая `i18nText` с обязательным `en`).
> 3. `lib/db/queries/*`: `getSettings`, `getServices({status})`, `getServiceBySlug`, `getPriceItems`, `getPackages`, `getAreas`, `getAreaBySlug`, `getFaqs(scope, id)`, `getReviews`, `getMedia`, `getBlock(key)` — все с `'use cache'` + `cacheLife('max')` + `cacheTag` (`content`, `settings`, `service:{slug}`, `area:{slug}`) и функцией `revalidateContent(tags)` (вызывает `updateTag` по каждому тегу; только из server actions).
> 4. `scripts/seed.ts`: читает `content/seed/*.json`, upsert по slug/key, не трогает записи с `updated_at > seeded_at` (поле `seeded_at` добавь в схему там, где есть сид). Пустые `ar` оставляй пустыми — их заполнит AI-перевод в админке и ревью носителя.
> 5. Юнит-тесты: `pick()` fallback, валидация сида (все JSON проходят zod), `pricing.ts` — реализуй по BRIEF §7.2 и §8: тарифные ступени по количеству, минимумы, пакеты (предлагать пакет, если он дешевле набора), допы, режим «диагностика + смета» для ремонта и фреона. Тесты на каждую ветку.
>
> DoD: `pnpm db:migrate && pnpm seed` на пустой Neon-ветке даёт данные для всех страниц; повторный `pnpm seed` ничего не меняет; тесты зелёные. Запиши в DECISIONS, как хранишь i18n и почему JSONB.

---

## Фаза 3 — Публичные страницы

**Промпт:**

> Прочитай CLAUDE.md, docs/BRIEF.md §4–6, §9, §12 и docs/DECISIONS.md. Фаза 3 — все публичные страницы на данных из БД.
>
> 1. Реализуй страницы по BRIEF §5–6: главная, каталог услуг, страница услуги (шаблон §6.2 с особенностями по slug), прайс (без калькулятора — он в фазе 4, оставь слот), годовые контракты, районы и страница района, о нас, контакты, privacy, terms, thank-you, 404. Секции без данных (например, отзывы) не рендерятся.
> 2. Компоненты: Hero с мокапом WhatsApp-отчёта, ServiceCard, PriceTable, BeforeAfter (слайдер, RTL-aware), FaqAccordion, StepsList, GuaranteeBlock, AreaChips, ReviewCarousel, ContractPlans, ComingSoonBanner (для status=coming_soon с датой), WhatsAppButton (пока простой wa.me без шаблона — шаблоны в фазе 4).
> 3. SEO: `generateMetadata` с hreflang и canonical на каждой странице, JSON-LD (HVACBusiness в layout, Service, FAQPage, BreadcrumbList), `sitemap.ts` с alternates, `robots.ts`, `opengraph-image.tsx` для локали и страницы услуги/района (арабский шрифт в генераторе).
> 4. Контент: дописать EN-тексты в сиде там, где поля пустые (по §4 и §6), RU — перевести, AR — оставить пустым. Тон по §4. Никаких выдуманных отзывов, лицензий, цифр «обслужили 10 000 клиентов».
> 5. Playwright: обход всех URL из sitemap (200, нет пустых `<h1>`), скриншоты главной и услуги на en/ar/ru, Lighthouse (через `@lhci/cli` или `playwright-lighthouse`) mobile ≥ 90 на главной и странице услуги.
>
> DoD по CLAUDE.md + Lighthouse ≥ 90. Отчёт: список страниц, где контент слабый и нужен Миша.

---

## Фаза 4 — Конверсия

**Промпт:**

> Прочитай CLAUDE.md, docs/BRIEF.md §7, §16 и docs/DECISIONS.md. Фаза 4 — WhatsApp, калькулятор, форма, пайплайн лида.
>
> 1. `lib/whatsapp.ts`: билдер ссылок `wa.me` с шаблонами по локали из `content_blocks` (ключи `wa.template.*`), подстановка услуги/количества/района/времени/страницы, пропуск пустых. Тесты. WhatsAppButton и StickyBar используют билдер; клики шлют `sendBeacon` в `/api/track` (без PII).
> 2. QuoteCalculator (клиентский островок, пошаговый, конфиг из `getPriceItems`/`getPackages`): объект → услуга → количество → допы → итог с разбивкой, предложением пакета и двумя CTA (WhatsApp с текстом разбивки; «Request a callback» открывает форму с `quote_snapshot`). Ремонт/фреон показывают «диагностика X + смета». Вся арифметика — `lib/pricing.ts`.
> 3. LeadForm (BRIEF §7.3): zod-схема общая для клиента и `POST /api/leads`, Turnstile (виджет + серверная проверка), honeypot, лимит 5/час на `ip_hash` через таблицу `rate_limits`, чекбокс маркетинга отдельно. После успеха — редирект на `/thank-you` с WhatsApp-кнопкой.
> 4. Пайплайн (§7.4): insert `leads` + `lead_events(created)`; в `after()` — Telegram `sendMessage` (HTML, inline-кнопки «WhatsApp клиенту» и «Открыть в админке»), Resend письмо получателям из settings, авто-ответ клиенту на его языке при наличии email; каждая доставка → `lead_events` ok/err; одна повторная попытка Telegram через 30 с. `lib/telegram.ts`, `lib/email.ts` (React Email не нужен — простой HTML-шаблон в трёх локалях).
> 5. `/api/track`: принимает `wa_click | tel_click | calc_quote | form_start`, пишет `track_events`, никаких cookies.
> 6. E2E: калькулятор до суммы на en и ar; отправка формы с тестовыми ключами Turnstile (`1x0000…`) → запись в БД (проверка через тестовый endpoint в dev или прямой запрос к тестовой БД) → сообщение в тестовый Telegram-чат (переменная `TELEGRAM_TEST_CHAT_ID`).
>
> DoD по CLAUDE.md + e2e зелёные на Vercel preview с тестовыми ключами.

---

## Фаза 5a — Админка: доступ, оболочка, контент

**Промпт:**

> Прочитай CLAUDE.md, docs/BRIEF.md §10, §11 и docs/DECISIONS.md. Фаза 5a — админка: вход, оболочка, контентные модули.
>
> 1. Auth.js v5 Credentials: таблица `users`, argon2id, JWT-сессия 7 дней, лимит попыток 5/15 мин, сброс пароля по ссылке через Resend, роли `owner`/`staff`, защита `/admin/*` и `/api/admin/*` в middleware/proxy и в каждом server action (`requireRole`). Сид двух owner-пользователей из env `SEED_ADMIN_EMAILS` с одноразовыми паролями, выводимыми в консоль сида.
> 2. Оболочка `/admin`: адаптивная (телефон первым), боковое меню → нижняя навигация на мобильном, переключатель языка интерфейса RU/EN (cookie), поиск, тосты с undo, скелетоны, пустые состояния с подсказкой «что сделать».
> 3. Общие компоненты: DataTable (сортировка, фильтры, пагинация, drag-and-drop порядка), I18nFields (три колонки en/ar/ru side-by-side, EN как источник, индикатор «нет перевода», кнопка «Перевести с EN» с diff-подтверждением), RichEditor (Tiptap: h2/h3, списки, ссылки, жирный; сериализация в HTML, санитизация при рендере), MediaPicker, StatusToggle, PublishBar (сохранить = опубликовать + `updateTag` по тегам; предпросмотр через `draftMode`).
> 4. Модули: Услуги, Цены и пакеты (инлайн-таблица + живой предпросмотр калькулятора + переключатель VAT), Районы, FAQ, Отзывы (источник обязателен, скриншот-подтверждение), Медиа (Vercel Blob, сжатие на клиенте до 2000px, EXIF-очистка, пары до/после, alt по локалям, флаг placeholder), Страницы (контент-блоки с версиями: 10 последних, откат).
> 5. `lib/ai.ts` + `POST /api/admin/ai/translate`: `@anthropic-ai/sdk`, модель `process.env.AI_MODEL ?? 'claude-opus-5-5'`, `output_config.format` с zod-схемой `{ ar, ru }`, `output_config.effort: 'low'`, `fallbacks: 'default'` + beta `server-side-fallback-2026-07-01`, глоссарий из settings в системном промпте, сохранение HTML-разметки, таймаут 60 с. Результат возвращается в UI как предложение, не пишется в БД.
> 6. Аудит: каждое изменение → `audit_log` с diff.
>
> DoD: сценарий «owner меняет цену → страница услуги обновилась ≤ 10 с» зелёный в e2e; staff не видит Настройки/Пользователей и получает 403 на их server actions; скриншоты админки 390/1280 в LTR (админка — только LTR, UI RU/EN).

---

## Фаза 5b — Админка: заявки, дашборд, настройки, пользователи

**Промпт:**

> Прочитай CLAUDE.md, docs/BRIEF.md §7.4, §10 и docs/DECISIONS.md. Фаза 5b — операционная часть админки.
>
> 1. Заявки: список с фильтрами (статус, тип, услуга, район, локаль, дата) и поиском по имени/телефону; карточка-дровер: контакты (кнопка WhatsApp с заготовкой ответа на языке клиента из `content_blocks` `reply.template.*`, tel:, mailto:), что хотел (услуги, количество, снимок калькулятора), статусы кнопками `new → contacted → scheduled → done / lost / spam`, заметки, таймлайн `lead_events` с кнопкой «отправить повторно» для Telegram/email, поле `next_service_due` для done; массовые действия; экспорт CSV; вид «канбан» по статусам; вкладка «Напомнить на этой неделе» (лиды с `next_service_due` в ближайшие 7 дней, кнопка WhatsApp с шаблоном напоминания).
> 2. Дашборд: лиды сегодня/7/30 дней, график по дням (14 дней, без тяжёлых библиотек — простой SVG), разбивка по типу и локали, клики WhatsApp по страницам из `track_events`, последние 5 заявок, блок «нужно внимание» (новые > 2 ч, непереведённые поля, услуги без фото, заглушки в медиа).
> 3. Настройки (BRIEF §10): бренд и лого SVG, контакты, часы, юр. данные, зона, время ответа, VAT, уведомления (Telegram chat id + кнопка «тест», email-получатели + «тест»), флаги (AR noindex → `robots` meta на ar-страницах, показывать отзывы, срочный вызов), аналитика (GA4/Meta id → включает баннер согласия на сайте), глоссарий для AI.
> 4. Пользователи: список, приглашение по email (Resend), роль, сброс пароля, деактивация. Журнал аудита: таблица с фильтром по сущности/пользователю.
> 5. E2E: лид из формы появляется в inbox с правильной локалью и снимком калькулятора; смена статуса пишет событие; тест Telegram-уведомления из настроек.
>
> DoD по CLAUDE.md + e2e. В отчёте — список всего, что требует боевых ключей (Telegram, Resend-домен, Turnstile) для фазы 6.

---

## Фаза 6 — Запуск

**Промпт:**

> Прочитай CLAUDE.md, docs/BRIEF.md §12, §16, §17 (фаза 6), §19 и docs/DECISIONS.md. Фаза 6 — подготовка к запуску. Данные от Миши — в `docs/MISHA-ANSWERS.md` (если файла нет — работай с плейсхолдерами и перечисли в отчёте, что заблокировано).
>
> 1. `docs/RUNBOOK.md`: подключение домена: DNS у Cloudflare в аккаунте Миши в режиме DNS only (A — значение из карточки домена Vercel, CNAME www → *.vercel-dns-0xx.com; MX/TXT Resend там же), регистрант — Миша/его компания, домен Resend (SPF/DKIM/DMARC), Turnstile на боевой домен, Telegram-бот и chat id Миши, создание пользователей, бэкапы Neon (PITR), откат деплоя, ротация ключей, как добавить район/услугу, как снять `noindex` с AR после ревью.
> 2. Контент: внести ответы Миши в settings и сид (контакты, лицензия, часы, цены, гарантии), заменить заглушки реальными фото где есть, проверить все `is_placeholder`.
> 3. Legal: финальные privacy и terms на трёх языках по BRIEF §16 с реальными данными компании.
> 4. Чеклист SEO: Search Console (sitemap отправлен), Bing, Google Business Profile — инструкция для Миши в RUNBOOK; проверить Rich Results для Service/FAQPage/LocalBusiness; hreflang-валидация.
> 5. Финальные проверки на проде: Lighthouse ≥ 90 на 4 страницах × 3 локали, тестовый лид проходит весь путь (БД → Telegram → email), вход в админку с телефона.
>
> DoD: продакшен открыт на трёх языках (AR с `noindex`, пока нет ревью носителя), все пункты RUNBOOK выполнены или помечены «ждёт Мишу» с конкретным вопросом.
