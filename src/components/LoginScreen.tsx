import { useState } from "react";
import { motion } from "framer-motion";
import { m, type Lang } from "../i18n";
import { ParticlesCanvas } from "./ParticlesCanvas";

type Props = {
  lang: Lang;
  brand: string;
  error?: string;
  onSubmit: (identifier: string, pass: string, remember: boolean) => void;
  onRegister: () => void;
  onForgot: () => void;
};

export function LoginScreen({ lang, brand, error, onSubmit, onRegister, onForgot }: Props) {
  const [errText, setErrText] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = String(fd.get("nick") ?? "").trim();
    const pass = String(fd.get("pass") ?? "");
    if (!id || !pass) {
      setErrText(m(lang, "INVALID_NICK"));
      return;
    }
    onSubmit(id, pass, fd.get("remember") === "on");
  };

  return (
    <div className="login-screen">
      <ParticlesCanvas />
      <div className="win-controls login-win-controls">
        <button type="button" className="win-btn" onClick={() => window.launcher.windowMinimize()}>
          ─
        </button>
        <button type="button" className="win-btn close" onClick={() => window.launcher.windowClose()}>
          ✕
        </button>
      </div>

      <motion.form
        className="login-card glass"
        onSubmit={submit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="login-logo"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span>N</span>
        </motion.div>

        <h1 className="login-title text-glow">{brand}</h1>
        <p className="login-subtitle">{m(lang, "authGateHint")}</p>

        <div className="field">
          <input name="nick" placeholder={m(lang, "nickOrEmail")} autoComplete="username" autoFocus />
        </div>
        <div className="field">
          <input
            name="pass"
            type="password"
            placeholder={m(lang, "password")}
            autoComplete="current-password"
          />
        </div>

        <label className="remember">
          <input type="checkbox" name="remember" defaultChecked />
          {m(lang, "remember")}
        </label>

        {(errText || error) && <div className="error-text">{errText || error}</div>}

        <motion.button
          type="submit"
          className="btn login-btn"
          whileHover={{ scale: 1.03, boxShadow: "var(--shadow)" }}
          whileTap={{ scale: 0.97 }}
        >
          {m(lang, "authTitle").toUpperCase()}
        </motion.button>

        <div className="login-footer">
          <button type="button" className="link-btn" onClick={onRegister}>
            {m(lang, "noAccount")} <span className="accent-link">{m(lang, "createAccount")}</span>
          </button>
          <button type="button" className="link-btn" onClick={onForgot}>
            {m(lang, "forgot")}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
