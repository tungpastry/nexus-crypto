"use client";

type TifaMessageBubbleProps = {
  role: "user" | "assistant";
  text: string;
};

export default function TifaMessageBubble({ role, text }: TifaMessageBubbleProps) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-6 ${
          isUser
            ? "border-[var(--border-pink)] bg-[rgba(255,95,162,0.14)] text-[var(--text-main)]"
            : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)]"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
