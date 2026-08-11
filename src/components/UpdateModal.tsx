import { m, type Lang } from "../i18n";

type Props = {
  lang: Lang;
  version?: string;
  onUpdate: () => void;
};

export function UpdateModal({ lang, version, onUpdate }: Props) {
  return (
    <div className="modal-backdrop">
      <div className="modal glass">
        <h3>{m(lang, "updateTitle")}</h3>
        <p style={{ color: "var(--text-muted)" }}>
          {m(lang, "updateText")}
          {version ? ` (${version})` : ""}
        </p>
        <button type="button" className="primary-btn" onClick={onUpdate}>
          {m(lang, "updateBtn")}
        </button>
      </div>
    </div>
  );
}
