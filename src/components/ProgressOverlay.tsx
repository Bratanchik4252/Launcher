import { m, type Lang } from "../i18n";
import type { LaunchProgress } from "../../electron/types";

type Props = {
  lang: Lang;
  progress: LaunchProgress | null;
};

export function ProgressOverlay({ lang, progress }: Props) {
  if (!progress) return null;

  const title = progress.phase === "java" ? m(lang, "javaUpdate") : m(lang, "downloading");
  const mb =
    progress.bytesDone && progress.bytesTotal
      ? `${Math.round(progress.bytesDone / 1024 / 1024)}mb / ${Math.round(progress.bytesTotal / 1024 / 1024)}mb`
      : "";

  return (
    <div className="progress-overlay">
      <div className="progress-card glass">
        <h3>{title}</h3>
        <div className="progress-bar">
          <span style={{ width: `${progress.percent}%` }} />
        </div>
        <strong>{progress.percent}%</strong>
        {mb && <div style={{ color: "var(--text-muted)", marginTop: 8 }}>{mb}</div>}
      </div>
    </div>
  );
}
