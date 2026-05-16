import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { getTifaRuntimeConfig, resolveRuntimePath } from "./config";

type ChatSessionRecord = {
  request_id: string;
  timestamp_utc: string;
  message: string;
  answer: string;
  context?: Record<string, unknown>;
  provider: string;
  model: string;
};

export async function appendTifaChatSession(record: ChatSessionRecord) {
  const runtimeDir = resolveRuntimePath(getTifaRuntimeConfig().runtimeDir);
  const sessionDir = path.join(runtimeDir, "tifa_chat_sessions");
  await mkdir(sessionDir, { recursive: true });

  const day = new Date().toISOString().slice(0, 10);
  const filePath = path.join(sessionDir, `${day}.jsonl`);
  await appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");
}
