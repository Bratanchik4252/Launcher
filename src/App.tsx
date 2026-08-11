import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { AppSettings, LauncherConfig, LaunchProgress } from "../electron/types";
import { AuthModal } from "./components/AuthModal";
import { BanScreen } from "./components/BanScreen";
import { BackgroundOrbs, TitleBar } from "./components/Chrome";
import { ProgressOverlay } from "./components/ProgressOverlay";
import { TopNav, type Tab } from "./components/TopNav";
import { UpdateModal } from "./components/UpdateModal";
import { UserMenu } from "./components/UserMenu";
import { HomePage } from "./pages/HomePage";
import { ServersPage } from "./pages/ServersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { m, t, type Lang } from "./i18n";

export default function App() {
  const [config, setConfig] = useState<LauncherConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [session, setSession] = useState<{ nickname: string } | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [authError, setAuthError] = useState<string>();
  const [authOpen, setAuthOpen] = useState(false);
  const [authGate, setAuthGate] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [progress, setProgress] = useState<LaunchProgress | null>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [isDev, setIsDev] = useState(false);
  const [launchError, setLaunchError] = useState<string>();
  const [selectedServer, setSelectedServer] = useState<string | null>("main");
  const [gameDir, setGameDir] = useState("");
  const [ban, setBan] = useState<{ reason?: string } | null>(null);

  const lang: Lang = settings?.language ?? "ru";

  useEffect(() => {
    if (!settings) return;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.accent = settings.accent;
  }, [settings?.theme, settings?.accent]);

  useEffect(() => {
    void (async () => {
      const [cfg, st, dir] = await Promise.all([
        window.launcher.getConfig(),
        window.launcher.getSettings(),
        window.launcher.getGameDirPath(),
      ]);
      setConfig(cfg);
      setSettings(st);
      setGameDir(dir);

      const banCheck = await window.launcher.checkHardwareBan();
      if (banCheck.banned) {
        setBan({ reason: banCheck.reason });
        return;
      }

      const [sess, dev] = await Promise.all([
        window.launcher.getSession(),
        window.launcher.isDevMode(),
      ]);
      setSession(sess ? { nickname: sess.nickname } : null);
      setIsDev(dev);
      const upd = await window.launcher.checkForUpdates();
      if (upd.available && upd.version) setUpdateVersion(upd.version);
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
        setAuthOpen(false);
        setAuthGate(false);
        return;
      }
      setAuthError(res.message);
      return;
    }
    setSession({ nickname: res.session.nickname });
    setAuthOpen(false);
    setAuthGate(false);
  };

  const requestPlay = () => {
    if (!session) {
      setAuthGate(true);
      setAuthOpen(true);
      return;
    }
    void runLaunch();
  };

  const runLaunch = async () => {
    setLaunchError(undefined);
    setProgress({ phase: "prepare", percent: 2, detail: "start" });
    const res = await window.launcher.prepareAndLaunch();
    setProgress(null);
    if (!res.ok && res.message) setLaunchError(res.message);
  };

  if (!config || !settings) return null;

  if (ban) {
    return (
      <div className="app-shell">
        <header className="titlebar glass">
          <div className="titlebar-left">
            <div className="brand">{config.brandName}</div>
          </div>
          <div className="win-controls">
            <button type="button" className="win-btn" onClick={() => window.launcher.windowMinimize()}>
              ─
            </button>
            <button type="button" className="win-btn close" onClick={() => window.launcher.windowClose()}>
              ✕
            </button>
          </div>
        </header>
        <BackgroundOrbs />
        <BanScreen lang={lang} onSupport={() => openLink("supportDiscord")} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TitleBar
        brand={config.brandName}
        auth={{
          loggedIn: !!session,
          nickname: session?.nickname,
          onLogin: () => {
            setAuthGate(false);
            setAuthOpen(true);
          },
          onRegister: () => openLink("register"),
          onProfile: () => setProfileOpen((v) => !v),
          onLogout: async () => {
            await window.launcher.logout();
            setSession(null);
            setProfileOpen(false);
            if (tab === "settings") setTab("home");
          },
          loginLabel: t(lang, "login"),
          registerLabel: t(lang, "register"),
        }}
      />
      <BackgroundOrbs />
      <TopNav lang={lang} tab={tab} onTab={setTab} loggedIn={!!session} />
      <main className="app-body">
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <HomePage
              key="home"
              lang={lang}
              loggedIn={!!session}
              onlineLabel="—"
              onPlay={requestPlay}
              onReadUpdate={() => openLink("website")}
              onSupport={() => openLink("supportDiscord")}
            />
          )}
          {tab === "servers" && (
            <ServersPage
              key="servers"
              lang={lang}
              selectedId={selectedServer}
              onSelect={setSelectedServer}
              onPlay={requestPlay}
            />
          )}
          {tab === "settings" && session && (
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
        open={profileOpen && !!session}
        nickname={session?.nickname ?? ""}
        coins={null}
        onClose={() => setProfileOpen(false)}
        onSettings={() => {
          setProfileOpen(false);
          setTab("settings");
        }}
        onLogout={async () => {
          await window.launcher.logout();
          setSession(null);
          setProfileOpen(false);
        }}
        onWebsite={() => openLink("website")}
      />
      <AuthModal
        lang={lang}
        open={authOpen}
        title={authGate ? m(lang, "authGateTitle") : undefined}
        hint={authGate ? m(lang, "authGateHint") : undefined}
        onClose={() => setAuthOpen(false)}
        onSubmit={handleLogin}
        onRegister={() => openLink("register")}
        onForgot={() => openLink("forgotPassword")}
        error={authError}
      />
      <ProgressOverlay lang={lang} progress={progress} />
      {updateVersion && (
        <UpdateModal lang={lang} version={updateVersion} onUpdate={() => void window.launcher.applyUpdate()} />
      )}
    </div>
  );
}
