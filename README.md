# ⚡ Nexus Crypto Dashboard  
> Real-time BTC/USDT Dashboard using **Next.js 16 + TradingView + AutoChecklist**

![Banner](https://raw.githubusercontent.com/tungpastry/nexus-crypto/main/public/banner_nexus_crypto.png)
> *Visualize the market. Stay in sync. Trade with confidence.*

---

## 📊 Overview

**Nexus Crypto** là dashboard realtime hiển thị dữ liệu Bitcoin (BTC/USDT) theo thời gian thực,  
kết hợp giữa **TradingView Chart**, **Auto Checklist (MA Trend)**, và **Manual Checklist** để hỗ trợ đánh giá xu hướng kỹ thuật.

---

## 🚀 Features

| Module | Description |
|--------|--------------|
| 📈 **TradingView Chart** | Realtime candlestick chart (Zoom, Crosshair, Horizontal Lines, Timeframe switch) |
| 🤖 **Auto Checklist** | Tự động tính toán xu hướng theo MA20 / MA50 / MA200 (H4, D, W) |
| 🧠 **Manual Checklist** | Đánh dấu thủ công các điều kiện setup (pullback, tín hiệu, tâm lý, RR) |
| 🧩 **Dynamic TF Sync** | Chart, AutoChecklist và ManualChecklist đồng bộ timeframe |
| 🔄 **Auto Refresh** | Làm mới dữ liệu mỗi 60 giây |
| 💡 **Visual FX** | Viền glow theo trend (Uptrend / Downtrend / Sideway) |

---

## 🛠️ Tech Stack

- **Next.js 16 (App Router, Turbopack)**
- **Tailwind CSS 3**
- **TypeScript**
- **TradingView Charting Library**
- **Binance API**
- **Framer Motion** (animation)
- **Lucide-react** (icons)

---

## 🧰 Project Structure

nexus-crypto/
├── app/
│ ├── api/
│ │ ├── btc-klines/route.ts # Fetch OHLC data from Binance
│ │ └── btc-price/route.ts # Realtime price
│ ├── components/
│ │ ├── TradingViewChart.tsx # Main chart component
│ │ ├── AutoChecklist.tsx # MA trend analyzer
│ │ ├── ManualChecklist.tsx # Manual trading checklist
│ │ └── PriceWidget.tsx # Realtime BTC price box
│ └── page.tsx # Dashboard layout
├── public/
│ └── banner_nexus_crypto.png
├── package.json
├── next.config.mjs
└── tsconfig.json

yaml
Sao chép mã

---

## ⚙️ Local Development

### 1️⃣ Clone repo
```bash
git clone https://github.com/tungpastry/nexus-crypto.git
cd nexus-crypto
2️⃣ Install dependencies
bash
Sao chép mã
npm install
3️⃣ Run dev
bash
Sao chép mã
npm run dev -p 3200
➡️ Truy cập tại: http://localhost:3200

☁️ Deploy on Ubuntu Server (Production)
Build static
bash
Sao chép mã
npm run build
npm start -p 3200
systemd Service (Auto-start on boot)
Tạo file service:

bash
Sao chép mã
sudo nano /etc/systemd/system/nexus-crypto.service
Nội dung:

ini
Sao chép mã
[Unit]
Description=Nexus Crypto Next.js App
After=network.target

[Service]
Type=simple
User=nexus
WorkingDirectory=/home/nexus/projects/nexus-crypto
ExecStart=/home/nexus/.nvm/versions/node/v22.18.0/bin/npm start -- -p 3200
Restart=always
RestartSec=5
Environment=NODE_ENV=production
StandardOutput=append:/home/nexus/projects/nexus-crypto/nexus-crypto.log
StandardError=append:/home/nexus/projects/nexus-crypto/nexus-crypto-error.log

[Install]
WantedBy=multi-user.target
Lưu & khởi động:

bash
Sao chép mã
sudo systemctl daemon-reload
sudo systemctl enable --now nexus-crypto
sudo systemctl status nexus-crypto --no-pager
🖼️ Preview
Chart	Auto Checklist	Manual Checklist

🧭 Shortcuts (Mac)
Action	Shortcut
➕ Add Horizontal Line	Option (⌥) + Click hoặc Right Click
❌ Delete Line	Double Click
🔍 Zoom / Pan	Scroll / Drag
🕓 Change Timeframe	Selector trên Chart

🧠 Dev Tips
Các dữ liệu MA được tính trực tiếp từ Binance API, có thể thay bằng nguồn nội bộ /api/btc-klines

Khi đổi TF (Timeframe), AutoChecklist sẽ tự động fetch lại dữ liệu và cập nhật trend

Có thể mở rộng cho altcoins khác (ETHUSDT, SOLUSDT…) bằng cách thêm param symbol

🧾 License
MIT License © 2025 tungpastry

💬 Made with ⚡ passion by Mike Nguyen

## Zenora BTC Price Contract

`GET /api/btc-price` returns the existing `price` field plus `updated_at`, a UTC ISO-8601 timestamp captured when the Nexus-Crypto server receives the Binance ticker response.

Example:

```json
{
  "price": "80169.73000000",
  "updated_at": "2026-05-13T13:55:00.000Z"
}
```

The `price` field remains backward-compatible for existing clients. The `updated_at` field satisfies the Zenora provider-health timestamp contract for `nexus_crypto`.

Smoke check:

```bash
./scripts/smoke_btc_price_contract.sh
```
