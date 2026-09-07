# Nexus Crypto Architecture

## Overview

Nexus Crypto is a Next.js 16 App Router dashboard for market observation, asset workflows, provider diagnostics, and grounded assistant explanations. It is non-custodial, does not execute orders, and does not provide financial recommendations.

Current baseline:

- Next.js `16.3.4`, React `19.2.0`, Node 22 LTS.
- Versioned 100-member CoinGecko catalog.
- 52 Binance Spot/USDT workspaces and 48 market-only workspaces.
- Eight core deep-health canaries.
- Ubuntu `systemd` service on port `3200`.

## Runtime Layers

### Market layer

- `app/config/assets.generated.json`: committed membership and capabilities.
- `app/lib/binance.ts`: Binance ticker and candle provider.
- `app/lib/marketSnapshot.ts`: CoinGecko response normalization.
- `app/lib/serverCache.ts`: short-lived in-memory cache and stale fallback.
- `app/api/market-snapshot/persistentCache.ts`: latest compatible snapshot on disk.

The market snapshot requests all 100 committed CoinGecko IDs. Binance routes only accept symbols exported from the generated catalog.

### Dashboard layer

- Home `/`: product header, global market metrics, Top 100 watchlist, and TifaWidget.
- Asset `/asset/[id]`: asset identity, live price, timeframe, TradingView, Nexus Decision Matrix, and TifaWidget.
- Ops `/ops`: provider readiness, deep canary diagnostics, active LLM status, executive summaries, issue lists, and TifaWidget.
- Login `/login`: LAN-local credential flow.

Home deliberately excludes provider diagnostics so opening the market dashboard does not invoke deep health.

### Decision layer

`app/lib/nexusAlgorithm.ts` computes MA structure, ATR14, volatility, volume confirmation, support/resistance context, optional higher-timeframe agreement, risk, score, and workflow state.

The Decision Matrix uses Binance candle close, not the 5-second ticker. Catalog `binancePriceTickSize` metadata formats ticker, close, MA, and ATR values consistently with Binance `PRICE_FILTER.tickSize`.

### Assistant layer

- `app/lib/tifa-core`: chat preparation, fallback answers, and stream lifecycle.
- `app/lib/tifa-nexus`: intent, market/asset context, and prompt building.
- `app/lib/tifa-tools`: allowlisted registry, orchestration, explainers, and formatters.
- `app/lib/tifa-provider-gateway`: Ollama/Gemini adapters, retries, redaction, and circuit breakers.
- `app/lib/gemini-budget`: Gemini-only cost guard, ledger, and state.
- `app/lib/tifa-runtime`: config and server chat-session persistence.

Current production selects Ollama. Gemini remains optional. Provider failure produces a grounded tool-only answer; the gateway does not automatically call the other provider.

## Data Flows

### Market dashboard

```text
Browser
  -> /api/market-snapshot
  -> CoinGecko global + 100 committed market IDs
  -> cache validation by catalog version/universe size
  -> Market Snapshot and Asset Watchlist
```

One bounded retry is used for CoinGecko 429/5xx responses. Compatible stale data is preferred over an empty failure.

### Binance asset workspace

```text
Asset registry
  -> /api/crypto-price (5-second cache/poll cadence)
  -> /api/crypto-klines (60-second cache/poll cadence)
  -> TradingView + Nexus Algorithm
  -> tick-size-aware UI
```

Market-only assets use the CoinGecko snapshot path and do not make unsupported Binance/chart/algorithm calls.

### Tifa

```text
validated message and page context
  -> resolveTifaIntent
  -> orchestrateTifaTools (strict allowlist)
  -> grounded tool context
  -> budget preflight
  -> configured Ollama or Gemini adapter
  -> provider output or tool-only fallback
```

The SSE route preserves `start`, `tool`, `budget`, `delta`, `done`, and `error` events. A provider error before deltas can fall back to pseudo-streamed tool text; a failure after partial provider output emits sanitized `STREAM_PROVIDER_ERROR` and closes.

## Authentication Boundaries

Root `proxy.ts` protects these pages when `NEXUS_AUTH_ENABLED=1`:

- `/`
- `/asset/*`
- `/ops`

The proxy leaves `/api/*` routing alone. Protected route handlers call `requireApiAuth` and accept either a valid session cookie or the configured smoke bearer token. Auth-disabled mode preserves open local behavior.

Public routes include:

- auth login/logout/status.
- `/api/version`.
- `/api/provider-health`, `/deep`, `/llm`, `/ollama`, and `/gemini`.

## Provider Health

- `/api/provider-health`: lightweight readiness for BTC ticker/candles and market snapshot.
- `/api/provider-health/deep`: manual eight-canary Binance diagnostic; never all 52 symbols.
- `/api/provider-health/llm`: canonical sanitized status for the active assistant provider.
- `/api/provider-health/ollama` and `/gemini`: compatibility surfaces reflecting the active-provider snapshot.

The Home page does not mount these diagnostic panels. The Ops page mounts deep health once and refreshes it only on operator action.

## Themes And Client State

`ThemeProvider` applies `black-pink` or `wikipedia-glass` via `data-theme` and local storage. A pre-hydration script prevents a noticeable theme flash. TradingView is recreated with its matching dark/light setting.

Tifa browser history is stored per page context. Web Speech text-to-speech runs entirely through browser APIs when available.

## Release Metadata

The deploy script writes only its managed release block in ignored `.env.production.local`. `/api/version` exposes commit, short commit, build time, Next.js version, Node version, environment, and response time. `VersionBadge` reads it at runtime.

## Storage Model

- No database or Redis.
- Price/candle cache: process memory and lost on restart.
- Market snapshot fallback: ignored `.runtime/` file.
- Gemini budget and server chat history: ignored `runtime/` files.
- Theme and widget history: browser local storage.

## Limitations

- Catalog membership changes only through reviewed regeneration.
- Market-only workspaces do not have Binance candles or Nexus analysis.
- Default provider health is representative, not an all-symbol guarantee.
- Deep health covers eight core canaries only.
- Circuit breaker state is process-local.
- Gemini budget values are application estimates, not provider billing.
- Tifa output remains constrained by available tool context and upstream freshness.
