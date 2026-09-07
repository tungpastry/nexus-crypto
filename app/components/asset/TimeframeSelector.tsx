"use client";

import type { NexusTimeframe } from "../../config/timeframes";
import { NEXUS_TIMEFRAMES } from "../../config/timeframes";

type TimeframeSelectorProps = {
  selectedTimeframe: NexusTimeframe;
  onSelectTimeframe: (timeframe: NexusTimeframe) => void;
};

export default function TimeframeSelector({
  selectedTimeframe,
  onSelectTimeframe,
}: TimeframeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {NEXUS_TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe.binance}
          type="button"
          onClick={() => onSelectTimeframe(timeframe)}
          className={`rounded-lg border px-3 py-2.5 font-mono text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
            selectedTimeframe.binance === timeframe.binance
              ? "border-[var(--border-brand)] nexus-timeframe-active text-[var(--timeframe-active-text)] shadow-[var(--timeframe-shadow)]"
              : "border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-cyan)] hover:bg-[rgba(125,211,252,0.1)]"
          }`}
        >
          {timeframe.label}
        </button>
      ))}
    </div>
  );
}
