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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function HomePage({ lang, loggedIn, onlineLabel, onPlay, onReadUpdate, onSupport }: Props) {
  return (
    <motion.div
      className="page page-home"
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="home-grid">
        <div className="hero">
          <motion.h2 variants={item}>
            {m(lang, "heroTitle")} <span>{m(lang, "heroAccent")}</span>
          </motion.h2>
          <motion.p variants={item}>{m(lang, "heroText")}</motion.p>
          <motion.div variants={item} className="stats">
            <div className="stat glass">
              <strong>{onlineLabel}</strong>
              {m(lang, "online")}
            </div>
          </motion.div>
          <motion.button
            variants={item}
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
          initial={{ opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="news-hero-visual" />
          <div className="news-hero-body">
            <span className="news-tag">{m(lang, "newsTag")}</span>
            <h3>{m(lang, "newsTitle")}</h3>
            <p>{m(lang, "newsBody")}</p>
          </div>
        </motion.article>
      </div>
      <motion.footer
        className="play-dock glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <button type="button" className="ghost-btn" onClick={onSupport}>
          {m(lang, "support")}
        </button>
        <motion.button
          type="button"
          className="primary-btn play-btn"
          onClick={onPlay}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {m(lang, "play").toUpperCase()}
        </motion.button>
        {!loggedIn && <span className="play-hint">{m(lang, "signInToLaunch")}</span>}
      </motion.footer>
    </motion.div>
  );
}
