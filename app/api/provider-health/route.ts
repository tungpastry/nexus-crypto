import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthConfig } from "../../lib/auth/config";
import { getCryptoKlines, getCryptoPrice } from "../../lib/binance";

type CheckStatus = "ok" | "warn" | "error";
type SnapshotCacheStatus = "hit" | "miss" | "stale" | "unknown";

async function measure(check: () => Promise<unknown>) {
  const started = Date.now();
  try {
    await check();
    return { status: "ok", latency_ms: Date.now() - started };
  } catch (error) {
    return {
      status: "error",
      latency_ms: Date.now() - started,
      message: error instanceof Error ? error.message : "Unknown provider error",
    };
  }
}

function getSnapshotCacheStatus(payload: unknown): SnapshotCacheStatus {
  if (!payload || typeof payload !== "object") {
    return "unknown";
  }

  const cache = (payload as { cache?: { status?: unknown } }).cache;
  if (
    cache?.status === "hit" ||
    cache?.status === "miss" ||
    cache?.status === "stale"
  ) {
    return cache.status;
  }

  return "unknown";
}

function getSnapshotAgeMs(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const cache = (payload as { cache?: { age_ms?: unknown } }).cache;
  return typeof cache?.age_ms === "number" ? cache.age_ms : null;
}

function buildCacheStatusCheck(value: SnapshotCacheStatus) {
  const status: CheckStatus =
    value === "hit" || value === "miss" ? "ok" : "warn";

  return { status, value };
}

function buildAgeCheck(value: number | null) {
  if (value === null) {
    return { status: "warn" as const, value };
  }

  if (value < 60_000) {
    return { status: "ok" as const, value };
  }

  if (value < 300_000) {
    return { status: "warn" as const, value };
  }

  return { status: "error" as const, value };
}

async function measureMarketSnapshot(origin: string) {
  const started = Date.now();
  const authConfig = getAuthConfig();
  const headers =
    authConfig.enabled && authConfig.smokeAuthToken
      ? { Authorization: `Bearer ${authConfig.smokeAuthToken}` }
      : undefined;

  try {
    const res = await axios.get(`${origin}/api/market-snapshot`, {
      timeout: 10_000,
      headers,
    });
    const latencyMs = Date.now() - started;
    const cacheStatus = getSnapshotCacheStatus(res.data);
    const ageMs = getSnapshotAgeMs(res.data);

    return {
      marketSnapshot: { status: "ok" as const, latency_ms: latencyMs },
      cacheStatus: buildCacheStatusCheck(cacheStatus),
      ageMs: buildAgeCheck(ageMs),
    };
  } catch (error) {
    return {
      marketSnapshot: {
        status: "error" as const,
        latency_ms: Date.now() - started,
        message:
          error instanceof Error ? error.message : "Market snapshot unavailable",
      },
      cacheStatus: { status: "error" as const, value: "unknown" as const },
      ageMs: { status: "error" as const, value: null },
    };
  }
}

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;

  const [binancePrice, binanceKlines, snapshotHealth] = await Promise.all([
    measure(() => getCryptoPrice("BTCUSDT")),
    measure(() => getCryptoKlines("BTCUSDT", "1h", 5)),
    measureMarketSnapshot(origin),
  ]);

  const checks = {
    binance_price: binancePrice,
    binance_klines: binanceKlines,
    market_snapshot: snapshotHealth.marketSnapshot,
    market_snapshot_cache_status: snapshotHealth.cacheStatus,
    market_snapshot_age_ms: snapshotHealth.ageMs,
  };
  const status = Object.values(checks).every((check) => check.status === "ok")
    ? "ok"
    : "degraded";

  return NextResponse.json({
    provider: "nexus_crypto",
    status,
    updated_at: new Date().toISOString(),
    checks,
  });
}
