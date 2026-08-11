import fs from "node:fs";
import path from "node:path";
import { getLogsDir } from "./config";

export function appendLog(channel: string, line: string): void {
  const dir = getLogsDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${channel}.log`);
  const stamp = new Date().toISOString();
  fs.appendFileSync(file, `[${stamp}] ${line}\n`, "utf8");
}
