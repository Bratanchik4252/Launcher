# Forge mod: Action Logger (1.12.2)

Логирует **полные действия игрока** в Forge 1.12.2:

- вход/выход в игру и смена измерения;
- открытие/закрытие любых GUI и контейнеров (сундук, верстак, печка и т.д.);
- **клики** по инвентарю и контейнерам (кнопка, слот, что в слоте);
- **подбор предметов** (`PICKUP`) и **выброс предметов** (`DROP`);
- **чат** (`CHAT`).

## Лог

Файл: `<папка игры>/config/ActionLogger/player_actions.log` (дописывается).

Пример строк:

```
2026-08-03 12:00:01.123  [Steve/xxx] LOGIN dim=0 x=100.0 y=64.0 z=-20.0
2026-08-03 12:00:05.456  [Steve/xxx] OPEN_GUI GuiChest dim=0 x=100.0 ...
2026-08-03 12:00:06.001  [Steve/xxx] CLICK LMB gui=GuiChest x=200 y=120 slot#13 inv=Сундук item=Булыжник x64 (minecraft:cobblestone)
2026-08-03 12:00:07.222  [Steve/xxx] PICKUP Кирка x1 (minecraft:diamond_pickaxe)
2026-08-03 12:00:09.999  [Steve/xxx] DROP Булыжник x64 (minecraft:cobblestone)
2026-08-03 12:00:10.111  [Steve/xxx] CHAT "привет всем"
```

## Настройка

`config/ActionLogger/player_actions.cfg` — включить/выключить каждое событие:

```
[general]
log_to_file = true
log_chat = true
log_gui_open = true
log_clicks = true
log_pickup = true
log_drop = true
log_container_open = true
log_dimension_change = true
```

## Сборка

Нужна Java 8 и Gradle (ForgeGradle 2.3).

```
gradle setupDecompWorkspace
gradle build
```

Готовый **actionlogger-1.0.0.jar** кладётся в папку `mods/` клиента.

## Структура

- `src/main/java/com/fivelauncher/actionlogger/`
  - `ActionLogger.java` — главный класс `@Mod`
  - `Settings.java` — конфиг
  - `Logger.java` — запись в файл
  - `Actions.java` — форматирование строк
  - `handler/PlayerHandler.java` — события игрока (чат, контейнеры, подбор/выброс)
  - `handler/GuiHandler.java` — GUI (только клиент)
  - `proxy/` — CommonProxy/ClientProxy

> Примечание: события, на которые вешает мод: `ServerChatEvent`,
> `PlayerContainerEvent.Open/Close`, `PlayerEvent.ItemPickupEvent`,
> `ItemTossEvent`, `GuiOpenEvent`, `GuiScreenEvent.MouseInputEvent.Post`,
> `PlayerEvent.PlayerLoggedIn/Out/ChangedDimension` (Forge 1.12.2 bus,
> `MinecraftForge.EVENT_BUS`).