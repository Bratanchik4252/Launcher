import { contextBridge, ipcRenderer } from "electron";
import type { LauncherAPI, LaunchProgress } from "./types";

const api: LauncherAPI = {
  getConfig: () => ipcRenderer.invoke("config:get"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (s) => ipcRenderer.invoke("settings:save", s),
  getSavedAccounts: () => ipcRenderer.invoke("accounts:list"),
  removeAccount: (id) => ipcRenderer.invoke("accounts:remove", id),
  login: (identifier, password, remember) =>
    ipcRenderer.invoke("auth:login", identifier, password, remember),
  logout: () => ipcRenderer.invoke("auth:logout"),
  getSession: () => ipcRenderer.invoke("auth:session"),
  getServerAddress: () => ipcRenderer.invoke("meta:getServerAddress"),
  openExternal: (url) => ipcRenderer.invoke("shell:open", url),
  openGameFolder: () => ipcRenderer.invoke("game:openFolder"),
  openLogsFolder: () => ipcRenderer.invoke("logs:openFolder"),
  getHwid: () => ipcRenderer.invoke("hwid:get"),
  checkHardwareBan: () => ipcRenderer.invoke("hwid:check"),
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowClose: () => ipcRenderer.invoke("window:close"),
  startDrag: () => {
    /* drag handled via CSS -webkit-app-region */
  },
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  applyUpdate: () => ipcRenderer.invoke("update:apply"),
  prepareAndLaunch: () => ipcRenderer.invoke("launch:start"),
  onLaunchProgress: (cb) => {
    const handler = (_: unknown, p: LaunchProgress) => cb(p);
    ipcRenderer.on("launch:progress", handler);
    return () => ipcRenderer.removeListener("launch:progress", handler);
  },
  isDevMode: () => ipcRenderer.invoke("dev:isDev"),
  getSystemRamMb: () => ipcRenderer.invoke("system:ramMb"),
  pickGameFolder: () => ipcRenderer.invoke("game:pickFolder"),
  getGameDirPath: () => ipcRenderer.invoke("game:getDir"),
  getInstallStatus: () => ipcRenderer.invoke("install:status"),
  installApp: () => ipcRenderer.invoke("install:start"),
  uninstallApp: () => ipcRenderer.invoke("install:uninstall"),
  onInstallProgress: (cb) => {
    const handler = (_: unknown, p: LaunchProgress) => cb(p);
    ipcRenderer.on("install:progress", handler);
    return () => ipcRenderer.removeListener("install:progress", handler);
  },
};

contextBridge.exposeInMainWorld("launcher", api);
