import { motion } from "framer-motion";
import { m, t, type Lang } from "../i18n";
import type { Tab } from "./TopNav";

type Props = {
  lang: Lang;
  brand: string;
  tab: Tab;
  onTab: (t: Tab) => void;
  nickname: string;
  isWhiteTheme: boolean;
  onToggleTheme: () => void;
  onProfile: () => void;
};

const NAV: { id: Tab; key: "navHome" | "navServers" | "navSettings" }[] = [
  { id: "home", key: "navHome" },
  { id: "servers", key: "navServers" },
  { id: "settings", key: "navSettings" },
];

export function SiteHeader({ lang, brand, tab, onTab, nickname, isWhiteTheme, onToggleTheme, onProfile }: Props) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="logo">
          <span className="logo-cube" aria-hidden />
          <span>{brand}</span>
        </div>

        <nav className="site-nav">
          {NAV.map((n) => (
            <motion.button
              key={n.id}
              type="button"
              className={`nav-link ${tab === n.id ? "active" : ""}`}
              onClick={() => onTab(n.id)}
              whileTap={{ scale: 0.95 }}
            >
              {t(lang, n.key)}
            </motion.button>
          ))}
        </nav>

        <div className="site-header-right">
          <button
            type="button"
            className={`theme-toggle ${isWhiteTheme ? "is-white" : ""}`}
            title={m(lang, "themeDark")}
            onClick={onToggleTheme}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0 4 12.74V17h-8v-2.26A7 7 0 0 0 12 2z" />
            </svg>
          </button>

          <motion.button
            type="button"
            className="profile-chip"
            onClick={onProfile}
            whileHover={{ boxShadow: "0 0 24px var(--glow-soft)" }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="avatar">{nickname.slice(0, 1).toUpperCase()}</span>
            <span className="profile-name">{nickname}</span>
            <span className="chev">▾</span>
          </motion.button>

          <div className="win-controls">
            <button type="button" className="win-btn" onClick={() => window.launcher.windowMinimize()}>
              ─
            </button>
            <button type="button" className="win-btn close" onClick={() => window.launcher.windowClose()}>
              ✕
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
