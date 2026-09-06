import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { NEXUS_ASSETS } from "../../config/assets";
import { requireApiAuth } from "../../lib/auth/api";
import {
  buildFallbackMarketSnapshot,
  buildMarketSnapshot,
  isMarketSnapshot,
  type CoinGeckoGlobalData,
  type CoinGeckoMarket,
  type MarketSnapshot,
} from "../../lib/marketSnapshot";
import { withProviderRetry } from "../../lib/providerRetry";

export const runtime = "nodejs";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const MARKET_SNAPSHOT_TTL_MS = 60_000;
const MARKET_SNAPSHOT_CACHE_DIR = path.join(process.cwd(), ".runtime");
const MARKET_SNAPSHOT_CACHE_FILE = path.join(
  MARKET_SNAPSHOT_CACHE_DIR,
  "market-snapshot-cache.json"
);

let cachedSnapshot: MarketSnapshot | null = null;
let cachedAt = 0;
let inFlightPromise: Promise<MarketSnapshot> | null = null;

function getCacheAge(now = Date.now()) {
  return cachedAt ? now - cachedAt : 0;
}

function withCache(
  snapshot: MarketSnapshot,
  cache: { status: "hit" | "miss" | "stale"; age_ms: number }
) {
  return { ...snapshot, cache };
}

async function writePersistentSnapshot(snapshot: MarketSnapshot) {
  try {
    await mkdir(MARKET_SNAPSHOT_CACHE_DIR, { recursive: true });
    await writeFile(MARKET_SNAPSHOT_CACHE_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  } catch (error) {
    console.warn("Failed to persist market snapshot cache:", error);
  }
}

async function readPersistentSnapshot() {
  try {
    const [file, stats] = await Promise.all([
      readFile(MARKET_SNAPSHOT_CACHE_FILE, "utf8"),
      stat(MARKET_SNAPSHOT_CACHE_FILE),
    ]);
    const parsed: unknown = JSON.parse(file);

    if (!isMarketSnapshot(parsed)) return null;

    return {
      snapshot: parsed,
      age_ms: Math.max(0, Date.now() - stats.mtimeMs),
    };
  } catch {
    return null;
  }
}

async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const ids = NEXUS_ASSETS.map((asset) => asset.coingeckoId).join(",");

  const [globalRes, marketsRes] = await Promise.all([
    withProviderRetry(() =>
      axios.get<{ data: CoinGeckoGlobalData }>(`${COINGECKO_BASE_URL}/global`, {
        timeout: 10_000,
      })
    ),
    withProviderRetry(() =>
      axios.get<CoinGeckoMarket[]>(`${COINGECKO_BASE_URL}/coins/markets`, {
        timeout: 10_000,
        params: {
          vs_currency: "usd",
          ids,
          order: "market_cap_desc",
          per_page: 100,
          page: 1,
          sparkline: false,
          price_change_percentage: "1h,24h,7d",
        },
      })
    ),
  ]);

  return buildMarketSnapshot(globalRes.data.data, marketsRes.data);
}

function refreshMarketSnapshot() {
  if (!inFlightPromise) {
    inFlightPromise = fetchMarketSnapshot()
      .then(async (snapshot) => {
        cachedSnapshot = snapshot;
        cachedAt = Date.now();
        await writePersistentSnapshot(snapshot);
        return snapshot;
      })
      .finally(() => {
        inFlightPromise = null;
      });
  }

  return inFlightPromise;
}

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  const now = Date.now();
  const ageMs = getCacheAge(now);

  if (cachedSnapshot && ageMs < MARKET_SNAPSHOT_TTL_MS) {
    return NextResponse.json(withCache(cachedSnapshot, { status: "hit", age_ms: ageMs }));
  }

  try {
    const snapshot = await refreshMarketSnapshot();
    return NextResponse.json(withCache(snapshot, { status: "miss", age_ms: 0 }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch market snapshot";

    if (cachedSnapshot) {
      return NextResponse.json(
        withCache(
          {
            ...cachedSnapshot,
            status: "degraded",
            error: { code: "MARKET_SNAPSHOT_STALE", message },
          },
          { status: "stale", age_ms: getCacheAge() }
        )
      );
    }

    const persisted = await readPersistentSnapshot();
    if (persisted) {
      cachedSnapshot = persisted.snapshot;
      cachedAt = Date.now() - persisted.age_ms;

      return NextResponse.json(
        withCache(
          {
            ...persisted.snapshot,
            status: "degraded",
            error: { code: "MARKET_SNAPSHOT_STALE", message },
          },
          { status: "stale", age_ms: persisted.age_ms }
        )
      );
    }

    return NextResponse.json(
      withCache(buildFallbackMarketSnapshot(message), { status: "miss", age_ms: 0 })
    );
  }
}
