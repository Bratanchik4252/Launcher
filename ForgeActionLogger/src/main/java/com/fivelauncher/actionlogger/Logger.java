package com.fivelauncher.actionlogger;

import java.io.File;
import java.io.PrintStream;

public class Logger {

    private static PrintStream out;
    private static boolean enabled = true;
    private static final java.text.SimpleDateFormat TIME =
            new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");

    private Logger() {
    }

    public static void start(File configDir, boolean fileLog) {
        enabled = fileLog;
        if (!enabled) {
            return;
        }
        try {
            File dir = new File(configDir, "ActionLogger");
            if (!dir.isDirectory() && !dir.mkdirs()) {
                System.out.println("[ActionLogger] Cannot create log dir: " + dir);
                return;
            }
            File f = new File(dir, "player_actions.log");
            out = new PrintStream(new java.io.FileOutputStream(f, true), true, "UTF-8");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void log(String line) {
        String ts = TIME.format(new java.util.Date());
        String full = ts + "  " + line;
        System.out.println("[ActionLogger] " + full);
        if (out != null) {
            out.println(full);
        }
    }
}