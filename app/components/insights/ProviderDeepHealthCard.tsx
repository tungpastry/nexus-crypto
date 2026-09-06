"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import RetroPanel from "../layout/RetroPanel";
import DataFreshnessBadge from "../market/DataFreshnessBadge";

type DeepCheckStatus = "ok" | "warn" | "error";

type DeepEndpointCheck = {
  status: DeepCheckStatus;
  latency_ms: number;
  message?: string;
  candles?: number;
};

type DeepSymbolCheck = {
  status: "ok" | "error";
  price: DeepEndpointCheck;
  klines: DeepEndpointCheck;
};

type ProviderDeepHealth = {
  provider: string;
  mode: "deep";
  scope?: "core-canary";
  available_symbols_total?: number;
  status: "ok" | "degraded" | "error";
  updated_at: string;
  summary: {
    symbols_total: number;
    symbols_ok: number;
    symbols_warn: number;
    symbols_error: number;
    latency_ms: number;
  };
  checks: Record<string, DeepSymbolCheck>;
};

type HealthTone = "ok" | "warn" | "error";

function getStatusTone(status: "ok" | "warn" | "error" | "degraded"): HealthTone {
  if (status === "ok") return "ok";
  if (status === "degraded" || status === "warn") return "warn";
  return "error";
}

function getStatusClass(status: "ok" | "warn" | "error" | "degraded") {
  const tone = getStatusTone(status);
  if (tone === "ok") {
    return "border-[rgba(94,234,212,0.35)] bg-[rgba(94,234,212,0.08)] text-[var(--mint-positive)]";
  }
  if (tone === "warn") {
    return "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]";
  }
  return "border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.08)] text-[var(--red-negative)]";
}

function StatusIcon({ status }: { status: "ok" | "warn" | "error" | "degraded" }) {
  const tone = getStatusTone(status);
  if (tone === "ok") return <CheckCircle2 className="h-4 w-4 text-[var(--mint-positive)]" />;
  if (tone === "warn") return <AlertTriangle className="h-4 w-4 text-[var(--amber-warning)]" />;
  return <XCircle className="h-4 w-4 text-[var(--red-negative)]" />;
}

export default function ProviderDeepHealthCard() {
  const [health, setHealth] = useState<ProviderDeepHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeepHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<ProviderDeepHealth>("/api/provider-health/deep");
      setHealth(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Provider deep health unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDeepHealth();
  }, [fetchDeepHealth]);

  const topStatus = error ? "error" : health?.status ?? "degraded";
  const symbols = Object.entries(health?.checks ?? {});

  return (
    <RetroPanel title="Provider Deep Health" eyebrow="Core Binance canary diagnostics">
      <div className="grid gap-4 p-5 lg:grid-cols-[260px_1fr]">
        <div className="rounded-2xl border border-[var(--border-soft)] nexus-card-surface p-4">
          <div className="flex items-center gap-2">
            <StatusIcon status={topStatus} />
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getStatusClass(
                topStatus
              )}`}
            >
              {loading ? "checking" : topStatus}
            </span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
            <p>
              Symbols: {health?.summary.symbols_ok ?? 0}/{health?.summary.symbols_total ?? 0} OK
            </p>
            <p>Errors: {health?.summary.symbols_error ?? 0}</p>
            <p>Latency: {typeof health?.summary.latency_ms === "number" ? `${health.summary.latency_ms}ms` : "--"}</p>
            <p>Scope: {health?.scope ?? "core-canary"}</p>
            <p>Available Nexus symbols: {health?.available_symbols_total ?? "--"}</p>
          </div>
          <div className="mt-3">
            <DataFreshnessBadge updatedAt={health?.updated_at} />
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] p-2 text-xs text-[var(--red-negative)]">
              Deep health unavailable: {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              void fetchDeepHealth();
            }}
            disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(125,211,252,0.35)] bg-[rgba(125,211,252,0.1)] px-3 py-2 text-xs font-semibold text-[var(--cyan-accent)] transition hover:bg-[rgba(125,211,252,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Checking..." : "Refresh Deep Check"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {symbols.length > 0 ? (
            symbols.map(([symbol, check]) => (
              <div
                key={symbol}
                className={`rounded-xl border p-4 ${
                  check.status === "ok"
                    ? "border-[rgba(94,234,212,0.26)] bg-[rgba(94,234,212,0.06)]"
                    : "border-[rgba(251,113,133,0.26)] bg-[rgba(251,113,133,0.06)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold text-[var(--text-main)]">{symbol}</p>
                  <StatusIcon status={check.status === "ok" ? "ok" : "error"} />
                </div>
                <div className="mt-3 space-y-2 text-xs font-mono text-[var(--text-muted)]">
                  <p>
                    Price: {check.price.status} · {check.price.latency_ms}ms
                  </p>
                  <p>
                    Klines: {check.klines.status} · {check.klines.latency_ms}ms
                    {typeof check.klines.candles === "number"
                      ? ` · ${check.klines.candles} candles`
                      : ""}
                  </p>
                  {check.price.message && (
                    <p className="break-words text-[var(--red-negative)]">{check.price.message}</p>
                  )}
                  {check.klines.message && (
                    <p className="break-words text-[var(--red-negative)]">{check.klines.message}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)] sm:col-span-2 xl:col-span-4">
              <Activity className="mb-2 h-4 w-4 text-[var(--pink-soft)]" />
              {loading ? "Loading deep provider diagnostics..." : "No deep health data available."}
            </div>
          )}
        </div>
      </div>
    </RetroPanel>
  );
}
