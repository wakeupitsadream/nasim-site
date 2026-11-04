# План сборки сайта сервисной компании Миши (Дубай): кондиционеры + химчистка мебели

Документ-бриф для Opus 5.5. Собирается по фазам, одна фаза = одна сессия. Fable подключается для правок архитектуры и ревью.

---

## 1. Контекст

Миша (Дубай) открывает сервисную компанию: чистка, мелкий ремонт и обслуживание кондиционеров в квартирах, виллах и небольших офисах; тем же фургоном и тем же клиентам — химчистка мебели. Нужен сайт на EN / AR / RU, деплой на Vercel, с собственной админкой, через которую Миша сам ведёт контент, цены и входящие заявки.

**Из голосовых Миши (7 сообщений, расшифровано):**
1. Параллельно он запускает бренд расходников (таблетки для посудомойки через брата, частная марка из Китая). К сайту не относится, в бриф не идёт.
2. Приоритет сервисной компании: сначала чистка и мелкий сервис кондиционеров, затем химчистка. Обычная уборка — «бабок не приносит», не делаем. Это подтверждает структуру сайта: кондиционеры — главный продукт, химчистка — второй.
3. Боль вилл у воды — плесень под кондиционерами и в шкафах. Люди покупают переносные осушители на Amazon и каждые 4 дня выливают воду. Канальный осушитель (~10 000 AED) как допродажа к обслуживанию — не отдельная ниша, а дополнение к компании по кондиционерам. На сайте: раздел «Влажность и плесень» как «скоро», с листом ожидания.
4. Нужен хороший техник и помощник, который разбирается в химии. Спрос на чистку постоянный.

**Решения, принятые с Максимом в этой сессии:**

| Вопрос | Решение |
|---|---|
| Модель заявки | Лид-ген: WhatsApp-кнопка с предзаполненным текстом + короткая форма «перезвоните». Без онлайн-записи и оплаты в v1. |
| Контент | Собственная админка высокого уровня (не headless CMS, не файлы в репо). |
| Репо и деплой | Новый репо и Vercel у Максима. Vercel Pro (Hobby запрещён для коммерции). |
| Объём v1 | Многостраничник под SEO: главная + страницы услуг + районы + контракты + о нас + контакты + legal, всё в 3 локалях. |
| Бренд | Ничего нет. Рабочее имя предлагается в плане, лого текстовое. |
| Доставка лидов | Входящие в админке + Telegram-уведомление Мише + email через Resend. |
| Цены | Прайса нет. Рыночные ориентиры Дубая как стартовые значения, Миша правит в админке. |
| Визуал | Референсов и фото нет. Дизайн-направление задаётся планом; на старте сгенерированные/стоковые заглушки, потом реальные фото через админку. |

---

## 2. Проверенные факты (поиск 04.11.2026)

1. **Next.js** стабильная — 16.4.5 (03.11.2026). Берём 16.x, App Router.
2. **Vercel Hobby** — только некоммерческое использование по fair use policy; сайт компании = Pro ($20/мес, одно деплой-место включено; Pro-команда Максима, Миша — в роли Billing со своей картой ОАЭ, см. `docs/INFRASTRUCTURE.md`). Регион функций: `dxb1` (Дубай) недоступен для Functions с марта 2026 (после аварии AWS me-central-1; в документации регионов его нет, дашборд пишет «under maintenance»), и БД там нет — функции и БД колокируем во Франкфурте: Vercel `fra1` = AWS eu-central-1 = Neon `aws-eu-central-1` (см. §13). Статику отдаёт CDN; по сообщениям сообщества, трафик из Персидского залива сейчас обслуживается через bom1 (Мумбаи) — официально не подтверждено.
3. **Neon** регионы: Франкфурт `aws-eu-central-1`, Сингапур `aws-ap-southeast-1`. Ближе к Дубаю Ближнего Востока нет.
4. **Рынок Дубая** (сайты конкурентов и блоги, не первичные данные): стандартная чистка сплита 150–350 AED/блок; глубокая чистка 250–600 AED/блок; пакет на квартиру 3–4 блока 350–600 AED; годовой контракт на 4–6 блоков 800–2 000 AED, виллы 1 500–4 000 AED; заправка фреона 200–400 AED; поиск и устранение утечки с азотной опрессовкой 600–1 200 AED; диван 40–70 AED за место или 150–350 AED за 2–3-местный; ковёр ~20 AED/м²; пакет «вся мягкая мебель в 1BHK» ~500 AED. Дешёвые офферы 29–49 AED обычно не включают радиатор и дренаж — это аргумент для позиционирования «честная цена заранее».
5. **Dubai Municipality**: чистка воздуховодов и чистка резервуаров воды требуют отдельных разрешений DM сверх trade license. Подтверждает слова Миши: воздуховоды — через партнёра, резервуары — с июля 2027.
6. **UAE PDPL** (Federal Decree-Law 45/2021): нужна privacy policy, отдельное согласие на маркетинг, согласие на аналитические cookies без cookie-wall. Статус исполнительных регламентов в источниках противоречив — делаем консервативно: баннер согласия только если включаем GA4/Meta Pixel; Vercel Analytics без cookies согласия не требует.
7. **next-intl v4** + App Router: `app/[locale]/` как корневой layout (без `app/layout.tsx`), `lib/i18n/{routing,navigation,request}.ts`, локаль из `next/root-params` (Next ≥16.3; `setRequestLocale` устарел с next-intl 4.13.5), `proxy.ts` (в Next 16 `middleware.ts` устарел), `dir="rtl"` на `<html>` для AR, арабский шрифт через `next/font` только в AR-локали, hreflang через `metadata.alternates.languages` (в routing `alternateLinks: false`).
8. **Домены** (проверено через Vercel API, .com): свободны `nasimcare.com`, `nasimdubai.com`, `getnasim.com`, `baridcare.com`, `coolnestdubai.com`, `breezecaredubai.com`, `aircaredubai.com`, `coolhands.co`, `nasim.services`. Заняты: `nasimhome.com`, `hawacare.com`, `coilcare.com`, `freshcoil.com`, `sahabcare.com`, `airnest.co`. Зону `.ae` не продают Vercel и Cloudflare; GoDaddy нет в списке аккредитованных TDRA регистраторов. `.ae` — у аккредитованного регистратора (AEserver: AED 125 первый год, ~145 продление, цены без учёта 5% VAT; Dynadot: $32.67/год). `name.ae` регистрирует кто угодно без документов; `co.ae` — только с UAE trade licence или товарным знаком; WHOIS-privacy у .ae нет. `nasim.ae` занят (зарегистрирован через Etisalat сторонним владельцем).

---

## 3. Бренд (рабочий)

