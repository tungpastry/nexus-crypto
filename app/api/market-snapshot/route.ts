import { NextResponse } from "next/server";
import axios from "axios";
import { NEXUS_ASSETS } from "../../config/assets";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

export async function GET() {
  try {
    const ids = NEXUS_ASSETS.map((asset) => asset.coingeckoId).join(",");

    const [globalRes, marketsRes] = await Promise.all([
      axios.get(`${COINGECKO_BASE_URL}/global`, { timeout: 10_000 }),
      axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
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

    const marketsById = new Map(marketsRes.data.map((market: any) => [market.id, market]));

    return NextResponse.json({
      provider: "coingecko",
      updated_at: new Date().toISOString(),
      global: {
        market_cap_usd: globalRes.data.data.total_market_cap.usd,
        volume_24h_usd: globalRes.data.data.total_volume.usd,
        btc_dominance: globalRes.data.data.market_cap_percentage.btc,
        eth_dominance: globalRes.data.data.market_cap_percentage.eth,
      },
      assets: NEXUS_ASSETS.map((asset) => {
        const market: any = marketsById.get(asset.coingeckoId);
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch market snapshot";
    return NextResponse.json({
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
    });
  }
}
