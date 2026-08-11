# Вариант БЕЗ хостинга: Supabase Edge Functions

Если не хочешь разворачивать отдельный сервер (`api-auth/`) — этот вариант.
Все функции деployятся прямо на твой существующий Supabase-проект
(бесплатный тариф), то есть **отдельный хостинг не нужен**.

## Что тут лежит

- `functions/auth-login/` — `POST /auth/login` (проверка никла + bcrypt-пароля, HWID-бан, бан аккаунта)
- `functions/hwid-check/` — `POST /hwid/check` (бан железа при старте)

Функции подключаются к твоей базе __через service-role__ (читают таблицы напрямую).

## Требуется Supabase CLI

```bash
npm install -g supabase
supabase login
```

## 1. Создай таблицы в базе (SQL Editor в дашборде)

```sql
create table if not exists users (
  id serial primary key,
  nickname text unique not null,
  password_hash text not null,   -- bcrypt-хэш пароля с сайта
  banned boolean not null default false,
  ban_reason text
);

create table if not exists hwid_bans (
  id serial primary key,
  hwid text unique not null,
  reason text
);
```

Если таблицы у тебя уже есть и называются иначе — поправь переменные окружения
ниже (см. шаг 3), названия колонок полностью настраиваются.

## 2. Подключи папку и задеплой

Из папки проекта launcher (там, где лежит `supabase/`):

```bash
supabase link --project-ref <project-ref>
supabase functions deploy auth-login --no-verify-jwt
supabase functions deploy hwid-check --no-verify-jwt
```

`--no-verify-jwt` — чтобы функции были публичными (лаунчер не шлёт token/JWT).

## 3. Задай переменные окружения (secrets)

Секреты можно задать в дашборде: **Project Settings → Edge Functions → Secrets**
(при ручном деплое они задаются через `supabase secrets set`).

| Переменная | Значение | Описание |
| --- | --- | --- |
| `SUPABASE_URL` | автоматически | адрес проекта |
| `SUPABASE_SERVICE_ROLE_KEY` | вручную | Project Settings → API → `service_role` (секрет!) |
| `USERS_TABLE` | `users` | таблица пользователей |
| `NICKNAME_COLUMN` | `nickname` | колонка логина |
| `PASSWORD_COLUMN` | `password_hash` | колонка bcrypt-хэша |
| `BANNED_COLUMN` | `banned` | колонка «забанен» |
| `BAN_REASON_COLUMN` | `ban_reason` | причина бана аккаунта |
| `HWID_BANS_TABLE` | `hwid_bans` | таблица банов железа |
| `HWID_COLUMN` | `hwid` | колонка HWID |
| `HWID_REASON_COLUMN` | `reason` | причина бана железа |

## 4. Укажи адрес в лаунчере

Edge Functions живут по адресу:

```
https://<project-ref>.functions.supabase.co/auth-login
https://<project-ref>.functions.supabase.co/hwid-check
```

В `launcher.config.json` свойство `apiBaseUrl` = `https://<project-ref>.functions.supabase.co`,
а `authLoginPath`/`authHwidCheckPath` оставь как `/auth/login` и `/hwid/check` —
лаунчер сам подставит их.

```json
{
  "apiBaseUrl": "https://<project-ref>.functions.supabase.co",
  "authLoginPath": "/auth/login",
  "authHwidCheckPath": "/hwid/check"
}
```

`devAuthBypass` должен быть `false`.

## Проверка

```bash
curl -X POST https://<project-ref>.functions.supabase.co/auth-login ^
  -H "Content-Type: application/json" ^
  -d "{\"nickname\":\"testplayer\",\"password\":\"secret\",\"hwid\":\"abc\"}"
```

## Важно

- `service_role` — это суперключ к твоей базе. Он хранится **только в секретах Supabase**,
  никуда не выкладывай и не клади в файлы лаунчера.
- Пароли не хранятся в лаунчере, по wire — HTTPS.
- Если используешь `auth.users` (стандартные регистрации Supabase) — колонки
  называются по-другому: `username`/`email`, `encrypted_password`, `banned` обычно нет.
  Поменяй переменные окружения соответственно, либо создай таблицу `users` и дублируй
  в неё регистрации с сайта при помощи триггера/события.