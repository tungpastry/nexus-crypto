# Nexus Crypto SaaS 2026

<p align="center">
  <img src="public/logo.png" alt="Nexus Crypto Logo" width="320" />
</p>

<p align="center">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16.2.6-000000?logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19.2.0-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white">
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-22c55e">
  <img alt="Status Active" src="https://img.shields.io/badge/Status-Active-2563eb">
</p>

Retro black-pink crypto decision-support dashboard for the Top 10 Nexus Universe. Built with Next.js 16 + React 19, TradingView widget charts, Binance price/klines routes, and CoinGecko-style market snapshot APIs.

Nexus Crypto is market-data-first tooling for observation and workflow discipline. It does not execute trades, does not custody funds, and does not provide financial or trading advice.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Validation](#validation)
- [Production Deployment On Ubuntu](#production-deployment-on-ubuntu)
- [API Overview](#api-overview)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Features
- Top 10 Nexus Universe market overview at `/`.
- Dedicated asset workspace at `/asset/[id]`.
- TradingView chart with unique container per asset/timeframe.
- Binance-backed `PriceWidget` and kline context.
- CoinGecko-style market snapshot route with cache/stale fallback.
- Nexus checklist with MA20/MA50/MA200 direction-aware scoring.
- Stablecoin market-only mode (USDT/USDC: no chart/MA/checklist automation).
- Provider health endpoint with cache freshness insight.
- Release metadata endpoint (`/api/version`) and UI version badge.
- LAN local authentication with proxy-based page protection.

## Tech Stack
- Next.js `16.2.6`
- React `19.2.0` + React DOM `19.2.0`
- TypeScript + Tailwind CSS v4
- Vitest + ESLint
- Axios
- Framer Motion
- Lucide React

## Prerequisites
- Node.js 22 LTS recommended (production reference uses Node `v22.18.0`).
- npm
- Optional for production: Ubuntu Server + `systemd`.

## Quick Start
Local development install:

```bash
npm install
```

Run local app:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:3200
```

Note: local development uses `npm install`. Production deploy uses `npm ci` for deterministic installs.

## Validation
```bash
npm run lint
npm run test
npm run build
```

## Production Deployment On Ubuntu
Preferred production deploy uses [`scripts/deploy_ubuntu_server.sh`](scripts/deploy_ubuntu_server.sh), which runs:
dirty guard -> fetch/pull `--ff-only` -> release metadata injection -> `npm ci` -> lint/test/build -> systemd restart -> provider-health wait loop -> version check -> smoke -> final clean-tree check.

Copy/paste deploy command:

```bash
cd /home/nexus/projects/nexus-crypto

NEXUS_CRYPTO_REPO_DIR="/home/nexus/projects/nexus-crypto" \
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" \
NEXUS_CRYPTO_SERVICE="nexus-crypto.service" \
NEXUS_CRYPTO_BRANCH="main" \
./scripts/deploy_ubuntu_server.sh
```

## API Overview
Primary endpoints:
- `/api/crypto-price`
- `/api/crypto-klines`
- `/api/market-snapshot`
- `/api/provider-health`
- `/api/version`
- legacy `/api/btc-price`
- legacy `/api/btc-klines`

Full contracts and examples are documented in [docs/api-reference.md](docs/api-reference.md).

## Documentation
- [docs/architecture.md](docs/architecture.md)
- [docs/api-reference.md](docs/api-reference.md)
- [docs/deployment.md](docs/deployment.md)
- [docs/troubleshooting.md](docs/troubleshooting.md)
- [docs/auth-lan-local.md](docs/auth-lan-local.md)
- [docs/release-checklist.md](docs/release-checklist.md)

## Project Structure
```text
nexus-crypto/
├── app/
│   ├── api/
│   ├── components/
│   │   ├── layout/NexusFooter.tsx
│   │   └── layout/ClientErrorBoundary.tsx
│   ├── config/
│   │   ├── assets.ts
│   │   └── timeframes.ts
│   ├── asset/[id]/page.tsx
│   ├── favicon.ico
│   └── page.tsx
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── deployment.md
│   ├── troubleshooting.md
│   ├── auth-lan-local.md
│   └── release-checklist.md
├── public/
│   ├── logo.png
│   └── favicon.png
├── proxy.ts
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
└── scripts/
```

## Roadmap
- Documentation and public repo hygiene improvements.
- Provider health deep checks beyond representative BTC probes.
- Nexus Algorithm v1.1 volatility/context tuning.
- Stablecoin market-mode UX polish.
- Optional Cloudflare Tunnel HTTPS deployment profile.
- Optional CI depth expansion.

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License
This project is licensed under the [MIT License](LICENSE).

## Author
- GitHub: [tungpastry](https://github.com/tungpastry)
