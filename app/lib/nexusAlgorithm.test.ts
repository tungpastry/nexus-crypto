import { afterEach, describe, expect, it, vi } from "vitest";
import { NEXUS_ASSETS } from "../config/assets";
import { NEXUS_TIMEFRAMES } from "../config/timeframes";
import type { NexusCandle } from "./binance";
import { buildNexusSignal } from "./nexusAlgorithm";

const asset = NEXUS_ASSETS[0];
const timeframe = NEXUS_TIMEFRAMES[2];
const now = "2026-05-15T12:00:00.000Z";

function makeCandles(
  closes: number[],
  options?: {
    volumeAt?: (index: number) => number;
    rangeAt?: (index: number, open: number, close: number) => { high: number; low: number };
  }
): NexusCandle[] {
  return closes.map((close, index) => {
    const previous = closes[index - 1] ?? close;
    const open = index === 0 ? close - 0.2 : previous;
    const range = options?.rangeAt?.(index, open, close);
    const high = range?.high ?? Math.max(open, close) + 1;
    const low = range?.low ?? Math.min(open, close) - 1;

    return {
      time: Date.parse(now) - (closes.length - index) * 60_000,
      open,
      high,
      low,
      close,
      volume: options?.volumeAt?.(index) ?? 1_000 + index,
    };
  });
}

function linearCloses(start: number, step: number, length = 200) {
  return Array.from({ length }, (_, index) => start + index * step);
}

function ruleStatus(signal: ReturnType<typeof buildNexusSignal>, id: string) {
  return signal.rules.find((rule) => rule.id === id)?.status;
}

