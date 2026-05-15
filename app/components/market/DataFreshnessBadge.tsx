"use client";

type DataFreshnessBadgeProps = {
  updatedAt?: string | null;
};

function getFreshness(updatedAt?: string | null) {
  if (!updatedAt) {
    return {
      label: "offline",
      className: "border-[rgba(251,113,133,0.35)] text-[var(--red-negative)]",
    };
  }

  const ageSeconds = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  if (ageSeconds < 30) {
    return {
      label: "fresh",
      className:
        "border-[rgba(94,234,212,0.4)] bg-[rgba(94,234,212,0.1)] text-[var(--mint-positive)]",
    };
  }
  if (ageSeconds < 60) {
    return {
      label: "ok",
      className:
        "border-[rgba(125,211,252,0.4)] bg-[rgba(125,211,252,0.11)] text-[var(--cyan-accent)]",
    };
  }
  if (ageSeconds < 300) {
    return {
      label: "stale",
      className:
        "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]",
    };
  }
  return {
    label: "offline",
    className: "border-[rgba(251,113,133,0.35)] text-[var(--red-negative)]",
  };
}

export default function DataFreshnessBadge({ updatedAt }: DataFreshnessBadgeProps) {
  const freshness = getFreshness(updatedAt);

  return (
    <span
      className={`inline-flex items-center rounded-full border bg-[rgba(0,0,0,0.35)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${freshness.className}`}
      title={updatedAt || "No timestamp"}
    >
      {freshness.label}
    </span>
  );
}
