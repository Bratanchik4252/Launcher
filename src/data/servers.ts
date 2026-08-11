export type GameServer = {
  id: string;
  name: string;
  version: string;
  tag: string;
  online: number | null;
  mode: string;
  description: string;
  modsHint: string[];
};

export const SERVERS: GameServer[] = [
  {
    id: "main",
    name: "Основной",
    version: "1.12.2",
    tag: "СБОРКА",
    online: null,
    mode: "PVE",
    description:
      "Главный сервер проекта. Сборка с модами и своими дополнениями — описание и список модов добавим, когда сборка будет на GitHub.",
    modsHint: ["Forge", "Свои моды", "…"],
  },
  {
    id: "test",
    name: "Тестовый",
    version: "1.12.2",
    tag: "СКОРО",
    online: null,
    mode: "PVE",
    description: "Запасной режим для тестов. Пока недоступен для входа из лаунчера.",
    modsHint: ["Скоро"],
  },
];