describe("buildNexusSignal", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects bull alignment and passes directional MA position", () => {
    vi.setSystemTime(new Date(now));
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(linearCloses(100, 0.5)),
      now
    );

    expect(signal.direction).toBe("bull");
    expect(signal.trend).toBe("UPTREND");
    expect(signal.bias).toBe("Bull Bias");
    expect(signal.risk).toBe("Low");
    expect(signal.price).toBeGreaterThan(signal.ma20);
    expect(signal.ma20).toBeGreaterThan(signal.ma50);
    expect(signal.ma50).toBeGreaterThan(signal.ma200);
    expect(ruleStatus(signal, "ma_position")).toBe("pass");
  });

  it("detects bear alignment without penalizing MA position", () => {
    vi.setSystemTime(new Date(now));
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(linearCloses(300, -0.5)),
      now
    );

    expect(signal.direction).toBe("bear");
    expect(signal.trend).toBe("DOWNTREND");
    expect(signal.bias).toBe("Bear Bias");
    expect(signal.risk).toBe("Low");
    expect(signal.price).toBeLessThan(signal.ma20);
    expect(signal.ma20).toBeLessThan(signal.ma50);
    expect(signal.ma50).toBeLessThan(signal.ma200);
    expect(ruleStatus(signal, "ma_position")).toBe("pass");
  });

  it("classifies non-aligned markets as neutral sideway", () => {
    vi.setSystemTime(new Date(now));
    const closes = Array.from(
      { length: 200 },
      (_, index) => 100 + Math.sin(index / 4) * 2
    );
    const signal = buildNexusSignal(asset, timeframe, makeCandles(closes), now);

    expect(signal.direction).toBe("neutral");
    expect(signal.trend).toBe("SIDEWAY");
    expect(signal.risk).toBe("Medium");
    expect(ruleStatus(signal, "ma_position")).toBe("neutral");
  });

  it("keeps scores bounded and rules populated", () => {
    vi.setSystemTime(new Date(now));
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(linearCloses(120, 0.2)),
      now
    );
    const ruleScore = signal.rules.reduce((sum, rule) => sum + rule.score, 0);

    expect(signal.rules.length).toBeGreaterThan(0);
    expect(signal.score).toBeGreaterThanOrEqual(0);
    expect(signal.score).toBeLessThanOrEqual(100);
    expect(ruleScore).toBeLessThanOrEqual(100);
  });

  it("marks fresh market data as pass", () => {
    vi.setSystemTime(new Date(now));
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(linearCloses(100, 0.5)),
      "2026-05-15T11:59:30.000Z"
    );

    expect(ruleStatus(signal, "freshness")).toBe("pass");
  });

  it("marks stale market data as warn", () => {
    vi.setSystemTime(new Date(now));
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(linearCloses(100, 0.5)),
      "2026-05-15T11:58:00.000Z"
    );

    expect(ruleStatus(signal, "freshness")).toBe("warn");
  });

  it("computes atr14 and atrPercent with enough candles", () => {
    vi.setSystemTime(new Date(now));
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(linearCloses(100, 0.2)),
      now
    );

    expect(signal.atr14).toBeGreaterThan(0);
    expect(signal.atrPercent).toBeGreaterThan(0);
  });

  it("classifies high volatility when candle ranges are large", () => {
    vi.setSystemTime(new Date(now));
    const candles = makeCandles(linearCloses(200, 0.1), {
      rangeAt: (_index, open, close) => ({
        high: Math.max(open, close) + 30,
        low: Math.min(open, close) - 30,
      }),
    });
    const signal = buildNexusSignal(asset, timeframe, candles, now);

    expect(signal.volatility).toBe("High");
    expect(ruleStatus(signal, "volatility_atr")).toBe("fail");
  });

  it("marks volume confirmation pass when latest volume is above average", () => {
    vi.setSystemTime(new Date(now));
    const closes = linearCloses(100, 0.15);
    const candles = makeCandles(closes, {
      volumeAt: (index) => (index === closes.length - 1 ? 3_000 : 1_000),
    });
    const signal = buildNexusSignal(asset, timeframe, candles, now);

    expect(signal.volumeRatio).toBeGreaterThan(1.05);
    expect(signal.volumeConfirmation).toBe("pass");
    expect(ruleStatus(signal, "volume_confirmation")).toBe("pass");
  });

  it("marks volume confirmation fail when trend volume is weak", () => {
    vi.setSystemTime(new Date(now));
    const closes = linearCloses(100, 0.2);
    const candles = makeCandles(closes, {
      volumeAt: (index) => (index === closes.length - 1 ? 200 : 1_000),
    });
    const signal = buildNexusSignal(asset, timeframe, candles, now);

    expect(signal.direction).toBe("bull");
    expect(signal.volumeRatio).toBeLessThan(0.8);
    expect(signal.volumeConfirmation).toBe("fail");
    expect(ruleStatus(signal, "volume_confirmation")).toBe("fail");
  });

  it("classifies support/resistance context for near support", () => {
    vi.setSystemTime(new Date(now));
    const closes = [
      ...linearCloses(100, 40 / 149, 150),
      ...Array.from({ length: 49 }, () => 140),
      140.1,
    ];
    const outlierIndex = closes.length - 45;
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(closes, {
        rangeAt: (index, open, close) => ({
          high:
            index === outlierIndex
              ? Math.max(open, close) + 12
              : Math.max(open, close) + 0.1,
          low: Math.min(open, close),
        }),
      }),
      now
    );

    expect(signal.supportResistance.position).toBe("near_support");
    expect(ruleStatus(signal, "support_resistance_context")).toBe("pass");
  });

  it("sets state Confirmed for strong aligned context", () => {
    vi.setSystemTime(new Date(now));
    const closes = linearCloses(100, 0.02);
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(closes, {
        volumeAt: (index) => (index === closes.length - 1 ? 3_200 : 1_000),
      }),
      now,
      { higherTimeframeDirection: "bull" }
    );

    expect(signal.score).toBeGreaterThanOrEqual(80);
    expect(signal.state).toBe("Confirmed");
  });

  it("sets state No Trade for high-risk overextended context", () => {
    vi.setSystemTime(new Date(now));
    const closes = [...Array.from({ length: 199 }, () => 100), 140];
    const signal = buildNexusSignal(
      asset,
      timeframe,
      makeCandles(closes),
      now
    );

    expect(signal.risk).toBe("High");
    expect(signal.state).toBe("No Trade");
  });
});