**Рабочее имя: Nasim** (араб. نسيم — «лёгкий ветерок, бриз»). Критерии: читается одинаково на EN/AR/RU, короткое, позитивное, не привязано к «AC», чтобы охватывать химчистку и будущие услуги, арабское слово даёт местный акцент для арабской аудитории и не отталкивает экспатов. Домен: `nasimcare.com` (свободен на 04.11.2026) в аккаунте Миши у Cloudflare Registrar или Porkbun; `nasim.ae` занят — перед покупкой проверить `nasimcare.ae` у AEserver (как редирект). Регистрант — Миша или его компания, не Максим. Полное название на сайте: «Nasim Home Care» (EN), «نسيم للعناية بالمنزل» (AR), «Nasim Home Care» (RU, латиницей).

Запасные: Barid Care (`baridcare.com`, بارد — «прохладный»), CoolNest Dubai (`coolnestdubai.com`), AirCare Dubai (`aircaredubai.com`, описательное, слабее для бренда).

Логотип v1 — текстовый: «Nasim» набран IBM Plex Sans SemiBold, точка над «i» заменена на маленький штрих-«бриз» (три короткие дуги). Арабская версия نسيم рядом в IBM Plex Sans Arabic. Favicon — тот же знак «бриз» в круге. Opus делает SVG сам. Если Миша выберет другое имя — всё в админке и в `settings`, замена — одна правка.

Все названия в плане ниже — с плейсхолдером `{Brand}`; в коде бренд читается из `settings`.

---

## 4. Позиционирование и аудитории

**Обещание (hero):** «Чистый холодный воздух без сюрпризов. Цена известна до приезда, техник в назначенный час, отчёт с фото в WhatsApp.»

**Пять отличий (повторяются на каждой странице услуги, как «гарантии»):**
1. Цена фиксирована до визита. На ремонт — диагностика по фиксированной цене, затем смета; цена диагностики засчитывается в ремонт.
2. Приезжаем в обещанный часовой слот (не «с 9 до 18»).
3. Отчёт в WhatsApp: фото до/после, замеры температуры на выходе, давление/ток где применимо.
4. Гарантия: на чистку 30 дней (если запах/проблема вернулись — переделаем бесплатно), на ремонт и запчасти 90 дней. Цифры подтверждает Миша.
5. Напоминание о следующей чистке через 4–6 месяцев (лист в админке, пока вручную через WhatsApp; автоматизация — фаза 2).

**Аудитории и язык:**
- EN — основная: экспаты всех национальностей, арендаторы квартир, владельцы вилл, менеджеры небольших офисов. Тон: конкретный, без маркетингового пафоса, цифры и факты.
- AR — местные семьи и арабоязычные экспаты, чаще виллы и канальные системы, важны доверие, лицензия, уважительный тон, «семейный» акцент. Перевод не механический — AR-копирайт должен проверить носитель (бюджет на Upwork ~$50–100, см. риски).
- RU — русскоязычные экспаты (Marina, JLT, JVC, Business Bay, Palm). Тон как для коллеги, без канцелярита. Для RU-аудитории WhatsApp и Telegram равнозначны — на RU-версии добавляем кнопку Telegram рядом с WhatsApp (если у Миши есть рабочий Telegram-аккаунт/бот; настраивается в админке).

**Что честно говорим «не делаем»** (на странице «О нас» и в FAQ): установку новых систем, сложный ремонт офисных VRF, чистку воздуховодов (передаём лицензированному партнёру), удаление плесени со стен (партнёр). Это укрепляет доверие и отсекает нецелевые заявки.

---

## 5. Структура сайта и URL

Локаль всегда в префиксе: `/en/...`, `/ar/...`, `/ru/...`. Корень `/` → редирект по `Accept-Language` с fallback на `/en`. `x-default` = EN.

| Путь (EN) | Назначение | Источник контента |
|---|---|---|
| `/en` | Главная | content_blocks + services + reviews + areas + faqs |
| `/en/services` | Каталог услуг (две группы: кондиционеры, химчистка; «скоро») | services |
| `/en/services/[slug]` | Страница услуги (10 активных + 2 «скоро») | services + price_items + faqs + media |
| `/en/pricing` | Весь прайс одной страницей + калькулятор | price_items + packages |
| `/en/annual-contracts` | Годовые контракты, 3 тарифа, форма запроса | packages(type=annual) + faqs(scope=contracts) |
| `/en/areas` | Районы обслуживания (карта-список) | areas |
| `/en/areas/[slug]` | Страница района (8–10 на старте) | areas + services + faqs(scope=area) |
| `/en/about` | О компании, команда, лицензия, «что не делаем», партнёры | content_blocks + media(kind=team) |
| `/en/contact` | Контакты, форма, часы, срочный вызов | settings |
| `/en/privacy`, `/en/terms` | Юридические | content_blocks (rich text) |
| `/en/thank-you` | После отправки формы (конверсионная цель) | статическая |
| `/admin/*` | Админка, без локали в URL, UI на RU/EN по переключателю | — |
| `/api/leads`, `/api/track`, `/api/auth/*`, `/api/admin/*` | Серверные ручки | — |
| `/sitemap.xml`, `/robots.txt`, `/[locale]/opengraph-image` | SEO | генерируются |

**Slugs услуг (EN; AR/RU — те же латинские slugs, локализуются только тексты, это упрощает hreflang):**
`ac-cleaning`, `ac-deep-cleaning`, `ducted-ac-fcu-service`, `emergency-ac-repair`, `ac-repair`, `refrigerant-leak-refill`, `annual-ac-contract` (ссылка на `/annual-contracts`), `sofa-cleaning`, `mattress-cleaning`, `carpet-cleaning`, `stain-odour-removal`; «скоро»: `water-tank-cleaning` (с июля 2027), `humidity-mould-check` (диагностика влажности, летний присмотр за домом, канальные осушители).

**Районы на старте (slug → название):** `dubai-marina`, `jbr`, `palm-jumeirah`, `downtown-dubai`, `business-bay`, `jvc`, `jlt`, `arabian-ranches`, `dubai-hills`, `damac-hills`, `al-barsha`, `jumeirah-umm-suqeim`, `springs-meadows-lakes`, `motor-city-sports-city`, `mirdif`, `silicon-oasis`. На старте публикуем 8–10 с уникальными интро (Opus пишет по брифу района: тип жилья, типичные системы, сезонные проблемы), остальные в админке как черновики. Тонкие дублирующие страницы не публикуем.

---

## 6. Постраничная спецификация

