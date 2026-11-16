# RUNBOOK.md — эксплуатация

## Админка: подключение на продакшене

Админка (`/admin`) работает, только когда есть база и секрет. Без них сайт живёт как раньше — на контенте из `content/seed`, а страница входа отвечает «админка ещё не подключена». Как это устроено — DECISIONS №68.

1. **База.** Vercel → проект `nasim-site` → Storage → Neon (Marketplace), регион Frankfurt (`aws-eu-central-1`). Интеграция сама добавит `DATABASE_URL` (pooled) и `DATABASE_URL_UNPOOLED`. Preview-ветки базы включить до первого деплоя превью, иначе превью-сборка мигрирует и читает продакшен-базу (INFRASTRUCTURE §5).
2. **Переменные окружения** (Production, при желании и Preview):
   - `AUTH_SECRET` — случайная строка не короче 32 символов (`openssl rand -base64 48`). Короче — вход отключён. Смена секрета разлогинивает всех.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — первый владелец; пароль не короче 10 символов. Читаются один раз, пока в `admin_users` никого нет. После первого деплоя их можно удалить.
3. **Деплой.** `pnpm build` сам применяет миграции (`scripts/migrate-if-db.mjs`) и создаёт первого владельца (`scripts/admin-user.mjs --bootstrap`).
4. **Проверка.** `/admin` → вход → Цены: поменять любую цену на 1 дирхам, открыть `/en/pricing` — цена новая; вернуть обратно. Обзор показывает обе правки в журнале.

## Пользователи админки

Локально, с `DATABASE_URL_UNPOOLED` продакшен-базы в окружении (значение — в настройках проекта Vercel):

```
pnpm admin:user misha@example.com                  # создать владельца, пароль напечатается один раз
pnpm admin:user misha@example.com 'новый пароль'   # сменить пароль (он же — сброс забытого)
pnpm admin:user helper@example.com --role staff    # сотрудник: цены и услуги, без настроек
```

Отключить человека: `update admin_users set active = false where email = '…';` — действует со следующего запроса, сессия не спасает.

## Откат правки из админки

Правки лежат в `content_overrides` (вид, ключ, изменённые поля), история — в `audit_log` (`before` / `after`).

- Вернуть одну запись к сиду: `delete from content_overrides where kind = 'price_item' and key = 'ac_clean_1';`
- Вернуть всё к сиду: `delete from content_overrides;`

После ручной правки базы кеш страниц сам не сбросится: сохранить любую правку в том же разделе админки (она вызывает `updateTag`) или сделать редеплой.

## Локальная разработка с админкой

```
service postgresql start
# .env.local: DATABASE_URL, DATABASE_URL_UNPOOLED, AUTH_SECRET (32+ символа)
pnpm db:migrate
pnpm admin:user owner@brigada.test 'local-admin-password'
pnpm dev                       # http://localhost:3000/admin
E2E_ADMIN_EMAIL=owner@brigada.test E2E_ADMIN_PASSWORD=local-admin-password pnpm e2e admin
```
