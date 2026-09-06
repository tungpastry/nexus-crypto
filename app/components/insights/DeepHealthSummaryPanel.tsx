"use client";

type DeepHealthSummaryPanelProps = {
  deepHealth: {
    summary: {
      symbols_total: number;
      symbols_ok: number;
      symbols_error: number;
      latency_ms: number | null;
      slow_symbols: Array<{ symbol: string; latency_ms: number }>;
    };
    symbols: Array<{
      symbol: string;
      status: "ok" | "error";
      issue: string | null;
      price_latency_ms: number | null;
      klines_latency_ms: number | null;
      candles: number | null;
    }>;
  };
};

export default function DeepHealthSummaryPanel({ deepHealth }: DeepHealthSummaryPanelProps) {
  const errorSymbols = deepHealth.symbols.filter((item) => item.status === "error");

  return (
    <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-soft)]">
        Deep Health Summary
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <p className="text-xs text-[var(--text-muted)]">
          Symbols OK:{" "}
          <span className="font-semibold text-[var(--mint-positive)]">
            {deepHealth.summary.symbols_ok}/{deepHealth.summary.symbols_total}
          </span>
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Symbols Error:{" "}
          <span className="font-semibold text-[var(--red-negative)]">
            {deepHealth.summary.symbols_error}
          </span>
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Deep Latency:{" "}
          <span className="font-mono text-[var(--text-main)]">
            {deepHealth.summary.latency_ms !== null ? `${deepHealth.summary.latency_ms}ms` : "--"}
          </span>
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Slow symbols:{" "}
          <span className="font-mono text-[var(--text-main)]">
            {deepHealth.summary.slow_symbols
              .map((item) => `${item.symbol} ${item.latency_ms}ms`)
              .join(", ") || "--"}
          </span>
        </p>
      </div>

      {errorSymbols.length ? (
        <div className="mt-3 space-y-1 rounded-lg border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] p-2">
          {errorSymbols.slice(0, 4).map((symbol) => (
            <p key={symbol.symbol} className="text-xs text-[var(--red-negative)]">
              {symbol.symbol}: {symbol.issue || "Deep check error"}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

