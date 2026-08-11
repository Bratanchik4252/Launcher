import { motion } from "framer-motion";
import { m, type Lang } from "../i18n";

type Props = {
  lang: Lang;
  loggedIn: boolean;
  onlineLabel: string;
  onPlay: () => void;
  onReadUpdate: () => void;
  onSupport: () => void;
};

export function HomePage({ lang, loggedIn, onlineLabel, onPlay, onReadUpdate, onSupport }: Props) {
  return (
    <motion.div
      className="page page-home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="home-grid">
        <div className="hero">
          <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {m(lang, "heroTitle")} <span>{m(lang, "heroAccent")}</span>
          </motion.h2>
          <p>{m(lang, "heroText")}</p>
          <div className="stats">
            <div className="stat glass">
              <strong>{onlineLabel}</strong>
              {m(lang, "online")}
            </div>
          </div>
          <motion.button
            type="button"
            className="outline-btn read-update-btn"
            onClick={onReadUpdate}
            whileHover={{ scale: 1.02, borderColor: "var(--accent)" }}
          >
            {m(lang, "readUpdate").toUpperCase()}
          </motion.button>
        </div>
        <motion.article
          className="news-hero glass"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="news-hero-visual" />
          <div className="news-hero-body">
            <span className="news-tag">{m(lang, "newsTag")}</span>
            <h3>{m(lang, "newsTitle")}</h3>
            <p>{m(lang, "newsBody")}</p>
          </div>
        </motion.article>
      </div>
      <footer className="play-dock glass">
        <button type="button" className="ghost-btn" onClick={onSupport}>
          {m(lang, "support")}
        </button>
        <motion.button
          type="button"
          className="primary-btn play-btn"
          onClick={onPlay}
          whileHover={{ scale: 1.03, boxShadow: "0 0 48px var(--accent-glow)" }}
          whileTap={{ scale: 0.97 }}
        >
          {m(lang, "play").toUpperCase()}
        </motion.button>
        {!loggedIn && (
          <span className="play-hint">{m(lang, "signInToLaunch")}</span>
        )}
      </footer>
    </motion.div>
  );
}
