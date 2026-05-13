# ⚡ Nexus Crypto Dashboard

> Real-time crypto dashboard built with **Next.js 16 + React 19 + TradingView Widget + Binance API**.

![Banner](https://raw.githubusercontent.com/tungpastry/nexus-crypto/main/public/banner_nexus_crypto.png)

> *Visualize the market. Stay in sync. Trade with confidence.*

---

## 📊 Overview

**Nexus Crypto** is a lightweight crypto market dashboard focused on **BTC/USDT** runtime data and TradingView-based visual monitoring.

The current app combines:

- **TradingView Advanced Chart Widget** for visual charting.
- **BTC price widget** powered by the internal `/api/btc-price` route.
- **Auto Checklist** for MA20 / MA50 / MA200 trend analysis.
- **Manual Checklist** stored in browser `localStorage`.
- **Zenora provider-health compatibility** through a durable `updated_at` timestamp in the BTC price payload.

---

## ✅ Current Runtime Scope

| Area | Current behavior |
|---|---|
| Main dashboard | Next.js App Router page at `/` |
| Chart | TradingView widget loaded from `https://s3.tradingview.com/tv.js` |
| Chart symbols | UI selector supports `BINANCE:BTCUSDT`, `BINANCE:ETHUSDT`, `BINANCE:SOLUSDT` |
| Price widget | BTC/USDT only via `/api/btc-price` |
| Auto Checklist | BTC/USDT only, fetches Binance klines directly from the client |
| Manual Checklist | Stored locally in browser `localStorage` under `manualChecklist` |
| BTC price refresh | Every 5 seconds in `PriceWidget` |
| Auto Checklist refresh | Every 60 seconds and whenever timeframe changes |
| Zenora contract | `/api/btc-price` returns `price` + `updated_at` |

> Important: the chart symbol selector can display ETH/SOL in TradingView, but the current API routes, PriceWidget, and AutoChecklist are still BTC/USDT-focused.

---

## 🚀 Features

| Module | Description |
|---|---|
| 📈 TradingView Chart | Client-side TradingView widget with symbol and timeframe switching |
| 💵 PriceWidget | Realtime BTC/USDT price with animated up/down movement |
| 🤖 AutoChecklist | MA20 / MA50 / MA200 trend analyzer for BTC/USDT |
| 🧠 ManualChecklist | Manual trade checklist with progress bar and reset button |
| 🧩 Dynamic TF Sync | Chart, AutoChecklist, and ManualChecklist receive the same selected timeframe |
| 🔄 Auto Refresh | BTC price refreshes every 5s; AutoChecklist refreshes every 60s |
| 💡 Visual FX | Trend-based glow / ring effects for dashboard cards |

---

## 🛠️ Tech Stack

Runtime stack from `package.json`:

- **Next.js 16.0.0**
- **React 19.2.0**
- **TypeScript 5**
- **Tailwind CSS 4** via `@import "tailwindcss"`
- **Axios** for HTTP requests
- **TradingView Widget** via external `tv.js` script
- **Binance API** for BTC price and kline data
- **Framer Motion** for animation
- **Lucide React** for icons

Notes:

- `chart.js`, `react-chartjs-2`, `chartjs-chart-financial`, `chartjs-plugin-zoom`, and `chartjs-plugin-crosshair` are still listed as dependencies, but the current dashboard page uses the TradingView widget instead of rendering Chart.js directly.
- The repo uses `next.config.ts`, not `next.config.mjs`.

---

## 🧰 Project Structure

```text
nexus-crypto/
├── app/
│   ├── api/
│   │   ├── btc-klines/route.ts      # Binance OHLC candles for BTCUSDT
│   │   └── btc-price/route.ts       # BTCUSDT realtime price + updated_at
│   ├── components/
│   │   ├── AutoChecklist.tsx        # MA20/MA50/MA200 trend analyzer
│   │   ├── ManualChecklist.tsx      # localStorage manual checklist
│   │   ├── PriceWidget.tsx          # realtime BTC price widget
│   │   ├── TradingViewChart.tsx     # TradingView widget wrapper
│   │   └── utils/
│   │       └── indicators.ts        # SMA helper
│   ├── globals.css                  # Tailwind CSS 4 import + root theme tokens
│   ├── layout.tsx                   # metadata, fonts, global layout
│   └── page.tsx                     # dashboard page
├── public/
│   └── banner_nexus_crypto.png
├── scripts/
│   └── smoke_btc_price_contract.sh  # BTC price/klines contract smoke check
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🔌 API Contracts

### `GET /api/btc-price`

Fetches BTC/USDT ticker price from Binance and returns a Zenora-compatible timestamp.

Response:

```json
{
  "price": "80169.73000000",
  "updated_at": "2026-05-13T13:55:00.000Z"
}
```

Field contract:

| Field | Type | Description |
|---|---|---|
| `price` | string | BTC/USDT price from Binance ticker API |
| `updated_at` | string | UTC ISO-8601 timestamp captured when the Nexus-Crypto server receives the Binance ticker response |

This keeps `price` backward-compatible while satisfying the Zenora provider-health timestamp contract for `nexus_crypto`.

Failure response:

```json
{
  "error": "Failed to fetch price"
}
```

---

### `GET /api/btc-klines?tf=<interval>`

Fetches BTC/USDT OHLC candles from Binance.

Default:

```text
/api/btc-klines?tf=1h
```

Example:

```text
/api/btc-klines?tf=4h
```

Response shape:

```json
[
  {
    "time": 1710000000000,
    "open": 68000.0,
    "high": 69000.0,
    "low": 67500.0,
    "close": 68500.0
  }
]
```

Notes:

- `tf` is passed to Binance as the `interval` parameter.
- Current route is BTCUSDT-only.
- Current route uses `limit=400`, except `tf=1M` uses `limit=500`.

---

## ⚙️ Local Development

### 1. Clone repo

```bash
git clone https://github.com/tungpastry/nexus-crypto.git
cd nexus-crypto
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run dev server

```bash
npm run dev
```

The `dev` script already binds to port `3200`:

```json
{
  "dev": "next dev -p 3200"
}
```

Open:

```text
http://localhost:3200
```

For LAN access, `next.config.ts` currently allows:

```ts
allowedDevOrigins: ["192.168.1.30"]
```

---

## 🧪 Smoke Checks

Run the BTC price and kline contract smoke test:

```bash
./scripts/smoke_btc_price_contract.sh
```

Default base URL:

```text
http://127.0.0.1:3200
```

Override base URL:

```bash
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" ./scripts/smoke_btc_price_contract.sh
```

Expected output:

```text
BTC_PRICE_CONTRACT=PASS
BTC_KLINES_CONTRACT=PASS
```

Manual curl checks:

```bash
curl -sS http://127.0.0.1:3200/api/btc-price | python3 -m json.tool
curl -sS 'http://127.0.0.1:3200/api/btc-klines?tf=4h' | python3 -m json.tool | head -80
```

---

## ☁️ Production Deployment on Ubuntu Server

### 1. Build

```bash
cd /home/nexus/projects/nexus-crypto
npm install
npm run build
```

### 2. Start manually on port 3200

```bash
npm start -- -p 3200
```

### 3. systemd service

Create or edit:

```bash
sudo nano /etc/systemd/system/nexus-crypto.service
```

Example unit:

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

Restart after deploy:

```bash
sudo systemctl restart nexus-crypto.service
journalctl -u nexus-crypto.service -n 80 --no-pager
```

---

## 🧭 Dashboard Usage

| Action | How |
|---|---|
| Change chart symbol | Use BTCUSDT / ETHUSDT / SOLUSDT buttons |
| Change timeframe | Use `15`, `30`, `60`, `240`, `D`, `W` selector |
| Reset manual checklist | Click `Reset` in ManualChecklist |
| Inspect BTC price API | Open `/api/btc-price` |
| Inspect BTC klines API | Open `/api/btc-klines?tf=4h` |

TradingView widget interactions depend on the embedded TradingView UI and browser behavior.

---

## 🧠 Developer Notes

- AutoChecklist currently fetches Binance klines directly from the client instead of using `/api/btc-klines`.
- PriceWidget fetches `/api/btc-price` every 5 seconds.
- ManualChecklist persists all checklist items in one localStorage key; it is not currently namespaced by timeframe or symbol.
- To extend APIs beyond BTCUSDT, add a validated `symbol` query parameter to `/api/btc-price` and `/api/btc-klines`, then update `PriceWidget` and `AutoChecklist` to pass the selected symbol.
- For Zenora provider health, keep `updated_at` timezone-aware and ISO-8601 compatible.

---

## 🔗 Zenora Integration Notes

Zenora-AI reads Nexus-Crypto as provider `nexus_crypto`.

The key health contract is:

```text
GET /api/btc-price
```

The response must include a durable timestamp field recognized by Zenora provider health. Current implementation uses:

```json
{
  "price": "...",
  "updated_at": "..."
}
```

After deploy, verify from Zenora-AI:

```bash
cd /home/nexus/projects/Zenora-AI
./scripts/run_terminal.sh providers detail nexus_crypto --json
./scripts/run_terminal.sh providers health
```

---

## 🧾 License

MIT License © 2025 tungpastry

💬 Made with ⚡ passion by Mike Nguyen
