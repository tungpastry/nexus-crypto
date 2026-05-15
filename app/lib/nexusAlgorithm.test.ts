import { afterEach, describe, expect, it, vi } from "vitest";
import { NEXUS_ASSETS } from "../config/assets";
import { NEXUS_TIMEFRAMES } from "../config/timeframes";
import type { NexusCandle } from "./binance";
import { buildNexusSignal } from "./nexusAlgorithm";

const asset = NEXUS_ASSETS[0];
const timeframe = NEXUS_TIMEFRAMES[2];
const now = "2026-05-15T12:00:00.000Z";

function makeCandles(closes: number[]): NexusCandle[] {
  return closes.map((close, index) => {
    const previous = closes[index - 1] ?? close;
    const open = index === 0 ? close - 0.2 : previous;
    const high = Math.max(open, close) + 1;
    const low = Math.min(open, close) - 1;

    return {
      time: Date.parse(now) - (closes.length - index) * 60_000,
      open,
      high,
      low,
      close,
      volume: 1_000 + index,
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
});
