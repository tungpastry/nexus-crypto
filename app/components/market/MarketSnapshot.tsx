"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Activity, BarChart3, Bitcoin, Clock3 } from "lucide-react";
import RetroPanel from "../layout/RetroPanel";
import DataFreshnessBadge from "./DataFreshnessBadge";

type MarketSnapshotData = {
  updated_at: string;
  cache?: {
    status: "hit" | "miss" | "stale";
    age_ms: number;
  };
  error?: { message: string };
  global: {
    market_cap_usd: number | null;
    volume_24h_usd: number | null;
    btc_dominance: number | null;
    eth_dominance: number | null;
  };
};

function compactUsd(value?: number | null) {
  if (typeof value !== "number") return "--";
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export default function MarketSnapshot() {
  const [data, setData] = useState<MarketSnapshotData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchSnapshot() {
      try {
        const res = await axios.get("/api/market-snapshot");
        if (active) {
          setData(res.data);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Snapshot unavailable");
      }
    }

    fetchSnapshot();
    const id = setInterval(fetchSnapshot, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: "Market Cap",
        value: compactUsd(data?.global.market_cap_usd),
        icon: BarChart3,
        iconClass: "text-[var(--pink-soft)]",
        cardClass:
          "border-[rgba(255,95,162,0.24)] hover:border-[rgba(255,95,162,0.38)]",
      },
      {
        label: "24h Volume",
        value: compactUsd(data?.global.volume_24h_usd),
        icon: Activity,
        iconClass: "text-[var(--cyan-accent)]",
        cardClass:
          "border-[rgba(125,211,252,0.24)] hover:border-[rgba(125,211,252,0.38)]",
      },
      {
        label: "BTC Dominance",
        value:
          typeof data?.global.btc_dominance === "number"
            ? `${data.global.btc_dominance.toFixed(1)}%`
            : "--",
        icon: Bitcoin,
        iconClass: "text-[var(--yellow-accent)]",
        cardClass:
          "border-[rgba(251,191,36,0.24)] hover:border-[rgba(251,191,36,0.38)]",
      },
      {
        label: "ETH Dominance",
        value:
          typeof data?.global.eth_dominance === "number"
            ? `${data.global.eth_dominance.toFixed(1)}%`
            : "--",
        icon: Clock3,
        iconClass: "text-[var(--violet-accent)]",
        cardClass:
          "border-[rgba(196,181,253,0.24)] hover:border-[rgba(196,181,253,0.38)]",
      },
    ],
    [data]
  );

  const statusText =
    data?.cache?.status === "stale"
      ? "Snapshot using cached data because provider is rate-limited"
      : error || data?.error?.message
        ? `Snapshot degraded: ${error || data?.error?.message}`
        : "Global market data synced";

  return (
    <RetroPanel title="Market Snapshot" eyebrow="CoinGecko-style global tape">
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))] p-4 shadow-[0_14px_32px_rgba(0,0,0,0.24)] transition hover:bg-[rgba(255,255,255,0.09)] ${card.cardClass}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-soft)]">{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.iconClass}`} />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-[var(--text-main)]">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.1)] px-4 py-3 text-xs text-[var(--text-muted)]">
        <span>{statusText}</span>
        <DataFreshnessBadge updatedAt={data?.updated_at} />
      </div>
    </RetroPanel>
  );
}
