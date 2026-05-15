# Nexus Crypto SaaS 2026

> Retro black-pink crypto dashboard built with Next.js 16, React 19, TradingView Widget, Binance API, and CoinGecko-style market data.

Nexus Crypto is a decision-support dashboard for watching the top 10 Nexus assets, syncing price/chart/timeframe context, and running a structured Nexus checklist. It does not execute trades and does not make trading recommendations.

## SaaS 2026 Blueprint

| Area | Runtime behavior |
|---|---|
| Asset universe | BTC, ETH, USDT, BNB, XRP, USDC, SOL, TRX, SHIB, DOGE |
| Market table | CoinGecko-style price, 24h/7d change, volume, and market data |
| Home overview | `/` shows the Top 10 Nexus Universe market overview |
| Asset workspace | `/asset/[id]` contains PriceWidget, timeframe picker, chart, and the Nexus checklist |
| Chart | TradingView widget with unique container id per asset/timeframe |
| Nexus checklist | Direction-aware MA20/MA50/MA200 auto rules, hybrid confirmations, manual discipline |
| Stablecoins | USDT and USDC show market data only; MA/checklist/chart are disabled |
| Freshness | UI badges classify data as fresh, ok, stale, or offline |
| Provider health | `/api/provider-health` returns Zenora/Nexus-compatible provider checks |
| Legacy BTC contract | `/api/btc-price` still returns `price` + `updated_at` |

## Page Split UX

`/` is the Top 10 Nexus Universe page. It stays focused on market overview: header, market snapshot, asset watchlist, provider health, and footer.

`/asset/[id]` is the Asset Workspace page. It contains the heavier workflow: TradingView Chart and one Nexus Auto Checklist panel. That checklist combines Auto Rules, Hybrid Confirmation, and Manual Discipline so users do not have to tick duplicate manual panels.

Stablecoins such as USDT and USDC use Market Mode. They can still open a workspace for market context, but TradingView charting and Nexus MA automation remain disabled. Nexus does not execute trades and does not provide trading recommendations.

Route examples:

```text
/asset/bitcoin
/asset/ethereum
/asset/solana
/asset/shiba-inu
/asset/dogecoin
/asset/tether
/asset/usd-coin
```

## Asset And Timeframe Config

Canonical asset metadata lives in:

```text
app/config/assets.ts
```

Canonical timeframe mapping lives in:

```text
app/config/timeframes.ts
```

Supported Binance symbols:

```text
BTCUSDT ETHUSDT BNBUSDT XRPUSDT SOLUSDT TRXUSDT SHIBUSDT DOGEUSDT
```

Supported timeframes:

```text
15m 30m 1h 4h 1d 1w
```

TradingView mappings:

```text
15m -> 15
30m -> 30
1h  -> 60
4h  -> 240
1D  -> D
1W  -> W
```

## API Contracts

### `GET /api/crypto-price?symbol=BTCUSDT`

Returns a validated Binance price payload.

```json
{
  "provider": "binance",
  "symbol": "BTCUSDT",
  "price": "80457.17000000",
  "updated_at": "2026-05-15T00:00:00.000Z"
}
```

Unsupported symbols return:

```json
{
  "error": {
    "code": "UNSUPPORTED_SYMBOL",
    "message": "Symbol is not allowed",
    "allowed": ["BTCUSDT", "ETHUSDT"]
  }
}
```

### `GET /api/crypto-klines?symbol=BTCUSDT&tf=4h`

Returns validated Binance OHLCV candles.

```json
{
  "provider": "binance",
  "symbol": "BTCUSDT",
  "tf": "4h",
  "updated_at": "2026-05-15T00:00:00.000Z",
  "candles": [
    {
      "time": 1710000000000,
      "open": 68000,
      "high": 69000,
      "low": 67500,
      "close": 68500,
      "volume": 1234.56
    }
  ]
}
```

### `GET /api/market-snapshot`

Returns CoinGecko-style global market data and the 10 Nexus assets.

### `GET /api/provider-health`

Returns Zenora/Nexus provider health:

```json
{
  "provider": "nexus_crypto",
  "status": "ok",
  "updated_at": "2026-05-15T00:00:00.000Z",
  "checks": {
    "binance_price": { "status": "ok", "latency_ms": 120 },
    "binance_klines": { "status": "ok", "latency_ms": 180 },
    "market_snapshot": { "status": "ok", "latency_ms": 240 }
  }
}
```

