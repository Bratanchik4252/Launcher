import { motion } from "framer-motion";
import { m, type Lang } from "../i18n";
import { ParticlesCanvas } from "../components/ParticlesCanvas";

type Props = {
  lang: Lang;
  onPlay: () => void;
  onSite: () => void;
  onSupport: () => void;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function HomePage({ lang, onPlay, onSite, onSupport }: Props) {
  return (
    <motion.div
      className="page page-home"
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <section className="hero home-hero">
        <ParticlesCanvas />
        <div className="hero-inner">
          <motion.h1 variants={item} className="text-glow">
            {m(lang, "heroTitle")}
            <br />
            <span className="hero-accent">{m(lang, "heroAccent")}</span>
          </motion.h1>
          <motion.p variants={item} className="hero-subtitle">
            {m(lang, "heroText")}
          </motion.p>
          <motion.div variants={item} className="hero-actions">
            <motion.button
              type="button"
              className="btn btn-lg"
              onClick={onPlay}
              whileHover={{ scale: 1.04, boxShadow: "var(--shadow)" }}
              whileTap={{ scale: 0.97 }}
            >
              {m(lang, "play")}
            </motion.button>
            <motion.button
              type="button"
              className="btn btn-lg"
              onClick={onSite}
              whileHover={{ scale: 1.04, boxShadow: "var(--shadow)" }}
              whileTap={{ scale: 0.97 }}
            >
              {m(lang, "ourSite")}
            </motion.button>
          </motion.div>
        </div>
      </section>

      <div className="home-steps">
        <h2 className="section-title text-glow">{m(lang, "howToPlayTitle")}</h2>
        <div className="grid-3">
          <motion.article variants={item} className="step glass">
            <h3>{m(lang, "homeStep1")}</h3>
            <p className="text-muted step-desc">{m(lang, "homeStep1Desc")}</p>
          </motion.article>
          <motion.article variants={item} className="step glass">
            <h3>{m(lang, "homeStep2")}</h3>
            <p className="text-muted step-desc">{m(lang, "homeStep2Desc")}</p>
          </motion.article>
          <motion.article variants={item} className="step glass">
            <h3>{m(lang, "homeStep3")}</h3>
            <p className="text-muted step-desc">{m(lang, "homeStep3Desc")}</p>
          </motion.article>
        </div>
      </div>

      <motion.article
        className="news-hero glass"
        variants={item}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="news-hero-visual" />
        <div className="news-hero-body">
          <span className="news-tag">{m(lang, "newsTag")}</span>
          <h3>{m(lang, "newsTitle")}</h3>
          <p>{m(lang, "newsBody")}</p>
          <button type="button" className="btn btn-sm" onClick={onSupport}>
            {m(lang, "readUpdate")}
          </button>
        </div>
      </motion.article>
    </motion.div>
  );
}
