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
      },
      {
        label: "24h Volume",
        value: compactUsd(data?.global.volume_24h_usd),
        icon: Activity,
      },
      {
        label: "BTC Dominance",
        value:
          typeof data?.global.btc_dominance === "number"
            ? `${data.global.btc_dominance.toFixed(1)}%`
            : "--",
        icon: Bitcoin,
      },
      {
        label: "ETH Dominance",
        value:
          typeof data?.global.eth_dominance === "number"
            ? `${data.global.eth_dominance.toFixed(1)}%`
            : "--",
        icon: Clock3,
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
            className="rounded-xl border border-pink-500/10 bg-[#110014]/75 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-pink-200/60">{card.label}</p>
              <card.icon className="h-4 w-4 text-pink-300" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-pink-500/10 px-4 py-3 text-xs text-pink-100/60">
        <span>{statusText}</span>
        <DataFreshnessBadge updatedAt={data?.updated_at} />
      </div>
    </RetroPanel>
  );
}
