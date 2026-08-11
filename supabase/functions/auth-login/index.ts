import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import bcrypt from "npm:bcryptjs@3.0.2";

// Supabase Edge Function: POST /auth/login
// Проверяет логин/пароль пользователя, зарегистрированного на сайте,
// против bcrypt-хэша в таблице пользователей.
//
// Переменные окружения (Project Settings -> Edge Functions -> Secrets):
//   SUPABASE_URL           (заполняется автоматически)
//   SUPABASE_SERVICE_ROLE_KEY
//   USERS_TABLE            (default: users)
//   NICKNAME_COLUMN        (default: nickname)
//   PASSWORD_COLUMN        (default: password_hash)
//   BANNED_COLUMN          (default: banned)
//   BAN_REASON_COLUMN      (default: ban_reason)
//   HWID_BANS_TABLE        (default: hwid_bans)
//   HWID_COLUMN            (default: hwid)
//   HWID_REASON_COLUMN     (default: reason)

const cfg = {
  usersTable: Deno.env.get("USERS_TABLE") ?? "users",
  nicknameColumn: Deno.env.get("NICKNAME_COLUMN") ?? "nickname",
  passwordColumn: Deno.env.get("PASSWORD_COLUMN") ?? "password_hash",
  bannedColumn: Deno.env.get("BANNED_COLUMN") ?? "banned",
  banReasonColumn: Deno.env.get("BAN_REASON_COLUMN") ?? "ban_reason",
  hwidBansTable: Deno.env.get("HWID_BANS_TABLE") ?? "hwid_bans",
  hwidColumn: Deno.env.get("HWID_COLUMN") ?? "hwid",
  hwidReasonColumn: Deno.env.get("HWID_REASON_COLUMN") ?? "reason",
};

function env(name: string): string {
  const v = Deno.env.get(name);
  if (v) return v;
  throw new Error(`Нет переменной окружения: ${name}`);
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function newToken(): string {
  const rand = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  let body: { nickname?: unknown; password?: unknown; hwid?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "BAD_JSON" });
  }

  const nickname = String(body.nickname ?? "").trim();
  const password = String(body.password ?? "");
  const hwid = String(body.hwid ?? "");

  if (!nickname || !password) return json(400, { message: "INVALID_INPUT" });

  // ---- HWID-бан ----
  if (hwid) {
    const { data: banRow } = await supabase
      .from(cfg.hwidBansTable)
      .select(cfg.hwidReasonColumn)
      .eq(cfg.hwidColumn, hwid)
      .maybeSingle()
      .catch(() => ({ data: null }));

    if (banRow) {
      return json(403, {
        message: "BANNED",
        banType: "hwid",
        reason: banRow[cfg.hwidReasonColumn] ?? "забанено администрацией",
      });
    }
  }

  // ---- Пользователь ----
  const { data: user, error } = await supabase
    .from(cfg.usersTable)
    .select(`${cfg.passwordColumn},${cfg.bannedColumn},${cfg.banReasonColumn}`)
    .eq(cfg.nicknameColumn, nickname)
    .maybeSingle()
    .catch(() => ({ data: null, error: null }));

  if (error || !user) {
    return json(401, { message: "Неверный логин или пароль" });
  }

  const passHash = user[cfg.passwordColumn] as string;
  if (!bcrypt.compareSync(password, passHash)) {
    return json(401, { message: "Неверный логин или пароль" });
  }

  if (user[cfg.bannedColumn]) {
    return json(403, {
      message: "Аккаунт заблокирован",
      banType: "account",
      reason: user[cfg.banReasonColumn] ?? "",
    });
  }

  return json(200, { token: newToken(), nickname });
});
