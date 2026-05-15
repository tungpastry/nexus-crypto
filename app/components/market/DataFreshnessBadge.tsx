"use client";

type DataFreshnessBadgeProps = {
  updatedAt?: string | null;
};

function getFreshness(updatedAt?: string | null) {
  if (!updatedAt) return { label: "offline", className: "border-red-400/30 text-red-300" };

  const ageSeconds = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  if (ageSeconds < 30) return { label: "fresh", className: "border-emerald-400/30 text-emerald-300" };
  if (ageSeconds < 60) return { label: "ok", className: "border-cyan-400/30 text-cyan-300" };
  if (ageSeconds < 300) return { label: "stale", className: "border-amber-400/30 text-amber-300" };
  return { label: "offline", className: "border-red-400/30 text-red-300" };
}

export default function DataFreshnessBadge({ updatedAt }: DataFreshnessBadgeProps) {
  const freshness = getFreshness(updatedAt);

  return (
    <span
      className={`inline-flex items-center rounded-full border bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${freshness.className}`}
      title={updatedAt || "No timestamp"}
    >
      {freshness.label}
    </span>
  );
}
