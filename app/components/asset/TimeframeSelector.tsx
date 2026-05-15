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
              ? "border-pink-400 bg-pink-500/20 text-pink-50"
              : "border-pink-500/15 bg-black/35 text-pink-100/60 hover:bg-pink-500/10"
          }`}
        >
          {timeframe.label}
        </button>
      ))}
    </div>
  );
}
