import { loadConfig } from "./config";

export async function checkForUpdates(): Promise<{
  available: boolean;
  version?: string;
  message?: string;
}> {
  const { updater } = loadConfig();
  if (!updater.githubOwner || !updater.githubRepo) {
    return { available: false, message: "UPDATER_NOT_CONFIGURED" };
  }

  try {
    const api = `https://api.github.com/repos/${updater.githubOwner}/${updater.githubRepo}/releases/latest`;
    const res = await fetch(api, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "FiveLauncher" },
    });
    if (!res.ok) return { available: false };
    const data = (await res.json()) as { tag_name: string };
    const current = process.env.npm_package_version ?? "0.1.0";
    const latest = data.tag_name.replace(/^v/, "");
    if (latest !== current) {
      return { available: true, version: latest };
    }
    return { available: false };
  } catch {
    return { available: false, message: "UPDATE_CHECK_FAILED" };
  }
}

export async function applyUpdate(): Promise<void> {
  // electron-updater hooks in when publish config is set; placeholder for CI
  throw new Error("UPDATER_INSTALL_PENDING_CI");
}
