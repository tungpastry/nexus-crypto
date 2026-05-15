"use client";

import { useEffect, useRef } from "react";
import type { NexusAsset } from "../config/assets";
import type { NexusTimeframe } from "../config/timeframes";

interface TradingViewChartProps {
  asset: NexusAsset;
  timeframe: NexusTimeframe;
  theme?: "dark" | "light";
  height?: number;
}

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => unknown;
    };
  }
}

export default function TradingViewChart({
  asset,
  timeframe,
  theme = "dark",
  height = 600,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = `tradingview_${asset.symbol}_${timeframe.label}`.replace(/\W/g, "_");
  const symbol = asset.tradingViewSymbol || "BINANCE:BTCUSDT";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    if (!asset.enableChart || !asset.tradingViewSymbol) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView) return;
      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval: timeframe.tradingView,
        timezone: "Etc/UTC",
        theme,
        style: "1",
        locale: "en",
        toolbar_bg: theme === "dark" ? "#050008" : "#f8fafc",
        enable_publishing: false,
        hide_legend: false,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        studies: ["MASimple@tv-basicstudies"],
        container_id: containerId,
      });
    };

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [asset.enableChart, asset.tradingViewSymbol, containerId, symbol, theme, timeframe.tradingView]);

  if (!asset.enableChart) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-pink-500/20 bg-black/70 p-6 text-center text-pink-100/70">
        {asset.symbol} is configured as market data only, so TradingView charting is disabled.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id={containerId}
      className="overflow-hidden rounded-2xl border border-pink-500/20 shadow-[0_0_30px_rgba(255,47,166,0.12)]"
      style={{ width: "100%", height }}
    />
  );
}
