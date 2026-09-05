"use client";

import { Send, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TifaPageContext } from "../../lib/tifa-core/types";
import { safeReadJson, safeWriteJson } from "../../lib/clientStorage";
import TifaBudgetBadge from "./TifaBudgetBadge";
import TifaMessageBubble from "./TifaMessageBubble";
import TifaAvatar from "./TifaAvatar";
import TifaProviderBadge from "./TifaProviderBadge";
import TifaQuickActions from "./TifaQuickActions";
import { useTifaSpeech } from "./useTifaSpeech";
import {
  TIFA_WELCOME_MESSAGE,
  clearChatHistory,
  loadChatHistory,
  persistChatHistory,
  type TifaChatMessage,
} from "./chatHistory";

type TifaChatPanelProps = {
  page: "home" | "asset" | "ops";
  context?: TifaPageContext;
  onClose: () => void;
};

type ChatMessage = TifaChatMessage;

type BudgetBadgeState = {
  status: "ok" | "degraded" | "blocked";
  reason?: string;
};

const HOME_ACTIONS = [
  {
    id: "market-summary",
    label: "Market Snapshot",
    prompt: "Market hôm nay thế nào? Tóm tắt market cap, volume và dominance.",
  },
  {
    id: "top-weak",
    label: "Top mạnh/yếu",
    prompt: "Top 10 asset nào mạnh nhất và yếu nhất trong 24h?",
  },
  {
    id: "btc-dom",
    label: "BTC Dominance",
    prompt: "BTC dominance hiện tại nói gì về market context?",
  },
];

const ASSET_ACTIONS = [
  {
    id: "analyze-asset",
    label: "Analyze Current Asset",
    prompt: "Phân tích asset hiện tại theo Nexus Decision Matrix.",
  },
  {
    id: "explain-score",
    label: "Explain Nexus Score",
    prompt: "Giải thích Nexus Score và state hiện tại theo ngôn ngữ dễ hiểu.",
  },
  {
    id: "explain-rules",
    label: "Explain Rules",
    prompt: "Nêu 5 rules quan trọng nhất và điều gì cần quan sát tiếp.",
  },
  {
    id: "risk-context",
    label: "Risk Context",
    prompt: "Giải thích risk context, ATR, volatility, và volume ratio cho asset này.",
  },
];

const OPS_ACTIONS = [
  {
    id: "ops-summary",
    label: "Ops Summary",
    prompt: "Cho tôi ops executive summary hiện tại.",
  },
  {
    id: "provider-health",
    label: "Provider Health",
    prompt: "Tóm tắt provider health hiện tại và điểm cần theo dõi.",
  },
  {
    id: "deep-health",
    label: "Deep Health",
    prompt: "Tóm tắt deep health cho toàn bộ Binance-enabled symbols.",
  },
  {
    id: "budget-status",
    label: "Gemini Budget",
    prompt: "Cho tôi trạng thái ngân sách Gemini tháng này.",
  },
];

function getQuickActions(page: "home" | "asset" | "ops") {
  if (page === "asset") return ASSET_ACTIONS;
  if (page === "ops") return OPS_ACTIONS;
  return HOME_ACTIONS;
}

function mapAssistantError(message: string) {
  return `Tifa gặp lỗi khi xử lý stream. Đang fallback non-stream.\n\nChi tiết: ${message}`;
}

