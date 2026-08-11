import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { getGameDir, loadConfig } from "./config";
import { getModpackSha256 } from "./supabase";
import type { LaunchProgress } from "./types";

/**
 * Скачивание файла с проверкой SHA-256 по ходу (без записи неверного файла).
 */
async function downloadFile(
  url: string,
  dest: string,
  expectedSha256: string | null,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error("DOWNLOAD_FAILED");
  const total = Number(res.headers.get("content-length") ?? 0);
  const hash = crypto.createHash("sha256");
  let done = 0;

  const reader = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
  reader.on("data", (chunk: Buffer) => {
    done += chunk.length;
    hash.update(chunk);
    onProgress(done, total);
  });

  await pipeline(reader, createWriteStream(dest));

  const actual = hash.digest("hex");
  if (expectedSha256) {
    if (actual.toLowerCase() !== expectedSha256.toLowerCase()) {
      fs.rmSync(dest, { force: true });
      throw new Error("CHECKSUM_MISMATCH");
    }
  }
}

async function resolveGithubAssetUrl(): Promise<{ url: string; digest?: string }> {
  const { modpack } = loadConfig();
  const api = `https://api.github.com/repos/${modpack.githubOwner}/${modpack.githubRepo}/releases/latest`;
  const res = await fetch(api, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "NovaCraftLauncher" },
  });
  if (!res.ok) throw new Error("GITHUB_RELEASE_NOT_FOUND");
  const data = (await res.json()) as {
    assets: { name: string; browser_download_url: string; digest?: string }[];
  };
  const asset = data.assets.find((a) => a.name === modpack.githubAssetName);
  if (!asset) throw new Error("GITHUB_ASSET_NOT_FOUND");
  return { url: asset.browser_download_url, digest: asset.digest };
}

/**
 * Распаковка zip НАЦИВНО (tar.exe в Windows 10+) — без PowerShell,
 * исключаем инъекцию команд через путь.
 */
function extractZip(zipPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ps = spawn("tar", ["-xf", zipPath, "-C", destDir], { stdio: "ignore" });
    ps.on("error", () => reject(new Error("MODPACK_EXTRACT_FAILED")));
    ps.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("MODPACK_EXTRACT_FAILED"))));
  });
}

export async function ensureModpack(onProgress: (p: LaunchProgress) => void): Promise<void> {
  const gameDir = getGameDir();
  const marker = path.join(gameDir, ".modpack-ready");
  if (fs.existsSync(marker)) return;

  const config = loadConfig();
  let url = config.modpack.fallbackDownloadUrl;

  if (config.modpack.source === "github" && config.modpack.githubOwner && config.modpack.githubRepo) {
    const gh = await resolveGithubAssetUrl();
    url = gh.url;
  } else if (config.modpack.manifestUrl) {
    url = config.modpack.manifestUrl;
  }

  // SHA-256: приоритет у БД (launcher_meta), затем конфиг.
  const sha = (await getModpackSha256()) || config.modpack.sha256 || null;

  if (!url) {
    fs.mkdirSync(gameDir, { recursive: true });
    fs.writeFileSync(
      marker,
      JSON.stringify({ note: "placeholder until modpack URL configured", at: Date.now() }),
      "utf8",
    );
    onProgress({ phase: "modpack", percent: 100, detail: "MODPACK_PLACEHOLDER" });
    return;
  }

  fs.mkdirSync(gameDir, { recursive: true });
  const zipPath = path.join(gameDir, "_modpack.zip");

  onProgress({ phase: "modpack", percent: 0, detail: "DOWNLOADING_MODPACK" });
  await downloadFile(url, zipPath, sha, (done, total) => {
    const percent = total ? Math.min(99, Math.round((done / total) * 100)) : 30;
    onProgress({
      phase: "modpack",
      percent,
      detail: "DOWNLOADING_MODPACK",
      bytesDone: done,
      bytesTotal: total || undefined,
    });
  });

  onProgress({ phase: "modpack", percent: 99, detail: "EXTRACTING_MODPACK" });
  await extractZip(zipPath, gameDir);

  fs.rmSync(zipPath, { force: true });
  fs.writeFileSync(marker, JSON.stringify({ url, sha, at: Date.now() }), "utf8");
  onProgress({ phase: "modpack", percent: 100, detail: "MODPACK_READY" });
}
