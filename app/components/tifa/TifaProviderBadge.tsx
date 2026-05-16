"use client";

type TifaProviderBadgeProps = {
  provider: string;
  model: string;
};

export default function TifaProviderBadge({ provider, model }: TifaProviderBadgeProps) {
  const isToolOnly = provider === "tool-only";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
        isToolOnly
          ? "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]"
          : "border-[var(--border-cyan)] bg-[rgba(125,211,252,0.08)] text-[var(--cyan-accent)]"
      }`}
      title={model}
    >
      {provider}
    </span>
  );
}
