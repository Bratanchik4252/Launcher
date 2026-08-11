import { createClient } from "npm:@supabase/supabase-js@2.45.0";

// Supabase Edge Function: POST /hwid/check
// Проверяет, не забанено ли железо (HWID). Вызывается лаунчером при каждом старте.
//
// Переменные окружения:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   HWID_BANS_TABLE   (default: hwid_bans)
//   HWID_COLUMN       (default: hwid)
//   HWID_REASON_COLUMN (default: reason)

const hwidBansTable = Deno.env.get("HWID_BANS_TABLE") ?? "hwid_bans";
const hwidColumn = Deno.env.get("HWID_COLUMN") ?? "hwid";
const hwidReasonColumn = Deno.env.get("HWID_REASON_COLUMN") ?? "reason";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  let body: { hwid?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "BAD_JSON" });
  }

  const hwid = String(body.hwid ?? "");
  if (!hwid) return json(400, { error: "BAD_INPUT" });

  const { data: banRow } = await supabase
    .from(hwidBansTable)
    .select(hwidReasonColumn)
    .eq(hwidColumn, hwid)
    .maybeSingle()
    .catch(() => ({ data: null }));

  if (banRow) {
    return json(200, {
      banned: true,
      reason: banRow[hwidReasonColumn] ?? "забанено администрацией",
    });
  }
  return json(200, { banned: false });
});
