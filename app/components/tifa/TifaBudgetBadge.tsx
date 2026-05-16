"use client";

type BudgetStatus = {
  status: "ok" | "degraded" | "blocked";
  reason?: string;
};

type TifaBudgetBadgeProps = {
  budget: BudgetStatus;
};

export default function TifaBudgetBadge({ budget }: TifaBudgetBadgeProps) {
  const tone =
    budget.status === "ok"
      ? "border-[rgba(94,234,212,0.35)] bg-[rgba(94,234,212,0.08)] text-[var(--mint-positive)]"
      : budget.status === "degraded"
        ? "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]"
        : "border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.08)] text-[var(--red-negative)]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${tone}`}
      title={budget.reason || `budget ${budget.status}`}
    >
      budget {budget.status}
    </span>
  );
}