export default function TifaChatPanel({ page, context, onClose }: TifaChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory(page));
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [provider, setProvider] = useState({ provider: "tool-only", model: "gemini-3-flash-preview" });
  const [budget, setBudget] = useState<BudgetBadgeState>({ status: "ok" });
  const [error, setError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState<boolean>(() =>
    safeReadJson<boolean>(
      "tifa-auto-read",
      false,
      (value): value is boolean => typeof value === "boolean"
    )
  );
  const quickActions = useMemo(() => getQuickActions(page), [page]);
  const speech = useTifaSpeech();

  useEffect(() => {
    safeWriteJson("tifa-auto-read", autoRead);
  }, [autoRead]);

  const stopSpeaking = () => {
    speech.stop();
    setSpeakingId(null);
  };

  const speakMessage = (id: string, text: string) => {
    if (speakingId === id) {
      stopSpeaking();
      return;
    }
    stopSpeaking();
    if (speech.speak(text, () => setSpeakingId(null))) {
      setSpeakingId(id);
    }
  };

  // Persist per-page thread so closing/reopening the panel keeps history.
  useEffect(() => {
    persistChatHistory(page, messages);
  }, [page, messages]);

  const handleClear = () => {
    if (pending) return;
    if (typeof window !== "undefined" && !window.confirm("Xóa lịch sử chat trang này?")) return;
    clearChatHistory(page);
    setMessages([TIFA_WELCOME_MESSAGE]);
    setError(null);
  };

  const updateAssistantMessage = (id: string, text: string) => {
    setMessages((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const sendNonStream = async (message: string, assistantId: string) => {
    const response = await fetch("/api/tifa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, context }),
    });

    const payload = (await response.json()) as
      | {
          ok: true;
          answer: string;
          provider: string;
          model: string;
          budget?: BudgetBadgeState;
        }
      | { ok: false; error?: { message?: string } };

    if (!response.ok || !payload.ok) {
      throw new Error(payload && "error" in payload ? payload.error?.message || "Request failed" : "Request failed");
    }

    updateAssistantMessage(assistantId, payload.answer);
    setProvider({ provider: payload.provider, model: payload.model });
    if (payload.budget) setBudget(payload.budget);
    return payload.answer;
  };

  const sendStream = async (message: string, assistantId: string) => {
    const response = await fetch("/api/tifa/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";

    const handleBlock = (block: string) => {
      const lines = block.split("\n");
      let event = "message";
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("event:")) {
          event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (!dataLines.length) return;
      const dataRaw = dataLines.join("\n");
      const payload = JSON.parse(dataRaw) as Record<string, unknown>;

      if (event === "start") {
        setProvider({
          provider: String(payload.provider || "tool-only"),
          model: String(payload.model || "gemini-3-flash-preview"),
        });
      } else if (event === "budget") {
        const status = payload.status;
        if (status === "ok" || status === "degraded" || status === "blocked") {
          setBudget({
            status,
            reason: typeof payload.reason === "string" ? payload.reason : undefined,
          });
        }
      } else if (event === "delta") {
        const text = String(payload.text || "");
        assistantText += text;
        updateAssistantMessage(assistantId, assistantText);
      } else if (event === "error") {
        throw new Error(String(payload.message || "Stream error"));
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const index = buffer.indexOf("\n\n");
        if (index === -1) break;
        const block = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 2);
        if (!block) continue;
        handleBlock(block);
      }
    }

    if (!assistantText.trim()) {
      throw new Error("Stream returned empty assistant content");
    }

    return assistantText;
  };

  const handleSend = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || pending) return;

    setError(null);
    const assistantId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setMessages((prev) => [
      ...prev,
      { id: `user_${assistantId}`, role: "user", text: trimmed },
      { id: assistantId, role: "assistant", text: "" },
    ]);
    setInput("");
    setPending(true);
    stopSpeaking();

    const maybeAutoRead = (finalText: string) => {
      if (autoRead && finalText.trim()) {
        speakMessage(assistantId, finalText);
      }
    };

    try {
      maybeAutoRead(await sendStream(trimmed, assistantId));
    } catch (streamError) {
      const streamMessage =
        streamError instanceof Error ? streamError.message : "Unknown streaming error";
      updateAssistantMessage(assistantId, mapAssistantError(streamMessage));
      try {
        maybeAutoRead(await sendNonStream(trimmed, assistantId));
      } catch (fallbackError) {
        updateAssistantMessage(
          assistantId,
          `Xin lỗi, fallback non-stream cũng lỗi: ${
            fallbackError instanceof Error ? fallbackError.message : "Unknown error"
          }`
        );
        setError("Assistant request failed.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--border-soft)] bg-black shadow-[0_24px_58px_rgba(0,0,0,0.36),0_0_30px_rgba(255,95,162,0.12)]">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3">
        <div className="flex items-center gap-3">
          <TifaAvatar size="sm" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-soft)]">
              TifaWidget Assistant
            </p>
            <p className="text-sm font-semibold text-[var(--text-main)]">Nexus Crypto Chat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={pending}
            className="rounded-lg border border-[var(--border-soft)] bg-[rgba(255,255,255,0.04)] p-1.5 text-[var(--text-muted)] transition hover:border-[var(--border-cyan)] hover:text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear chat history"
            title="Xóa lịch sử chat trang này"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-soft)] bg-[rgba(255,255,255,0.04)] p-1.5 text-[var(--text-muted)] transition hover:border-[var(--border-pink)] hover:text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)]"
            aria-label="Close Tifa panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-soft)] px-4 py-2">
        <TifaProviderBadge provider={provider.provider} model={provider.model} />
        <TifaBudgetBadge budget={budget} />
        <button
          type="button"
          onClick={() => setAutoRead((value) => !value)}
          disabled={!speech.supported}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)] disabled:cursor-not-allowed disabled:opacity-50 ${
            autoRead
              ? "border-[var(--border-cyan)] bg-[rgba(125,211,252,0.08)] text-[var(--cyan-accent)]"
              : "border-[var(--border-soft)] bg-black text-[var(--text-muted)]"
          }`}
          title={
            !speech.supported
              ? "Trình duyệt không hỗ trợ đọc to"
              : !speech.hasVietnameseVoice
                ? "Tự động đọc trả lời (trình duyệt chưa có giọng Việt, sẽ dùng giọng mặc định)"
                : "Tự động đọc trả lời mới"
          }
        >
          {autoRead ? (
            <Volume2 className="h-3 w-3" />
          ) : (
            <VolumeX className="h-3 w-3" />
          )}
          Tự đọc
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((message) => (
          <TifaMessageBubble
            key={message.id}
            role={message.role}
            text={message.text}
            speechSupported={speech.supported}
            speaking={speakingId === message.id}
            onToggleSpeech={() => speakMessage(message.id, message.text)}
          />
        ))}
      </div>

      <div className="space-y-3 border-t border-[var(--border-soft)] px-4 py-3">
        <TifaQuickActions
          actions={quickActions}
          onPick={(prompt) => void handleSend(prompt)}
          disabled={pending}
        />

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend(input);
              }
            }}
            placeholder="Ask Tifa about market, asset, risk, or budget..."
            className="h-10 flex-1 rounded-xl border border-[var(--border-soft)] bg-black px-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)]"
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => void handleSend(input)}
            disabled={pending || !input.trim()}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border-pink)] bg-[linear-gradient(135deg,rgba(255,95,162,0.92),rgba(244,114,182,0.78))] px-3 text-[var(--text-main)] shadow-[0_0_20px_rgba(255,95,162,0.26)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {error ? <p className="text-xs text-[var(--red-negative)]">{error}</p> : null}
      </div>
    </div>
  );
}
