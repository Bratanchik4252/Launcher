import { motion } from "framer-motion";
import { SERVERS, type GameServer } from "../data/servers";
import { m, type Lang } from "../i18n";

type Props = {
  lang: Lang;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPlay: () => void;
};

function ServerCard({
  server,
  active,
  onClick,
  index,
}: {
  server: GameServer;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      className={`server-card glass ${active ? "active" : ""}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
    >
      <span className="server-tag">{server.tag}</span>
      <h3>{server.name}</h3>
      <div className="server-online">
        <span className="dot" />
        {server.online ?? "—"}
      </div>
    </motion.button>
  );
}

export function ServersPage({ lang, selectedId, onSelect, onPlay }: Props) {
  const selected = SERVERS.find((s) => s.id === selectedId) ?? null;

  return (
    <motion.div className="page servers-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="servers-head">
        <h2>{m(lang, "serversTitle")}</h2>
        <p>{m(lang, "serversSubtitle")}</p>
      </header>
      <div className="servers-split">
        <div className="server-grid compact">
          {SERVERS.map((s, i) => (
            <ServerCard
              key={s.id}
              server={s}
              active={s.id === selectedId}
              onClick={() => onSelect(s.id)}
              index={i}
            />
          ))}
        </div>
        <div className="server-detail glass">
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <div className="detail-meta">
                <span>{selected.version}</span>
                <span>{selected.mode}</span>
              </div>
              <p className="detail-desc">{selected.description}</p>
              <div className="mod-tags">
                {selected.modsHint.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3>{m(lang, "serverNotSelected")}</h3>
              <p className="detail-desc">{m(lang, "serverPickHint")}</p>
            </>
          )}
        </div>
      </div>
      <footer className="play-dock glass">
        <div className="choice-label">
          {m(lang, "yourChoice")}: <strong>{selected?.name ?? "—"}</strong>
        </div>
        <motion.button
          type="button"
          className="primary-btn play-btn"
          disabled={!selected}
          onClick={onPlay}
          whileHover={selected ? { scale: 1.03 } : {}}
        >
          {m(lang, "playServer").toUpperCase()}
        </motion.button>
      </footer>
    </motion.div>
  );
}
