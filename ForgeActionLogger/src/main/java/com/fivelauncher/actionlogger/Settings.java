package com.fivelauncher.actionlogger;

import java.io.File;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Settings {

    public static boolean LOG_CHAT = true;
    public static boolean LOG_GUI_OPEN = true;
    public static boolean LOG_CLICKS = true;
    public static boolean LOG_PICKUP = true;
    public static boolean LOG_DROP = true;
    public static boolean LOG_CONTAINER_OPEN = true;
    public static boolean LOG_DIMENSION_CHANGE = true;
    public static boolean LOG_TO_FILE = true;

    private static final Map<String, String> RU_NAMES = new HashMap<>();

    static {
        RU_NAMES.put("container.chest", "Сундук");
        RU_NAMES.put("container.chestDouble", "Большой сундук");
        RU_NAMES.put("container.enderchest", "Сундук Края");
        RU_NAMES.put("container.shulker", "Шалкеровый ящик");
        RU_NAMES.put("container.shulkerBox", "Шалкеровый ящик");
        RU_NAMES.put("container.crafting", "Верстак");
        RU_NAMES.put("container.furnace", "Печь");
        RU_NAMES.put("container.enchant", "Стол зачарования");
        RU_NAMES.put("container.brewing", "Варочная стойка");
        RU_NAMES.put("container.repair", "Наковальня");
        RU_NAMES.put("container.beacon", "Маяк");
        RU_NAMES.put("container.dispenser", "Раздатчик");
        RU_NAMES.put("container.dropper", "Выбрасыватель");
        RU_NAMES.put("container.hopper", "Воронка");
        RU_NAMES.put("container.inventory", "Инвентарь");
    }

    private Settings() {
    }

    public static String translateName(String unlocalized) {
        if (unlocalized == null) {
            return "unknown";
        }
        String ru = RU_NAMES.get(unlocalized);
        return ru != null ? ru : unlocalized.replace("container.", "");
    }

    public static void load(File configDir) {
        try {
            if (configDir == null || !configDir.isDirectory()) {
                return;
            }
            File dir = new File(configDir, "ActionLogger");
            if (!dir.isDirectory()) {
                dir.mkdirs();
            }
            File cfg = new File(dir, "player_actions.cfg");
            if (!cfg.exists()) {
                writeDefault(cfg);
                return;
            }
            List<String> lines = Files.readAllLines(cfg.toPath());
            for (String line : lines) {
                String s = line.trim();
                if (s.isEmpty() || s.startsWith("#") || s.startsWith("[")) {
                    continue;
                }
                String[] kv = s.split("=", 2);
                if (kv.length != 2) {
                    continue;
                }
                boolean v = "true".equalsIgnoreCase(kv[1].trim());
                switch (kv[0].trim()) {
                    case "log_chat": LOG_CHAT = v; break;
                    case "log_gui_open": LOG_GUI_OPEN = v; break;
                    case "log_clicks": LOG_CLICKS = v; break;
                    case "log_pickup": LOG_PICKUP = v; break;
                    case "log_drop": LOG_DROP = v; break;
                    case "log_container_open": LOG_CONTAINER_OPEN = v; break;
                    case "log_dimension_change": LOG_DIMENSION_CHANGE = v; break;
                    case "log_to_file": LOG_TO_FILE = v; break;
                    default: break;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void writeDefault(File cfg) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("# Action Logger config\n");
            sb.append("[general]\n");
            sb.append("log_to_file = true\n");
            sb.append("log_chat = true\n");
            sb.append("log_gui_open = true\n");
            sb.append("log_clicks = true\n");
            sb.append("log_pickup = true\n");
            sb.append("log_drop = true\n");
            sb.append("log_container_open = true\n");
            sb.append("log_dimension_change = true\n");
            Files.write(cfg.toPath(), sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}