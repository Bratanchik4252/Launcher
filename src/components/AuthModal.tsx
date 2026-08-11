import { motion, AnimatePresence } from "framer-motion";
import { m, t, type Lang, type MessageKey } from "../i18n";

type Props = {
  lang: Lang;
  open: boolean;
  title?: string;
  hint?: string;
  onClose: () => void;
  onSubmit: (identifier: string, pass: string, remember: boolean) => void;
  onRegister: () => void;
  onForgot: () => void;
  error?: string;
};

export function AuthModal({
  lang,
  open,
  title,
  hint,
  onClose,
  onSubmit,
  onRegister,
  onForgot,
  error,
}: Props) {
  const errText = error ? m(lang, error as MessageKey) || error : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            className="auth-card glass modal-auth"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              onSubmit(
                String(fd.get("nick") ?? ""),
                String(fd.get("pass") ?? ""),
                fd.get("remember") === "on",
              );
            }}
          >
            <button type="button" className="modal-close" onClick={onClose}>
              ✕
            </button>
            <h1>{title ?? m(lang, "authTitle")}</h1>
            {hint && <p className="auth-hint">{hint}</p>}
            <div className="field">
              <input name="nick" placeholder={m(lang, "nickOrEmail")} autoComplete="username" />
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
            <div className="error-text">{errText}</div>
            <motion.button
              type="submit"
              className="primary-btn"
              whileHover={{ scale: 1.02, boxShadow: "0 0 40px var(--accent-glow)" }}
              whileTap={{ scale: 0.98 }}
            >
              {t(lang, "login").toUpperCase()}
            </motion.button>
            <div className="auth-footer column">
              <button type="button" className="link-btn accent-link" onClick={onRegister}>
                {m(lang, "createAccount")}
              </button>
              <button type="button" className="link-btn" onClick={onForgot}>
                {m(lang, "forgot")}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
