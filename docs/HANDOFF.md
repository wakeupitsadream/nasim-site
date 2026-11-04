# nasim-site — пакет передачи (04.11.2026)

Исторический документ: так пакет передавался в репо. Актуальное состояние — README.md в корне и `docs/DECISIONS.md`.

Что здесь и куда это положить в новый репо `nasim-site`:

| Файл | Куда в репо | Для кого |
|---|---|---|
| `CLAUDE.md` | корень | Opus — правила проекта, читает каждую сессию |
| `docs/BRIEF.md` | `docs/` | Opus и Максим — полный бриф (стек, страницы, админка, схема БД, дизайн) |
| `docs/PHASES.md` | `docs/` | Максим — готовые промпты по фазам 0–6, вставлять первым сообщением сессии |
| `docs/MISHA-QUESTIONNAIRE.md` | `docs/` (ответы — в `docs/MISHA-ANSWERS.md`) | Миша — анкета; та же анкета опубликована как документ для пересылки |
| `content/seed/services.json` | `content/seed/` | сид: 12 услуг, EN + RU, AR пусто |
| `content/seed/prices.json` | `content/seed/` | сид: 17 позиций прайса, 4 пакета, правила расчёта |
| `content/seed/areas.json` | `content/seed/` | сид: 16 районов, 10 с интро |
| `content/seed/faqs.json` | `content/seed/` | сид: 19 FAQ (глобальные, по услугам, контракты) |
| `content/seed/blocks.json` | `content/seed/` | сид: тексты главной, гарантия, шаблоны WhatsApp (EN/AR/RU), дефолты настроек |
| `styles/design-tokens.css` | `styles/` | токены дизайна, подключать в `app/globals.css` |

Порядок запуска:
1. Репо `wakeupitsadream/nasim-site` создан (04.11.2026), пакет залит, фаза 0 выполнена в ветке `phase-0/scaffold`.
2. Vercel: Максим переводит свою команду на Pro (14-дневный trial), приглашает Мишу в роль Billing, Миша привязывает карту ОАЭ до конца trial. Neon — через Vercel Marketplace в той же команде, регион Frankfurt, preview-ветки включены. Подробно — `docs/INFRASTRUCTURE.md`.
3. Домен — в собственном аккаунте Миши (Cloudflare Registrar или Porkbun), регистрант Миша; Максим получает роль DNS.
4. Параллельно пересылает Мише анкету; ответы складывает в `docs/MISHA-ANSWERS.md` до фазы 6.

Пустые `ar` в сиде — осознанно: арабский черновик делает AI-перевод в админке (фаза 5a), затем ревью носителя перед снятием `noindex` с AR-версии.
