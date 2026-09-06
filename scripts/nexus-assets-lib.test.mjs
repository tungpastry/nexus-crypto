import { describe, expect, it } from "vitest";
import { buildNexusCatalog } from "./nexus-assets-lib.mjs";

function fixtures() {
  const coins = Array.from({ length: 100 }, (_, index) => ({
    id: index === 0 ? "bitcoin" : `coin-${index + 1}`,
    symbol: index === 0 ? "btc" : `c${index + 1}`,
    name: index === 0 ? "Bitcoin" : `Coin ${index + 1}`,
    image: `https://coin-images.coingecko.com/coins/images/${index + 1}/small/coin.png`,
    market_cap_rank: index + 1,
  }));
  const overrides = {
    routeIds: {},
    stablecoinIds: [],
    forceMarketOnlyIds: [],
    categories: { bitcoin: "major" },
    binanceSymbols: {},
    deepHealthCanaryIds: coins.slice(0, 8).map((coin) => coin.id),
  };
  const exchangeInfo = {
    symbols: coins.slice(0, 8).map((coin) => ({
      symbol: `${coin.symbol.toUpperCase()}USDT`,
      quoteAsset: "USDT",
      status: "TRADING",
      isSpotTradingAllowed: true,
    })),
  };
  return { coins, overrides, exchangeInfo };
}

describe("Nexus asset catalog generator", () => {
  it("builds a validated 100-asset catalog with bounded canaries", () => {
    const catalog = buildNexusCatalog({
      ...fixtures(),
      generatedAt: "2026-09-06T00:00:00.000Z",
    });
    expect(catalog.assets).toHaveLength(100);
    expect(catalog.assets.filter((asset) => asset.enableChecklist)).toHaveLength(8);
    expect(catalog.assets.filter((asset) => asset.deepHealthCanary)).toHaveLength(8);
  });

  it("rejects an untrusted image host", () => {
    const input = fixtures();
    input.coins[0].image = "https://example.com/bitcoin.png";
    expect(() =>
      buildNexusCatalog({ ...input, generatedAt: "2026-09-06T00:00:00.000Z" })
    ).toThrow(/Unsupported CoinGecko image URL/);
  });

  it("requires an override when a CoinGecko symbol is ambiguous", () => {
    const input = fixtures();
    input.coins[1].symbol = "btc";
    expect(() =>
      buildNexusCatalog({ ...input, generatedAt: "2026-09-06T00:00:00.000Z" })
    ).toThrow(/Ambiguous symbol requires override/);
  });
});
