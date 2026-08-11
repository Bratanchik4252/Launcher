import { motion } from "framer-motion";
import { m, type Lang } from "../i18n";

type Props = {
  lang: Lang;
  onSupport: () => void;
};

export function BanScreen({ lang, onSupport }: Props) {
  return (
    <motion.div
      className="ban-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="ban-card glass"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="ban-icon">!</div>
        <h2>{m(lang, "banTitle")}</h2>
        <p>{m(lang, "banText")}</p>
        <motion.button
          type="button"
          className="primary-btn"
          whileHover={{ scale: 1.02, boxShadow: "0 0 40px var(--accent-glow)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onSupport}
        >
          {m(lang, "banSupport").toUpperCase()}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
