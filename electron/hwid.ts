import crypto from "node:crypto";
import os from "node:os";
import { execFile } from "node:child_process";

let cached: string | null = null;

function runPowershell(script: string): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { timeout: 7000, windowsHide: true },
      (err, stdout) => {
        if (err) {
          resolve("");
          return;
        }
        resolve(stdout.trim());
      },
    );
  });
}

async function systemIdentifiers(): Promise<string[]> {
  if (process.platform !== "win32") return [];
  const scripts = [
    "(Get-CimInstance Win32_DiskDrive | ForEach-Object { ($_.SerialNumber -as [string]).Trim() } | Where-Object { $_ -and $_.Length -gt 3 }) -join '|'",
    "(Get-CimInstance Win32_BaseBoard | Select-Object -First 1 -ExpandProperty SerialNumber) -replace '\\s', ''",
    "(Get-CimInstance Win32_BIOS | Select-Object -First 1 -ExpandProperty SerialNumber) -replace '\\s', ''",
    "(Get-CimInstance Win32_ComputerSystemProduct | Select-Object -First 1 -ExpandProperty UUID)",
  ];
  const results = await Promise.all(scripts.map((s) => runPowershell(s)));
  return results.filter((v) => v && v.length > 3);
}

function baseParts(): string[] {
  return [
    os.hostname(),
    os.platform(),
    os.arch(),
    ...os.cpus().slice(0, 1).map((c) => c.model),
    Object.values(os.networkInterfaces())
      .flat()
      .filter((n) => n && !n.internal && n.mac !== "00:00:00:00:00:00")
      .map((n) => n!.mac)
      .sort()
      .join("|"),
  ];
}

export async function getHardwareId(): Promise<string> {
  if (cached) return cached;
  const extra = await systemIdentifiers();
  const parts = [...baseParts(), ...extra];
  cached = crypto.createHash("sha256").update(parts.join("::")).digest("hex").slice(0, 32);
  return cached;
}
