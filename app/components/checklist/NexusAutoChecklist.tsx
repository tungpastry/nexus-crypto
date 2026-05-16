"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { NexusAsset } from "../../config/assets";
import type { NexusTimeframe } from "../../config/timeframes";
import {
  buildNexusSignal,
  type NexusChecklistRule,
  type NexusSignal,
} from "../../lib/nexusAlgorithm";
import RetroPanel from "../layout/RetroPanel";
import DataFreshnessBadge from "../market/DataFreshnessBadge";

type NexusAutoChecklistProps = {
  asset: NexusAsset;
  timeframe: NexusTimeframe;
  onTrendChange?: (trend: NexusSignal["trend"] | "DISABLED") => void;
};

type MetricTone =
  | "price"
  | "ma20"
  | "ma50"
  | "ma200"
  | "atr"
  | "atrPercent"
  | "volatilityLow"
  | "volatilityNormal"
  | "volatilityHigh"
  | "volatilityUnknown"
  | "volume";

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: value < 1 ? 6 : 2,
  });
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "--";
  return `${value.toFixed(2)}%`;
}

function formatRatio(value: number) {
  if (!Number.isFinite(value)) return "--";
  return `${value.toFixed(2)}x`;
}

function getStateClass(state: NexusSignal["state"]) {
  if (state === "No Trade") {
    return "border-[rgba(251,113,133,0.45)] bg-[rgba(251,113,133,0.12)] text-[var(--red-negative)]";
  }
  if (state === "Watch") {
    return "border-[rgba(251,191,36,0.45)] bg-[rgba(251,191,36,0.12)] text-[var(--amber-warning)]";
  }
  if (state === "Ready") {
    return "border-[rgba(125,211,252,0.45)] bg-[rgba(125,211,252,0.12)] text-[var(--cyan-accent)]";
  }
  return "border-[rgba(94,234,212,0.45)] bg-[rgba(94,234,212,0.12)] text-[var(--mint-positive)]";
}

function getMetricToneClass(tone: MetricTone) {
  if (tone === "price") {
    return "border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.07)] text-yellow-300";
  }
  if (tone === "ma20") {
    return "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.07)] text-red-300";
  }
  if (tone === "ma50") {
    return "border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.07)] text-green-300";
  }
  if (tone === "ma200") {
    return "border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.07)] text-sky-300";
  }
  if (tone === "atr") {
    return "border-[rgba(196,181,253,0.35)] bg-[rgba(196,181,253,0.07)] text-violet-300";
  }
  if (tone === "atrPercent") {
    return "border-[rgba(244,114,182,0.35)] bg-[rgba(244,114,182,0.07)] text-pink-300";
  }
  if (tone === "volatilityLow") {
    return "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.07)] text-[var(--amber-warning)]";
  }
  if (tone === "volatilityNormal") {
    return "border-[rgba(94,234,212,0.35)] bg-[rgba(94,234,212,0.07)] text-[var(--mint-positive)]";
  }
  if (tone === "volatilityHigh") {
    return "border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.07)] text-[var(--red-negative)]";
  }
  if (tone === "volatilityUnknown") {
    return "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.045)] text-[var(--text-muted)]";
  }
  return "border-[rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.07)] text-orange-300";
}

function getVolatilityTone(volatility: NexusSignal["volatility"]): MetricTone {
  if (volatility === "Low") return "volatilityLow";
  if (volatility === "Normal") return "volatilityNormal";
  if (volatility === "High") return "volatilityHigh";
  return "volatilityUnknown";
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: MetricTone;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${getMetricToneClass(
        tone
      )}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-soft)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-bold">{value}</p>
    </div>
  );
}

function RuleIcon({ rule }: { rule: NexusChecklistRule }) {
  if (rule.status === "pass") {
    return <CheckCircle2 className="h-4 w-4 text-[var(--mint-positive)]" />;
  }
  if (rule.status === "warn" || rule.status === "neutral") {
    return <AlertTriangle className="h-4 w-4 text-[var(--amber-warning)]" />;
  }
  return <XCircle className="h-4 w-4 text-[var(--red-negative)]" />;
}

function RuleRow({ rule }: { rule: NexusChecklistRule }) {
  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.045)] px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-[var(--text-main)]">
        <RuleIcon rule={rule} />
        {rule.label}
      </span>
      <span className="font-mono text-xs text-[var(--text-soft)]">{rule.score}</span>
    </div>
  );
}

export default function NexusAutoChecklist({
  asset,
  timeframe,
  onTrendChange,
}: NexusAutoChecklistProps) {
  const [signal, setSignal] = useState<NexusSignal | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          setError(err instanceof Error ? err.message : "Decision matrix unavailable");
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

  if (!asset.enableChecklist || !asset.binanceSymbol) {
    return (
      <RetroPanel title="Nexus Decision Matrix" eyebrow={`${asset.symbol} market mode`}>
        <div className="p-5 text-sm text-[var(--text-muted)]">
          Stablecoin assets use market data only. MA rules, Nexus Score, and decision matrix
          automation are disabled for {asset.symbol}.
        </div>
      </RetroPanel>
    );
  }

  if (error || !signal) {
    return (
      <RetroPanel title="Nexus Decision Matrix" eyebrow={`${asset.symbol} ${timeframe.label}`}>
        <div className="p-5 text-sm text-[var(--text-muted)]">
          {error ? `Decision matrix degraded: ${error}` : "Loading Nexus decision matrix..."}
        </div>
      </RetroPanel>
    );
  }

  return (
    <RetroPanel title="Nexus Decision Matrix" eyebrow={`${signal.symbol} ${timeframe.label}`}>
      <div className="grid gap-4 p-5 lg:grid-cols-[200px_1fr]">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Nexus Score</p>
          <p className="mt-2 font-mono text-5xl font-bold text-[var(--text-main)]">{signal.score}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.16)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-cyan-300"
              style={{ width: `${signal.score}%` }}
            />
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">State</p>
            <span
              className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStateClass(signal.state)}`}
            >
              {signal.state}
            </span>
          </div>
          <div className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
            <p>Direction: {signal.direction.toUpperCase()}</p>
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Price" value={formatNumber(signal.price)} tone="price" />
            <MetricCard label="MA20" value={formatNumber(signal.ma20)} tone="ma20" />
            <MetricCard label="MA50" value={formatNumber(signal.ma50)} tone="ma50" />
            <MetricCard label="MA200" value={formatNumber(signal.ma200)} tone="ma200" />
            <MetricCard label="ATR14" value={formatNumber(signal.atr14)} tone="atr" />
            <MetricCard
              label="ATR %"
              value={formatPercent(signal.atrPercent)}
              tone="atrPercent"
            />
            <MetricCard
              label="Volatility"
              value={signal.volatility}
              tone={getVolatilityTone(signal.volatility)}
            />
            <MetricCard
              label="Volume Ratio"
              value={formatRatio(signal.volumeRatio)}
              tone="volume"
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-main)]">
              Decision Rules
            </h3>
            <div className="space-y-2">
              {signal.rules.map((rule) => (
                <RuleRow key={rule.id} rule={rule} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </RetroPanel>
  );
}
