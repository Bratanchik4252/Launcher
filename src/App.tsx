import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { AppSettings, InstallStatus, LauncherConfig, LaunchProgress, ServerInfo } from "../electron/types";
import { BanScreen } from "./components/BanScreen";
import { InstallScreen } from "./components/InstallScreen";
import { LoginScreen } from "./components/LoginScreen";
import { ProgressOverlay } from "./components/ProgressOverlay";
import { SiteHeader } from "./components/SiteHeader";
import { UpdateModal } from "./components/UpdateModal";
import { UserMenu } from "./components/UserMenu";
import type { Tab } from "./components/TopNav";
import { HomePage } from "./pages/HomePage";
import { ServersPage } from "./pages/ServersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { m, type Lang } from "./i18n";

export default function App() {
  const [config, setConfig] = useState<LauncherConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [session, setSession] = useState<{ nickname: string } | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [authError, setAuthError] = useState<string>();
  const [profileOpen, setProfileOpen] = useState(false);
  const [progress, setProgress] = useState<LaunchProgress | null>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [isDev, setIsDev] = useState(false);
  const [launchError, setLaunchError] = useState<string>();
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [gameDir, setGameDir] = useState("");
  const [ban, setBan] = useState<{ reason?: string } | null>(null);
  const [installStatus, setInstallStatus] = useState<InstallStatus | null>(null);

  const lang: Lang = settings?.language ?? "ru";

  useEffect(() => {
    if (!settings) return;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.accent = settings.accent;
  }, [settings?.theme, settings?.accent]);

  useEffect(() => {
    void (async () => {
      const install = await window.launcher.getInstallStatus();
      setInstallStatus(install);
      if (install.installMode) return;

      const [cfg, st, dir] = await Promise.all([
        window.launcher.getConfig(),
        window.launcher.getSettings(),
        window.launcher.getGameDirPath(),
      ]);
      setConfig(cfg);
      setSettings(st);
      setGameDir(dir);

      const [sess, dev] = await Promise.all([
        window.launcher.getSession(),
        window.launcher.isDevMode(),
      ]);
      setSession(sess ? { nickname: sess.nickname } : null);
      setIsDev(dev);

      if (sess) {
        const banCheck = await window.launcher.checkHardwareBan();
        if (banCheck.banned) {
          setBan({ reason: banCheck.reason });
          return;
        }
        const [srv, upd] = await Promise.all([
          window.launcher.getServers(),
          window.launcher.checkForUpdates(),
        ]);
        setServers(srv);
        if (upd.available && upd.version) setUpdateVersion(upd.version);
      }
    })();

    return window.launcher.onLaunchProgress((p) => {
      setProgress(p);
      if (p.percent >= 100) setTimeout(() => setProgress(null), 600);
    });
  }, []);

  const saveSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await window.launcher.saveSettings(patch);
    setSettings(next);
    if (patch.gameDir !== undefined) setGameDir(patch.gameDir);
    else if (Object.keys(patch).length) {
      const dir = await window.launcher.getGameDirPath();
      setGameDir(dir);
    }
  }, []);

  const openLink = (key: keyof LauncherConfig["links"]) => {
    if (!config) return;
    void window.launcher.openExternal(config.links[key]);
  };

  const handleLogin = async (identifier: string, pass: string, remember: boolean) => {
    setAuthError(undefined);
    const res = await window.launcher.login(identifier, pass, remember);
    if (!res.ok) {
      if (res.banned) {
        setBan({ reason: res.reason });
        return;
      }
      setAuthError(res.message);
      return;
    }
    setSession({ nickname: res.session.nickname });
    setTab("home");
    const [banCheck, srv, upd] = await Promise.all([
      window.launcher.checkHardwareBan(),
      window.launcher.getServers(),
      window.launcher.checkForUpdates(),
    ]);
    if (banCheck.banned) setBan({ reason: banCheck.reason });
    setServers(srv);
    if (upd.available && upd.version) setUpdateVersion(upd.version);
  };

  const handleLogout = async () => {
    await window.launcher.logout();
    setSession(null);
    setProfileOpen(false);
    setServers([]);
  };

  const runLaunch = async () => {
    setLaunchError(undefined);
    setProgress({ phase: "prepare", percent: 2, detail: "start" });
    const res = await window.launcher.prepareAndLaunch();
    setProgress(null);
    if (!res.ok && res.message) setLaunchError(res.message);
  };

  if (installStatus?.installMode) {
    return (
      <div className="app-shell">
        <InstallScreen status={installStatus} lang={lang} />
      </div>
    );
  }

  if (!config || !settings) return null;

  if (ban) {
    return (
      <div className="app-shell">
        <header className="site-header">
          <div className="site-header-inner">
            <div className="logo">
              <span className="logo-cube" aria-hidden />
              <span>{config.brandName}</span>
            </div>
            <div className="win-controls">
              <button type="button" className="win-btn" onClick={() => window.launcher.windowMinimize()}>
                ─
              </button>
              <button type="button" className="win-btn close" onClick={() => window.launcher.windowClose()}>
                ✕
              </button>
            </div>
          </div>
        </header>
        <BanScreen lang={lang} onSupport={() => openLink("supportDiscord")} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <LoginScreen
          lang={lang}
          brand={config.brandName}
          error={authError}
          onSubmit={handleLogin}
          onRegister={() => openLink("register")}
          onForgot={() => openLink("forgotPassword")}
        />
        <ProgressOverlay lang={lang} progress={progress} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader
        lang={lang}
        brand={config.brandName}
        tab={tab}
        onTab={setTab}
        nickname={session.nickname}
        isWhiteTheme={settings.theme === "light"}
        onToggleTheme={() =>
          void saveSettings({ theme: settings.theme === "light" ? "dark" : "light" })
        }
        onProfile={() => setProfileOpen((v) => !v)}
      />
      <main className="app-body">
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <HomePage
              key="home"
              lang={lang}
              onPlay={runLaunch}
              onSite={() => openLink("website")}
              onSupport={() => openLink("supportDiscord")}
            />
          )}
          {tab === "servers" && (
            <ServersPage
              key="servers"
              lang={lang}
              servers={servers}
              onPlay={() => runLaunch()}
              onViewOnSite={() => openLink("serversPage")}
            />
          )}
          {tab === "settings" && (
            <SettingsPage
              key="settings"
              lang={lang}
              settings={settings}
              onChange={(p) => void saveSettings(p)}
              isDev={isDev}
              gameDir={gameDir}
            />
          )}
        </AnimatePresence>
        {launchError && (
          <p className="error-text launch-error">
            {m(lang, launchError as keyof typeof import("./i18n").messages.ru) || launchError}
          </p>
        )}
      </main>
      <UserMenu
        lang={lang}
        open={profileOpen}
        nickname={session.nickname}
        coins={null}
        onClose={() => setProfileOpen(false)}
        onSettings={() => {
          setProfileOpen(false);
          setTab("settings");
        }}
        onLogout={() => void handleLogout()}
        onWebsite={() => openLink("website")}
      />
      <ProgressOverlay lang={lang} progress={progress} />
      {updateVersion && (
        <UpdateModal lang={lang} version={updateVersion} onUpdate={() => void window.launcher.applyUpdate()} />
      )}
    </div>
  );
}
