import axios from "axios";
import type { NextRequest } from "next/server";
import { NEXUS_ASSETS } from "../../config/assets";
import { getAuthConfig } from "../auth/config";
import type { MarketContextPayload } from "./types";

type SnapshotAsset = {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  category: string;
  price: number | null;
  change_24h: number | null;
  change_7d: number | null;
};

type SnapshotPayload = {
  updated_at?: string;
  cache?: {
    status?: "hit" | "miss" | "stale";
    age_ms?: number;
  };
  global?: {
    market_cap_usd: number | null;
    volume_24h_usd: number | null;
    btc_dominance: number | null;
    eth_dominance: number | null;
  };
  assets?: SnapshotAsset[];
};

export function buildInternalAuthHeaders(req?: NextRequest) {
  const headers: Record<string, string> = {};
  const authHeader = req?.headers.get("authorization");
  if (authHeader) headers.Authorization = authHeader;
  const cookieHeader = req?.headers.get("cookie");
  if (cookieHeader) headers.Cookie = cookieHeader;

  if (!headers.Authorization) {
    const config = getAuthConfig();
    if (config.enabled && config.smokeAuthToken) {
      headers.Authorization = `Bearer ${config.smokeAuthToken}`;
    }
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

export async function getMarketContext(
  origin: string,
  req?: NextRequest
): Promise<MarketContextPayload> {
  const res = await axios.get<SnapshotPayload>(`${origin}/api/market-snapshot`, {
    timeout: 10_000,
    headers: buildInternalAuthHeaders(req),
  });

  const payload = res.data;
  const assets = payload.assets || [];
  const modeById = new Map<string, "nexus" | "market-only">(
    NEXUS_ASSETS.map((asset) => [
      asset.id,
      asset.enableChecklist ? "nexus" : "market-only",
    ])
  );

  return {
    ok: true,
    context_type: "market_snapshot",
    updated_at: payload.updated_at || new Date().toISOString(),
    cache: payload.cache,
    global: {
      market_cap_usd: payload.global?.market_cap_usd ?? null,
      volume_24h_usd: payload.global?.volume_24h_usd ?? null,
      btc_dominance: payload.global?.btc_dominance ?? null,
      eth_dominance: payload.global?.eth_dominance ?? null,
    },
    top_assets: assets.map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      rank: asset.rank,
      category: asset.category,
      price: asset.price,
      change_24h: asset.change_24h,
      change_7d: asset.change_7d,
      mode: modeById.get(asset.id) ?? "nexus",
    })),
    disclaimer: "Market data only. No trade execution.",
  };
}
