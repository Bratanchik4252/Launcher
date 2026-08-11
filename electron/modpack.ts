import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getGameDir, loadConfig } from "./config";
import type { LaunchProgress } from "./types";

/**
 * Автоподхват модов с GitHub.
 *
 * Владелец просто заливает моды в папку `mods/` (и при желании `config/`)
 * репозитория ModPack — лаунчер сам скачивает новые файлы, обновляет
 * изменившиеся и удаляет те, что убрали из репозитория.
 *
 * Целостность: файлы сверяются по git blob-sha из API GitHub
 * (содержимое файла хэшируется локально тем же алгоритмом — sha1
 * от «blob <размер>\0<данные>»). Подмена невозможна без взлома GitHub.
 */

const MANIFEST_FILE = ".modpack-manifest.json";

type TreeEntry = {
  path: string;
  sha: string;
  size: number;
};

type Manifest = Record<string, string>; // path -> git blob sha

function manifestFile(): string {
  return path.join(getGameDir(), MANIFEST_FILE);
}

function loadManifest(): Manifest {
  try {
    return JSON.parse(fs.readFileSync(manifestFile(), "utf8")) as Manifest;
  } catch {
    return {};
  }
}

function saveManifest(m: Manifest): void {
  fs.writeFileSync(manifestFile(), JSON.stringify(m, null, 2), "utf8");
}

async function fetchTree(): Promise<TreeEntry[]> {
  const { modpack } = loadConfig();
  const api = `https://api.github.com/repos/${modpack.githubOwner}/${modpack.githubRepo}/git/trees/${modpack.githubBranch}?recursive=1`;
  const res = await fetch(api, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "NovaCraftLauncher" },
  });
  if (!res.ok) throw new Error("GITHUB_TREE_FAILED");
  const data = (await res.json()) as {
    tree: { path?: string; type: string; sha: string; size?: number }[];
  };
  return data.tree
    .filter((e) => e.type === "blob" && e.path && e.size !== undefined)
    .map((e) => ({ path: e.path as string, sha: e.sha, size: e.size as number }));
}

/** Git blob-sha1 = sha1("blob <size>\0" + содержимое). */
function computeBlobSha(data: Buffer, size: number): string {
  const header = Buffer.from(`blob ${size}\0`, "utf8");
  return crypto.createHash("sha1").update(header).update(data).digest("hex");
}

async function downloadModFile(
  url: string,
  dest: string,
  expectedSha: string,
  expectedSize: number,
  onChunk: (bytes: number) => void,
): Promise<void> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error("MODPACK_DOWNLOAD_FAILED");

  const tmp = dest + ".part";
  const file = createWriteStream(tmp);
  const hash = crypto.createHash("sha1");
  const header = Buffer.from(`blob ${expectedSize}\0`, "utf8");
  hash.update(header);

  let size = 0;
  const reader = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
  reader.on("data", (chunk: Buffer) => {
    size += chunk.length;
    hash.update(chunk);
    onChunk(chunk.length);
  });

  try {
    await pipeline(reader, file);
  } catch {
    fs.rmSync(tmp, { force: true });
    throw new Error("MODPACK_DOWNLOAD_FAILED");
  }

  if (size !== expectedSize || hash.digest("hex") !== expectedSha) {
    fs.rmSync(tmp, { force: true });
    throw new Error("CHECKSUM_MISMATCH");
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(tmp, dest);
}

export async function syncModpack(onProgress: (p: LaunchProgress) => void): Promise<void> {
  const { modpack } = loadConfig();
  const gameDir = getGameDir();
  fs.mkdirSync(gameDir, { recursive: true });

  const tree = await fetchTree();
  const modsFolder = modpack.modsFolder || "mods";
  const configFolder = modpack.configFolder || "config";

  const wanted = new Map<string, TreeEntry>();
  for (const e of tree) {
    if (e.path.startsWith(`${modsFolder}/`)) {
      wanted.set(e.path, e);
    } else if (configFolder && e.path.startsWith(`${configFolder}/`)) {
      wanted.set(e.path, e);
    }
  }

  const manifest = loadManifest();
  const toDownload = [...wanted.values()].filter((e) => manifest[e.path] !== e.sha);
  const totalBytes = toDownload.reduce((sum, e) => sum + e.size, 0);
  let doneBytes = 0;

  // Удаляем локальные файлы, которых больше нет в репозитории.
  for (const [p, sha] of Object.entries(manifest)) {
    if (wanted.has(p)) continue;
    const local = path.join(gameDir, p);
    try {
      fs.rmSync(local, { force: true });
    } catch {
      /* ignore */
    }
    delete manifest[p];
  }

  if (toDownload.length > 0) {
    onProgress({
      phase: "modpack",
      percent: 0,
      detail: "DOWNLOADING_MODPACK",
      bytesDone: 0,
      bytesTotal: totalBytes || undefined,
    });
  }

  for (const entry of toDownload) {
    const raw = `https://raw.githubusercontent.com/${modpack.githubOwner}/${modpack.githubRepo}/${modpack.githubBranch}/${entry.path}`;
    const dest = path.join(gameDir, entry.path);

    let attempt = 0;
    for (;;) {
      attempt += 1;
      try {
        onProgress({
          phase: "modpack",
          percent: totalBytes ? Math.min(94, Math.round((doneBytes / totalBytes) * 100)) : 30,
          detail: "DOWNLOADING_MODPACK",
          bytesDone: doneBytes,
          bytesTotal: totalBytes || undefined,
        });
        await downloadModFile(raw, dest, entry.sha, entry.size, (bytes) => {
          doneBytes += bytes;
          onProgress({
            phase: "modpack",
            percent: totalBytes ? Math.min(94, Math.round((doneBytes / totalBytes) * 100)) : 30,
            detail: "DOWNLOADING_MODPACK",
            bytesDone: doneBytes,
            bytesTotal: totalBytes || undefined,
          });
        });
        manifest[entry.path] = entry.sha;
        break;
      } catch (e) {
        if (attempt >= 2) throw e;
      }
    }
  }

  saveManifest(manifest);
  onProgress({
    phase: "modpack",
    percent: 100,
    detail: "MODPACK_READY",
    bytesDone: doneBytes,
    bytesTotal: totalBytes || undefined,
  });
}
