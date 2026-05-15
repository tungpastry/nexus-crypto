"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import RetroPanel from "../layout/RetroPanel";
import DataFreshnessBadge from "../market/DataFreshnessBadge";

type ProviderCheck = {
  status: "ok" | "error";
  latency_ms: number;
  message?: string;
};

type ProviderHealth = {
  provider: string;
  status: "ok" | "degraded";
  updated_at: string;
  checks: {
    binance_price: ProviderCheck;
    binance_klines: ProviderCheck;
    market_snapshot: ProviderCheck;
  };
};

const CHECK_LABELS: Record<keyof ProviderHealth["checks"], string> = {
  binance_price: "Binance price",
  binance_klines: "Binance klines",
  market_snapshot: "Market snapshot",
};

export default function ProviderHealthPanel() {
  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchHealth() {
      try {
        const res = await axios.get<ProviderHealth>("/api/provider-health");
        if (active) {
          setHealth(res.data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setHealth(null);
          setError(err instanceof Error ? err.message : "Provider health unavailable");
        }
      }
    }

    fetchHealth();
    const id = setInterval(fetchHealth, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const degraded = Boolean(error || health?.status === "degraded");

  return (
    <RetroPanel title="Provider Health" eyebrow="Zenora-compatible checks">
      <div className="grid gap-4 p-5 lg:grid-cols-[240px_1fr]">
        <div className="rounded-2xl border border-pink-500/10 bg-black/45 p-4">
          <div className="flex items-center gap-2">
            {degraded ? (
              <AlertTriangle className="h-5 w-5 text-amber-300" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            )}
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-pink-100">
              {health?.status || "loading"}
            </p>
          </div>
          <p className="mt-3 text-sm text-pink-100/60">
            {error || "Binance, market snapshot, and provider contracts are monitored."}
          </p>
          <div className="mt-4">
            <DataFreshnessBadge updatedAt={health?.updated_at} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {health
            ? Object.entries(health.checks).map(([key, check]) => {
                const label = CHECK_LABELS[key as keyof ProviderHealth["checks"]];
                const ok = check.status === "ok";

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-pink-500/10 bg-black/35 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-pink-50">{label}</p>
                      {ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-300" />
                      )}
                    </div>
                    <p className="mt-2 font-mono text-xs text-pink-100/60">
                      {check.status} · {check.latency_ms}ms
                    </p>
                  </div>
                );
              })
            : (
              <div className="rounded-xl border border-pink-500/10 bg-black/35 p-4 text-sm text-pink-100/60 sm:col-span-3">
                <Activity className="mb-2 h-4 w-4 text-pink-300" />
                Loading provider health...
              </div>
            )}
        </div>
      </div>
    </RetroPanel>
  );
}
