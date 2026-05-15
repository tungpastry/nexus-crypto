"use client";

import { useEffect, useRef, useState } from "react";
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
    __nexusTradingViewLoading?: Promise<void>;
  }
}

function loadTradingViewScript() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("TradingView can only load in the browser"));
  }

  if (window.TradingView) return Promise.resolve();
  if (window.__nexusTradingViewLoading) return window.__nexusTradingViewLoading;

  window.__nexusTradingViewLoading = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://s3.tradingview.com/tv.js"]'
    );

    const finish = () => {
      if (window.TradingView) resolve();
      else reject(new Error("TradingView script loaded without widget API"));
    };

    if (existingScript) {
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("TradingView script failed to load")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("TradingView script failed to load"));
    document.head.appendChild(script);
  }).catch((error) => {
    window.__nexusTradingViewLoading = undefined;
    throw error;
  });

  return window.__nexusTradingViewLoading;
}

export default function TradingViewChart({
  asset,
  timeframe,
  theme = "dark",
  height = 600,
}: TradingViewChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const containerId = `tradingview_${asset.symbol}_${timeframe.label}`.replace(/\W/g, "_");
  const symbol = asset.tradingViewSymbol || "BINANCE:BTCUSDT";

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();
    setLoadFailed(false);

    if (!asset.enableChart || !asset.tradingViewSymbol) return;

    const chartNode = document.createElement("div");
    chartNode.id = containerId;
    chartNode.style.width = "100%";
    chartNode.style.height = "100%";
    host.appendChild(chartNode);

    loadTradingViewScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.TradingView) return;
        if (!document.getElementById(containerId)) return;

        new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: timeframe.tradingView,
          timezone: "Etc/UTC",
          theme,
          style: "1",
          locale: "en",
          toolbar_bg: theme === "dark" ? "#0b0710" : "#f8fafc",
          enable_publishing: false,
          hide_legend: false,
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          studies: ["MASimple@tv-basicstudies"],
          container_id: containerId,
        });
      })
      .catch((error) => {
        console.error("TradingView unavailable:", error);
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      if (host.contains(chartNode)) {
        host.removeChild(chartNode);
      }
    };
  }, [asset.enableChart, asset.tradingViewSymbol, containerId, symbol, theme, timeframe.tradingView]);

  if (!asset.enableChart) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] p-6 text-center text-[var(--text-muted)]">
        {asset.symbol} is configured as market data only, so TradingView charting is disabled.
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] p-6 text-center text-[var(--text-muted)]">
        TradingView unavailable. Please refresh or check network access.
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.14)] shadow-[0_18px_50px_rgba(0,0,0,0.35),0_0_35px_rgba(255,95,162,0.08)]"
      style={{ width: "100%", height }}
    />
  );
}
