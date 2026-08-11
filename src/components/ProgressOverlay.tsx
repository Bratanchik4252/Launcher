import { AnimatePresence, motion } from "framer-motion";
import { m, type Lang } from "../i18n";
import type { LaunchProgress } from "../../electron/types";

type Props = {
  lang: Lang;
  progress: LaunchProgress | null;
};

export function ProgressOverlay({ lang, progress }: Props) {
  const title = progress?.phase === "java" ? m(lang, "javaUpdate") : m(lang, "downloading");
  const mb =
    progress && progress.bytesDone && progress.bytesTotal
      ? `${Math.round(progress.bytesDone / 1024 / 1024)}mb / ${Math.round(progress.bytesTotal / 1024 / 1024)}mb`
      : "";

  return (
    <AnimatePresence>
      {progress && (
        <motion.div
          className="progress-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="progress-card glass"
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <h3>{title}</h3>
            <div className="progress-bar">
              <span style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="progress-meta">
              <strong>{progress.percent}%</strong>
              {mb && <span>{mb}</span>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
