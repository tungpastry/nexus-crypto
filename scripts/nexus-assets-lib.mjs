import { createHash } from "node:crypto";

const ALLOWED_IMAGE_HOSTS = new Set([
  "assets.coingecko.com",
  "coin-images.coingecko.com",
]);
const VALID_CATEGORIES = new Set([
  "major",
  "stablecoin",
  "exchange",
  "altcoin",
  "meme",
]);

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function assertImageUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
    throw new Error(`Unsupported CoinGecko image URL: ${value}`);
  }
}

export function validateGeneratedCatalog(catalog) {
  if (!catalog || typeof catalog !== "object") throw new Error("Catalog must be an object");
  if (!Array.isArray(catalog.assets) || catalog.assets.length !== 100) {
    throw new Error("Catalog must contain exactly 100 assets");
  }

  const ids = new Set();
  const coingeckoIds = new Set();
  const binanceSymbols = new Set();
  let canaries = 0;

  catalog.assets.forEach((asset, index) => {
    if (asset.catalogOrder !== index + 1) throw new Error(`Invalid catalog order for ${asset.id}`);
    if (!asset.id || ids.has(asset.id)) throw new Error(`Duplicate route id: ${asset.id}`);
    if (!asset.coingeckoId || coingeckoIds.has(asset.coingeckoId)) {
      throw new Error(`Duplicate CoinGecko id: ${asset.coingeckoId}`);
    }
    ids.add(asset.id);
    coingeckoIds.add(asset.coingeckoId);
    assertImageUrl(asset.iconUrl);

    if (!VALID_CATEGORIES.has(asset.category)) {
      throw new Error(`Invalid category for ${asset.id}: ${asset.category}`);
    }
    if (!Number.isFinite(asset.rank) || asset.rank < 1) {
      throw new Error(`Invalid market rank for ${asset.id}`);
    }

    if (asset.binanceSymbol) {
      if (binanceSymbols.has(asset.binanceSymbol)) {
        throw new Error(`Duplicate Binance symbol: ${asset.binanceSymbol}`);
      }
      binanceSymbols.add(asset.binanceSymbol);
    }

    if (asset.enableChecklist) {
      if (!asset.binanceSymbol || !asset.tradingViewSymbol || !asset.enableChart || !asset.enableMA) {
        throw new Error(`Incomplete Nexus capability for ${asset.id}`);
      }
      if (asset.marketOnlyReason) throw new Error(`Nexus asset cannot be market-only: ${asset.id}`);
    } else if (!asset.marketOnlyReason) {
      throw new Error(`Market-only reason missing for ${asset.id}`);
    }

    if (asset.category === "stablecoin" && asset.marketOnlyReason !== "stablecoin") {
      throw new Error(`Stablecoin capability mismatch for ${asset.id}`);
    }
    if (asset.deepHealthCanary) {
      canaries += 1;
      if (!asset.binanceSymbol || !asset.enableChecklist) {
        throw new Error(`Deep-health canary must be Binance-enabled: ${asset.id}`);
      }
    }
  });

  if (canaries !== 8) throw new Error(`Expected 8 deep-health canaries, received ${canaries}`);
  if (catalog.metadata?.universeSize !== 100) throw new Error("Catalog metadata size mismatch");
  if (catalog.metadata?.binanceEnabledCount !== binanceSymbols.size) {
    throw new Error("Catalog Binance count mismatch");
  }
  return catalog;
}

