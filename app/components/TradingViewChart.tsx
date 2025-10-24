"use client";

import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol?: string; // ví dụ: "BINANCE:BTCUSDT"
  interval?: string; // ví dụ: "60", "240", "D", "W"
  theme?: "dark" | "light";
  height?: number;
}

/**
 * TradingViewChart.tsx v1.0
 * Triển khai TradingView Advanced Chart widget (tv.js)
 * - Tự resize theo container
 * - Đồng bộ theme, interval, symbol
 * - Dùng trong Next.js 16 (client component)
 */
export default function TradingViewChart({
  symbol = "BINANCE:BTCUSDT",
  interval = "60",
  theme = "dark",
  height = 600,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 🧹 Clear nội dung cũ nếu re-render
    containerRef.current.innerHTML = "";

    // ✅ Inject script TradingView
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (typeof TradingView === "undefined") return;
      // @ts-ignore
      new TradingView.widget({
        autosize: true,
        symbol,
        interval,
        timezone: "Etc/UTC",
        theme,
        style: "1",
        locale: "en",
        toolbar_bg: theme === "dark" ? "#0f172a" : "#f8fafc",
        enable_publishing: false,
        hide_legend: false,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        container_id: "tradingview_chart",
      });
    };

    containerRef.current.appendChild(script);

    return () => {
      // Cleanup script & chart nếu component bị hủy
      containerRef.current!.innerHTML = "";
    };
  }, [symbol, interval, theme]);

  return (
    <div
      ref={containerRef}
      id="tradingview_chart"
      className="rounded-xl border border-gray-700 overflow-hidden shadow-lg"
      style={{ width: "100%", height }}
    />
  );
}