### 6.1 Главная
1. **Hero**: заголовок-обещание, подзаголовок (три факта: цена заранее, слот, отчёт), две CTA — «Book on WhatsApp» (зелёная, WA-иконка) и «Get instant price» (скролл к калькулятору). Справа/снизу — карточка «пример отчёта в WhatsApp» (мокап сообщения с фото до/после и замерами). Строка доверия под CTA: «Licensed in Dubai · Insured · 30-day guarantee · Fixed price» — значения из settings, лицензия показывается только когда номер заполнен.
2. **Быстрый выбор услуги**: 6 плиток (чистка, глубокая чистка, канальные/FCU, срочный вызов, ремонт/фреон, химчистка мебели) с ценой «от» и временем визита.
3. **Как это работает**: 4 шага — пишете в WhatsApp или форму → фиксируем цену и слот → техник приезжает, фото до/после → отчёт и напоминание. 
4. **Калькулятор мгновенной цены** (§7.2).
5. **До/после**: слайдер пар фото (media kind=before_after), подпись: район, услуга, замер температуры. На старте 3 сгенерированные пары с пометкой в админке «заменить реальными».
6. **Почему чистить каждые 4–6 месяцев в Дубае**: три факта (пыль, плесень из-за влажности, рост счёта за электричество у грязного радиатора) — короткие, без страшилок.
7. **Годовой контракт** — краткая карточка с тремя тарифами и ссылкой.
8. **Отзывы** — карусель из reviews(published), с источником (Google/WhatsApp). Пока отзывов нет — секция скрыта автоматически (не показываем пустое и не выдумываем).
9. **Районы** — чипы с ссылками.
10. **FAQ** — 6 глобальных вопросов (аккордеон, FAQPage JSON-LD).
11. **Финальный CTA** + форма «перезвоните» (§7.3).
12. **Футер**: контакты, часы, юр. информация (название компании, номер лицензии, TRN если есть), ссылки, переключатель языка, соцсети.
13. **Липкая мобильная панель**: WhatsApp + «Call» (tel:) всегда видна на мобильных; на RU — плюс Telegram, если включён.

### 6.2 Шаблон страницы услуги
Hero (название, 1 абзац, цена «от» и единица, длительность, CTA WhatsApp с предзаполненным текстом про эту услугу) → «Что входит» (чеклист) / «Что не входит» → «Когда это нужно» (симптомы: запах, капает, слабо холодит) → таблица цен для этой услуги (price_items) → «Как проходит визит» (3–5 шагов, с временем) → до/после этой услуги → гарантия → FAQ услуги → связанные услуги («обычно заказывают вместе») → форма. JSON-LD `Service` + `FAQPage` + `BreadcrumbList`.

Особенности:
- `ac-deep-cleaning`: объяснить разницу со стандартной (разборка внутреннего блока, мойка барабана вентилятора, антибактериальная обработка), когда обязательна (запах, плесень, чёрный налёт), предупреждение про возраст блока.
- `emergency-ac-repair`: блок «Same-day», часы срочных вызовов из settings, цена выезда с диагностикой и правило зачёта, список типовых причин (не холодит, течёт вода, не включается, шум).
- `refrigerant-leak-refill`: принцип «сначала ищем и чиним утечку, потом заправляем», почему «просто дозаправить» — выброшенные деньги; цена поиска, цена заправки «от», ремонт по смете.
- `ducted-ac-fcu-service`: для вилл и башен; FCU, фильтры канальных, дренаж, термостаты; что отличает от сплита; упоминание, что чистку воздуховодов делает лицензированный партнёр.
- `humidity-mould-check` («скоро»): боль из голосовых — плесень на виллах у воды, переносные осушители; что предложим: диагностика влажности с гигрометром, рекомендации, канальный осушитель под ключ с партнёром-монтажником, летний присмотр за домом (визит раз в 2 недели, проверка кондиционеров/протечек, фотоотчёт). Кнопка «Join waitlist» → лид типа `waitlist`.
- `water-tank-cleaning` («скоро, июль 2027»): честно про разрешение DM, waitlist.

### 6.3 Прайс
Таблицы по группам с единицами и минимумами, сноска про VAT (переключатель в settings: «цены включают 5% VAT» / без строки, пока нет регистрации), блок «что влияет на цену» (количество блоков, доступ к наружному блоку, этаж/виллa), калькулятор.

### 6.4 Годовые контракты
Три тарифа (таблица сравнения), «как считается экономия», что входит в приоритетный выезд, форма «запросить контракт» (лид типа `contract`).

### 6.5 Район
Интро (уникальное), типичные дома и системы района, рекомендованная частота, услуги с ценами, «приезжаем в {район} за N минут» (поле в areas), FAQ района (2–3), CTA. Без выдуманных отзывов.

### 6.6 О нас
История в 3 абзаца (Миша пишет факты, Opus — текст), команда (фото/имена из media kind=team, пока плейсхолдеры), лицензия и страховка, стандарты работы (чеклист техника), «чего мы не делаем и кому передаём», партнёры.

### 6.7 Контакты
Телефон, WhatsApp, email, часы (обычные и срочные), зона обслуживания, форма, карта не нужна (выездной сервис), юр. адрес.

---

## 7. Конверсионные механики

### 7.1 WhatsApp deep link
`https://wa.me/<номер без +>?text=<urlencoded>`. Номер из settings. Текст — шаблон по локали и контексту:
- EN: «Hi {Brand}! I'd like to book {service} ({units} units) in {area}. Preferred time: {time}. — from website/{page}»
- AR: «مرحباً {Brand}، أود حجز {service}…» (клиент пишет на арабском, Миша отвечает через переводчик/сотрудника — отметить в анкете).
- RU: «Здравствуйте! Хочу заказать {service}…».
Поля подставляются из контекста страницы/калькулятора; пустые опускаются. Клик логируется через `navigator.sendBeacon('/api/track', {type:'wa_click', page, locale, service})` без персональных данных — для статистики в админке.

### 7.2 Калькулятор мгновенной цены (ключевая фича «цена заранее»)
Клиентский островок, конфиг из БД (price_items, packages, правила скидок). Шаги: 1) тип объекта (квартира / вилла / офис) → 2) услуга (стандартная чистка / глубокая / канальные FCU / ремонт-диагностика / химчистка) → 3) количество (блоки / FCU / места дивана, матрасы, м² ковра) → 4) допы (пятна/запах, срочно сегодня) → итог: сумма, разбивка, «что входит», применённый пакет (если выгоднее — предлагаем пакет), CTA «Book this on WhatsApp» (текст с разбивкой) и «Request a callback» (форма с предзаполненным quote_snapshot). Ремонт и фреон — показывают «диагностика X AED + смета», не сумму. Правила ценообразования — чистые функции в `lib/pricing.ts` с unit-тестами.

### 7.3 Форма «перезвоните»
Поля: имя, телефон (маска +971, валидация E.164, разрешаем любые страны), район (select из areas + «другой»), услуга (multi), количество блоков (опц.), удобное время (сегодня / завтра / выбрать), комментарий, email (опц.), чекбокс маркетинга (опц., отдельно), ссылка на privacy. Защита: Cloudflare Turnstile (бесплатно) + honeypot + лимит 5 заявок/час с IP (таблица в БД). Отправка → страница «спасибо» с WhatsApp-кнопкой («быстрее — напишите нам») и ожидаемым временем ответа из settings.

### 7.4 Пайплайн лида
`POST /api/leads` → zod → Turnstile verify → insert `leads` + `lead_events(created)` → в `after()` (Next 15+): Telegram `sendMessage` в чат Миши (HTML: услуга, район, количество, время, сумма калькулятора, локаль; inline-кнопки «WhatsApp клиенту» (wa.me на номер клиента с заготовкой ответа на его языке) и «Открыть в админке»), письмо через Resend на адрес компании, авто-ответ клиенту на его языке (если есть email). Каждая доставка пишется в `lead_events` (ok/error) — в админке видно, что ушло. Повтор при ошибке Telegram — одна попытка через 30 с.

