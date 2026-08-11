import { motion, AnimatePresence } from "framer-motion";
import { m, type Lang } from "../i18n";

type Props = {
  lang: Lang;
  open: boolean;
  nickname: string;
  coins: number | null;
  onClose: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onWebsite: () => void;
};

export function UserMenu({
  lang,
  open,
  nickname,
  coins,
  onClose,
  onSettings,
  onLogout,
  onWebsite,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="menu-scrim" onClick={onClose} />
          <motion.aside
            className="user-menu glass"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
          >
            <div className="user-menu-head">
              <span className="avatar lg">{nickname.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{nickname}</strong>
                <span className="role-tag">{m(lang, "player")}</span>
              </div>
            </div>
            <div className="coin-row glass-inset">
              <div>
                <small>{m(lang, "coins")}</small>
                <strong>{coins ?? "—"}</strong>
                <p className="coin-hint">{m(lang, "claimOnSite")}</p>
              </div>
              <button type="button" className="chip-btn" onClick={onWebsite}>
                {m(lang, "website")}
              </button>
            </div>
            <button type="button" className="secondary-btn menu-btn" onClick={onSettings}>
              {m(lang, "profileSettings")}
            </button>
            <button type="button" className="secondary-btn menu-btn danger" onClick={onLogout}>
              {m(lang, "logout")}
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
