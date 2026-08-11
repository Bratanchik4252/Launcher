import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import type { LauncherConfig } from "./types";
import { getResolvedGameDir } from "./store";

let cached: LauncherConfig | null = null;

export function getConfigPath(): string {
  const bundled = path.join(app.getAppPath(), "launcher.config.json");
  const user = path.join(app.getPath("userData"), "launcher.config.json");
  if (fs.existsSync(user)) return user;
  return bundled;
}

export function loadConfig(): LauncherConfig {
  if (cached) return cached;
  const raw = fs.readFileSync(getConfigPath(), "utf8");
  cached = JSON.parse(raw) as LauncherConfig;
  return cached;
}

export function defaultGameDir(): string {
  return path.join(app.getPath("userData"), "game");
}

export function getGameDir(): string {
  return getResolvedGameDir();
}

export function getJavaDir(): string {
  return path.join(app.getPath("userData"), "runtime", "java8");
}

export function getLogsDir(): string {
  return path.join(app.getPath("userData"), "logs");
}

export function ensureDirs(): void {
  for (const dir of [getGameDir(), getJavaDir(), getLogsDir()]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
