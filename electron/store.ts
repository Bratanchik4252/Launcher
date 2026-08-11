import { safeStorage } from "electron";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { AppSettings, SavedAccount, SessionData } from "./types";
import os from "node:os";

const SETTINGS_FILE = "settings.json";
const ACCOUNTS_FILE = "accounts.enc";
const SESSION_FILE = "session.enc";

function recommendedRamMb(): number {
  const total = os.totalmem();
  const quarter = Math.floor(total / 4 / 512) * 512;
  return Math.min(16384, Math.max(8192, quarter));
}

const defaultSettings: AppSettings = {
  ramMb: recommendedRamMb(),
  ramAuto: true,
  language: "ru",
  theme: "dark",
  accent: "nova",
  rememberMe: true,
  gameDir: "",
  showDevLogs: false,
};

function userDataFile(name: string): string {
  return path.join(app.getPath("userData"), name);
}

function encryptJson(data: unknown): Buffer {
  const plain = Buffer.from(JSON.stringify(data), "utf8");
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(plain.toString("utf8"));
  }
  throw new Error("ENCRYPTION_UNAVAILABLE");
}

function decryptJson<T>(buf: Buffer): T {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("ENCRYPTION_UNAVAILABLE");
  }
  const str = safeStorage.decryptString(buf);
  return JSON.parse(str) as T;
}

export function loadSettings(): AppSettings {
  const file = userDataFile(SETTINGS_FILE);
  if (!fs.existsSync(file)) return { ...defaultSettings };
  try {
    const merged = { ...defaultSettings, ...JSON.parse(fs.readFileSync(file, "utf8")) };
    if (merged.ramAuto) {
      merged.ramMb = recommendedRamMb();
    }
    return merged;
  } catch {
    return { ...defaultSettings };
  }
}

export function getResolvedGameDir(): string {
  const s = loadSettings();
  if (s.gameDir && fs.existsSync(s.gameDir)) return s.gameDir;
  return path.join(app.getPath("userData"), "game");
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...loadSettings(), ...patch };
  fs.writeFileSync(userDataFile(SETTINGS_FILE), JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function loadSavedAccounts(): SavedAccount[] {
  const file = userDataFile(ACCOUNTS_FILE);
  if (!fs.existsSync(file)) return [];
  try {
    return decryptJson<SavedAccount[]>(fs.readFileSync(file));
  } catch {
    return [];
  }
}

export function saveSavedAccounts(accounts: SavedAccount[]): void {
  try {
    fs.writeFileSync(userDataFile(ACCOUNTS_FILE), encryptJson(accounts));
  } catch {
    // шифрование недоступно — НЕ храним список аккаунтов в открытом виде
  }
}

export function loadSession(): SessionData | null {
  const file = userDataFile(SESSION_FILE);
  if (!fs.existsSync(file)) return null;
  try {
    return decryptJson<SessionData>(fs.readFileSync(file));
  } catch {
    return null;
  }
}

export function saveSession(session: SessionData | null): void {
  const file = userDataFile(SESSION_FILE);
  if (!session) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return;
  }
  try {
    fs.writeFileSync(file, encryptJson(session));
  } catch {
    // шифрование недоступно — токены в открытом виде не пишем
  }
}
