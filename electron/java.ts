import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { getJavaDir, loadConfig } from "./config";
import type { LaunchProgress } from "./types";

function javaBin(): string {
  return path.join(getJavaDir(), "bin", "java.exe");
}

export function findSystemJava8(): string | null {
  const candidates = [
    process.env.JAVA_HOME,
    "C:\\Program Files\\Java\\jre1.8.0_461",
    "C:\\Program Files\\Java\\jre-1.8",
    "C:\\Program Files (x86)\\Java\\jre1.8.0_461",
  ].filter(Boolean) as string[];

  for (const base of candidates) {
    const exe = path.join(base, "bin", "java.exe");
    if (fs.existsSync(exe)) return exe;
  }

  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(";")) {
    const exe = path.join(dir.trim(), "java.exe");
    if (fs.existsSync(exe)) {
      try {
        const out = require("node:child_process").execSync(`"${exe}" -version 2>&1`, {
          encoding: "utf8",
        });
        if (/version "1\.8|version "8\./.test(out)) return exe;
      } catch {
        /* skip */
      }
    }
  }
  return null;
}

export function getJavaExecutable(): string | null {
  const bundled = javaBin();
  if (fs.existsSync(bundled)) return bundled;
  return findSystemJava8();
}

async function extractZip(zipPath: string, dest: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ps = spawn("tar", ["-xf", zipPath, "-C", dest], { stdio: "ignore" });
    ps.on("error", () => reject(new Error("ZIP_EXTRACT_FAILED")));
    ps.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("ZIP_EXTRACT_FAILED"))));
  });
}

export async function ensureJava8(
  onProgress: (p: LaunchProgress) => void,
): Promise<string> {
  const existing = getJavaExecutable();
  if (existing) return existing;

  const config = loadConfig();
  const javaDir = getJavaDir();
  fs.mkdirSync(javaDir, { recursive: true });

  onProgress({
    phase: "java",
    percent: 0,
    detail: "DOWNLOADING_JAVA",
  });

  const tmpZip = path.join(javaDir, "jre8.zip");
  const res = await fetch(config.java.temurinJreUrl, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error("JAVA_DOWNLOAD_FAILED");

  // Adoptium API отдаёт контрольную сумму в заголовке X-Checksum-SHA256.
  const expectedSha =
    (res.headers.get("x-checksum-sha256") || "").toLowerCase() || null;
  const hash = crypto.createHash("sha256");

  const total = Number(res.headers.get("content-length") ?? 0);
  let done = 0;
  const file = createWriteStream(tmpZip);
  const reader = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);

  reader.on("data", (chunk: Buffer) => {
    done += chunk.length;
    hash.update(chunk);
    const percent = total ? Math.min(99, Math.round((done / total) * 100)) : 50;
    onProgress({
      phase: "java",
      percent,
      detail: "DOWNLOADING_JAVA",
      bytesDone: done,
      bytesTotal: total || undefined,
    });
  });

  await pipeline(reader, file);

  if (expectedSha) {
    const actual = hash.digest("hex");
    if (actual !== expectedSha) {
      fs.rmSync(tmpZip, { force: true });
      throw new Error("JAVA_CHECKSUM_MISMATCH");
    }
  }

  const extractRoot = path.join(javaDir, "_extract");
  fs.mkdirSync(extractRoot, { recursive: true });
  await extractZip(tmpZip, extractRoot);

  const entries = fs.readdirSync(extractRoot);
  const jreFolder = entries.find((e) => fs.statSync(path.join(extractRoot, e)).isDirectory());
  if (!jreFolder) throw new Error("JAVA_LAYOUT_FAILED");

  const src = path.join(extractRoot, jreFolder);
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(javaDir, name);
    fs.cpSync(from, to, { recursive: true });
  }

  fs.rmSync(extractRoot, { recursive: true, force: true });
  fs.rmSync(tmpZip, { force: true });

  onProgress({ phase: "java", percent: 100, detail: "JAVA_READY" });

  const exe = javaBin();
  if (!fs.existsSync(exe)) throw new Error("JAVA_INSTALL_FAILED");
  return exe;
}
