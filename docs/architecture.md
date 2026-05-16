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
- Provider health probes representative Binance pairs (`BTCUSDT`) and market snapshot route status; it is not yet a full per-asset deep diagnostic grid.
