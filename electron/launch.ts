import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getGameDir, loadConfig } from "./config";
import { ensureModpack } from "./download";
import { ensureJava8, getJavaExecutable } from "./java";
import { appendLog } from "./logger";
import { loadSettings } from "./store";
import { getValidSession } from "./auth";
import { getServerAddress } from "./supabase";
import type { LaunchProgress } from "./types";

/**
 * Токен сессии для клиентского мода NovaGuardClient: кладётся в файл внутри
 * папки игры (права на чтение — только текущий пользователь). Игра передаёт
 * его серверному моду при входе; без него сервер кикает.
 */
function writeGameTokenFile(gameDir: string, accessToken: string): void {
  const file = path.join(gameDir, "novacraft_session");
  fs.writeFileSync(file, accessToken, { encoding: "utf8", mode: 0o600 });
}

export async function prepareAndLaunch(
  emit: (p: LaunchProgress) => void,
): Promise<{ ok: boolean; message?: string }> {
  const session = await getValidSession();
  if (!session) return { ok: false, message: "NOT_LOGGED_IN" };

  // IP сервера не лежит в клиенте — берём из БД (launcher_meta).
  const server = await getServerAddress();
  if (!server) {
    return { ok: false, message: "SERVER_ADDRESS_NOT_CONFIGURED" };
  }

  try {
    emit({ phase: "prepare", percent: 5, detail: "CHECK_JAVA" });
    const java = await ensureJava8(emit);

    emit({ phase: "prepare", percent: 40, detail: "CHECK_MODPACK" });
    await ensureModpack(emit);

    const settings = loadSettings();
    const config = loadConfig();
    const gameDir = getGameDir();

    const versionJson = path.join(gameDir, "versions", config.gameVersion, `${config.gameVersion}.json`);
    const hasVanillaLayout = fs.existsSync(versionJson);

    if (!hasVanillaLayout) {
      appendLog(
        "launch",
        `Modpack folder ready at ${gameDir}. Full ${config.gameVersion}+Forge bootstrap will run when manifest is configured.`,
      );
      emit({ phase: "done", percent: 100, detail: "WAITING_MODPACK_CONFIG" });
      return {
        ok: false,
        message: "MODPACK_NOT_INSTALLED",
      };
    }

    const ram = settings.ramMb;
    const jvmArgs = [`-Xms${Math.floor(ram / 2)}M`, `-Xmx${ram}M`];

    // Автоподключение к серверу проекта + ник аккаунта (offline-клиент).
    // Токен сессии — клиент-моду через файл novacraft_session.
    writeGameTokenFile(gameDir, session.accessToken);

    const args: string[] = [
      ...jvmArgs,
      "-cp",
      path.join(gameDir, "libraries", "*"),
      "net.minecraft.client.main.Main",
      "--username",
      session.nickname,
      "--server",
      server.host,
      "--port",
      String(server.port),
    ];

    appendLog("launch", `Starting MC ${config.gameVersion} as ${session.nickname} -> ${server.host}:${server.port}`);
    const child = spawn(java, args, {
      cwd: gameDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NOVACRAFT_SESSION: session.accessToken },
    });

    child.stdout?.on("data", (d) => appendLog("game", d.toString()));
    child.stderr?.on("data", (d) => appendLog("game", d.toString()));

    emit({ phase: "done", percent: 100, detail: "GAME_STARTED" });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LAUNCH_FAILED";
    appendLog("error", msg);
    return { ok: false, message: msg };
  }
}

export function getJavaStatus(): string | null {
  return getJavaExecutable();
}
