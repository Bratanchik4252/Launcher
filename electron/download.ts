import { syncModpack } from "./modpack";
import type { LaunchProgress } from "./types";

/**
 * Модпак: автоподхват с GitHub (папки mods/ и config/ репозитория ModPack).
 * Владелец заливает моды — лаунчер сам скачивает, обновляет и синкает.
 */
export async function ensureModpack(onProgress: (p: LaunchProgress) => void): Promise<void> {
  await syncModpack(onProgress);
}
