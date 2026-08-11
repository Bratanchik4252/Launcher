import crypto from "node:crypto";
import { loadConfig } from "./config";
import type { AuthResult, HwidCheckResult, SessionData } from "./types";
import { loadSavedAccounts, saveSavedAccounts, saveSession, loadSettings } from "./store";
import { loginWithSupabase, refreshSession, signOut, checkHardwareBan as checkHwid } from "./supabase";

/**
 * Вход по нику ИЛИ email через Supabase (те же аккаунты, что на сайте).
 * Без пароля вход невозможен — devAuthBypass удалён.
 */
export async function login(
  identifier: string,
  password: string,
  remember: boolean,
): Promise<AuthResult> {
  const id = identifier.trim();
  if (!id || id.length < 3) return { ok: false, message: "INVALID_NICK" };
  if (!password || password.length < 4) return { ok: false, message: "INVALID_PASSWORD" };

  try {
    const session = await loginWithSupabase(id, password);
    saveSession(session);

    if (remember && loadSettings().rememberMe) {
      const accounts = loadSavedAccounts().filter(
        (a) => a.nickname !== session.nickname || a.email !== session.email,
      );
      accounts.unshift({
        id: crypto.randomUUID(),
        nickname: session.nickname,
        email: session.email,
        savedAt: Date.now(),
      });
      saveSavedAccounts(accounts.slice(0, loadConfig().maxSavedAccounts));
    }

    return { ok: true, session };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AUTH_FAILED";
    if (msg.startsWith("TOO_MANY_ATTEMPTS")) {
      const sec = Number(msg.split(":")[1]) || 0;
      return { ok: false, message: "TOO_MANY_ATTEMPTS", reason: String(sec) };
    }
    if (msg === "SUPABASE_NOT_CONFIGURED") return { ok: false, message: "API_NOT_CONFIGURED" };
    return { ok: false, message: "AUTH_FAILED" };
  }
}

/** Актуальная сессия: восстановление + продление по refresh-токену. */
export async function getValidSession(): Promise<SessionData | null> {
  const session = loadSession();
  if (!session) return null;
  if (session.expiresAt > Date.now() + 60_000) return session;
  const next = await refreshSession(session);
  if (!next) {
    saveSession(null);
    return null;
  }
  saveSession(next);
  return next;
}

export async function checkHardwareBan(): Promise<HwidCheckResult> {
  const res = await checkHwid();
  return res.banned ? { banned: true, reason: res.reason } : { banned: false };
}

export async function logout(): Promise<void> {
  try {
    await signOut();
  } finally {
    saveSession(null);
  }
}

export { loadSession } from "./store";
