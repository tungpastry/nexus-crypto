"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { calcMA } from "./utils/indicators";

interface Props {
  tf: string; // từ page.tsx: "15" | "60" | "240" | "D" | "W"
  onTrendChange?: (trend: string) => void;
}

// ✅ Map timeframe TradingView -> Binance
function tvToBinance(tf: string): string {
  const key = tf.toUpperCase();
  const map: Record<string, string> = {
    "1": "1m",
    "3": "3m",
    "5": "5m",
    "15": "15m",
    "30": "30m",
    "45": "45m",
    "60": "1h",
    "120": "2h",
    "180": "3h",
    "240": "4h",
    "360": "6h",
    "480": "8h",
    "720": "12h",
    "D": "1d",
    "W": "1w",
    "M": "1M",
  };
  return map[key] ?? "1h"; // default an toàn
}

export default function AutoChecklist({ tf, onTrendChange }: Props) {
  const [signal, setSignal] = useState<{
    price: number;
    ma20: number;
    ma50: number;
    ma200: number;
    trend: string;
  } | null>(null);

  const [fade, setFade] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setError(null);
      const interval = tvToBinance(tf);

      // Bạn có thể thay bằng API internal: `/api/btc-klines?tf=${interval}`
      const limit = 650; // đủ cho MA200
      const { data } = await axios.get(
        `https://api.binance.com/api/v3/klines`,
        { params: { symbol: "BTCUSDT", interval, limit } }
      );

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No data from Binance for tf=${interval}`);
      }

      const closes: number[] = data.map((c: any) => parseFloat(c[4]));
      const current = closes.at(-1) ?? 0;
      const ma20 = calcMA(closes, 20).at(-1) ?? 0;
      const ma50 = calcMA(closes, 50).at(-1) ?? 0;
      const ma200 = calcMA(closes, 200).at(-1) ?? 0;

      let trend = "Sideway";
      if (current && ma20 && ma50 && ma200) {
        if (current > ma20 && ma20 > ma50 && ma50 > ma200) trend = "Uptrend";
        else if (current < ma20 && ma20 < ma50 && ma50 < ma200) trend = "Downtrend";
      }

      setFade(true);
      setTimeout(() => setFade(false), 1000);
      setSignal({ price: current, ma20, ma50, ma200, trend });
      onTrendChange?.(trend);
    } catch (err: any) {
      console.error("AutoChecklist fetch error:", err?.message || err);
      setError(err?.message || "Fetch failed");
      setSignal(null);
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [tf]); // đổi TF là fetch lại

  // UI
  if (error) {
    return (
      <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-2 text-slate-200">
          Auto Checklist (MA Trend Analysis)
        </h3>
        <p className="text-sm text-red-400">Error: {error}</p>
        <p className="text-xs text-gray-500 mt-1">TF: {tf} → {tvToBinance(tf)}</p>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-2 text-slate-200">
          Auto Checklist (MA Trend Analysis)
        </h3>
        <p className="text-sm text-gray-400">Loading...</p>
        <p className="text-xs text-gray-500 mt-1">TF: {tf} → {tvToBinance(tf)}</p>
      </div>
    );
  }

  const { price, ma20, ma50, ma200, trend } = signal;
  const trendColor =
    trend === "Uptrend"
      ? "text-emerald-400"
      : trend === "Downtrend"
      ? "text-red-400"
      : "text-gray-400";

  return (
    <div
      className={`bg-gray-900 text-white p-5 rounded-2xl shadow-lg border transition-all duration-700 ${
        fade ? "ring-2 ring-emerald-400/60" : "ring-0"
      }`}
    >
      <h3 className="text-lg font-semibold mb-3 text-center text-slate-200">
        Auto Checklist (MA Trend Analysis)
      </h3>

      <div
        className={`flex flex-col sm:flex-row justify-around items-center gap-2 text-sm font-mono transition-opacity duration-700 ${
          fade ? "opacity-80" : "opacity-100"
        }`}
      >
        <span className="text-yellow-400">
          Price: <span className="font-semibold">{price.toFixed(2)}</span>
        </span>
        <span className="text-red-400">
          MA20: <span className="font-semibold">{ma20.toFixed(2)}</span>
        </span>
        <span className="text-green-400">
          MA50: <span className="font-semibold">{ma50.toFixed(2)}</span>
        </span>
        <span className="text-blue-400">
          MA200: <span className="font-semibold">{ma200.toFixed(2)}</span>
        </span>
      </div>

      <div className={`mt-3 text-center text-base font-semibold ${trendColor}`}>
        → {trend === "Uptrend" ? "📈 Uptrend" : trend === "Downtrend" ? "📉 Downtrend" : "⚖️ Sideway"}
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        TF: {tf} → {tvToBinance(tf)} | Auto refresh every 60s
      </p>
    </div>
  );
}
