import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { app } from "electron";
import { loadConfig } from "./config";
import { installedExe, isInstalled } from "./installer";

/**
 * Обновления через GitHub Releases: новый setup-файл (portable) скачивается
 * во временную папку и запускается — установщик сам заменит себя
 * (install-mode: копирует новый exe и перезапускает).
 */

const ASSET_PATTERN = /^NovaCraftLauncher-.+-setup\.exe$/i;

export async function checkForUpdates(): Promise<{
  available: boolean;
  version?: string;
  message?: string;
}> {
  const { updater } = loadConfig();
  if (!updater.githubOwner || !updater.githubRepo) {
    return { available: false, message: "UPDATER_NOT_CONFIGURED" };
  }

  try {
    const api = `https://api.github.com/repos/${updater.githubOwner}/${updater.githubRepo}/releases/latest`;
    const res = await fetch(api, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "NovaCraftLauncher" },
    });
    if (!res.ok) return { available: false };
    const data = (await res.json()) as { tag_name: string };
    const current = app.getVersion();
    const latest = data.tag_name.replace(/^v/, "");
    if (latest !== current) {
      return { available: true, version: latest };
    }
    return { available: false };
  } catch {
    return { available: false, message: "UPDATE_CHECK_FAILED" };
  }
}

export async function applyUpdate(): Promise<void> {
  const { updater } = loadConfig();
  if (!updater.githubOwner || !updater.githubRepo) throw new Error("UPDATER_NOT_CONFIGURED");

  const api = `https://api.github.com/repos/${updater.githubOwner}/${updater.githubRepo}/releases/latest`;
  const res = await fetch(api, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "NovaCraftLauncher" },
  });
  if (!res.ok) throw new Error("UPDATE_FETCH_FAILED");
  const data = (await res.json()) as {
    tag_name: string;
    assets: { name: string; browser_download_url: string; size: number }[];
  };
  const asset = data.assets.find((a) => ASSET_PATTERN.test(a.name));
  if (!asset) throw new Error("UPDATE_ASSET_NOT_FOUND");

  const tmp = path.join(os.tmpdir(), `novacraft-update-${Date.now()}-${asset.name}`);
  const dl = await fetch(asset.browser_download_url, { redirect: "follow" });
  if (!dl.ok || !dl.body) throw new Error("UPDATE_DOWNLOAD_FAILED");
  const buf = Buffer.from(await dl.arrayBuffer());
  if (buf.length !== asset.size) throw new Error("UPDATE_DOWNLOAD_FAILED");
  fs.writeFileSync(tmp, buf);

  // Обновление поверх установленной копии: копируем новый exe вместо текущего.
  if (isInstalled()) {
    try {
      fs.copyFileSync(tmp, installedExe());
      fs.rmSync(tmp, { force: true });
      const child = spawn(installedExe(), [], { detached: true, stdio: "ignore" });
      child.unref();
      app.exit(0);
      return;
    } catch {
      // не получилось заменить — запускаем установщик как есть
    }
  }

  const child = spawn(tmp, [], { detached: true, stdio: "ignore" });
  child.unref();
  app.exit(0);
}
