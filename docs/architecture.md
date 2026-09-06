# Nexus Crypto Architecture

## Overview

Nexus Crypto is a Next.js App Router SaaS dashboard focused on market-data observation and checklist workflow discipline for a fixed Top 10 crypto universe. The app is intentionally non-custodial and non-executional.

Current reviewed baseline:

- Product direction: Nexus Crypto SaaS 2026
- Runtime: Next.js 16 App Router
- Main production port: `3200`
- Production reference: Ubuntu Server + `systemd`
- Latest reviewed commit: `05a7953cab919705d3db2e30e80f2215a7a7c27b`

## Layered Architecture

Nexus Crypto now has four operational layers:

1. **Market Layer**
   - fixed Top 10 Nexus Universe
   - Binance price and kline providers
   - CoinGecko-style market snapshot
   - server cache and stale fallback
   - stablecoin market-only mode

2. **Dashboard Layer**
   - Home (`/`) market overview
   - Asset Workspace (`/asset/[id]`)
   - TradingView chart workspace
   - PriceWidget
   - Nexus checklist / MA20-MA50-MA200 scoring
   - data freshness and version badges

3. **Ops Layer**
   - `/ops` diagnostics page
   - `/api/provider-health`
   - `/api/provider-health/deep`
   - `/api/provider-health/gemini`
   - version endpoint and deploy metadata

4. **Tifa Assistant Layer**
   - `/api/tifa`
   - `/api/tifa/stream`
   - `/api/tifa-tools/*`
   - Gemini provider gateway
   - budget guard
   - circuit breaker
   - Phase 2 tool orchestration

## Runtime Architecture

- Browser UI renders Home (`/`), Asset Workspace (`/asset/[id]`), and Ops (`/ops`).
- UI calls internal Next.js API routes under `/api/*`.
- API routes call upstream provider surfaces such as Binance and market snapshot providers.
- Server cache/stale fallback keeps UI resilient during transient provider issues.
- Freshness and provider-health states are surfaced back to UI badges/panels.
- Tifa Assistant builds grounded tool context before answering.
- Gemini provider calls are guarded by budget preflight/postflight and circuit breaker state.

## Pages And Core UI Modules

- Home `/`: market overview, asset watchlist, provider health, TifaWidget, footer/version surfaces.
- Asset Workspace `/asset/[id]`: `PriceWidget`, `TradingViewChart`, Nexus auto checklist, timeframe controls, TifaWidget, footer.
- Ops `/ops`: provider health, provider deep health, Gemini assistant status, Ops Executive Summary, Provider Health Summary, Deep Health Summary, Ops Issues & Recommendations.
- Shared resilience: `ClientErrorBoundary`, data freshness surfaces, version metadata surfaces.

## Config-Driven Market Universe

- Asset universe is defined in `app/config/assets.ts`.
- Timeframe mapping is defined in `app/config/timeframes.ts`.
- UI and API symbol/timeframe controls follow these configs rather than per-component hardcoding.
- Stablecoins (`USDT`, `USDC`) run market-only mode: no chart, no MA, no checklist automation.
- Binance-enabled symbols drive deep provider health fanout.

## Auth And Routing Guard

- Next.js 16 proxy convention is implemented in `proxy.ts` (replaces `middleware.ts`).
- Protected pages when auth is enabled: `/` and `/asset/*`.
- Protected APIs may accept either a valid session cookie or `Authorization: Bearer <NEXUS_SMOKE_AUTH_TOKEN>` when configured.
- Public operational routes include `/api/version`, `/api/provider-health`, `/api/provider-health/deep`, and auth routes.
- Session validation is handled through local auth helpers; no OAuth/NextAuth/database layer.

## TifaWidget Assistant Architecture

Tifa runtime flow:

```text
user message
→ resolveTifaIntent()
→ orchestrateTifaTools()
→ mapOrchestrationToToolContext()
→ runBudgetPreflight()
→ Gemini provider or tool-only fallback
→ writeBudgetPostflight()
→ append chat session
```

Phase 2 tools are allowlisted in `app/lib/tifa-tools/registry.ts`:

```text
market_context
asset_analysis
budget_status
gemini_provider_health
provider_health
deep_provider_health
provider_health_explainer
deep_health_explainer
ops_summary
```

The orchestrator degrades safely: per-tool failures are captured as warnings when partial context is still safe.

## Provider Health Architecture

- `/api/provider-health` is the lightweight readiness route.
- `/api/provider-health/deep` is the wider multi-symbol diagnostics route.
- `/api/provider-health/gemini` exposes client-safe Gemini provider, stream, circuit, and budget status.
- `/api/tifa-tools/provider-health-explainer` normalizes provider health into assistant/UI-friendly diagnostics.
- `/api/tifa-tools/deep-health-explainer` normalizes multi-symbol diagnostics.
- `/api/tifa-tools/ops-summary` combines provider, deep, Gemini, and budget context.

## Release Metadata And Version Surface

- Deploy script writes a managed release metadata block into `.env.production.local`.
- `/api/version` exposes runtime metadata (`commit`, `short_commit`, `build_time`, `next`, `node`, `env`).
- `VersionBadge` surfaces this metadata in the UI footer.

## Nexus Algorithm v1.1

- Adds ATR14 and volatility regime (`Low`, `Normal`, `High`, `Unknown`).
- Adds volume confirmation scoring and ratio context.
- Adds support/resistance location context from recent candle window.
- Adds optional higher-timeframe agreement hook (non-breaking optional input).
- Adds workflow state output: `No Trade`, `Watch`, `Ready`, `Confirmed`.
- Output remains workflow decision-support only (no trade execution and no financial advice).

## Current Limitations

- No trade execution and no custody/account integration.
- Default `/api/provider-health` remains lightweight and should be preferred for frequent readiness checks.
- Deep diagnostics are exposed separately at `/api/provider-health/deep` across all Binance-enabled symbols to avoid heavy default readiness probes.
- Ops summary is process-local and should receive a TTL cache before high-concurrency usage.
- Gemini budget estimate is a local guardrail and should not be treated as exact cloud billing.
