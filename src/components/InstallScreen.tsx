import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { InstallStatus, LaunchProgress } from "../../electron/types";
import { m, type Lang } from "../i18n";

const STEPS: { key: "INSTALL_COPY" | "INSTALL_SHORTCUTS" | "INSTALL_REGISTER"; labelKey: keyof typeof import("../i18n").messages.ru }[] = [
  { key: "INSTALL_COPY", labelKey: "installCopying" },
  { key: "INSTALL_SHORTCUTS", labelKey: "installShortcuts" },
  { key: "INSTALL_REGISTER", labelKey: "installRegister" },
];

const STEP_ORDER: Record<string, number> = {
  INSTALL_COPY: 0,
  INSTALL_SHORTCUTS: 1,
  INSTALL_REGISTER: 2,
};

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">{label}</span>
      <motion.button
        type="button"
        className={`toggle ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        whileTap={{ scale: 0.92 }}
        aria-pressed={checked}
      >
        <motion.span
          className="toggle-knob"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}

export function InstallScreen({ status, lang }: { status: InstallStatus; lang: Lang }) {
  const [progress, setProgress] = useState<LaunchProgress | null>(null);
  const [error, setError] = useState<string>();
  const [running, setRunning] = useState(false);
  const [launchAfter, setLaunchAfter] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const [displayStep, setDisplayStep] = useState(-1);
  const doneRef = useRef(false);

  useEffect(() => {
    return window.launcher.onInstallProgress((p) => {
      setProgress(p);
      if (p.percent >= 100) doneRef.current = true;
    });
  }, []);

  const currentStep =
    progress && progress.detail && progress.detail in STEP_ORDER ? STEP_ORDER[progress.detail] : -1;
  const percent = progress?.percent ?? 0;
  const installing = running && !doneRef.current && !error;

  useEffect(() => {
    if (!installing) return;
    const t = setInterval(() => {
      setDisplayStep((d) => {
        if (d >= STEPS.length - 1) return d;
        const target = doneRef.current ? STEPS.length : currentStep;
        return target > d ? d + 1 : d;
      });
    }, 750);
    return () => clearInterval(t);
  }, [installing, currentStep]);

  const start = async () => {
    setRunning(true);
    setError(undefined);
    try {
      await window.launcher.installApp({ launchAfter, autoStart });
    } catch (e) {
      setError(e instanceof Error ? e.message : "INSTALL_FAILED");
      setRunning(false);
    }
  };

  return (
    <div className="install-screen">
      <div className="install-rings" aria-hidden>
        <motion.div
          className="install-ring r1"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="install-ring r2"
          animate={{ scale: [1.15, 1, 1.15], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
      </div>

      <motion.div
        className="install-card glass"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="install-logo"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span>N</span>
        </motion.div>

        <h2 className="install-title">{m(lang, "installTitle")}</h2>
        <p className="install-desc">{m(lang, "installDesc")}</p>

        <div className="install-path">{status.installDir}</div>

        <div className="install-steps">
          {STEPS.map((s, i) => {
            const state = displayStep > i ? "done" : displayStep === i ? "active" : "idle";
            return (
              <div key={s.key} className={`install-step ${state}`}>
                <motion.div
                  className="step-dot"
                  animate={state === "active" ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.9, repeat: state === "active" ? Infinity : 0 }}
                >
                  {state === "done" ? "✓" : ""}
                </motion.div>
                <span className="step-label">{m(lang, s.labelKey)}</span>
              </div>
            );
          })}
        </div>

        <div className="install-options">
          <Toggle checked={launchAfter} onChange={setLaunchAfter} label={m(lang, "installLaunchAfter")} disabled={installing} />
          <Toggle checked={autoStart} onChange={setAutoStart} label={m(lang, "installAutoStart")} disabled={installing} />
        </div>

        <div className="install-bar-wrap">
          <div className="install-bar">
            <motion.div
              className="install-bar-fill"
              animate={{ width: `${percent}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
            <motion.div
              className="install-bar-shine"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p key="err" className="install-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {m(lang, "installError")}: {error}
            </motion.p>
          ) : installing ? (
            <motion.p key="run" className="install-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {percent >= 100
                ? m(lang, "installLaunching")
                : progress?.detail && progress.detail in STEP_ORDER
                  ? m(lang, STEPS[STEP_ORDER[progress.detail]].labelKey) + "..."
                  : m(lang, "installCopying") + "..."}
            </motion.p>
          ) : (
            <motion.div key="btn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <button type="button" className="primary-btn install-btn" onClick={start} disabled={running}>
                {m(lang, "installBtn")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
