import { useEffect, useRef, useState } from "react";
import { LANGUAGE_OPTIONS, type Lang } from "../i18n";

type Props = {
  lang: Lang;
  onChange: (lang: Lang) => void;
};

export function LanguageSelect({ lang, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = LANGUAGE_OPTIONS.find((l) => l.id === lang);

  return (
    <div className="lang-select" ref={rootRef}>
      <button
        type="button"
        className={`lang-select-trigger ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current?.native ?? lang}</span>
        <span className="lang-select-chevron">▾</span>
      </button>
      {open && (
        <ul className="lang-select-menu glass">
          {LANGUAGE_OPTIONS.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                className={`lang-select-item ${lang === l.id ? "active" : ""}`}
                onClick={() => {
                  onChange(l.id);
                  setOpen(false);
                }}
              >
                <span>{l.native}</span>
                {lang === l.id && <span className="lang-select-check">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
