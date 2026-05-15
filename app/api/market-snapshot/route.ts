import { NextResponse } from "next/server";
import axios from "axios";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { NEXUS_ASSETS } from "../../config/assets";

export const runtime = "nodejs";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const MARKET_SNAPSHOT_TTL_MS = 60_000;
const MARKET_SNAPSHOT_CACHE_DIR = path.join(process.cwd(), ".runtime");
const MARKET_SNAPSHOT_CACHE_FILE = path.join(
  MARKET_SNAPSHOT_CACHE_DIR,
  "market-snapshot-cache.json"
);

type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  category: string;
  price: number | null;
  change_1h: number | null;
  change_24h: number | null;
  change_7d: number | null;
  volume_24h: number | null;
  market_cap: number | null;
};

type MarketSnapshot = {
  provider: "coingecko";
  status?: "degraded";
  updated_at: string;
  error?: {
    code: string;
    message: string;
  };
  global: {
    market_cap_usd: number | null;
    volume_24h_usd: number | null;
    btc_dominance: number | null;
    eth_dominance: number | null;
  };
  assets: MarketAsset[];
};

type CoinGeckoMarket = {
  id: string;
  current_price?: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume?: number;
  market_cap?: number;
};

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

function buildFallbackSnapshot(message: string): MarketSnapshot {
  return {
    provider: "coingecko",
    status: "degraded",
    updated_at: new Date().toISOString(),
    error: { code: "MARKET_SNAPSHOT_ERROR", message },
    global: {
      market_cap_usd: null,
      volume_24h_usd: null,
      btc_dominance: null,
      eth_dominance: null,
    },
    assets: NEXUS_ASSETS.map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      rank: asset.rank,
      category: asset.category,
      price: null,
      change_1h: null,
      change_24h: null,
      change_7d: null,
      volume_24h: null,
      market_cap: null,
    })),
  };
}

function isNumberOrNull(value: unknown): value is number | null {
  return typeof value === "number" || value === null;
}

function isMarketSnapshot(value: unknown): value is MarketSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  const global = snapshot.global as Record<string, unknown> | undefined;
  const assets = snapshot.assets;

  return (
    snapshot.provider === "coingecko" &&
    typeof snapshot.updated_at === "string" &&
    Boolean(global) &&
    isNumberOrNull(global?.market_cap_usd) &&
    isNumberOrNull(global?.volume_24h_usd) &&
    isNumberOrNull(global?.btc_dominance) &&
    isNumberOrNull(global?.eth_dominance) &&
    Array.isArray(assets) &&
    assets.length === NEXUS_ASSETS.length
  );
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
    axios.get(`${COINGECKO_BASE_URL}/global`, { timeout: 10_000 }),
    axios.get<CoinGeckoMarket[]>(`${COINGECKO_BASE_URL}/coins/markets`, {
      timeout: 10_000,
      params: {
        vs_currency: "usd",
        ids,
        order: "market_cap_desc",
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: "1h,24h,7d",
      },
    }),
  ]);

  const marketsById = new Map(marketsRes.data.map((market) => [market.id, market]));

  return {
    provider: "coingecko",
    updated_at: new Date().toISOString(),
    global: {
      market_cap_usd: globalRes.data.data.total_market_cap.usd,
      volume_24h_usd: globalRes.data.data.total_volume.usd,
      btc_dominance: globalRes.data.data.market_cap_percentage.btc,
      eth_dominance: globalRes.data.data.market_cap_percentage.eth,
    },
    assets: NEXUS_ASSETS.map((asset) => {
      const market = marketsById.get(asset.coingeckoId);
      return {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        rank: asset.rank,
        category: asset.category,
        price: market?.current_price ?? null,
        change_1h: market?.price_change_percentage_1h_in_currency ?? null,
        change_24h: market?.price_change_percentage_24h_in_currency ?? null,
        change_7d: market?.price_change_percentage_7d_in_currency ?? null,
        volume_24h: market?.total_volume ?? null,
        market_cap: market?.market_cap ?? null,
      };
    }),
  };
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

export async function GET() {
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
      withCache(buildFallbackSnapshot(message), { status: "miss", age_ms: 0 })
    );
  }
}
