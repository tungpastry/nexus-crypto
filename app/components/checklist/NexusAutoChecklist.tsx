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
    return "border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.07)] text-[var(--metric-price-text)]";
  }
  if (tone === "ma20") {
    return "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.07)] text-[var(--metric-ma20-text)]";
  }
  if (tone === "ma50") {
    return "border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.07)] text-[var(--metric-ma50-text)]";
  }
  if (tone === "ma200") {
    return "border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.07)] text-[var(--metric-ma200-text)]";
  }
  if (tone === "atr") {
    return "border-[rgba(196,181,253,0.35)] bg-[rgba(196,181,253,0.07)] text-[var(--metric-atr-text)]";
  }
  if (tone === "atrPercent") {
    return "border-[rgba(244,114,182,0.35)] bg-[rgba(244,114,182,0.07)] text-[var(--metric-atr-percent-text)]";
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
    return "border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-muted)]";
  }
  return "border-[rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.07)] text-[var(--metric-volume-text)]";
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
      className={`rounded-xl border px-3 py-2 transition hover:bg-[var(--bg-card-hover)] ${getMetricToneClass(
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

function getRuleRowClass(status: NexusChecklistRule["status"]) {
  if (status === "pass") {
    return "border-[rgba(94,234,212,0.28)] bg-[rgba(94,234,212,0.06)]";
  }
  if (status === "warn" || status === "neutral") {
    return "border-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.06)]";
  }
  return "border-[rgba(251,113,133,0.28)] bg-[rgba(251,113,133,0.06)]";
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
    <div
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 ${getRuleRowClass(rule.status)}`}
    >
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
        <div className="rounded-2xl border border-[var(--border-soft)] nexus-card-surface p-4 shadow-[0_12px_32px_rgba(0,0,0,0.24)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Nexus Score</p>
          <p className="mt-2 nexus-title-gradient bg-clip-text font-mono text-5xl font-bold text-transparent drop-shadow-[0_0_16px_rgba(255,95,162,0.2)]">
            {signal.score}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border-strong)]">
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
          <div className="mt-4 space-y-1 text-xs">
            {[
              ["Direction", signal.direction.toUpperCase()],
              ["Trend", signal.trend],
              ["Bias", signal.bias],
              ["Setup", signal.setup],
              ["Risk", signal.risk],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-1"
              >
                <span className="text-[var(--text-soft)]">{label}</span>
                <span className="font-mono text-[var(--text-main)]">{value}</span>
              </div>
            ))}
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
