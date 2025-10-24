"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
  Plugin,
} from "chart.js";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import zoomPlugin from "chartjs-plugin-zoom";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
  CandlestickController,
  CandlestickElement,
  zoomPlugin
);

interface CandleData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

interface Props {
  tf: string;
  setTf: (v: string) => void;
}

interface HLine {
  id: string;
  price: number;
}

export default function ChartRealtime({ tf, setTf }: Props) {
  const chartRef = useRef<ChartJS<"candlestick"> | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [maData, setMaData] = useState<{ ma20: number[]; ma50: number[]; ma200: number[] }>({
    ma20: [],
    ma50: [],
    ma200: [],
  });

  // 🧩 Horizontal Lines
  const [lines, setLines] = useState<HLine[]>([]);

  // 🧮 Hàm tính MA
  const calcMA = (data: number[], period: number) => {
    const ma: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      ma.push(slice.reduce((a, b) => a + b, 0) / period);
    }
    return ma;
  };

  // 🟢 Fetch data
  async function fetchCandles() {
    try {
      const limit = 650;
      const res = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${tf}&limit=${limit}`
      );
      const newCandles: CandleData[] = res.data.map((c: any) => ({
        x: c[0],
        o: parseFloat(c[1]),
        h: parseFloat(c[2]),
        l: parseFloat(c[3]),
        c: parseFloat(c[4]),
      }));
      const closes = newCandles.map((d) => d.c);
      const ma20 = calcMA(closes, 20);
      const ma50 = calcMA(closes, 50);
      const ma200 = calcMA(closes, 200);
      setCandles(newCandles);
      setMaData({ ma20, ma50, ma200 });
    } catch (e) {
      console.error("Chart fetch error:", e);
    }
  }

  useEffect(() => {
    fetchCandles();
    const interval = setInterval(fetchCandles, 60000);
    return () => clearInterval(interval);
  }, [tf]);

  // 🧠 Lưu & load horizontal lines
  useEffect(() => {
    const saved = localStorage.getItem("chart_hlines");
    if (saved) setLines(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("chart_hlines", JSON.stringify(lines));
  }, [lines]);

  // ✅ Plugin crosshair + horizontal line render
  const customPlugin: Plugin = {
    id: "customPlugin",
    afterDraw(chart) {
      const ctx = chart.ctx;
      const tooltip = chart.tooltip;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(180,180,180,0.6)";
      ctx.lineWidth = 1;

      // ✅ Crosshair (dọc + ngang)
      const active = tooltip?.getActiveElements?.();
      if (active && active.length > 0) {
        const { x, y } = active[0].element;
        ctx.beginPath();
        ctx.moveTo(chart.chartArea.left, y);
        ctx.lineTo(chart.chartArea.right, y);
        ctx.moveTo(x, chart.chartArea.top);
        ctx.lineTo(x, chart.chartArea.bottom);
        ctx.stroke();

        // Label giá
        const price = chart.scales.y.getValueForPixel(y)?.toFixed(2);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(chart.chartArea.right - 70, y - 8, 70, 16);
        ctx.fillStyle = "#10b981";
        ctx.font = "10px monospace";
        ctx.fillText(price ?? "", chart.chartArea.right - 65, y + 4);
      }

      // 🟡 Vẽ các Horizontal Line người dùng thêm
      lines.forEach((line) => {
        const y = chart.scales.y.getPixelForValue(line.price);
        if (y < chart.chartArea.top || y > chart.chartArea.bottom) return;
        ctx.setLineDash([]);
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(chart.chartArea.left, y);
        ctx.lineTo(chart.chartArea.right, y);
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(chart.chartArea.right - 65, y - 8, 65, 16);
        ctx.fillStyle = "#facc15";
        ctx.fillText(line.price.toFixed(2), chart.chartArea.right - 60, y + 4);
      });

      ctx.restore();
    },
  };

  // 🖱 Thêm / xóa horizontal lines
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleClick = (e: MouseEvent) => {
      if (e.altKey || e.button === 2) {
        e.preventDefault();
        const rect = chart.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const price = chart.scales.y.getValueForPixel(y);
        if (price === undefined) return; // ✅ Guard tránh undefined
        const newLine: HLine = { id: crypto.randomUUID(), price };
        setLines((prev) => [...prev, newLine]);
      }
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const rect = chart.canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = chart.scales.y.getValueForPixel(y);
      if (price === undefined) return;
      // Xóa line gần nhất trong khoảng ±2 giá
      setLines((prev) => prev.filter((l) => Math.abs(l.price - price) > 2));
    };

    chart.canvas.addEventListener("click", handleClick);
    chart.canvas.addEventListener("dblclick", handleDoubleClick);
    chart.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      chart.canvas.removeEventListener("click", handleClick);
      chart.canvas.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [lines]);

  // 🧮 Căn chỉnh MA
  const alignMA = (ma: number[], candles: CandleData[]) => {
    const offset = candles.length - ma.length;
    return candles.map((c, i) => ({
      x: c.x,
      y: i >= offset ? ma[i - offset] : null,
    }));
  };

  const hasMA200 = maData.ma200.filter(Boolean).length >= 2;

  const chartData = {
    datasets: [
      {
        label: "BTC/USDT",
        type: "candlestick",
        data: candles,
        color: { up: "#10b981", down: "#ef4444", unchanged: "#999" },
      },
      {
        label: "MA20",
        type: "line",
        data: alignMA(maData.ma20, candles),
        borderColor: "#f87171",
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: "MA50",
        type: "line",
        data: alignMA(maData.ma50, candles),
        borderColor: "#34d399",
        borderWidth: 1,
        pointRadius: 0,
      },
      ...(hasMA200
        ? [
            {
              label: "MA200",
              type: "line",
              data: alignMA(maData.ma200, candles),
              borderColor: "#3b82f6",
              borderWidth: 1.2,
              pointRadius: 0,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        labels: { color: "#9ca3af", font: { size: 11 } },
      },
      zoom: {
        pan: { enabled: true, mode: "xy" as const },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "xy" as const },
      },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        type: "time" as const,
        time: { unit: tf === "1h" ? "hour" : "day" },
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(75,85,99,0.2)" },
      },
      y: {
        position: "right" as const,
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(75,85,99,0.2)" },
      },
    },
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Timeframe buttons */}
      <div className="flex gap-2 mb-2">
        {["1h", "4h", "1d", "1w"].map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={`px-3 py-1 text-xs rounded-md ${
              tf === t ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => chartRef.current?.resetZoom()}
          className="px-3 py-1 text-xs bg-gray-700 rounded-md text-gray-300 hover:bg-gray-600"
        >
          Reset Zoom
        </button>
      </div>

      {/* Chart container */}
      <div
        className="relative w-full max-w-6xl rounded-xl overflow-hidden border border-gray-700 shadow-lg bg-gray-900"
        style={{ height: "65vh" }}
      >
        {candles.length > 0 ? (
          <Chart
            ref={chartRef}
            type="candlestick"
            data={chartData as any}
            options={options as any}
            plugins={[customPlugin]}
          />
        ) : (
          <p className="text-gray-500 text-center mt-20">Loading chart...</p>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        🖱 Alt + Click (hoặc Right Click) để thêm Horizontal Line | Double Click để xóa
      </p>
    </div>
  );
}
