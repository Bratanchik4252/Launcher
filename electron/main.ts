import { app, BrowserWindow, ipcMain, shell, nativeTheme, dialog } from "electron";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { login, logout, checkHardwareBan, getValidSession } from "./auth";
import { defaultGameDir, ensureDirs, getGameDir, loadConfig } from "./config";
import { getHardwareId } from "./hwid";
import { prepareAndLaunch } from "./launch";
import { getServerAddress, getServers } from "./supabase";
import {
  loadSavedAccounts,
  loadSettings,
  saveSavedAccounts,
  saveSettings,
} from "./store";
import { checkForUpdates, applyUpdate } from "./updater";
import { installApp, isInstalled, isInstallMode, installDir, installedExe, uninstallApp } from "./installer";
import type { InstallStatus, LaunchProgress } from "./types";
let mainWindow: BrowserWindow | null = null;

function broadcastProgress(p: LaunchProgress): void {
  mainWindow?.webContents.send("launch:progress", p);
}

function broadcastInstallProgress(p: LaunchProgress): void {
  mainWindow?.webContents.send("install:progress", p);
}

function createWindow(): void {
  const settings = loadSettings();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  nativeTheme.themeSource = settings.theme === "light" ? "light" : "dark";

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpc(): void {
  ipcMain.handle("config:get", () => loadConfig());
  ipcMain.handle("settings:get", () => loadSettings());
  ipcMain.handle("settings:save", (_e, patch) => {
    const next = saveSettings(patch);
    if (patch.theme) {
      nativeTheme.themeSource = patch.theme === "light" ? "light" : "dark";
    }
    return next;
  });
  ipcMain.handle("accounts:list", () => loadSavedAccounts());
  ipcMain.handle("accounts:remove", (_e, id: string) => {
    const list = loadSavedAccounts().filter((a) => a.id !== id);
    saveSavedAccounts(list);
  });
  ipcMain.handle("auth:login", (_e, identifier: string, pass: string, remember: boolean) =>
    login(identifier, pass, remember),
  );
  ipcMain.handle("auth:logout", () => logout());
  ipcMain.handle("auth:session", () => getValidSession());
  ipcMain.handle("shell:open", (_e, url: string) => {
    if (!/^https?:\/\//i.test(url)) return;
    return shell.openExternal(url);
  });
  ipcMain.handle("game:openFolder", () => shell.openPath(getGameDir()));
  ipcMain.handle("logs:openFolder", () => shell.openPath(path.join(app.getPath("userData"), "logs")));
  ipcMain.handle("hwid:get", () => getHardwareId());
  ipcMain.handle("hwid:check", () => checkHardwareBan());
  ipcMain.handle("meta:getServerAddress", () => getServerAddress());
  ipcMain.handle("meta:getServers", () => getServers());
  ipcMain.handle("window:minimize", () => mainWindow?.minimize());
  ipcMain.handle("window:close", () => mainWindow?.close());
  ipcMain.handle("dev:isDev", () => !app.isPackaged);
  ipcMain.handle("update:check", () => checkForUpdates());
  ipcMain.handle("update:apply", () => applyUpdate());
  ipcMain.handle("launch:start", async () => prepareAndLaunch(broadcastProgress));
  ipcMain.handle("install:status", (): InstallStatus => ({
    installMode: isInstallMode(),
    installed: isInstalled(),
    installDir: installDir(),
    exe: installedExe(),
    version: app.getVersion(),
  }));
  ipcMain.handle("install:start", async (_e, opts) => installApp(broadcastInstallProgress, opts));
  ipcMain.handle("install:uninstall", async () => {
    if (!isInstalled()) return;
    await uninstallApp();
  });
  ipcMain.handle("system:ramMb", () => Math.floor(os.totalmem() / 1024 / 1024));
  ipcMain.handle("game:getDir", () => getGameDir());
  ipcMain.handle("game:pickFolder", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory", "createDirectory"],
      defaultPath: getGameDir(),
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });
}

app.whenReady().then(async () => {
  app.setName("NOVACRAFT Launcher");
  fs.mkdirSync(defaultGameDir(), { recursive: true });
  ensureDirs();
  registerIpc();

  // Режим деинсталляции: без окна — удаление и выход.
  if (process.argv.includes("--uninstall") && isInstalled()) {
    await uninstallApp();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
