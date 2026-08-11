import { app } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { loadConfig } from "./config";
import type { LaunchProgress } from "./types";

/**
 * Кастомный установщик (install-mode).
 *
 * Лаунчер собирается как один переносимый exe (electron-builder portable).
 * При запуске из временной папки / без маркера установки он показывает
 * анимированный экран установки: копирует себя в %LOCALAPPDATA%\Programs,
 * создаёт ярлыки, регистрирует в «Установка и удаление программ»,
 * затем запускает установленную копию и закрывается.
 * Никакого NSIS — полный контроль над стилем и анимациями.
 */

const APP_DIR_NAME = "NOVACRAFT Launcher";

function markerPath(): string {
  return path.join(path.dirname(process.execPath), "installed.json");
}

export function isInstalled(): boolean {
  return fs.existsSync(markerPath());
}

/** Первый запуск (не установлен и не dev-режим) → показать установщик. */
export function isInstallMode(): boolean {
  return app.isPackaged && !isInstalled();
}

export function installDir(): string {
  const local = process.env.LOCALAPPDATA || app.getPath("appData");
  return path.join(local, "Programs", APP_DIR_NAME);
}

export function installedExe(): string {
  return path.join(installDir(), "NOVACRAFT Launcher.exe");
}

function runningFromTemp(): boolean {
  return process.execPath.toLowerCase().startsWith(os.tmpdir().toLowerCase());
}

/** Копирование приложения целиком (exe + resources\app.asar + locales). */
function copySelf(destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(path.dirname(process.execPath), destDir, { recursive: true });
  fs.writeFileSync(
    path.join(destDir, "installed.json"),
    JSON.stringify({ version: app.getVersion(), installedAt: Date.now() }),
    "utf8",
  );
}

