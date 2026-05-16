"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import type { NexusAsset } from "../../config/assets";
import { NEXUS_TIMEFRAMES } from "../../config/timeframes";
import type { NexusSignal } from "../../lib/nexusAlgorithm";
import PriceWidget from "../PriceWidget";
import TradingViewChart from "../TradingViewChart";
import NexusAutoChecklist from "../checklist/NexusAutoChecklist";
import ClientErrorBoundary from "../layout/ClientErrorBoundary";
import NexusFooter from "../layout/NexusFooter";
import RetroPanel from "../layout/RetroPanel";
import TifaWidget from "../tifa/TifaWidget";
import AssetWorkspaceHeader from "./AssetWorkspaceHeader";
import TimeframeSelector from "./TimeframeSelector";

type AssetWorkspaceShellProps = {
  asset: NexusAsset;
};

export default function AssetWorkspaceShell({ asset }: AssetWorkspaceShellProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(NEXUS_TIMEFRAMES[2]);
  const [trend, setTrend] = useState<NexusSignal["trend"] | "SIDEWAY" | "DISABLED">("SIDEWAY");

  const trendRing =
    trend === "UPTREND"
      ? "ring-2 ring-[rgba(94,234,212,0.56)] shadow-[0_0_28px_rgba(94,234,212,0.24)]"
      : trend === "DOWNTREND"
        ? "ring-2 ring-[rgba(251,113,133,0.56)] shadow-[0_0_28px_rgba(251,113,133,0.24)]"
        : trend === "DISABLED"
          ? "ring-1 ring-[rgba(255,255,255,0.2)] shadow-[0_0_16px_rgba(255,255,255,0.1)]"
          : "ring-1 ring-[rgba(255,255,255,0.22)] shadow-[0_0_18px_rgba(255,255,255,0.1)]";

  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-6 text-[var(--text-main)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.075)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition hover:border-[var(--border-pink)] hover:bg-[rgba(255,95,162,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Top 10 Nexus Universe
        </Link>

        <ClientErrorBoundary>
          <AssetWorkspaceHeader asset={asset} />
        </ClientErrorBoundary>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <ClientErrorBoundary>
            <PriceWidget asset={asset} />
          </ClientErrorBoundary>

          <ClientErrorBoundary>
            <RetroPanel title="Timeframe Selector" eyebrow={`${asset.symbol} workspace`}>
              <div className="space-y-4 p-5">
                <TimeframeSelector
                  selectedTimeframe={selectedTimeframe}
                  onSelectTimeframe={setSelectedTimeframe}
                />
                <p className="text-xs leading-5 text-[var(--text-muted)]">
                  Timeframe controls chart interval, Nexus MA context, and Decision Matrix
                  confirmations. Market data only; no trade execution or recommendations.
                </p>
              </div>
            </RetroPanel>
          </ClientErrorBoundary>
        </div>

        <ClientErrorBoundary>
          <RetroPanel
            title="TradingView Chart"
            eyebrow={`${asset.symbol} ${selectedTimeframe.label}`}
          >
            <div className="p-4">
              <div className="overflow-hidden rounded-xl border border-[rgba(125,211,252,0.16)] bg-[#05070b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_18px_44px_rgba(0,0,0,0.28)]">
                <TradingViewChart
                  asset={asset}
                  timeframe={selectedTimeframe}
                  theme="dark"
                  height={680}
                />
              </div>
            </div>
          </RetroPanel>
        </ClientErrorBoundary>

        <ClientErrorBoundary>
          <div className={`rounded-2xl transition-all duration-700 ${trendRing}`}>
            <NexusAutoChecklist
              asset={asset}
              timeframe={selectedTimeframe}
              onTrendChange={setTrend}
            />
          </div>
        </ClientErrorBoundary>

        <NexusFooter />
      </div>
      <TifaWidget
        page="asset"
        context={{
          page: `/asset/${asset.id}`,
          assetId: asset.id,
          timeframe: selectedTimeframe.binance,
        }}
      />
    </main>
  );
}
