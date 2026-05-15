"use client";

import { useState } from "react";
import { Activity, ShieldCheck } from "lucide-react";
import PriceWidget from "./components/PriceWidget";
import NexusAutoChecklist from "./components/checklist/NexusAutoChecklist";
import ManualChecklist from "./components/ManualChecklist";
import TradingViewChart from "./components/TradingViewChart";
import RetroPanel from "./components/layout/RetroPanel";
import MarketSnapshot from "./components/market/MarketSnapshot";
import AssetWatchlist from "./components/market/AssetWatchlist";
import { NEXUS_ASSETS } from "./config/assets";
import { NEXUS_TIMEFRAMES } from "./config/timeframes";

export default function Home() {
  const [selectedAsset, setSelectedAsset] = useState(NEXUS_ASSETS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(NEXUS_TIMEFRAMES[2]);
  const [trend, setTrend] = useState("SIDEWAY");

  const trendRing =
    trend === "UPTREND"
      ? "ring-2 ring-emerald-400/60 shadow-[0_0_24px_rgba(56,255,156,0.16)]"
      : trend === "DOWNTREND"
        ? "ring-2 ring-red-400/60 shadow-[0_0_24px_rgba(255,79,109,0.16)]"
        : "ring-1 ring-pink-500/20";

  return (
    <main className="min-h-screen bg-[#050008] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-pink-500/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.36em] text-pink-300/75">
              Retro Market Command Center
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-normal text-pink-50 sm:text-5xl">
              Nexus Crypto SaaS 2026
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-pink-100/60">
              A professional black-pink crypto dashboard for market data, chart workflow,
              Nexus MA context, and manual discipline. No trade execution. No trading
              recommendations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-pink-100/70">
            <div className="rounded-xl border border-pink-500/20 bg-black/50 p-3">
              <Activity className="mb-2 h-4 w-4 text-cyan-300" />
              Binance + CoinGecko
            </div>
            <div className="rounded-xl border border-pink-500/20 bg-black/50 p-3">
              <ShieldCheck className="mb-2 h-4 w-4 text-emerald-300" />
              Zenora health ready
            </div>
          </div>
        </header>

        <MarketSnapshot />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <AssetWatchlist selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

          <RetroPanel title="Selected Workspace" eyebrow={selectedAsset.name}>
            <div className="space-y-4 p-4">
              <PriceWidget asset={selectedAsset} />

              <div className="flex flex-wrap gap-2">
                {NEXUS_TIMEFRAMES.map((timeframe) => (
                  <button
                    key={timeframe.binance}
                    type="button"
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`rounded-lg border px-3 py-2 font-mono text-xs transition ${
                      selectedTimeframe.binance === timeframe.binance
                        ? "border-pink-400 bg-pink-500/20 text-pink-50"
                        : "border-pink-500/15 bg-black/35 text-pink-100/60 hover:bg-pink-500/10"
                    }`}
                  >
                    {timeframe.label}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-pink-500/10 bg-black/35 p-3 text-xs leading-5 text-pink-100/55">
                {selectedAsset.note ||
                  `${selectedAsset.symbol} uses the Nexus trading workflow with Binance price, TradingView chart, and MA checklist context.`}
              </div>
            </div>
          </RetroPanel>
        </div>

        <div className={`rounded-2xl transition-all duration-700 ${trendRing}`}>
          <NexusAutoChecklist
            asset={selectedAsset}
            timeframe={selectedTimeframe}
            onTrendChange={setTrend}
          />
        </div>

        <RetroPanel title="TradingView Chart" eyebrow={`${selectedAsset.symbol} ${selectedTimeframe.label}`}>
          <div className="p-4">
            <TradingViewChart asset={selectedAsset} timeframe={selectedTimeframe} theme="dark" height={620} />
          </div>
        </RetroPanel>

        <ManualChecklist asset={selectedAsset} timeframe={selectedTimeframe} />

        <p className="pb-4 text-center text-xs text-pink-100/40">
          Data via Binance and CoinGecko. TradingView chart widget renders client-side.
        </p>
      </div>
    </main>
  );
}