### Legacy BTC Routes

`/api/btc-price` is preserved for Zenora compatibility and still returns:

```json
{
  "price": "80169.73000000",
  "updated_at": "2026-05-15T00:00:00.000Z"
}
```

`/api/btc-klines?tf=4h` is preserved and still returns the legacy candle array.

## Project Structure

```text
nexus-crypto/
├── app/
│   ├── api/
│   │   ├── btc-klines/route.ts
│   │   ├── btc-price/route.ts
│   │   ├── crypto-klines/route.ts
│   │   ├── crypto-price/route.ts
│   │   ├── market-snapshot/route.ts
│   │   └── provider-health/route.ts
│   ├── asset/[id]/page.tsx
│   ├── components/
│   │   ├── asset/AssetWorkspaceHeader.tsx
│   │   ├── asset/AssetWorkspaceShell.tsx
│   │   ├── asset/TimeframeSelector.tsx
│   │   ├── checklist/ManualDisciplineChecklist.tsx
│   │   ├── checklist/NexusAutoChecklist.tsx
│   │   ├── insights/ProviderHealthPanel.tsx
│   │   ├── layout/RetroPanel.tsx
│   │   ├── market/AssetWatchlist.tsx
│   │   ├── market/DataFreshnessBadge.tsx
│   │   ├── market/MarketSnapshot.tsx
│   │   ├── ManualChecklist.tsx
│   │   ├── PriceWidget.tsx
│   │   └── TradingViewChart.tsx
│   ├── config/
│   │   ├── assets.ts
│   │   ├── theme.ts
│   │   └── timeframes.ts
│   ├── lib/
│   │   ├── binance.ts
│   │   ├── nexusAlgorithm.ts
│   │   └── validators.ts
│   └── page.tsx
├── scripts/
│   ├── smoke_btc_price_contract.sh
│   └── smoke_crypto_assets_contract.sh
└── package.json
```

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server on port 3200:

```bash
npm run dev
```

Open:

```text
http://localhost:3200
```

For LAN usage in this deployment:

```text
Mac Mini: 192.168.1.7
Ubuntu Server: 192.168.1.30
Ubuntu path: /home/nexus/projects/nexus-crypto
```

## Validation

Run lint and build:

```bash
npm run lint
npm run build
```

Run the app:

```bash
npm run dev
```

Run smoke checks against the dev server:

```bash
./scripts/smoke_btc_price_contract.sh
./scripts/smoke_crypto_assets_contract.sh
```

Override the base URL:

```bash
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" ./scripts/smoke_crypto_assets_contract.sh
```

Expected multi-asset output includes:

```text
CRYPTO_PRICE_BTCUSDT=PASS
CRYPTO_KLINES_BTCUSDT=PASS
CRYPTO_PRICE_ETHUSDT=PASS
CRYPTO_KLINES_ETHUSDT=PASS
PROVIDER_HEALTH=PASS
```

## Production Deployment On Ubuntu

Build:

```bash
cd /home/nexus/projects/nexus-crypto
npm install
npm run build
```

Start manually on port 3200:

```bash
npm start -- -p 3200
```

Example systemd unit:

```ini
[Unit]
Description=Nexus Crypto Next.js App
After=network.target

[Service]
Type=simple
User=nexus
WorkingDirectory=/home/nexus/projects/nexus-crypto
Environment=NODE_ENV=production
ExecStart=/home/nexus/.nvm/versions/node/v22.18.0/bin/npm start -- -p 3200
Restart=always
RestartSec=5
StandardOutput=append:/home/nexus/projects/nexus-crypto/nexus-crypto.log
StandardError=append:/home/nexus/projects/nexus-crypto/nexus-crypto-error.log

[Install]
WantedBy=multi-user.target
```

Reload and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nexus-crypto.service
sudo systemctl status nexus-crypto.service --no-pager
```

## Zenora Integration Notes

Zenora reads Nexus Crypto as provider `nexus_crypto`. Keep `/api/btc-price` backward compatible with `price` and timezone-aware `updated_at`, and use `/api/provider-health` for the fuller SaaS 2026 health surface.

## License

MIT License © 2025 tungpastry