---

## 8. Прайс по умолчанию (AED, стартовые гипотезы, правятся в админке)

| Услуга | Единица | Цена | Примечание |
|---|---|---|---|
| Чистка сплита, 1 блок | блок | 199 | выезд включён |
| Чистка сплита, 2–3 блока | блок | 169 | |
| Чистка сплита, 4+ блоков | блок | 149 | |
| Глубокая чистка, 1 блок | блок | 399 | разборка внутреннего блока |
| Глубокая чистка, 2+ | блок | 349 | |
| Обслуживание FCU / канальные (вилла, башня) | FCU | 249 | мин. 2 FCU |
| Срочный выезд + диагностика | визит | 149 | засчитывается в ремонт того же визита |
| Ремонт (работа) | от | 199 | + запчасти по смете, 90 дн. гарантия |
| Поиск утечки (азотная опрессовка) | блок | 249 | |
| Заправка после устранения утечки | от | 349 | по типу фреона и объёму |
| Диван | место | 49 | мин. 3 места |
| Кресло | шт | 69 | |
| Матрас single / double / king | шт | 149 / 199 / 249 | |
| Ковёр | м² | 25 | мин. 150 |
| Пятна и запах, обработка | предмет | 79 | допродажа |
| Пакет «Fresh Home»: 3 блока + 3-местный диван | пакет | 599 | вместо 654 |
| Контракт Essential: до 3 блоков, 3 визита/год, приоритет, −10% на ремонт | год | 899 | |
| Контракт Comfort: до 5 блоков, 3 визита, одна глубокая чистка включена | год | 1 499 | |
| Контракт Villa: до 8 FCU/блоков, 3 визита, приоритет 24 ч | год | 2 499 | |

Правила: цены без VAT до регистрации плательщика (переключатель); округление до 1 AED; формат — EN «AED 199», AR «199 د.إ» латинскими цифрами (`ar-AE-u-nu-latn`), RU «199 AED».

---

## 9. Многоязычность и RTL

1. **next-intl v4**: `lib/i18n/routing.ts` (locales `['en','ar','ru']`, defaultLocale `en`, `localePrefix: 'always'`, `alternateLinks: false`), `lib/i18n/navigation.ts` (`Link`, `useRouter`, `redirect`, `getPathname`), `lib/i18n/request.ts` (локаль из `next/root-params`), `proxy.ts` в корне (Next 16, Node runtime). В server actions и route handlers `next/root-params` недоступен — локаль передаётся явно: `getTranslations({ locale, namespace })`. UI-строки (кнопки, формы, ошибки) — `messages/{en,ar,ru}.json`. Контент — в БД как локализованные поля.
2. **Локализованные поля**: тип `I18nText = { en: string; ar?: string; ru?: string }` в JSONB; на чтении fallback на EN с пометкой в админке «нет перевода». Валидация zod.
3. **RTL**: `<html lang dir>` из локали; только логические CSS-свойства (`ms-/me-/ps-/pe-`, `text-start`), в Tailwind v4 они есть; направленные иконки (стрелки, шевроны) зеркалятся через `rtl:-scale-x-100`; телефоны, цены, email, URL — в `<span dir="ltr">`; слайдер до/после и карусели учитывают направление; тестовый экран в Storybook-подобной странице `/admin/dev/rtl` (только dev) не нужен — проверяем Playwright-скриншотами.
4. **Шрифты**: IBM Plex Sans (latin + cyrillic) для EN/RU, IBM Plex Sans Arabic для AR, через `next/font/google` с `subsets` по локали, `display: swap`; размеры арабского на 5–10% крупнее на тех же токенах (переменная `--font-scale`).
5. **Числа и даты**: `Intl.NumberFormat` с `nu-latn` для AR; часы работы — `Intl.DateTimeFormat`; дни недели Дубая Пн–Вс, выходные Сб–Вс — просто текст в settings по локалям.
6. **hreflang**: `generateMetadata` → `alternates: { canonical, languages: { en, ar, ru, 'x-default': en } }` на каждой странице; `sitemap.ts` отдаёт все локали с `alternates`.
7. **Переключатель языка**: в хедере, сохраняет текущий путь (slug общий), cookie `NEXT_LOCALE` ставит прокси next-intl сам (сессионная, sameSite=lax); подписи на родных языках: English · العربية · Русский.
8. **Арабский копирайт**: Opus пишет AR-черновик по EN; в плане запуска — ревью носителем (Upwork/Fiverr, ~$50–100) до публикации AR-версии. До ревью AR можно держать в `noindex` (флаг в settings) — чтобы не индексировать слабый текст.

---

## 10. Админка («на высшем уровне»)

**Принципы**: Миша будет пользоваться с телефона — всё адаптивно; действия в 1–2 клика; автосохранение черновиков форм; оптимистичные обновления с undo-тостом; ясные пустые состояния; скелетоны; поиск везде, где список; никакого «технического» языка (slug показываем, но с подсказкой). UI на русском по умолчанию, EN по переключателю (строки через next-intl, локаль админки в cookie). Тема — светлая (тёмная не в v1).

**Доступ**: Auth.js v5, Credentials (email + пароль, argon2id), сессия в JWT-cookie (httpOnly, 7 дней), лимит попыток входа (5/15 мин), сброс пароля по ссылке через Resend. Роли: `owner` (всё, пользователи, настройки), `staff` (лиды, контент; без настроек и пользователей). Сид: Миша (owner), Максим (owner). Middleware закрывает `/admin` и `/api/admin`.

**Модули:**

