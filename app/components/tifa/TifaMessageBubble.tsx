"use client";

import TifaAvatar from "./TifaAvatar";

type TifaMessageBubbleProps = {
  role: "user" | "assistant";
  text: string;
};

export default function TifaMessageBubble({ role, text }: TifaMessageBubbleProps) {
  const isUser = role === "user";

  if (!isUser) {
    return (
      <div className="flex justify-start">
        <div className="flex max-w-[92%] items-end gap-2">
          <TifaAvatar size="sm" />
          <div className="max-w-[85%] rounded-2xl border border-[var(--border-soft)] bg-black px-3 py-2 text-sm leading-6 text-[var(--text-main)]">
            {text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] rounded-2xl border border-[var(--border-pink)] bg-black px-3 py-2 text-sm leading-6 text-[var(--text-main)]"
      >
        {text}
      </div>
    </div>
  );
}
