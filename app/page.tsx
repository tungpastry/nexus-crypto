"use client";

import { useState } from "react";
import PriceWidget from "./components/PriceWidget";
import AutoChecklist from "./components/AutoChecklist";
import ManualChecklist from "./components/ManualChecklist";
import TradingViewChart from "./components/TradingViewChart";

/**
 * page.tsx v2.0
 * Dashboard Nexus Crypto — sử dụng TradingView Chart
 * Không còn phụ thuộc vào Chart.js
 */
export default function Home() {
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");
  const [tf, setTf] = useState("60"); // timeframe TradingView: 15, 60, 240, D, W
  const [trend, setTrend] = useState("Sideway");

  // 🎨 Áp dụng glow viền theo trend
  const trendRing =
    trend === "Uptrend"
      ? "ring-2 ring-emerald-500/70 shadow-lg shadow-emerald-500/20"
      : trend === "Downtrend"
        ? "ring-2 ring-red-500/70 shadow-lg shadow-red-500/20"
        : "ring-1 ring-slate-600/30";

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6 space-y-6">
      <h1 className="text-3xl font-bold text-emerald-400">
        ⚡ Nexus Crypto Dashboard
      </h1>

      {/* 🟢 Price + AutoChecklist */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-6xl mt-4">
        <div className="w-full md:w-1/2">
          <PriceWidget />
        </div>

        <div
          className={`w-full md:w-1/2 rounded-2xl p-[2px] transition-all duration-700 ${trendRing}`}
        >
          <AutoChecklist tf={tf} onTrendChange={setTrend} />
        </div>
      </div>

      {/* 🔘 Symbol Selector */}
      <div className="flex gap-3 mt-4">
        {["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT"].map(
          (pair) => (
            <button
              key={pair}
              onClick={() => setSymbol(pair)}
              className={`px-4 py-1 rounded-md text-xs font-semibold ${symbol === pair
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
            >
              {pair.replace("BINANCE:", "")}
            </button>
          )
        )}
      </div>

      {/* 🕒 Timeframe Selector */}
      <div className="flex gap-2 mt-2">
        {["15", "60", "240", "D", "W"].map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={`px-3 py-1 text-xs rounded-md ${tf === t ? "bg-emerald-500 text-white" : "bg-gray-800 text-gray-300"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 📊 TradingView Chart */}
      <div className="w-full max-w-6xl mt-4">
        <TradingViewChart symbol={symbol} interval={tf} theme="dark" height={600} />
      </div>

      {/* 📝 Manual Checklist */}
      <ManualChecklist tf={tf} />

      <p className="text-gray-500 text-xs text-center mt-6">
        Data via Binance API — Rendered with TradingView Chart Widget | Auto refresh 60s
      </p>
    </main>
  );
}