| Модуль | Что внутри |
|---|---|
| Дашборд | Лиды за сегодня/неделю, график по дням (14 дней), по источнику (форма / калькулятор / waitlist / контракт), клики WhatsApp по страницам, последние 5 заявок, «нужно внимание»: новые > 2 ч без контакта, непереведённые поля, услуги без фото. |
| Заявки (inbox) | Список с фильтрами (статус, услуга, район, дата, локаль), поиск по имени/телефону; карточка: контакт (кнопки WhatsApp с заготовкой ответа на языке клиента, tel:, email), что хотел (услуги, количество, снимок калькулятора с суммой), район, время, комментарий; статусы `new → contacted → scheduled → done / lost / spam` (кнопки, не выпадашка), заметки, таймлайн доставок (Telegram ok/err, email ok/err) с кнопкой «отправить повторно»; массовые действия (спам, статус); экспорт CSV. Канбан по статусам как второй вид. Напоминание «следующая чистка»: поле `next_service_due` у done-лида + вкладка «Напомнить на этой неделе» (ручная рассылка через WhatsApp по кнопке; автоматизация — фаза 2). |
| Услуги | Список с drag-and-drop порядком, статус (активна / скоро / партнёр / скрыта), редактор: три колонки локалей side-by-side (EN слева как источник), индикаторы «нет перевода», кнопка «Перевести с EN → AR, RU» (AI, см. ниже), rich-text (Tiptap) для описания, чеклисты «входит/не входит», FAQ услуги, фото, SEO-поля, предпросмотр в новой вкладке (`?preview=1` с draft-режимом). |
| Цены и пакеты | Табличное инлайн-редактирование price_items (цена, минимум, единица, примечание), пакеты и контракты, живой предпросмотр калькулятора прямо в модуле, переключатель VAT. Валидация: цена > 0, минимум ≥ 1. |
| Районы | Список, избранные на главной, интро по локалям, «время приезда», FAQ района, публикация/черновик. |
| FAQ | Глобальные, по услугам, по районам, по контрактам; порядок drag-and-drop. |
| Отзывы | Ручное добавление (автор, источник Google/WhatsApp/другое, оценка, дата, текст на языке оригинала + переводы через AI, услуга/район), публикация. Без подделок: поле «источник» обязательно, скриншот-подтверждение в media (не публикуется). |
| Медиа | Загрузка в Vercel Blob (drag-and-drop, сжатие на клиенте до 2000px, EXIF-очистка), типы: до/после (создание пары), галерея, hero, команда; alt-текст по локалям (AI подсказка); привязка к услуге/району; замена заглушек с пометкой «placeholder». |
| Страницы | Контент-блоки главной, «О нас», гарантия, контакты, privacy, terms — rich-text по локалям с версионированием (последние 10 версий, откат). |
| Настройки | Бренд (название по локалям, лого SVG), контакты (телефон, WhatsApp, Telegram, email), часы (обычные/срочные), юр. данные (компания, лицензия, TRN, адрес), зона обслуживания, время ответа, VAT, уведомления (Telegram chat id + «тест», email получателей + «тест»), флаги (AR noindex, показывать отзывы, срочный вызов включён), аналитика (ID GA4/Meta — включают баннер согласия). |
| Пользователи | Список, приглашение по email, роль, сброс пароля, деактивация. |
| Журнал | Кто что менял (entity, поле, старое → новое), последние 90 дней. |

**AI-помощник в админке** (сервер, ключ в env): перевод EN → AR/RU с сохранением HTML-разметки и терминов (глоссарий в settings: «split AC» = «сплит-система», и т.д.), улучшение текста («короче», «проще», «дружелюбнее»), генерация alt-текстов. Реализация по skill `claude-api`: SDK `@anthropic-ai/sdk`, модель `claude-opus-5-5` (дефолт по правилам skill; Максим может переключить на `claude-haiku-5-5` через env `AI_MODEL` — для коротких переводов это в 40 раз дешевле), structured outputs через `output_config.format` с zod-схемой `{ar: string, ru: string}`, `output_config.effort: 'low'`, `fallbacks: 'default'` с beta-заголовком `server-side-fallback-2026-07-01`, таймаут 60 с, результат показывается как diff и применяется только по подтверждению. Стоимость на объёме сайта — единицы долларов.

**Публикация**: сохранение = запись в БД + `updateTag('content')` и точечные `updateTag('service:{slug}')`/`updateTag('area:{slug}')` в server action (read-your-own-writes); запросы публичных страниц — `'use cache'` + `cacheLife('max')` + `cacheTag`; экспорт `revalidate` с Cache Components запрещён — статический shell живёт в ISR Vercel до инвалидации тега; предпросмотр черновика через `draftMode()`.

---

## 11. Схема данных (Drizzle + Neon Postgres)

```
users(id, email uniq, password_hash, name, role enum(owner,staff), active, last_login_at, created_at)
settings(id=1, brand_name i18n, logo_svg, phone, whatsapp, telegram, email, hours i18n, emergency_hours i18n,
         legal_name, license_no, trn, address i18n, service_area_note i18n, response_time_note i18n,
         vat_included bool, vat_registered bool, telegram_chat_id, notify_emails text[], flags jsonb,
         glossary jsonb, analytics jsonb, updated_at)
services(id, slug uniq, category enum(ac,upholstery,coming_soon), status enum(active,coming_soon,partner,hidden),
         sort, name i18n, short i18n, description_html i18n, includes i18n[], excludes i18n[], symptoms i18n[],
         visit_steps i18n[], duration_min, price_from numeric, pricing_unit enum, available_from date,
         seo_title i18n, seo_description i18n, hero_media_id, published, updated_at)
price_items(id, service_id, name i18n, unit enum(unit,fcu,visit,seat,item,sqm,from), price numeric,
            min_qty int, tier_from_qty int, note i18n, sort, active)
packages(id, type enum(bundle,annual), slug, name i18n, description i18n, price numeric, compare_price numeric,
         includes jsonb, highlighted bool, sort, published)
areas(id, slug uniq, name i18n, intro_html i18n, eta_minutes, featured bool, sort, seo_title i18n,
      seo_description i18n, published)
faqs(id, scope enum(global,service,area,contracts), service_id?, area_id?, question i18n, answer_html i18n, sort, published)
reviews(id, author_name, source enum(google,whatsapp,other), source_url?, rating 1..5, date, original_locale,
        text i18n, service_id?, area_id?, proof_media_id?, published)
media(id, blob_url, blob_pathname, kind enum(before_after,gallery,hero,team,proof), pair_id?, pair_role enum(before,after)?,
      alt i18n, width, height, bytes, service_id?, area_id?, is_placeholder bool, created_at)
content_blocks(id, key uniq, kind enum(text,html,json), value i18n, updated_by, updated_at)
content_versions(id, entity, entity_id, snapshot jsonb, created_by, created_at)
leads(id, created_at, locale, type enum(callback,quote,contract,waitlist), status enum(new,contacted,scheduled,done,lost,spam),
      name, phone_e164, email?, property_type enum(apartment,villa,office)?, area_id?, area_text?,
      service_slugs text[], units_count?, preferred_time?, message?, quote_snapshot jsonb?, page_path, utm jsonb,
      consent_marketing bool, ip_hash, user_agent, assigned_to?, next_service_due date?, updated_at)
lead_notes(id, lead_id, user_id, text, created_at)
lead_events(id, lead_id, type enum(created,status_changed,telegram_sent,telegram_failed,email_sent,email_failed,
            autoreply_sent,note_added,reminder_sent), payload jsonb, created_at)
track_events(id, type enum(wa_click,tel_click,calc_quote,form_start), page_path, locale, service_slug?, created_at)  -- без PII
rate_limits(key, window_start, count)
audit_log(id, user_id, entity, entity_id, action, diff jsonb, created_at)
```

Индексы: `leads(status, created_at desc)`, `leads(phone_e164)`, `track_events(created_at)`, уникальность slug. Миграции — `drizzle-kit generate` в репо, применяются в билде (как в daylik: `scripts/migrate-if-db.mjs`) через `DATABASE_URL_UNPOOLED`; Preview-деплои обязаны получать свою Neon-ветку (интеграция Neon ↔ Vercel), иначе превью-сборка мигрирует продакшен. Сид — `scripts/seed.ts` из `content/seed/*.json` (стартовый контент на трёх языках, цены из §8, районы, FAQ).

