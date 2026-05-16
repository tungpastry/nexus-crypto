# Nexus Crypto Architecture

## Overview
Nexus Crypto is a Next.js App Router dashboard focused on market-data observation and checklist workflow discipline for a fixed Top 10 crypto universe. The app is intentionally non-custodial and non-executional.

## Runtime Architecture
- Browser UI renders Home (`/`) and Asset Workspace (`/asset/[id]`).
- UI calls internal Next.js API routes under `/api/*`.
- API routes call upstream provider surfaces (Binance + CoinGecko-style snapshot data).
- Server cache/stale fallback keeps UI resilient during transient provider issues.
- Freshness and provider-health states are surfaced back to UI badges/panels.

## Pages And Core UI Modules
- Home `/`: `MarketSnapshot`, `AssetWatchlist`, `ProviderHealthPanel`, `NexusFooter`.
- Asset Workspace `/asset/[id]`: `PriceWidget`, `TradingViewChart`, `NexusAutoChecklist`, timeframe controls, `NexusFooter`.
- Shared resilience: `ClientErrorBoundary`, `DataFreshnessBadge`, `VersionBadge`.

## Config-Driven Market Universe
- Asset universe is defined in `app/config/assets.ts`.
- Timeframe mapping is defined in `app/config/timeframes.ts`.
- UI and API symbol/timeframe controls follow these configs rather than per-component hardcoding.

## Auth And Routing Guard
- Next.js 16 proxy convention is implemented in `proxy.ts` (replaces `middleware.ts`).
- Protected pages when auth is enabled: `/` and `/asset/*`.
- Public operational routes include `/api/version` and `/api/provider-health`.
- Session validation is handled through local auth helpers; no OAuth/NextAuth/database layer.

## Release Metadata And Version Surface
- Deploy script writes release metadata block into `.env.production.local`.
- `/api/version` exposes runtime metadata (`commit`, `short_commit`, `build_time`, `next`, `node`, `env`).
- `VersionBadge` surfaces this metadata in the UI footer.

## Current Limitations
- No trade execution and no custody/account integration.
- Default `/api/provider-health` remains lightweight (BTC representative checks + market snapshot).
- Deep diagnostics are exposed separately at `/api/provider-health/deep` across all Binance-enabled symbols to avoid heavy default readiness probes.

## Nexus Algorithm v1.1
- Adds ATR14 and volatility regime (`Low`, `Normal`, `High`, `Unknown`).
- Adds volume confirmation scoring and ratio context.
- Adds support/resistance location context from recent candle window.
- Adds optional higher-timeframe agreement hook (non-breaking optional input).
- Adds workflow state output: `No Trade`, `Watch`, `Ready`, `Confirmed`.
- Output remains workflow decision-support only (no trade execution and no financial advice).
