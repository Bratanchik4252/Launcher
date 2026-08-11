import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AppSettings } from "../../electron/types";
import { LanguageSelect } from "../components/LanguageSelect";
import { ACCENT_OPTIONS, m, type Lang } from "../i18n";

type Section = "folder" | "theme" | "lang" | "ram" | "admin" | "other";

type Props = {
  lang: Lang;
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  isDev: boolean;
  gameDir: string;
};

const RAM_MAX = 65536;
const RAM_MIN = 1024;

export function SettingsPage({ lang, settings, onChange, isDev, gameDir }: Props) {
  const [section, setSection] = useState<Section>("folder");
  const [systemRam, setSystemRam] = useState(16384);

  useEffect(() => {
    void window.launcher.getSystemRamMb().then(setSystemRam);
  }, []);

  const sections: { id: Section; label: string }[] = [
    { id: "folder", label: m(lang, "settingsFolder") },
    { id: "theme", label: m(lang, "settingsTheme") },
    { id: "lang", label: m(lang, "language") },
    { id: "ram", label: m(lang, "settingsRam") },
    ...(isDev ? [{ id: "admin" as const, label: m(lang, "settingsAdmin") }] : []),
    { id: "other", label: m(lang, "settingsOther") },
  ];

  const ramGb = (settings.ramMb / 1024).toFixed(1);

  return (
    <div className="page settings-page">
      <div className="settings-banner glass" />
      <div className="settings-body">
        <aside className="settings-nav">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`settings-nav-item ${section === s.id ? "active" : ""}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </aside>
        <div className="settings-content">
          {section === "folder" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>{m(lang, "settingsFolder")}</h2>
              <div className="settings-card glass">
                <p>{m(lang, "folderHint")}</p>
                <div className="folder-row">
                  <code className="folder-path">{gameDir}</code>
                  <button
                    type="button"
                    className="outline-btn sm"
                    onClick={async () => {
                      const picked = await window.launcher.pickGameFolder();
                      if (picked) onChange({ gameDir: picked });
                    }}
                  >
                    {m(lang, "changeFolder").toUpperCase()}
                  </button>
                </div>
                <button type="button" className="link-btn" onClick={() => window.launcher.openGameFolder()}>
                  {m(lang, "openGameFolder").toUpperCase()}
                </button>
              </div>
            </motion.div>
          )}
          {section === "theme" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>{m(lang, "settingsTheme")}</h2>
              <div className="settings-card glass theme-list">
                <div className="settings-row" style={{ marginBottom: 16 }}>
                  <button
                    type="button"
                    className={`chip ${settings.theme === "dark" ? "active" : ""}`}
                    onClick={() => onChange({ theme: "dark" })}
                  >
                    {m(lang, "themeDark")}
                  </button>
                  <button
                    type="button"
                    className={`chip ${settings.theme === "light" ? "active" : ""}`}
                    onClick={() => onChange({ theme: "light" })}
                  >
                    {m(lang, "themeLight")}
                  </button>
                </div>
                {ACCENT_OPTIONS.map((a) => (
                  <label key={a.id} className={`theme-option ${settings.accent === a.id ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="accent"
                      checked={settings.accent === a.id}
                      onChange={() => onChange({ accent: a.id })}
                    />
                    <span className="swatch" style={{ background: a.color }} />
                    <span>{lang === "ru" ? a.ru : a.en}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
          {section === "lang" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>{m(lang, "language")}</h2>
              <div className="settings-card glass">
                <LanguageSelect lang={lang} onChange={(l) => onChange({ language: l })} />
              </div>
            </motion.div>
          )}
          {section === "ram" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>{m(lang, "settingsRam")}</h2>
              <div className="settings-card glass">
                <strong>
                  {m(lang, "ram")} — {ramGb} GB
                </strong>
                <p className="muted">{m(lang, "ramRecommended")}</p>
                <div className="ram-track">
                  <input
                    type="range"
                    min={RAM_MIN}
                    max={RAM_MAX}
                    step={512}
                    disabled={settings.ramAuto}
                    value={settings.ramMb}
                    onChange={(e) => onChange({ ramMb: Number(e.target.value), ramAuto: false })}
                  />
                  <div className="ram-marks">
                    <span>8 GB</span>
                    <span className="rec">8–16 GB</span>
                    <span>64 GB</span>
                  </div>
                </div>
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={settings.ramAuto}
                    onChange={(e) =>
                      onChange({
                        ramAuto: e.target.checked,
                        ramMb: e.target.checked ? Math.min(16384, Math.max(8192, Math.floor(systemRam / 4))) : settings.ramMb,
                      })
                    }
                  />
                  {m(lang, "ramAuto")}
                </label>
              </div>
            </motion.div>
          )}
          {section === "admin" && isDev && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>{m(lang, "settingsAdmin")}</h2>
              <div className="settings-card glass">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={settings.showDevLogs}
                    onChange={(e) => onChange({ showDevLogs: e.target.checked })}
                  />
                  {m(lang, "openLogs")}
                </label>
                {settings.showDevLogs && (
                  <button type="button" className="secondary-btn" onClick={() => window.launcher.openLogsFolder()}>
                    {m(lang, "openGameFolder")}
                  </button>
                )}
              </div>
            </motion.div>
          )}
          {section === "other" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>{m(lang, "settingsOther")}</h2>
              <div className="settings-card glass">
                <div className="settings-row" style={{ alignItems: "center", gap: 16 }}>
                  <span>{m(lang, "language")}</span>
                  <LanguageSelect lang={lang} onChange={(l) => onChange({ language: l })} />
                </div>
                <p className="muted">{m(lang, "otherHint")}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
