"use client";

import axios from "axios";
import { RefreshCw, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import RetroPanel from "../layout/RetroPanel";

type GeminiBudgetStatus = {
  provider: string;
  model: string;
  current_month: string;
  monthly_cap_usd: number;
  hard_stop_usd: number;
  degrade_threshold_usd: number;
  monthly_spend_usd: number;
  monthly_requests: number;
  remaining_hard_stop_usd: number;
  status: "ok" | "degraded" | "blocked";
  failure_mode: string;
};

type GeminiProviderHealth = {
  provider: string;
  assistant_enabled: boolean;
  configured: boolean;
  model: string;
  status: "ok" | "degraded" | "blocked" | "disabled";
  reason?: string;
  stream: {
    enabled: boolean;
    timeout_ms: number;
    retry_limit: number;
  };
  request: {
    timeout_ms: number;
    retry_limit: number;
  };
  circuit: {
    enabled: boolean;
    state: "closed" | "open" | "half_open";
    failure_count: number;
    cooldown_ms: number;
    opened_until: string | null;
    threshold: number;
  };
};

function statusClass(status: "ok" | "degraded" | "blocked" | "disabled") {
  if (status === "ok") {
    return "border-[rgba(94,234,212,0.35)] bg-[rgba(94,234,212,0.08)] text-[var(--mint-positive)]";
  }
  if (status === "degraded") {
    return "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]";
  }
  if (status === "disabled") {
    return "border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]";
  }
  return "border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.08)] text-[var(--red-negative)]";
}

export default function GeminiAssistantStatusPanel() {
  const [budget, setBudget] = useState<GeminiBudgetStatus | null>(null);
  const [provider, setProvider] = useState<GeminiProviderHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [budgetRes, providerRes] = await Promise.all([
        axios.get<GeminiBudgetStatus>("/api/tifa-tools/budget-status"),
        axios.get<GeminiProviderHealth>("/api/provider-health/gemini"),
      ]);
      setBudget(budgetRes.data);
      setProvider(providerRes.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load Gemini status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <RetroPanel title="Gemini Assistant Status" eyebrow="Budget guard and provider state">
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${
              statusClass(provider?.status || "disabled")
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            {provider?.status || "disabled"}
          </span>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs text-[var(--text-main)] transition hover:border-[var(--border-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Checking..." : "Refresh Gemini Status"}
          </button>
        </div>

        {error ? <p className="text-xs text-[var(--red-negative)]">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Provider
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {provider?.provider || "gemini"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Model
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {provider?.model || budget?.model || "gemini-3-flash-preview"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Month
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {budget?.current_month || "--"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Requests
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {budget?.monthly_requests ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Stream
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {provider?.stream.enabled ? "enabled" : "disabled"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Circuit
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {provider?.circuit.state || "closed"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Failures
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {provider ? `${provider.circuit.failure_count}/${provider.circuit.threshold}` : "0/0"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Timeout
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {provider?.request.timeout_ms ?? 0}ms
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Retry
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {provider?.request.retry_limit ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.06)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Cooldown
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {provider?.circuit.cooldown_ms ?? 0}ms
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[rgba(94,234,212,0.3)] bg-[rgba(94,234,212,0.08)] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">Spend</p>
            <p className="mt-1 font-mono text-sm font-semibold text-[var(--mint-positive)]">
              ${budget?.monthly_spend_usd?.toFixed(4) ?? "0.0000"}
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Degrade Threshold
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-[var(--amber-warning)]">
              ${budget?.degrade_threshold_usd?.toFixed(2) ?? "0.00"}
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Hard Stop
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-[var(--red-negative)]">
              ${budget?.hard_stop_usd?.toFixed(2) ?? "0.00"}
            </p>
          </div>
        </div>

        {provider?.reason ? (
          <p className="text-xs text-[var(--text-muted)]">Provider note: {provider.reason}</p>
        ) : null}
        {provider?.circuit.opened_until ? (
          <p className="text-xs text-[var(--text-muted)]">
            Circuit open until: {provider.circuit.opened_until}
          </p>
        ) : null}
      </div>
    </RetroPanel>
  );
}