/** Ярлыки (PowerShell WScript.Shell — только фиксированные пути, без user-ввода). */
function createShortcuts(
  exe: string,
  websiteLink: string,
  onProgress: (p: LaunchProgress) => void,
): Promise<void> {
  const dir = path.dirname(exe);
  const desktop = app.getPath("desktop");
  const startMenu = path.join(app.getPath("appData"), "Microsoft", "Windows", "Start Menu", "Programs");
  const q = (s: string) => s.replace(/'/g, "''");
  const website = websiteLink.startsWith("http") ? websiteLink : "https://novacraft";

  const ps = `
$ws = New-Object -ComObject WScript.Shell
function New-Link($lnk, $target) {
  $s = $ws.CreateShortcut($lnk)
  $s.TargetPath = $target
  $s.WorkingDirectory = '${q(dir)}'
  $s.IconLocation = '${q(exe)},0'
  $s.Save()
}
New-Link '${q(path.join(desktop, "NOVACRAFT Launcher.lnk"))}' '${q(exe)}'
$sm = Join-Path '${q(startMenu)}' 'NOVACRAFT'
New-Item -ItemType Directory -Force -Path $sm | Out-Null
New-Link (Join-Path $sm 'NOVACRAFT Launcher.lnk') '${q(exe)}'
New-Link (Join-Path $sm 'Сайт NOVACRAFT.lnk') '${q(website)}'
`;

  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], (err) => {
      onProgress({ phase: "install", percent: 80, detail: "INSTALL_SHORTCUTS" });
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Регистрация в «Установка и удаление программ» (HKCU, без прав админа). */
function registerUninstall(exe: string, onProgress: (p: LaunchProgress) => void): Promise<void> {
  const key = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\NOVACRAFTLauncher`;
  const values: Array<[string, string, string?]> = [
    ["DisplayName", "NOVACRAFT Launcher"],
    ["DisplayVersion", app.getVersion()],
    ["Publisher", "NOVACRAFT"],
    ["DisplayIcon", exe],
    ["InstallLocation", path.dirname(exe)],
    ["UninstallString", `"${exe}" --uninstall`],
    ["NoModify", "1", "REG_DWORD"],
    ["NoRepair", "1", "REG_DWORD"],
  ];
  const run = (v: string[]) =>
    new Promise<void>((resolve, reject) => {
      execFile("reg.exe", ["add", key, "/f", ...v], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  return values
    .reduce(
      (chain, [name, data, type]) => chain.then(() => run(["/v", name, "/d", data, ...(type ? ["/t", type] : [])])),
      Promise.resolve(),
    )
    .then(() => {
      onProgress({ phase: "install", percent: 95, detail: "INSTALL_REGISTER" });
    });
}

/** Автозапуск со стартом системы (HKCU Run). */
function setAutoStart(exe: string, enabled: boolean): Promise<void> {
  const key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
  const args = enabled ? ["add", key, "/f", "/v", "NOVACRAFT Launcher", "/d", `"${exe}"`] : ["delete", key, "/v", "NOVACRAFT Launcher", "/f"];
  return new Promise((resolve) => {
    execFile("reg.exe", args, () => resolve());
  });
}

function launchAndQuit(exe: string): void {
  const child = spawn(exe, [], { detached: true, stdio: "ignore" });
  child.unref();
  app.exit(0);
}

export interface InstallOptions {
  launchAfter?: boolean;
  autoStart?: boolean;
}

/** Полная установка: копирование → ярлыки → реестр → автозапуск → запуск. */
export async function installApp(
  onProgress: (p: LaunchProgress) => void,
  opts: InstallOptions = {},
): Promise<void> {
  if (!app.isPackaged) throw new Error("INSTALL_DEV_MODE");
  if (isInstalled()) throw new Error("INSTALL_ALREADY");

  const config = loadConfig();
  const destDir = installDir();
  const destExe = installedExe();

  onProgress({ phase: "install", percent: 4, detail: "INSTALL_COPY" });
  copySelf(destDir);

  onProgress({ phase: "install", percent: 55, detail: "INSTALL_SHORTCUTS" });
  await createShortcuts(destExe, config.links.website, onProgress);

  onProgress({ phase: "install", percent: 80, detail: "INSTALL_REGISTER" });
  await registerUninstall(destExe, onProgress);

  if (opts.autoStart) {
    await setAutoStart(destExe, true);
  }

  onProgress({ phase: "install", percent: 100, detail: "INSTALL_DONE" });
  if (opts.launchAfter !== false) {
    launchAndQuit(destExe);
  } else {
    app.exit(0);
  }
}

/** Удаление: реестр, ярлыки, своя папка (отложенное удаление через bat). */
export async function uninstallApp(): Promise<void> {
  const exe = process.execPath;
  const dir = path.dirname(exe);

  await new Promise<void>((resolve) => {
    execFile(
      "reg.exe",
      ["delete", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\NOVACRAFTLauncher", "/f"],
      () => resolve(),
    );
  });

  await setAutoStart(exe, false);

  const desktop = app.getPath("desktop");
  const startMenu = path.join(app.getPath("appData"), "Microsoft", "Windows", "Start Menu", "Programs");
  for (const p of [
    path.join(desktop, "NOVACRAFT Launcher.lnk"),
    path.join(startMenu, "NOVACRAFT", "NOVACRAFT Launcher.lnk"),
    path.join(startMenu, "NOVACRAFT", "Сайт NOVACRAFT.lnk"),
  ]) {
    try {
      fs.rmSync(p, { force: true });
    } catch {
      /* ignore */
    }
  }

  const bat = path.join(os.tmpdir(), `novacraft-uninstall-${Date.now()}.bat`);
  fs.writeFileSync(
    bat,
    `@echo off\r\ntimeout /t 2 /nobreak >nul\r\nrmdir /s /q "${dir}"\r\ndel "%~f0"\r\n`,
    "utf8",
  );
  const child = spawn("cmd.exe", ["/c", bat], { detached: true, stdio: "ignore" });
  child.unref();
  app.exit(0);
}
