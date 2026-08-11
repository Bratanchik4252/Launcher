import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { app } from "electron";
import { loadConfig } from "./config";
import { getHardwareId } from "./hwid";
import type { SessionData } from "./types";

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (client) return client;
  const cfg = loadConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

/** Ник → email (ищем профиль сайта, RLS разрешает чтение). */
export async function resolveEmailByIdentifier(identifier: string): Promise<string | null> {
  const id = identifier.trim();
  if (!id) return null;
  if (id.includes("@")) return id.toLowerCase();
  const { data, error } = await getClient()
    .from("profiles")
    .select("email")
    .ilike("name", id)
    .maybeSingle();
  if (error || !data || !data.email) return null;
  return String(data.email).toLowerCase();
}

/** Профиль (ник) по текущей сессии. */
export async function fetchProfile(userId: string): Promise<{ name: string; email: string } | null> {
  const { data, error } = await getClient()
    .from("profiles")
    .select("name,email")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { name: String(data.name), email: String(data.email || "") };
}

// ------------------------------------------------------------------
// Антибрутфорс: 5 неудачных попыток по ключу (ник/email) → блок 5 минут.
// Локально, в userData — Supabase Auth дополнительно сам режет брутфорс.
// ------------------------------------------------------------------
const ATTEMPTS_FILE = "auth-attempts.json";

function attemptsFile(): string {
  return path.join(app.getPath("userData"), ATTEMPTS_FILE);
}

type AttemptsStore = Record<string, { count: number; lockedUntil: number }>;

function loadAttempts(): AttemptsStore {
  try {
    return JSON.parse(fs.readFileSync(attemptsFile(), "utf8")) as AttemptsStore;
  } catch {
    return {};
  }
}

function saveAttempts(s: AttemptsStore): void {
  try {
    fs.writeFileSync(attemptsFile(), JSON.stringify(s), "utf8");
  } catch {}
}

const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

function attemptsKey(identifier: string): string {
  return crypto.createHash("sha256").update(identifier.toLowerCase()).digest("hex");
}

export function checkLocked(identifier: string): number {
  const s = loadAttempts();
  const e = s[attemptsKey(identifier)];
  if (!e || e.count < MAX_ATTEMPTS) return 0;
  const left = (e.lockedUntil || 0) - Date.now();
  if (left <= 0) return 0;
  return Math.ceil(left / 1000);
}

function recordFailure(identifier: string): void {
  const s = loadAttempts();
  const k = attemptsKey(identifier);
  const e = s[k] || { count: 0, lockedUntil: 0 };
  if (e.count >= MAX_ATTEMPTS && e.lockedUntil > Date.now()) return;
  if (e.count >= MAX_ATTEMPTS) {
    e.count = 1;
    e.lockedUntil = 0;
  } else {
    e.count += 1;
  }
  if (e.count >= MAX_ATTEMPTS) e.lockedUntil = Date.now() + LOCK_MS;
  s[k] = e;
  saveAttempts(s);
}

function clearAttempts(identifier: string): void {
  const s = loadAttempts();
  delete s[attemptsKey(identifier)];
  saveAttempts(s);
}

// ------------------------------------------------------------------
// Вход и сессия
// ------------------------------------------------------------------
export async function loginWithSupabase(
  identifier: string,
  password: string,
): Promise<SessionData> {
  const locked = checkLocked(identifier);
  if (locked > 0) {
    throw new Error(`TOO_MANY_ATTEMPTS:${locked}`);
  }

  const email = await resolveEmailByIdentifier(identifier);
  if (!email) {
    recordFailure(identifier);
    throw new Error("AUTH_FAILED");
  }

  try {
    const { data, error } = await getClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) {
      recordFailure(identifier);
      throw new Error("AUTH_FAILED");
    }

    const profile = await fetchProfile(data.session.user.id);
    const session: SessionData = {
      nickname: profile?.name || data.session.user.email.split("@")[0],
      email: profile?.email || email,
      userId: data.session.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: Date.now() + (data.session.expires_in || 3600) * 1000,
    };
    clearAttempts(identifier);
    return session;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("TOO_MANY_ATTEMPTS")) throw e;
    recordFailure(identifier);
    throw new Error("AUTH_FAILED");
  }
}

/** Восстановление/обновление сессии по refresh-токену. */
export async function refreshSession(session: SessionData): Promise<SessionData | null> {
  try {
    const { data, error } = await getClient().auth.refreshSession({
      refresh_token: session.refreshToken,
    });
    if (error || !data.session) return null;
    return {
      ...session,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: Date.now() + (data.session.expires_in || 3600) * 1000,
    };
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    await getClient().auth.signOut();
  } catch {
    // локальная сессия всё равно удаляется
  }
}

/** Бан по HWID: читаем таблицу hwid_bans (RLS: select true). */
export async function checkHardwareBan(): Promise<{ banned: boolean; reason?: string }> {
  try {
    const hwid = await getHardwareId();
    const { data, error } = await getClient()
      .from("hwid_bans")
      .select("reason")
      .eq("hwid", hwid)
      .maybeSingle();
    if (error) return { banned: false };
    if (data) return { banned: true, reason: data.reason || undefined };
    return { banned: false };
  } catch {
    return { banned: false };
  }
}

/** Адрес игрового сервера из БД (launcher_meta) — IP не лежит в клиенте. */
export async function getServerAddress(): Promise<{ host: string; port: number } | null> {
  try {
    const { data, error } = await getClient()
      .from("launcher_meta")
      .select("key,value")
      .in("key", ["server_host", "server_port"]);
    if (error || !data) return null;
    const map: Record<string, string> = {};
    data.forEach((r) => (map[String(r.key)] = String(r.value)));
    const host = map["server_host"];
    const port = Number(map["server_port"] || 25565);
    if (!host) return null;
    return { host, port: Number.isFinite(port) ? port : 25565 };
  } catch {
    return null;
  }
}

/** SHA-256 модпака из БД (приоритет над конфигом). */
export async function getModpackSha256(): Promise<string | null> {
  try {
    const { data, error } = await getClient()
      .from("launcher_meta")
      .select("value")
      .eq("key", "modpack_sha256")
      .maybeSingle();
    if (error || !data) return null;
    return String(data.value || "").trim() || null;
  } catch {
    return null;
  }
}
