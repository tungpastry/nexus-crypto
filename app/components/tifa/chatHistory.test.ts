import { afterEach, describe, expect, it } from "vitest";
import {
  TIFA_CHAT_HISTORY_LIMIT,
  TIFA_WELCOME_MESSAGE,
  clearChatHistory,
  isChatMessageArray,
  loadChatHistory,
  persistChatHistory,
  tifaChatHistoryKey,
  type TifaChatMessage,
} from "./chatHistory";

function makeStore() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}

describe("tifa chat history", () => {
  afterEach(() => {
    // @ts-expect-error test-only window stub
    delete globalThis.window;
  });

  it("uses per-page keys", () => {
    expect(tifaChatHistoryKey("home")).toBe("tifa-chat-history:home");
    expect(tifaChatHistoryKey("asset")).toBe("tifa-chat-history:asset");
    expect(tifaChatHistoryKey("ops")).toBe("tifa-chat-history:ops");
  });

  it("rejects malformed stored history", () => {
    expect(isChatMessageArray([])).toBe(false);
    expect(isChatMessageArray(null)).toBe(false);
    expect(isChatMessageArray([{ id: "a", role: "user" }])).toBe(false);
    expect(isChatMessageArray([{ id: "a", role: "bot", text: "hi" }])).toBe(false);
    expect(
      isChatMessageArray([{ id: "a", role: "user", text: "hi" }])
    ).toBe(true);
  });

  it("falls back to welcome without a browser store", () => {
    expect(loadChatHistory("home")).toEqual([TIFA_WELCOME_MESSAGE]);
  });

  it("round-trips history per page and clears it", () => {
    // @ts-expect-error test-only window stub
    globalThis.window = { localStorage: makeStore() };
    const messages: TifaChatMessage[] = [
      { id: "u1", role: "user", text: "hello" },
      { id: "a1", role: "assistant", text: "hi there" },
    ];

    persistChatHistory("asset", messages);
    expect(loadChatHistory("asset")).toEqual(messages);
    // Other pages are isolated.
    expect(loadChatHistory("home")).toEqual([TIFA_WELCOME_MESSAGE]);

    clearChatHistory("asset");
    expect(loadChatHistory("asset")).toEqual([TIFA_WELCOME_MESSAGE]);
  });

  it("drops empty in-flight bubbles and caps stored length", () => {
    // @ts-expect-error test-only window stub
    globalThis.window = { localStorage: makeStore() };
    const messages: TifaChatMessage[] = Array.from(
      { length: TIFA_CHAT_HISTORY_LIMIT + 10 },
      (_, index) => ({
        id: `u${index}`,
        role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
        text: `msg ${index}`,
      })
    );
    messages.push({ id: "empty", role: "assistant", text: "   " });

    persistChatHistory("ops", messages);
    const loaded = loadChatHistory("ops");
    expect(loaded).toHaveLength(TIFA_CHAT_HISTORY_LIMIT);
    expect(loaded.some((item) => item.id === "empty")).toBe(false);
    expect(loaded[loaded.length - 1].id).toBe(`u${TIFA_CHAT_HISTORY_LIMIT + 9}`);
  });

  it("falls back to welcome for corrupt stored data", () => {
    const store = makeStore();
    // @ts-expect-error test-only window stub
    globalThis.window = { localStorage: store };
    store.setItem(tifaChatHistoryKey("home"), "not-json{{{");
    expect(loadChatHistory("home")).toEqual([TIFA_WELCOME_MESSAGE]);

    store.setItem(tifaChatHistoryKey("home"), JSON.stringify([{ nope: true }]));
    expect(loadChatHistory("home")).toEqual([TIFA_WELCOME_MESSAGE]);
  });
});
