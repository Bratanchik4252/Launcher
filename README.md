# NOVACRAFT Launcher (0.1.0)

Лаунчер Minecraft **1.7.10** (сборка с модами) для Windows: Electron + React + TypeScript, тёмная/светлая тема, RU/EN/DE/FR/ES/UK/PL.

## Запуск для теста

```bat
npm install
npm run dev
```

Или двойной клик по `run-dev.bat`.

## Сборка установщика (.exe)

```bat
npm run dist
```

Готовый файл: `release\NovaCraftLauncher-0.1.0-setup.exe`

## Настройка

Файл `launcher.config.json`:

| Поле | Что это |
| --- | --- |
| `supabaseUrl` / `supabaseAnonKey` | проект Supabase (те же аккаунты, что на сайте NOVACRAFT) |
| `modpack` | источник модпака: GitHub Releases (owner/repo/asset) + SHA-256 |
| `java` | JRE 8 от Adoptium (проверка по X-Checksum-SHA256) |
| `updater` | GitHub-репозиторий с релизами лаунчера |
| `defaultRamMb` | память по умолчанию |

Вставь свои `supabaseUrl` и `supabaseAnonKey` (Project Settings → API → URL / anon key).

## Безопасность

- Пароли не сохраняются; токен сессии — только в Windows DPAPI (safeStorage).
- Вход по нику ИЛИ email через Supabase Auth — те же аккаунты, что на сайте.
- Антибрутфорс: 5 неудачных попыток → блок 5 минут (`auth-attempts.json` в userData).
- Бан железа: `hwid_bans` в БД, проверка при старте и входе.
- Адрес игрового сервера не зашит в клиент: берётся из таблицы `launcher_meta` при запуске.
- Модпак скачивается с проверкой SHA-256 (частичное несоответствие → перекачка, mismatch → отказ).
- Никаких PowerShell-команд — распаковка через нативный `tar.exe`.

## Схема Supabase

`supabase/` — DDL для таблиц лаунчера (`launcher_meta`, `hwid_bans`): запустить в Supabase SQL Editor. RLS: `launcher_meta` только для авторизованных, `hwid_bans` — select для всех (без секретов).

## Данные

`%APPDATA%\novacraft-launcher\` — игра, Java, модпак, логи.