---

## 12. SEO

1. `generateMetadata` на каждой странице из полей БД (title ≤ 60 симв., description ≤ 155), шаблон «{Page} | {Brand} Dubai».
2. JSON-LD: `HVACBusiness` (подтип LocalBusiness) в layout с адресом, телефоном, `areaServed` (районы), `openingHoursSpecification`, `priceRange`; `Service` на страницах услуг с `offers` (цена «от», валюта AED); `FAQPage` где есть FAQ; `BreadcrumbList`. `AggregateRating` не ставим (Google не показывает self-serving отзывы, риск санкций).
3. `sitemap.ts` — все опубликованные страницы × 3 локали с `alternates`; `robots.ts` — закрыть `/admin`, `/api`, `?preview`.
4. OG-изображения через `opengraph-image.tsx` на локаль и страницу (бренд, заголовок на языке локали, арабский шрифт в генераторе).
5. Производительность: бюджет Lighthouse mobile ≥ 90 по всем категориям, LCP < 2.5 с, CLS < 0.1, JS на маркетинговых страницах < 120 КБ gz (калькулятор и форма — единственные клиентские островки), изображения через `next/image` (AVIF/WebP, `sizes` заданы), шрифты subset.
6. Внутренняя перелинковка: услуга ↔ районы ↔ контракты; хлебные крошки; футерные ссылки на все услуги.
7. Чеклист запуска: Google Search Console (3 локали = один домен), Google Business Profile (критично для «ac cleaning near me»), Bing Webmaster, карта сайта отправлена, Яндекс не нужен.

---

## 13. Техстек и инфраструктура

| Слой | Выбор | Почему |
|---|---|---|
| Фреймворк | Next.js 16.4, App Router, TypeScript strict, React 19.3, Cache Components | актуальная стабильная; Vercel-native |
| Стили | Tailwind CSS v4.3 (`@tailwindcss/postcss`) + shadcn/ui 4.23 (base radix, radix-nova, `rtl: true`; дефолт shadcn теперь Base UI — Radix выбираем явно) | логические свойства для RTL, быстрые формы и таблицы в админке |
| i18n | next-intl v4.14 (`next/root-params`) | стандарт для App Router, RTL-дружелюбен |
| БД | Neon Postgres (Frankfurt) + Drizzle ORM 0.45 (1.0 пока rc), драйвер `pg` Pool + `attachDatabasePool` | тот же стек, что в daylik — знакомые паттерны, бесплатного тарифа хватит на годы |
| Функции | Vercel, регион `fra1` | колокация с БД важнее близости к пользователю: публичные страницы отдаёт CDN, а функции ходят в БД несколько раз за запрос |
| Файлы | Vercel Blob | входит в Pro, простая интеграция |
| Auth | Auth.js v5 (Credentials) + argon2 | без внешнего провайдера, 2–3 пользователя; Auth.js v5 всё ещё beta и в режиме поддержки — предложение перейти на Better Auth в `docs/DECISIONS.md`, решение до фазы 5a |
| Email | Resend (бесплатный тариф: 3 000 писем/мес, 1 домен) | уведомления, авто-ответы, сброс пароля |
| Уведомления | Telegram Bot API (fetch, без библиотек) | мгновенно и бесплатно |
| Антиспам | Cloudflare Turnstile + honeypot + лимит в БД | бесплатно, без Redis |
| AI в админке | `@anthropic-ai/sdk`, `claude-opus-5-5` (env-переключатель на haiku) | перевод/копирайт, см. §10 |
| Rich text | Tiptap (минимальный набор: заголовки, списки, ссылки, жирный) | HTML в БД, санитизация `sanitize-html` на выходе |
| Валидация | zod (общие схемы клиент/сервер) | |
| Тесты | Vitest (pricing, whatsapp link, i18n fallback, формат чисел), Playwright 1.63 (закреплён под браузер контейнера; e2e в 3 локалях + скриншоты RTL), axe-core в Playwright | |
| CI | GitHub Actions: typecheck, lint, unit, build на PR; Vercel preview на каждый PR | |
| Аналитика | Vercel Web Analytics (без cookies) + свои `track_events`; GA4/Meta Pixel — опционально за баннером согласия | PDPL-консервативно |
| Мониторинг | Vercel logs; Telegram-алерт при ошибке доставки лида (уже в пайплайне) | минимум |

**Переменные окружения** (`.env.example` в репо):
`DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (миграции), `AUTH_SECRET`, `AUTH_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM`, `TELEGRAM_BOT_TOKEN`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `AI_MODEL` (default `claude-opus-5-5`), `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, `IP_HASH_SALT`. Telegram chat id, WhatsApp и контакты — в БД (settings), не в env.

**Стоимость в месяц**: Vercel Pro $20, Neon $0 (free), Resend $0, Turnstile $0, Blob в Pro, домен ~$12/год (.com) и/или .ae ~AED 100–150/год, Anthropic API ≈ $1–3, ревью AR-текста одноразово $50–100. Итого ≈ $22/мес + разовые. Платит Миша картой ОАЭ (роль Billing у Vercel); российские карты эти сервисы не принимают.

---

## 14. Структура репо (один Next-проект, не монорепо)

```
nasim-site/
  app/
    [locale]/
      layout.tsx                 # КОРНЕВОЙ layout: html lang/dir, шрифты по локали, header/footer, JSON-LD LocalBusiness
      page.tsx                   # главная
      services/page.tsx  services/[slug]/page.tsx
      pricing/page.tsx  annual-contracts/page.tsx
      areas/page.tsx  areas/[slug]/page.tsx
      about/page.tsx  contact/page.tsx  privacy/page.tsx  terms/page.tsx  thank-you/page.tsx
      opengraph-image.tsx  not-found.tsx  [...rest]/page.tsx
    not-found.tsx                # глобальный 404 со своим <html> (app/layout.tsx нет)
    admin/
      layout.tsx  (корневой layout админки с <html>; auth guard, shell)  page.tsx (дашборд)
      leads/  services/  pricing/  areas/  faqs/  reviews/  media/  pages/  settings/  users/  audit/
      login/page.tsx
    api/
      leads/route.ts  track/route.ts  auth/[...nextauth]/route.ts
      admin/ (upload, ai/translate, revalidate, export)
    sitemap.ts  robots.ts
  components/
    marketing/ (Hero, ServiceCard, QuoteCalculator, LeadForm, BeforeAfter, FaqAccordion, StickyBar, LangSwitcher…)
    admin/     (DataTable, I18nFields, RichEditor, MediaPicker, StatusPills, LeadDrawer…)
    ui/        (shadcn)
  lib/
    db/ (client.ts, schema.ts, queries/*.ts с cache tags)
    i18n/ (routing.ts, navigation.ts, request.ts, format.ts, text.ts)
    pricing.ts  whatsapp.ts  telegram.ts  email.ts  ai.ts  auth.ts  ratelimit.ts  seo.ts  sanitize.ts
    validation/ (zod-схемы лидов, контента)
  messages/ en.json ar.json ru.json        # UI-строки
  content/seed/ services.json areas.json faqs.json blocks.json prices.json
  drizzle/ (миграции)
  scripts/ seed.ts migrate-if-db.mjs
  tests/ unit/ e2e/
  public/ (favicon, logo.svg, og-fallback)
  docs/ BRIEF.md (этот план) DECISIONS.md INFRASTRUCTURE.md RUNBOOK.md (операции: деплой, бэкап, добавить пользователя)
  CLAUDE.md  AGENTS.md  .env.example  proxy.ts  next.config.ts  drizzle.config.ts  vercel.json
```

