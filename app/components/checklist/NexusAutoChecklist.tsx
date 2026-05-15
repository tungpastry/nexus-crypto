"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle2, Circle, XCircle } from "lucide-react";
import type { NexusAsset } from "../../config/assets";
import type { NexusTimeframe } from "../../config/timeframes";
import { safeReadJson, safeWriteJson } from "../../lib/clientStorage";
import { buildNexusSignal, type NexusChecklistRule, type NexusSignal } from "../../lib/nexusAlgorithm";
import RetroPanel from "../layout/RetroPanel";
import DataFreshnessBadge from "../market/DataFreshnessBadge";

type NexusAutoChecklistProps = {
  asset: NexusAsset;
  timeframe: NexusTimeframe;
  onTrendChange?: (trend: NexusSignal["trend"] | "DISABLED") => void;
};

type UserChecks = Record<string, boolean>;

const HYBRID_RULES: NexusChecklistRule[] = [
  {
    id: "pullback_confirmed",
    label: "Pullback or retest is confirmed by user",
    status: "neutral",
    score: 0,
    type: "hybrid",
  },
  {
    id: "candle_signal_confirmed",
    label: "Candle signal confirmed by user",
    status: "neutral",
    score: 0,
    type: "hybrid",
  },
];

const MANUAL_RULES: NexusChecklistRule[] = [
  {
    id: "no_fomo",
    label: "No FOMO; decision process remains calm",
    status: "neutral",
    score: 0,
    type: "manual",
  },
  {
    id: "news_checked",
    label: "Major news and event risk checked",
    status: "neutral",
    score: 0,
    type: "manual",
  },
  {
    id: "plan_confirmed",
    label: "Plan, invalidation, and risk are confirmed",
    status: "neutral",
    score: 0,
    type: "manual",
  },
  {
    id: "no_overtrade",
    label: "No overtrade impulse",
    status: "neutral",
    score: 0,
    type: "manual",
  },
];

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("en-US", { maximumFractionDigits: value < 1 ? 6 : 2 });
}

function isPlainUserChecks(value: unknown): value is UserChecks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.values(value).every((item) => typeof item === "boolean");
}

function RuleIcon({ rule, checked }: { rule: NexusChecklistRule; checked?: boolean }) {
  if (rule.type !== "auto") {
    return checked ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
    ) : (
      <Circle className="h-4 w-4 text-pink-100/35" />
    );
  }

  if (rule.status === "pass") return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (rule.status === "warn" || rule.status === "neutral") {
    return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  }
  return <XCircle className="h-4 w-4 text-red-300" />;
}

