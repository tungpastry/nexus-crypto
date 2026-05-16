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

Retro black-pink crypto decision-support dashboard for the Top 10 Nexus Universe. Built with Next.js 16 + React 19, TradingView widget charts, Binance price/klines routes, CoinGecko-style market snapshot APIs, LAN-local auth, TifaWidget Assistant, and `/ops` diagnostics.

Nexus Crypto is market-data-first tooling for observation and workflow discipline. It does not execute trades, does not custody funds, and does not provide financial or trading advice.

## Current Verified Baseline

- Latest reviewed commit: `fce6b64e92a6acb404a7272aa96fef1cae3a11fb`
- Commit theme: Gemini CLI DevOps bootstrap/system prompt update for Phase 2
- Previous Phase 2 completion commit: `eb816232596ccf02216d4b08366ba7c99e6f97f3`
- Production reference: Ubuntu Server, `nexus-crypto.service`, port `3200`
- Runtime status after live validation: Phase 2 + Gemini live provider smoke passed

## Table of Contents

- [Features](#features)
- [Architecture Layers](#architecture-layers)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Validation](#validation)
- [Production Deployment On Ubuntu](#production-deployment-on-ubuntu)
- [Gemini Live Provider](#gemini-live-provider)
- [Gemini CLI DevOps Agent](#gemini-cli-devops-agent)
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
- Nexus Decision Matrix: multi-factor workflow scoring that combines MA20/MA50/MA200 structure, trend/bias state, ATR volatility regime, volume confirmation, support/resistance location, and optional higher-timeframe agreement into a clear decision-support state (`No Trade`, `Watch`, `Ready`, `Confirmed`).
- Stablecoin market-only mode (USDT/USDC: no chart/MA/checklist automation).
- Provider health endpoint with cache freshness insight.
- Deep provider health endpoint for all Binance-enabled Nexus symbols.
- Release metadata endpoint (`/api/version`) and UI version badge.
- LAN local authentication with proxy-based page protection.
- TifaWidget Assistant with grounded market/asset context and Gemini budget guard.
  - Phase 1.1 hardening: contract tests, no-secret leakage tests, Gemini true-stream path, safe pre-stream fallback to tool-only pseudo stream, sanitized `STREAM_PROVIDER_ERROR`, and Gemini circuit breaker.
  - Phase 2 ops orchestration: provider/deep health explainers, ops summary endpoint, allowlisted orchestration endpoint, and richer `/ops` diagnostic summaries.
- Gemini CLI DevOps context layer for safe repository maintenance.

## Architecture Layers

Nexus Crypto is organized into five practical layers:

1. **Market Layer**
   - Top 10 universe config
   - Binance price/klines APIs
   - market snapshot
   - stablecoin market-only behavior

2. **Dashboard Layer**
   - Home market overview
   - per-asset workspace
   - TradingView charts
   - Nexus checklist and MA scoring

3. **Ops Layer**
   - provider health
   - deep provider health
   - version metadata
   - `/ops` diagnostics panels

4. **Tifa Assistant Layer**
   - `/api/tifa`
   - `/api/tifa/stream`
   - Tifa tools
   - Gemini provider gateway
   - budget guard + circuit breaker
   - Phase 2 tool orchestration

5. **DevOps Agent Layer**
   - `bin/nxgcli.sh`
   - `bootstrap.txt`
   - `load_context.txt`
   - `system_prompt.txt`
   - safe slice workflow for Gemini CLI repository work

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
- Optional for repository DevOps: Gemini CLI installed and logged in.

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

Tifa smoke:

```bash
export NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200"
export NEXUS_SMOKE_AUTH_TOKEN="$(grep '^NEXUS_SMOKE_AUTH_TOKEN=' .env.production.local | cut -d= -f2-)"
npm run smoke:tifa
```

Expected Phase 2 smoke lines include:

```text
TIFA_PROVIDER_HEALTH_EXPLAINER=PASS
TIFA_DEEP_HEALTH_EXPLAINER=PASS
TIFA_OPS_SUMMARY=PASS
TIFA_TOOL_ORCHESTRATOR=PASS
TIFA_PHASE2_NO_SECRET_LEAK=PASS
```

## Production Deployment On Ubuntu

Preferred production deploy uses [`scripts/deploy_ubuntu_server.sh`](scripts/deploy_ubuntu_server.sh), which runs:

```text
dirty guard -> fetch/pull --ff-only -> release metadata injection -> npm ci -> lint/test/build -> systemd restart -> provider-health wait loop -> version check -> smoke -> final clean-tree check
```

Copy/paste deploy command:

```bash
cd /home/nexus/projects/nexus-crypto

NEXUS_CRYPTO_REPO_DIR="/home/nexus/projects/nexus-crypto" \
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" \
NEXUS_CRYPTO_SERVICE="nexus-crypto.service" \
NEXUS_CRYPTO_BRANCH="main" \
./scripts/deploy_ubuntu_server.sh
```

## Gemini Live Provider

Tifa can run in either tool-only fallback mode or live Gemini mode.

Required live provider env:

```text
GEMINI_API_KEY=<redacted>
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_STREAM_ENABLED=1
GEMINI_CIRCUIT_BREAKER_ENABLED=1
```

Do not print or commit `.env.production.local`.

Health check:

```bash
curl -sS http://127.0.0.1:3200/api/provider-health/gemini | python3 -m json.tool
```

Expected live provider indicators:

```json
{
  "configured": true,
  "status": "ok",
  "circuit": { "state": "closed" },
  "budget": { "status": "ok" }
}
```

## Gemini CLI DevOps Agent

Commit `fce6b64e92a6acb404a7272aa96fef1cae3a11fb` updates the repository DevOps context for Gemini CLI.

Canonical entrypoint:

```bash
./bin/nxgcli.sh "inspect repo and propose next safe slice"
```

The wrapper loads:

```text
bootstrap.txt -> load_context.txt -> system_prompt.txt
```

DevOps agent rules:

- inspect before patching
- preserve auth boundaries
- preserve Gemini budget guard
- preserve circuit breaker behavior
- preserve no-secret leakage behavior
- avoid broad refactors without a slice plan
- never claim tests passed without output

See [`docs/gemini-cli-devops.md`](docs/gemini-cli-devops.md).

## API Overview

Primary endpoints:

- `/api/crypto-price`
- `/api/crypto-klines`
- `/api/market-snapshot`
- `/api/provider-health`
- `/api/provider-health/deep`
- `/api/provider-health/gemini`
- `/api/version`
- `/api/tifa`
- `/api/tifa/stream`
- `/api/tifa-tools/market-context`
- `/api/tifa-tools/asset-analysis`
- `/api/tifa-tools/budget-status`
- `/api/tifa-tools/provider-health-explainer`
- `/api/tifa-tools/deep-health-explainer`
- `/api/tifa-tools/ops-summary`
- `/api/tifa-tools/orchestrate`
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
- [docs/tifa-assistant-phase1.md](docs/tifa-assistant-phase1.md)
- [docs/tifa-assistant-phase2.md](docs/tifa-assistant-phase2.md)
- [docs/gemini-cli-devops.md](docs/gemini-cli-devops.md)

## Project Structure

```text
nexus-crypto/
├── app/
│   ├── api/
│   │   ├── provider-health/
│   │   ├── tifa/
│   │   └── tifa-tools/
│   ├── components/
│   ├── config/
│   ├── lib/
│   │   ├── gemini-budget/
│   │   ├── tifa-core/
│   │   ├── tifa-nexus/
│   │   ├── tifa-provider-gateway/
│   │   ├── tifa-runtime/
│   │   └── tifa-tools/
│   ├── asset/[id]/page.tsx
│   └── page.tsx
├── bin/
│   └── nxgcli.sh
├── docs/
├── public/
├── scripts/
├── bootstrap.txt
├── load_context.txt
├── system_prompt.txt
├── proxy.ts
└── package.json
```

## Roadmap

- Add lightweight TTL cache for `/api/tifa-tools/ops-summary`.
- Add richer orchestration warnings panel on `/ops`.
- Add full chat intent-to-tool integration tests.
- Fix old Turbopack NFT tracing warning from runtime config import chain.
- Expand CI depth for Tifa smoke where safe.
- Optional Cloudflare Tunnel HTTPS deployment profile.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](LICENSE).

## Author

- GitHub: [tungpastry](https://github.com/tungpastry)
