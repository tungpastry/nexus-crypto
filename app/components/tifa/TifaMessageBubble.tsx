"use client";

import { Volume2, VolumeX } from "lucide-react";
import TifaAvatar from "./TifaAvatar";

type TifaMessageBubbleProps = {
  role: "user" | "assistant";
  text: string;
  speechSupported?: boolean;
  speaking?: boolean;
  onToggleSpeech?: () => void;
};

export default function TifaMessageBubble({
  role,
  text,
  speechSupported = false,
  speaking = false,
  onToggleSpeech,
}: TifaMessageBubbleProps) {
  const isUser = role === "user";

  if (!isUser) {
    return (
      <div className="flex justify-start">
        <div className="flex max-w-[92%] items-end gap-2">
          <TifaAvatar size="sm" />
          <div className="nexus-solid-surface max-w-[85%] rounded-2xl border border-[var(--border-soft)] px-3 py-2 text-sm leading-6 text-[var(--text-main)]">
            {text}
          </div>
          {speechSupported && text.trim() ? (
            <button
              type="button"
              onClick={onToggleSpeech}
              className="nexus-solid-surface shrink-0 rounded-lg border border-[var(--border-soft)] p-1.5 text-[var(--text-muted)] transition hover:border-[var(--border-cyan)] hover:text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              aria-label={speaking ? "Stop reading aloud" : "Read aloud"}
              title={speaking ? "Dừng đọc" : "Đọc to tin này"}
            >
              {speaking ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div
        className="nexus-solid-surface max-w-[85%] rounded-2xl border border-[var(--border-pink)] px-3 py-2 text-sm leading-6 text-[var(--text-main)]"
      >
        {text}
      </div>
    </div>
  );
}
