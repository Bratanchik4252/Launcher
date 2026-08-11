export type LauncherConfig = {
  brandName: string;
  /** Проект Supabase сайта (тот же, что на сайте). */
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Игра, для которой всё собирается. */
  gameVersion: string;
  forgeVersion: string;
  links: {
    website: string;
    register: string;
    forgotPassword: string;
    discord: string;
    telegram: string;
    supportDiscord: string;
  };
  modpack: {
    /** github-folder: автоподхват модов из папок репозитория (mods/, config/). */
    source: "github-folder" | "github" | "url";
    githubOwner: string;
    githubRepo: string;
    githubBranch: string;
    /** Папка в репозитории, откуда берутся моды (*.jar в gameDir/mods). */
    modsFolder: string;
    /** Папка в репозитории с конфигами (опционально). */
    configFolder: string;
    githubAssetName?: string;
    sha256?: string;
    manifestUrl?: string;
    fallbackDownloadUrl?: string;
  };
  java: {
    majorVersion: number;
    temurinJreUrl: string;
  };
  updater: {
    githubOwner: string;
    githubRepo: string;
    mandatory: boolean;
  };
  defaultRamMb: number;
  maxSavedAccounts: number;
};

export type SavedAccount = {
  id: string;
  nickname: string;
  email: string;
  savedAt: number;
};

/** Сессия входа (хранится ТОЛЬКО в DPAPI, без plaintext-фолбэка). */
export type SessionData = {
  nickname: string;
  email: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  /** expires_at (мс). Если истёк — пробуем обновить refreshToken. */
  expiresAt: number;
};

export type AuthResult =
  | { ok: true; session: SessionData }
  | {
      ok: false;
      message: string;
      banned?: boolean;
      banType?: "hwid" | "account";
      reason?: string;
    };

export type HwidCheckResult =
  | { banned: true; reason?: string }
  | { banned: false };

export type LaunchProgress = {
  phase: string;
  percent: number;
  detail?: string;
  bytesDone?: number;
  bytesTotal?: number;
};

export type AccentId = "nova" | "mono" | "royal" | "amber" | "mint" | "rose";

export type LangId = "ru" | "en" | "de" | "fr" | "es" | "uk" | "pl";

export type AppSettings = {
  ramMb: number;
  ramAuto: boolean;
  language: LangId;
  theme: "dark" | "light";
  accent: AccentId;
  rememberMe: boolean;
  gameDir: string;
  showDevLogs: boolean;
};

export type ServerAddress = {
  host: string;
  port: number;
};

export type InstallStatus = {
  installMode: boolean;
  installed: boolean;
  installDir: string;
  exe: string;
  version: string;
};

export type InstallOptions = {
  launchAfter?: boolean;
  autoStart?: boolean;
};

export type LauncherAPI = {
  getConfig: () => Promise<LauncherConfig>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (s: Partial<AppSettings>) => Promise<AppSettings>;
  getSavedAccounts: () => Promise<SavedAccount[]>;
  removeAccount: (id: string) => Promise<void>;
  /** Вход по нику ИЛИ email. */
  login: (identifier: string, password: string, remember: boolean) => Promise<AuthResult>;
  logout: () => Promise<void>;
  getSession: () => Promise<SessionData | null>;
  openExternal: (url: string) => Promise<void>;
  openGameFolder: () => Promise<void>;
  openLogsFolder: () => Promise<void>;
  getHwid: () => Promise<string>;
  checkHardwareBan: () => Promise<HwidCheckResult>;
  getServerAddress: () => Promise<ServerAddress>;
  windowMinimize: () => void;
  windowClose: () => void;
  startDrag: () => void;
  checkForUpdates: () => Promise<{ available: boolean; version?: string; message?: string }>;
  applyUpdate: () => Promise<void>;
  prepareAndLaunch: () => Promise<{ ok: boolean; message?: string }>;
  onLaunchProgress: (cb: (p: LaunchProgress) => void) => () => void;
  isDevMode: () => Promise<boolean>;
  getSystemRamMb: () => Promise<number>;
  pickGameFolder: () => Promise<string | null>;
  getGameDirPath: () => Promise<string>;
  getInstallStatus: () => Promise<InstallStatus>;
  installApp: (opts?: InstallOptions) => Promise<void>;
  uninstallApp: () => Promise<void>;
  onInstallProgress: (cb: (p: LaunchProgress) => void) => () => void;
};

declare global {
  interface Window {
    launcher: LauncherAPI;
  }
}

export {};