export function buildNexusCatalog({ coins, exchangeInfo, overrides, generatedAt }) {
  if (!Array.isArray(coins) || coins.length !== 100) {
    throw new Error(`CoinGecko must return exactly 100 rows; received ${coins?.length ?? 0}`);
  }
  if (!Array.isArray(exchangeInfo?.symbols)) throw new Error("Invalid Binance exchangeInfo payload");

  const symbolCounts = new Map();
  for (const coin of coins) {
    const symbol = String(coin.symbol || "").toUpperCase();
    symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
  }

  const tradingUsdt = new Set(
    exchangeInfo.symbols
      .filter(
        (item) =>
          item?.status === "TRADING" &&
          item?.quoteAsset === "USDT" &&
          item?.isSpotTradingAllowed !== false
      )
      .map((item) => String(item.symbol))
  );
  const stablecoinIds = new Set(overrides.stablecoinIds || []);
  const forceMarketOnlyIds = new Set(overrides.forceMarketOnlyIds || []);
  const canaryIds = new Set(overrides.deepHealthCanaryIds || []);
  const usedBinanceSymbols = new Set();

  const assets = coins.map((coin, index) => {
    const coingeckoId = String(coin.id || "");
    const symbol = String(coin.symbol || "").toUpperCase();
    const image = String(coin.image || "");
    assertImageUrl(image);
    if (!coingeckoId || !symbol || !coin.name) throw new Error(`Invalid CoinGecko row at ${index}`);

    const stablecoin = stablecoinIds.has(coingeckoId);
    const forcedMarketOnly = forceMarketOnlyIds.has(coingeckoId);
    const hasOverride = hasOwn(overrides.binanceSymbols || {}, coingeckoId);
    let binanceSymbol = hasOverride ? overrides.binanceSymbols[coingeckoId] : undefined;

    if (!stablecoin && !forcedMarketOnly && !hasOverride) {
      if ((symbolCounts.get(symbol) || 0) > 1) {
        throw new Error(`Ambiguous symbol requires override: ${symbol}`);
      }
      const candidate = `${symbol}USDT`;
      if (tradingUsdt.has(candidate)) binanceSymbol = candidate;
    }

    if (binanceSymbol != null) {
      if (!tradingUsdt.has(binanceSymbol)) {
        throw new Error(`Binance override is not a trading USDT pair: ${binanceSymbol}`);
      }
      if (usedBinanceSymbols.has(binanceSymbol)) {
        throw new Error(`Binance symbol mapped more than once: ${binanceSymbol}`);
      }
      usedBinanceSymbols.add(binanceSymbol);
    }

    const enabled = Boolean(binanceSymbol) && !stablecoin && !forcedMarketOnly;
    const marketOnlyReason = enabled
      ? undefined
      : stablecoin
        ? "stablecoin"
        : "binance-usdt-unavailable";
    const category = stablecoin
      ? "stablecoin"
      : overrides.categories?.[coingeckoId] || "altcoin";

    return {
      id: overrides.routeIds?.[coingeckoId] || coingeckoId,
      rank: Number(coin.market_cap_rank) || index + 1,
      catalogOrder: index + 1,
      name: String(coin.name),
      symbol,
      iconUrl: image,
      category,
      coingeckoId,
      ...(enabled ? { binanceSymbol, tradingViewSymbol: `BINANCE:${binanceSymbol}` } : {}),
      quote: enabled ? "USDT" : "USD",
      enablePrice: true,
      enableChart: enabled,
      enableMA: enabled,
      enableChecklist: enabled,
      ...(marketOnlyReason ? { marketOnlyReason } : {}),
      ...(canaryIds.has(coingeckoId) ? { deepHealthCanary: true } : {}),
      ...(!enabled
        ? {
            note:
              marketOnlyReason === "stablecoin"
                ? "Stablecoin: CoinGecko market data only; Nexus MA analysis is disabled."
                : "CoinGecko market data only; Binance USDT chart and Nexus MA analysis are unavailable.",
          }
        : {}),
    };
  });

  const canonical = JSON.stringify(assets);
  const hash = createHash("sha256").update(canonical).digest("hex").slice(0, 12);
  const binanceEnabledCount = assets.filter((asset) => asset.enableChecklist).length;
  const catalog = {
    metadata: {
      catalogVersion: `${generatedAt.slice(0, 10)}-${hash}`,
      generatedAt,
      universeSize: assets.length,
      binanceEnabledCount,
      marketOnlyCount: assets.length - binanceEnabledCount,
      sources: {
        coingecko: "https://api.coingecko.com/api/v3/coins/markets",
        binance: "https://api.binance.com/api/v3/exchangeInfo",
      },
    },
    assets,
  };

  return validateGeneratedCatalog(catalog);
}
