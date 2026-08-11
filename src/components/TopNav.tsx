import { motion } from "framer-motion";
import { t, type Lang } from "../i18n";

export type Tab = "home" | "servers" | "settings";

type Props = {
  lang: Lang;
  tab: Tab;
  onTab: (t: Tab) => void;
  loggedIn: boolean;
};

export function TopNav({ lang, tab, onTab, loggedIn }: Props) {
  const items: { id: Tab; label: string; needAuth?: boolean }[] = [
    { id: "home", label: t(lang, "navHome") },
    { id: "servers", label: t(lang, "navServers") },
    { id: "settings", label: t(lang, "navSettings"), needAuth: true },
  ];

  return (
    <nav className="top-nav">
      <div className="nav-pill glass">
        {items
          .filter((i) => !i.needAuth || loggedIn)
          .map((item) => (
            <motion.button
              key={item.id}
              type="button"
              className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => onTab(item.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.label}
            </motion.button>
          ))}
      </div>
    </nav>
  );
}
