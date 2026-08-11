import { motion } from "framer-motion";

type AuthProps = {
  loggedIn: boolean;
  nickname?: string;
  onLogin: () => void;
  onRegister: () => void;
  onProfile: () => void;
  onLogout: () => void;
  loginLabel: string;
  registerLabel: string;
};

type Props = {
  brand: string;
  auth: AuthProps;
};

export function TitleBar({ brand, auth }: Props) {
  return (
    <header className="titlebar glass">
      <div className="titlebar-left">
        <div className="brand">{brand}</div>
        {!auth.loggedIn ? (
          <div className="auth-cluster">
            <motion.button
              type="button"
              className="auth-btn ghost"
              onClick={auth.onLogin}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {auth.loginLabel}
            </motion.button>
            <motion.button
              type="button"
              className="auth-btn outline"
              onClick={auth.onRegister}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {auth.registerLabel}
            </motion.button>
          </div>
        ) : (
          <motion.button
            type="button"
            className="profile-chip"
            onClick={auth.onProfile}
            whileHover={{ boxShadow: "0 0 24px var(--accent-glow)" }}
          >
            <span className="avatar">{auth.nickname?.slice(0, 1).toUpperCase()}</span>
            <span>{auth.nickname}</span>
            <span className="chev">▾</span>
          </motion.button>
        )}
      </div>
      <div className="win-controls">
        <button type="button" className="win-btn" onClick={() => window.launcher.windowMinimize()}>
          ─
        </button>
        <button type="button" className="win-btn close" onClick={() => window.launcher.windowClose()}>
          ✕
        </button>
      </div>
    </header>
  );
}

export function BackgroundOrbs() {
  return (
    <div className="bg-orbs" aria-hidden>
      <motion.div
        className="orb a"
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 9, repeat: Infinity }}
      />
      <motion.div
        className="orb b"
        animate={{ scale: [1, 1.06, 1], x: [0, 20, 0] }}
        transition={{ duration: 11, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="orb c"
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 7, repeat: Infinity }}
      />
    </div>
  );
}
