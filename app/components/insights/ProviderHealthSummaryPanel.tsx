"use client";

type ProviderHealthSummaryPanelProps = {
  providerHealth: {
    summary: {
      total_checks: number;
      ok_checks: number;
      warn_checks: number;
      error_checks: number;
      slowest_check: string | null;
      slowest_latency_ms: number | null;
    };
  };
};

export default function ProviderHealthSummaryPanel({
  providerHealth,
}: ProviderHealthSummaryPanelProps) {
  return (
    <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-soft)]">
        Provider Health Summary
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <p className="text-xs text-[var(--text-muted)]">
          Total checks:{" "}
          <span className="font-semibold text-[var(--text-main)]">
            {providerHealth.summary.total_checks}
          </span>
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          OK:{" "}
          <span className="font-semibold text-[var(--mint-positive)]">
            {providerHealth.summary.ok_checks}
          </span>
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Warn:{" "}
          <span className="font-semibold text-[var(--amber-warning)]">
            {providerHealth.summary.warn_checks}
          </span>
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Error:{" "}
          <span className="font-semibold text-[var(--red-negative)]">
            {providerHealth.summary.error_checks}
          </span>
        </p>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Slowest check:{" "}
        <span className="font-mono text-[var(--text-main)]">
          {providerHealth.summary.slowest_check || "--"}
          {providerHealth.summary.slowest_latency_ms !== null
            ? ` (${providerHealth.summary.slowest_latency_ms}ms)`
            : ""}
        </span>
      </p>
    </section>
  );
}