---

## 15. Дизайн-направление

1. **Настроение**: прохлада и чистота без «больничности»; Дубай без клише (никаких золотых куполов). Много воздуха, крупная типографика, фотографии техников за работой крупнее, чем иконки.
2. **Палитра (токены в `:root`)**: фон `--bg: #F7F4EF` (тёплый песок — отличает от белых конкурентов), поверхность `#FFFFFF`, текст `#121A1F`, основной `--primary: #0E3B47` (глубокий сине-зелёный), акцент `--accent: #19B3A6` (прохладная бирюза для выделений и иконок), CTA WhatsApp — фирменный `#25D366` только для WA-кнопок, предупреждение `#D97706`, ошибка `#C2410C`. Контраст ≥ 4.5:1 проверяется axe.
3. **Типографика**: IBM Plex Sans / IBM Plex Sans Arabic; шкала через `clamp()`: h1 36–56px, h2 28–40, body 17–18, small 14; межстрочный 1.5; заголовки на AR без «жирного» 700 — 600.
4. **Компоненты**: карточка услуги с ценой «от» и временем; плашка «цена фиксирована»; мокап WhatsApp-отчёта; слайдер до/после с ручкой; пилюли районов; аккордеон FAQ; таблица цен с липкой первой колонкой на мобильном; липкая нижняя панель на мобильных; формы с крупными полями (44px+), маска телефона.
5. **Мобильный первым**: макеты от 360px; хедер сворачивается в бургер + WA-иконка; калькулятор — пошаговый, одна группа на экран.
6. **Иллюстрации/фото на старте**: 8–10 сгенерированных изображений (у Максима есть Higgsfield) по брифу: техник в фирменной футболке у открытого внутреннего блока, фургон у виллы, чистый радиатор крупно, химчистка дивана; реалистичный свет, без улыбающихся стоковых лиц в камеру. Все помечаются `is_placeholder` и заменяются Мишей.
7. **Доступность**: фокус-кольца, aria на аккордеонах/слайдере, формы с подписями, `prefers-reduced-motion`.
8. **Без тёмной темы в v1** (экономим QA на RTL × тема).

---

## 16. Юридическое и соответствие

1. Privacy Policy (PDPL): какие данные (имя, телефон, email, район, сообщение, технические), зачем (обработка заявки, уведомления), где хранятся (Neon, Франкфурт, ЕС), кому передаём (Vercel, Resend, Telegram, Cloudflare Turnstile, Anthropic — только тексты сайта, не данные клиентов), срок хранения (лиды 24 мес., затем анонимизация), права (доступ/удаление по email), контакт. Opus пишет черновик на EN, переводы; юрист не обязателен для старта, но отметить Мише.
2. Terms: что входит в услугу, гарантия, отмена/перенос (бесплатно за 4 ч), ответственность за старые/повреждённые блоки, оплата (наличные/карта/перевод — из анкеты).
3. Согласия: чекбокс маркетинга отдельный, не предотмеченный; баннер cookies появляется только если включены GA4/Meta (флаг в settings); Vercel Analytics без cookies.
4. Футер: юр. название, номер лицензии DED/free zone, TRN (если есть), адрес — показываются только когда заполнены.
5. Хранение телефонов — как есть (нужны для работы); IP — только хэш с солью.

---

## 17. Этапы сборки для Opus 5.5 (одна фаза = одна сессия)