function RuleRow({
  rule,
  checked,
  onToggle,
}: {
  rule: NexusChecklistRule;
  checked?: boolean;
  onToggle?: () => void;
}) {
  const interactive = Boolean(onToggle);
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!interactive}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
        checked
          ? "border-emerald-400/30 bg-emerald-400/10"
          : "border-pink-500/10 bg-black/35 hover:bg-pink-500/10"
      } ${interactive ? "cursor-pointer" : "cursor-default"}`}
    >
      <span className="flex items-center gap-2 text-sm text-pink-50/85">
        <RuleIcon rule={rule} checked={checked} />
        {rule.label}
      </span>
      {rule.type === "auto" && (
        <span className="font-mono text-xs text-pink-100/50">{rule.score}</span>
      )}
    </button>
  );
}

export default function NexusAutoChecklist({
  asset,
  timeframe,
  onTrendChange,
}: NexusAutoChecklistProps) {
  const [signal, setSignal] = useState<NexusSignal | null>(null);
  const [checks, setChecks] = useState<UserChecks>({});
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storageKey = `nexusAutoChecklist:${asset.symbol}:${timeframe.binance}`;

  useEffect(() => {
    setChecks(safeReadJson<UserChecks>(storageKey, {}, isPlainUserChecks));
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    safeWriteJson(storageKey, checks);
  }, [checks, loadedStorageKey, storageKey]);

  useEffect(() => {
    if (!asset.enableChecklist || !asset.binanceSymbol) {
      setSignal(null);
      setError(null);
      onTrendChange?.("DISABLED");
      return;
    }

    let active = true;

    async function fetchSignal() {
      try {
        const res = await axios.get("/api/crypto-klines", {
          params: { symbol: asset.binanceSymbol, tf: timeframe.binance },
        });
        const nextSignal = buildNexusSignal(
          asset,
          timeframe,
          res.data.candles,
          res.data.updated_at
        );

        if (active) {
          setSignal(nextSignal);
          setError(null);
          onTrendChange?.(nextSignal.trend);
        }
      } catch (err) {
        if (active) {
          setSignal(null);
          setError(err instanceof Error ? err.message : "Checklist unavailable");
        }
      }
    }

    fetchSignal();
    const id = setInterval(fetchSignal, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [asset, timeframe, onTrendChange]);

  const autoRules = signal?.rules.filter((rule) => rule.type === "auto") ?? [];
  const algorithmHybridRules = signal?.rules.filter((rule) => rule.type === "hybrid") ?? [];
  const hybridRules = [...algorithmHybridRules, ...HYBRID_RULES];
  const userConfirmed = useMemo(
    () => [...HYBRID_RULES, ...MANUAL_RULES].filter((rule) => checks[rule.id]).length,
    [checks]
  );
  const userRuleCount = HYBRID_RULES.length + MANUAL_RULES.length;

  const toggleCheck = (id: string) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!asset.enableChecklist || !asset.binanceSymbol) {
    return (
      <RetroPanel title="Nexus Auto Checklist" eyebrow={`${asset.symbol} market mode`}>
        <div className="p-5 text-sm text-pink-100/70">
          Stablecoin assets use market data only. MA rules, Nexus Score, and checklist automation
          are disabled for {asset.symbol}.
        </div>
      </RetroPanel>
    );
  }

  if (error || !signal) {
    return (
      <RetroPanel title="Nexus Auto Checklist" eyebrow={`${asset.symbol} ${timeframe.label}`}>
        <div className="p-5 text-sm text-pink-100/70">
          {error ? `Checklist degraded: ${error}` : "Loading Nexus signal..."}
        </div>
      </RetroPanel>
    );
  }

  return (
    <RetroPanel title="Nexus Auto Checklist" eyebrow={`${signal.symbol} ${timeframe.label}`}>
      <div className="grid gap-4 p-5 lg:grid-cols-[180px_1fr]">
        <div className="rounded-2xl border border-pink-500/10 bg-[#110014]/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-pink-200/55">Nexus Score</p>
          <p className="mt-2 font-mono text-5xl font-bold text-pink-100">{signal.score}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-pink-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-cyan-300"
              style={{ width: `${signal.score}%` }}
            />
          </div>
          <div className="mt-4 space-y-1 text-xs text-pink-100/65">
            <p>Trend: {signal.trend}</p>
            <p>Bias: {signal.bias}</p>
            <p>Setup: {signal.setup}</p>
            <p>Risk: {signal.risk}</p>
          </div>
          <div className="mt-3">
            <DataFreshnessBadge updatedAt={signal.updated_at} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2 font-mono text-xs text-pink-100/65 sm:grid-cols-4">
            <span>Price {formatNumber(signal.price)}</span>
            <span>MA20 {formatNumber(signal.ma20)}</span>
            <span>MA50 {formatNumber(signal.ma50)}</span>
            <span>MA200 {formatNumber(signal.ma200)}</span>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-pink-100">Auto Rules</h3>
            <div className="space-y-2">
              {autoRules.map((rule) => (
                <RuleRow key={rule.id} rule={rule} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-pink-100">Hybrid Confirmation</h3>
            <div className="space-y-2">
              {hybridRules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  checked={checks[rule.id]}
                  onToggle={
                    HYBRID_RULES.some((item) => item.id === rule.id)
                      ? () => toggleCheck(rule.id)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-pink-100">Manual Discipline</h3>
            <div className="space-y-2">
              {MANUAL_RULES.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  checked={checks[rule.id]}
                  onToggle={() => toggleCheck(rule.id)}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-pink-100/50">
              User confirmations: {userConfirmed}/{userRuleCount}. This dashboard does not execute
              trades or make trading recommendations.
            </p>
          </div>
        </div>
      </div>
    </RetroPanel>
  );
}
