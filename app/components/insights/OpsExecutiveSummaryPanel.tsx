"use client";

import axios from "axios";
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import RetroPanel from "../layout/RetroPanel";
import DeepHealthSummaryPanel from "./DeepHealthSummaryPanel";
import OpsIssueListPanel from "./OpsIssueListPanel";
import ProviderHealthSummaryPanel from "./ProviderHealthSummaryPanel";

export type OpsSummaryPayload = {
  ok: true;
  context_type: "ops_summary";
  updated_at: string;
  status: "ok" | "degraded" | "error";
  executive: {
    headline: string;
    status: "ok" | "degraded" | "error";
    provider_status: "ok" | "degraded";
    deep_health_status: "ok" | "degraded" | "error";
    gemini_status: "ok" | "degraded" | "blocked" | "disabled";
    budget_status: "ok" | "degraded" | "blocked";
  };
  provider_health: {
    summary: {
      total_checks: number;
      ok_checks: number;
      warn_checks: number;
      error_checks: number;
      slowest_check: string | null;
      slowest_latency_ms: number | null;
    };
  };
  deep_health: {
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
  gemini_health: {
    summary: {
      stream_mode: "true-stream" | "pseudo-stream" | "tool-only";
      circuit_state: "closed" | "open" | "half_open";
      circuit_failures: string;
      retry_limit: number;
      timeout_ms: number;
      monthly_spend_usd: number;
      hard_stop_usd: number;
    };
    status: "ok" | "degraded" | "blocked" | "disabled";
  };
  issues: Array<{
    id: string;
    severity: "info" | "warn" | "error";
    title: string;
    detail: string;
    source: "provider_health" | "deep_health" | "gemini_provider" | "budget";
  }>;
  recommendations: string[];
};

function statusClass(status: "ok" | "degraded" | "error") {
  if (status === "ok") {
    return "border-[rgba(94,234,212,0.35)] bg-[rgba(94,234,212,0.08)] text-[var(--mint-positive)]";
  }
  if (status === "degraded") {
    return "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]";
  }
  return "border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.08)] text-[var(--red-negative)]";
}

export default function OpsExecutiveSummaryPanel() {
  const [summary, setSummary] = useState<OpsSummaryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<OpsSummaryPayload>("/api/tifa-tools/ops-summary");
      setSummary(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load ops summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <RetroPanel title="Ops Executive Summary" eyebrow="Tifa multi-tool orchestration">
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${statusClass(
              summary?.status || "degraded"
            )}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {summary?.status || "loading"}
          </span>

          <button
            type="button"
            onClick={() => void loadSummary()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs text-[var(--text-main)] transition hover:border-[var(--border-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Ops Summary"}
          </button>
        </div>

        {error ? (
          <p className="rounded-lg border border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.08)] px-3 py-2 text-xs text-[var(--red-negative)]">
            <AlertTriangle className="mr-2 inline h-3.5 w-3.5" />
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3 sm:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Headline
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {summary?.executive.headline || "Loading ops summary..."}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Provider
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {summary?.executive.provider_status || "--"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Deep
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {summary?.executive.deep_health_status || "--"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Gemini/Budget
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {summary
                ? `${summary.executive.gemini_status} / ${summary.executive.budget_status}`
                : "--"}
            </p>
          </div>
        </div>

        {summary ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <ProviderHealthSummaryPanel providerHealth={summary.provider_health} />
            <DeepHealthSummaryPanel deepHealth={summary.deep_health} />
          </div>
        ) : null}

        {summary ? (
          <OpsIssueListPanel issues={summary.issues} recommendations={summary.recommendations} />
        ) : null}
      </div>
    </RetroPanel>
  );
}

