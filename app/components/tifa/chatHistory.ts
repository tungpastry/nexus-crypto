import {
  safeReadJson,
  safeRemoveKey,
  safeWriteJson,
} from "../../lib/clientStorage";

export type TifaChatRole = "user" | "assistant";

export type TifaChatMessage = {
  id: string;
  role: TifaChatRole;
  text: string;
};

export type TifaChatPage = "home" | "asset" | "ops";

export const TIFA_CHAT_HISTORY_LIMIT = 50;

export const TIFA_WELCOME_MESSAGE: TifaChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Chào bạn, mình là Tifa. Mình sẽ bám dữ liệu Nexus hiện có để trả lời ngắn gọn, có ngữ cảnh, và không bịa số.",
};

export function tifaChatHistoryKey(page: TifaChatPage) {
  return `tifa-chat-history:${page}`;
}

function isChatMessage(value: unknown): value is TifaChatMessage {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.role === "user" || record.role === "assistant") &&
    typeof record.text === "string"
  );
}

export function isChatMessageArray(value: unknown): value is TifaChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isChatMessage)
  );
}

export function loadChatHistory(page: TifaChatPage): TifaChatMessage[] {
  return safeReadJson<TifaChatMessage[]>(
    tifaChatHistoryKey(page),
    [TIFA_WELCOME_MESSAGE],
    isChatMessageArray
  );
}

function sanitizeHistory(messages: TifaChatMessage[]): TifaChatMessage[] {
  // Drop in-flight empty bubbles (e.g. panel closed mid-stream) and keep the
  // most recent messages so localStorage stays small.
  const nonEmpty = messages.filter((message) => message.text.trim() !== "");
  if (nonEmpty.length === 0) return [TIFA_WELCOME_MESSAGE];
  return nonEmpty.slice(-TIFA_CHAT_HISTORY_LIMIT);
}

export function persistChatHistory(page: TifaChatPage, messages: TifaChatMessage[]) {
  safeWriteJson(tifaChatHistoryKey(page), sanitizeHistory(messages));
}

export function clearChatHistory(page: TifaChatPage) {
  safeRemoveKey(tifaChatHistoryKey(page));
}
