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
          className={`rounded-lg border px-3 py-2 font-mono text-xs transition ${
            selectedTimeframe.binance === timeframe.binance
              ? "border-[rgba(255,95,162,0.5)] bg-[rgba(255,95,162,0.2)] text-[var(--text-main)]"
              : "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] hover:bg-[rgba(255,95,162,0.1)]"
          }`}
        >
          {timeframe.label}
        </button>
      ))}
    </div>
  );
}
