"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import RetroPanel from "../layout/RetroPanel";
import DataFreshnessBadge from "../market/DataFreshnessBadge";

type ProviderCheck = {
  status: "ok" | "warn" | "error";
  latency_ms?: number;
  value?: string | number | null;
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
    market_snapshot_cache_status?: ProviderCheck;
    market_snapshot_age_ms?: ProviderCheck;
  };
};

function getStatusClass(status: "ok" | "warn" | "error" | "degraded") {
  if (status === "ok") {
    return "border-[rgba(94,234,212,0.35)] bg-[rgba(94,234,212,0.08)] text-[var(--mint-positive)]";
  }
  if (status === "warn" || status === "degraded") {
    return "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]";
  }
  return "border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.08)] text-[var(--red-negative)]";
}

const CHECK_LABELS: Partial<Record<keyof ProviderHealth["checks"], string>> = {
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
        <div className="rounded-2xl border border-[var(--border-soft)] nexus-card-surface p-4">
          <div className="flex items-center gap-2">
            {degraded ? (
              <AlertTriangle className="h-5 w-5 text-[var(--amber-warning)]" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-[var(--mint-positive)]" />
            )}
            <p
              className={`rounded-full border px-2 py-1 font-mono text-xs uppercase tracking-[0.14em] ${getStatusClass(
                health?.status || "degraded"
              )}`}
            >
              {health?.status || "loading"}
            </p>
          </div>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {error || "Binance, market snapshot, and provider contracts are monitored."}
          </p>
          <div className="mt-4">
            <DataFreshnessBadge updatedAt={health?.updated_at} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {health
            ? Object.entries(health.checks).map(([key, check]) => {
                const label =
                  CHECK_LABELS[key as keyof ProviderHealth["checks"]] ||
                  key.replaceAll("_", " ");
                const ok = check.status === "ok";
                const warn = check.status === "warn";

                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-4 ${
                      ok
                        ? "border-[rgba(94,234,212,0.26)] bg-[rgba(94,234,212,0.06)]"
                        : warn
                          ? "border-[rgba(251,191,36,0.26)] bg-[rgba(251,191,36,0.06)]"
                          : "border-[rgba(251,113,133,0.26)] bg-[rgba(251,113,133,0.06)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--text-main)]">{label}</p>
                      {ok ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--mint-positive)]" />
                      ) : warn ? (
                        <AlertTriangle className="h-4 w-4 text-[var(--amber-warning)]" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-[var(--red-negative)]" />
                      )}
                    </div>
                    <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                      {check.status}
                      {typeof check.latency_ms === "number" ? ` · ${check.latency_ms}ms` : ""}
                      {check.value !== undefined ? ` · ${String(check.value)}` : ""}
                    </p>
                  </div>
                );
              })
            : (
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)] sm:col-span-3">
                <Activity className="mb-2 h-4 w-4 text-[var(--pink-soft)]" />
                Loading provider health...
              </div>
            )}
        </div>
      </div>
    </RetroPanel>
  );
}