Каждая фаза заканчивается: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` зелёные, Vercel preview открывается, запись в `docs/DECISIONS.md`.

**Фаза 0 — Каркас (0.5 дня).** Репо `nasim-site` у Максима, `pnpm create next-app` (TS, App Router, Tailwind v4, src — нет), shadcn init, next-intl с 3 локалями и пустыми страницами, ESLint/Prettier, Vitest, Playwright, GitHub Actions CI, `CLAUDE.md` (правила: логические CSS-свойства, i18n-поля, запрет хардкода текста, схема коммитов), Vercel-проект подключён, env заведены, Neon создан (Frankfurt), Drizzle подключён, пустая миграция применяется в билде. DoD: три локали открываются, `dir="rtl"` на AR, CI зелёный.

**Фаза 1 — Дизайн-система и оболочка (1 день).** Токены, шрифты по локалям, Header/Footer/LangSwitcher/StickyBar, типографика, базовые компоненты (Button, Card, Pill, Accordion, Table, Input с маской), страница `/[locale]/dev/ui` (только dev) со всеми компонентами в LTR и RTL. DoD: Playwright-скриншоты EN и AR без визуальных поломок, axe без критических ошибок.

**Фаза 2 — Данные и сид (1 день).** Полная схема §11, миграции, запросы с cache tags, `scripts/seed.ts`, стартовый контент EN (Opus пишет по §4–8), AR и RU черновики, цены §8, 10 районов, 6 глобальных FAQ + по 3 на услугу. DoD: сид идемпотентен, `pnpm seed` на пустой базе даёт рабочий сайт.

**Фаза 3 — Публичные страницы (2 дня).** Все страницы §5–6, JSON-LD, sitemap/robots, OG-изображения, hreflang, 404. DoD: Lighthouse mobile ≥ 90 на главной и странице услуги в 3 локалях; все ссылки работают (Playwright обходит sitemap).

**Фаза 4 — Конверсия (1 день).** WhatsApp-билдер, калькулятор с тестами на `pricing.ts`, форма + `/api/leads` + Turnstile + лимиты, Telegram и Resend, авто-ответ, страница «спасибо», `/api/track`. DoD: e2e-тест отправляет лид на preview → запись в БД, сообщение в тестовый Telegram-чат, письмо в Resend sandbox.

**Фаза 5 — Админка (3–4 дня, можно разбить на 5a контент / 5b лиды+настройки).** Auth, shell, дашборд, inbox, все модули §10, медиа в Blob, AI-перевод, версии, аудит, revalidate. DoD: сценарий «Миша меняет цену → сайт обновился за ≤ 10 с», «лид пришёл → виден в inbox с кнопкой WhatsApp», e2e на вход/роль/публикацию.

**Фаза 6 — Запуск (1 день).** Домен и DNS, Resend-домен (SPF/DKIM), Turnstile на боевой домен, Telegram-чат Миши, пользователи, финальный контент от Миши по анкете §18, замена заглушек где есть фото, AR на ревью носителю (до ревью AR `noindex`), Search Console + Business Profile, бэкап-политика (Neon PITR 7 дней на free), `docs/RUNBOOK.md`. DoD: прод открывается на 3 языках, тестовый лид прошёл весь путь, Lighthouse на проде ≥ 90.

Ориентир: 9–11 рабочих дней работы Opus с ревью Максима. Fable подключать: ревью архитектуры после фазы 2, ревью AR/RU копирайта после фазы 3, аудит админки после фазы 5.

---

## 18. Анкета для Миши (нужно до фазы 6, часть — до фазы 2)

1. Юр. лицо: зарегистрировано? Название, тип лицензии (mainland DED / free zone), номер лицензии, ожидаемая дата, TRN (VAT) есть или нет.
2. Контакты для сайта: рабочий номер WhatsApp (+971…), телефон для звонков (тот же?), email компании (на домене — заведём), Telegram для уведомлений (username, добавить бота).
3. Зона: только Дубай? Шарджа/Абу-Даби? Какие районы в приоритете (из списка §5 отметить, добавить свои).
4. Часы: обычные и для срочных вызовов; работаете ли в пятницу/воскресенье; «same-day» реально?
5. Команда и техника: сколько техников и фургонов на старте, страховка ответственности есть?
6. Цены: подтвердить/исправить таблицу §8; минимальный заказ или плата за выезд; скидка за объём; оплата (наличные, карта на месте, перевод, Tabby?).
7. Гарантия: сроки на чистку и ремонт, условия; политика отмены/переноса.
8. Что именно входит в стандартную и глубокую чистку (его чеклист); какая химия (эко/безопасно для детей — важно для AR и семей); сколько длится визит на 1 блок.
9. Для AR-аудитории: кто отвечает арабоязычным клиентам (сотрудник/переводчик)? Если никто — на AR-версии честно: «пишите на английском или арабском, ответим на английском».
10. Партнёры: кому передаёте воздуховоды и плесень (название, лицензия) — упоминать ли их на сайте.
11. Фото: реальные фото работ, фургона, команды; разрешение на публикацию лиц.
12. Отзывы: есть ли первые клиенты, готовые дать отзыв; Google Business Profile создан?
13. Имя: Nasim / Barid / своё; есть ли предпочтения по цвету.
14. Контракты: подтверждение состава трёх тарифов; хочет ли «корпоративный» для офисов отдельно.
15. Канальные осушители и присмотр за домом: когда реально запускать, чтобы правильно поставить «скоро».

---

## 19. Риски и как закрываем

| Риск | Решение |
|---|---|
| Компания ещё не зарегистрирована — нечего писать в футер, нельзя обещать «licensed» | Поля лицензии пустые → плашки скрываются автоматически; запуск сайта возможен как «pre-launch» с листом ожидания |
| Машинный арабский в маркетинге отталкивает | Ревью носителем до снятия `noindex` с AR; глоссарий терминов в settings |
| «Цена заранее» ломается на ремонте | Явная модель: фиксированная цена на чистку; на ремонт — фиксированная диагностика + смета, диагностика засчитывается |
| Новый домен не ранжируется месяцами | Google Business Profile + отзывы с первых заказов + районные страницы; первые лиды — через WhatsApp-рассылку по знакомым и Facebook-группы экспатов, сайт как «витрина доверия» |
| Спам в форме | Turnstile + honeypot + лимиты; статус «спам» в inbox |
| Vercel Hobby заблокируют за коммерцию | Сразу Pro |
| Админка раздувает сроки | Фаза 5 разбивается на 5a/5b; дашборд и канбан — в конце, inbox и редактор услуг — первыми |
| Опечатки/несогласованность трёх языков | Индикаторы «нет перевода», AI-перевод с diff, предпросмотр по локали перед публикацией |
| Аккаунты на гражданине РФ, провайдер «перестрахуется» | Платёжный метод и домен — у Миши; план выхода — перенос Vercel-проекта в команду Миши без даунтайма (env, домены, git-связь переезжают; интеграции и Blob — отдельно), см. `docs/INFRASTRUCTURE.md` |
| Anthropic API не обслуживает Россию | Аккаунт и ключ — на Мише, вызовы только с сервера (fra1) |
| Разработчик в РФ: троттлинг Cloudflare, блокировки кастомных доменов Vercel, WhatsApp | VPN для дашбордов; превью `*.vercel.app` обычно открываются; проверка WhatsApp-ссылок — через Мишу или VPN |

---

## 20. Не в v1 (фаза 2, по результатам первых лидов)

Онлайн-запись со слотами и календарём; онлайн-оплата (Stripe UAE / Ziina / Tabby); личный кабинет клиента с историей обслуживания («паспорт кондиционера»); автоматические напоминания через WhatsApp Business API; блог; остальные районы и Шарджа; импорт отзывов из Google; страница канальных осушителей как услуга; чистка резервуаров (июль 2027); тёмная тема; подключение CRM.

---

## 21. Верификация плана целиком (как проверяем результат Opus)

1. `pnpm typecheck`, `pnpm lint`, `pnpm test` (unit: pricing, whatsapp, i18n fallback, number format), `pnpm build` — зелёные локально и в CI.
2. Playwright e2e на preview: открыть главную в 3 локалях; переключить язык с сохранением страницы; пройти калькулятор до суммы; отправить форму (с тестовым ключом Turnstile) → лид в БД → событие Telegram в тестовый чат; вход в админку, смена цены → проверка на сайте через ≤ 10 с; загрузка медиа; AI-перевод поля.
3. Скриншотные тесты EN vs AR на главной, услуге, калькуляторе, админ-inbox (на мобильной ширине 390px и десктопе 1280px).
4. Lighthouse CI (mobile) ≥ 90 performance/accessibility/best-practices/SEO на 4 страницах × 3 локали.
5. axe-core без критических нарушений.
6. Проверка hreflang/sitemap валидатором; Rich Results Test для `Service`, `FAQPage`, `LocalBusiness`.
7. Ручной прогон Максима по чеклисту из `docs/RUNBOOK.md` перед передачей Мише.

---

## 22. Состав пакета передачи

1. Собираю из этого плана пакет для передачи Opus и Мише в scratchpad и отправляю файлами:
   `BRIEF.md` (этот план в финальном виде), `CLAUDE.md` для нового репо (правила кода и i18n/RTL, стек, команды), `PHASES.md` (готовые промпты-задания для Opus по фазам 0–6 с DoD), `MISHA-QUESTIONNAIRE.md` (анкета §18 — отдельно, чтобы переслать Мише), `content/seed/*.json` (стартовые услуги, цены, районы, FAQ на EN с полями под AR/RU) и `design-tokens.css`.
2. Публикую анкету для Миши как артефакт-страницу, чтобы Максим переслал ссылку.
3. Репо `nasim-site` создаёт Максим (у сессии нет права создавать репозитории), после чего Opus начинает с фазы 0 по `PHASES.md`.
