import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ServerInfo } from "../../electron/types";
import { m, type Lang } from "../i18n";

type Props = {
  lang: Lang;
  servers: ServerInfo[];
  onPlay: (server: ServerInfo) => void;
  onViewOnSite: (server: ServerInfo) => void;
};

export function ServersPage({ lang, servers, onPlay, onViewOnSite }: Props) {
  const [selected, setSelected] = useState<ServerInfo | null>(null);

  if (selected) {
    return (
      <ServerDetail
        lang={lang}
        server={selected}
        onBack={() => setSelected(null)}
        onPlay={() => onPlay(selected)}
        onViewOnSite={() => onViewOnSite(selected)}
      />
    );
  }

  return (
    <motion.div
      className="page page-servers"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
    >
      <div className="page-hero">
        <h1 className="text-glow">{m(lang, "serversTitle")}</h1>
        <p className="text-muted">{m(lang, "serversSubtitle")}</p>
      </div>

      {servers.length === 0 ? (
        <div className="glass card empty-servers">{m(lang, "emptyServers")}</div>
      ) : (
        <div className="server-list">
          {servers.map((s, i) => (
            <motion.article
              key={s.id}
              className="server-row glass"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <button type="button" className="server-row-main" onClick={() => setSelected(s)}>
                <div className="server-row-head">
                  <strong className="server-name">{s.name}</strong>
                  <span className={`badge ${s.online > 0 ? "online" : "offline"}`}>
                    <span className="dot" />
                    {s.online}
                  </span>
                </div>
                <span className="server-version">{m(lang, "serverVersion")}: {s.version}</span>
              </button>
              <div className="server-row-actions">
                <button type="button" className="btn btn-sm" onClick={() => setSelected(s)}>
                  {m(lang, "more")}
                </button>
                <button
                  type="button"
                  className="btn btn-sm play-server-btn"
                  onClick={() => onPlay(s)}
                >
                  {m(lang, "playServer")}
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ServerDetail({
  lang,
  server: s,
  onBack,
  onPlay,
  onViewOnSite,
}: {
  lang: Lang;
  server: ServerInfo;
  onBack: () => void;
  onPlay: () => void;
  onViewOnSite: () => void;
}) {
  return (
    <motion.div
      className="page page-server-detail"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
    >
      <button type="button" className="btn btn-sm back-btn" onClick={onBack}>
        ← {m(lang, "back")}
      </button>

      <motion.article
        className="glass card server-detail"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="server-detail-head">
          <h1 className="text-glow">{s.name}</h1>
          <span className={`badge ${s.online > 0 ? "online" : "offline"}`}>
            <span className="dot" />
            {m(lang, "serverOnline")}: {s.online}
          </span>
        </div>

        <p className="server-detail-desc">{s.description}</p>

        <div className="server-meta">
          <span>{m(lang, "serverVersion")}: <strong>{s.version}</strong></span>
          <span>{m(lang, "peakOnline")}: <strong>{s.peakOnline}</strong></span>
        </div>

        {s.mods.length > 0 && (
          <div className="mods-block">
            <div className="mods-title">
              {m(lang, "modsList")} ({s.mods.length})
            </div>
            <div className="mods-grid">
              {s.mods.map((mod, i) => (
                <span key={i} className="mod-chip">
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="server-detail-actions">
          <button type="button" className="btn" onClick={onViewOnSite}>
            {m(lang, "viewOnSite")}
          </button>
          <motion.button
            type="button"
            className="btn play-server-btn"
            onClick={onPlay}
            whileHover={{ scale: 1.04, boxShadow: "var(--shadow)" }}
            whileTap={{ scale: 0.97 }}
          >
            {m(lang, "playServer")}
          </motion.button>
        </div>
      </motion.article>

      <AnimatePresence />
    </motion.div>
  );
}
