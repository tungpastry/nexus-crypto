# Nexus Top 100 Asset Catalog

## Purpose

The asset catalog is the committed capability boundary for the dashboard. It freezes a reviewed CoinGecko Top 100 membership while recording which assets have a verified Binance Spot/USDT workflow.

Current committed metadata:

| Field | Value |
| --- | --- |
| Catalog version | `2026-09-06-01628185553c` |
| Generated at | `2026-09-06T13:04:19.372Z` |
| Universe size | 100 |
| Binance-enabled | 52 |
| Market-only | 48 |
| Deep-health canaries | 8 |

The membership does not change automatically at runtime. Market metrics and market-cap rank can update without changing catalog membership.

## Files

- `app/config/assets.generated.json`: generated catalog and metadata.
- `app/config/assets.ts`: exported types, catalog arrays, symbol sets, and lookup helpers.
- `scripts/generate_nexus_assets.mjs`: online refresh entry point.
- `scripts/nexus-assets-lib.mjs`: generation and validation logic.
- `scripts/asset-overrides.json`: reviewed aliases and explicit mapping overrides.
- `scripts/check_nexus_assets.mjs`: offline integrity check.

## Refresh Workflow

Review provider output and overrides before replacing the catalog:

```bash
npm run assets:refresh
npm run assets:check
git diff -- app/config/assets.generated.json scripts/asset-overrides.json
```

`assets:refresh` fetches CoinGecko markets and Binance `exchangeInfo`, validates the result, and writes the generated catalog. It aborts on incomplete rows, duplicate IDs, ambiguous symbols, invalid image hosts, missing core assets, or invalid Binance filter metadata.

Do not hand-edit generated asset rows. Use explicit overrides for aliases or collisions, then regenerate and review the complete diff.

## Capability Model

Each `NexusAsset` includes:

- identity: `id`, `coingeckoId`, `name`, `symbol`, `iconUrl`
- catalog ordering: `rank`, `catalogOrder`
- market classification: `category`, `quote`
- provider mapping: `binanceSymbol`, `tradingViewSymbol`
- display precision: `binancePriceTickSize`
- feature flags: `enablePrice`, `enableChart`, `enableMA`, `enableChecklist`
- market-only reason: `stablecoin` or `binance-usdt-unavailable`
- optional `deepHealthCanary` marker

### Binance-enabled mode

A full Nexus workspace requires an active Binance Spot symbol quoted in USDT. These assets receive:

- `/api/crypto-price` live feed.
- `/api/crypto-klines` candles.
- TradingView chart mapping.
- Nexus Decision Matrix.

### Market-only mode

An asset remains market-only when it is a stablecoin or has no verified Binance Spot/USDT pair. The workspace uses CoinGecko snapshot data and does not request unsupported Binance candles, chart mapping, or Nexus analysis.

Stablecoin and provider-unavailable assets have different reasons so the UI and Tifa can explain the limitation accurately.

## Binance Price Precision

For every Binance-enabled asset, the generator stores `PRICE_FILTER.tickSize` as `binancePriceTickSize`. The UI derives decimal places from that string:

- BTC/ETH `0.01000000`: 2 decimals.
- TRX `0.00010000`: 4 decimals.
- DOGE `0.00001000`: 5 decimals.
- SHIB/PEPE `0.00000001`: 8 decimals.

The Live Feed uses ticker price and appends `USDT`. The Decision Matrix labels its source as `Kline Close` and applies the same precision to close, MA, and ATR values. Small differences between the two panels are expected because the ticker refreshes every 5 seconds while candle analysis refreshes every 60 seconds.

No runtime call to Binance `exchangeInfo` is made for formatting.

## Market Snapshot

`/api/market-snapshot` requests the 100 committed CoinGecko IDs and returns:

- current global market metrics.
- live market rows sorted by live market-cap rank.
- `catalog_version`, `catalog_generated_at`, and `universe_size`.
- cache/freshness metadata at the route layer.

Persistent cached data is accepted only when catalog version and universe size match the committed catalog.

## Deep Health Scope

Deep health intentionally remains a core-canary diagnostic:

```text
BTCUSDT ETHUSDT BNBUSDT XRPUSDT
SOLUSDT TRXUSDT DOGEUSDT SHIBUSDT
```

`/api/provider-health/deep` reports `scope: "core-canary"`, checks these eight symbols, and also reports the full `available_symbols_total`. It must not fan out across all Binance-enabled assets on routine page loads.

## Validation

```bash
npm run assets:check
npm run test
npm run build
```

Expected catalog checks include 100 unique IDs, 52 Binance-enabled assets, valid tick sizes for every Binance mapping, explicit market-only reasons, and exactly eight canaries.
