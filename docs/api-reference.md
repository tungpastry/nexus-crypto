# API Reference

All examples are illustrative. Market values, latency, timestamps, catalog version, provider, model, and release metadata vary at runtime.

## Authentication

When `NEXUS_AUTH_ENABLED != "1"`, protected APIs retain open local behavior. When enabled, protected routes require either:

- a valid signed session cookie; or
- `Authorization: Bearer <NEXUS_SMOKE_AUTH_TOKEN>` when the smoke token is configured.

Unauthorized response:

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

Public routes are the auth family, `/api/version`, and every route under `/api/provider-health`. Market-data and Tifa routes described below are protected unless marked public.

## Market Data

### GET /api/crypto-price

Returns Binance ticker price for a catalog-enabled Binance symbol.

```text
/api/crypto-price?symbol=BTCUSDT
```

- `symbol`: required; validated against the generated `BINANCE_SYMBOLS` allowlist (52 symbols in the current catalog).
- Auth: protected.
- Cache TTL: 5 seconds, with stale fallback.

```json
{
  "provider": "binance",
  "symbol": "BTCUSDT",
  "price": "80274.43000000",
  "updated_at": "2026-09-07T00:00:00.000Z",
  "cache": { "status": "hit", "age_ms": 1200, "ttl_ms": 5000 }
}
```

The API preserves Binance's string price. UI precision comes from the catalog's `binancePriceTickSize`.

Errors:

- `400 UNSUPPORTED_SYMBOL`
- `502 PRICE_PROVIDER_ERROR` when no stale value exists
- degraded `200` with `PRICE_PROVIDER_STALE` when stale cache is usable

### GET /api/crypto-klines

Returns Binance OHLCV candles for a catalog-enabled symbol/timeframe.

```text
/api/crypto-klines?symbol=BTCUSDT&tf=1h
```

- `symbol`: required; same generated allowlist as price.
- `tf`: required; `15m`, `30m`, `1h`, `4h`, `1d`, or `1w`.
- Auth: protected.
- Cache TTL: 60 seconds.
- Fetch limit: 400 candles, or 500 for `1w`.

```json
{
  "provider": "binance",
  "symbol": "BTCUSDT",
  "tf": "1h",
  "updated_at": "2026-09-07T00:00:00.000Z",
  "candles": [
    {
      "time": 1788739200000,
      "open": 80000,
      "high": 81000,
      "low": 79500,
      "close": 80274.43,
      "volume": 1234.56
    }
  ],
  "cache": { "status": "miss", "age_ms": 0, "ttl_ms": 60000 }
}
```

Errors:

- `400 UNSUPPORTED_SYMBOL`
- `400 UNSUPPORTED_TIMEFRAME`
- `502 KLINES_PROVIDER_ERROR`
- degraded `200` with `KLINES_PROVIDER_STALE` when stale cache is usable

### GET /api/market-snapshot

Returns global CoinGecko metrics and rows for all members of the committed Top 100 catalog.

- Auth: protected.
- Runtime membership: fixed by the committed catalog.
- Market rank/metrics: live from CoinGecko when available.

```json
{
  "provider": "coingecko",
  "catalog_version": "2026-09-06-01628185553c",
  "catalog_generated_at": "2026-09-06T13:04:19.372Z",
  "universe_size": 100,
  "updated_at": "2026-09-07T00:00:00.000Z",
  "global": {
    "market_cap_usd": 0,
    "volume_24h_usd": 0,
    "btc_dominance": 0,
    "eth_dominance": 0
  },
  "assets": [
    {
      "id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "rank": 1,
      "category": "major",
      "price": 0,
      "change_1h": 0,
      "change_24h": 0,
      "change_7d": 0,
      "volume_24h": 0,
      "market_cap": 0
    }
  ],
  "cache": { "status": "hit", "age_ms": 4200 }
}
```

CoinGecko 429/5xx errors receive one bounded retry. A RAM or persistent snapshot is accepted only when catalog version and universe size match. Otherwise the route returns a degraded structure with null values.

### Legacy BTC routes

- `GET /api/btc-price`
- `GET /api/btc-klines?tf=1h`

These protected compatibility routes delegate to the same Binance/cache behavior. New callers should use the generic crypto routes.

## Operational Health (Public)

### GET /api/provider-health

Lightweight readiness check for representative BTC price/candles plus the market snapshot.

```json
{
  "provider": "nexus_crypto",
  "status": "ok",
  "updated_at": "2026-09-07T00:00:00.000Z",
  "checks": {
    "binance_price": { "status": "ok", "latency_ms": 100 },
    "binance_klines": { "status": "ok", "latency_ms": 120 },
    "market_snapshot": { "status": "ok", "latency_ms": 240 },
    "market_snapshot_cache_status": { "status": "ok", "value": "hit" },
    "market_snapshot_age_ms": { "status": "ok", "value": 980 }
  }
}
```

Status is `ok` or `degraded`. Prefer this endpoint for readiness polling.

### GET /api/provider-health/deep

Checks price and five `1h` candles for eight core canaries:

```text
BTCUSDT ETHUSDT BNBUSDT XRPUSDT
SOLUSDT TRXUSDT DOGEUSDT SHIBUSDT
```

```json
{
  "provider": "nexus_crypto",
  "mode": "deep",
  "scope": "core-canary",
  "available_symbols_total": 52,
  "status": "ok",
  "updated_at": "2026-09-07T00:00:00.000Z",
  "summary": {
    "symbols_total": 8,
    "symbols_ok": 8,
    "symbols_warn": 0,
    "symbols_error": 0,
    "latency_ms": 500
  },
  "checks": {
    "BTCUSDT": {
      "status": "ok",
      "price": { "status": "ok", "latency_ms": 80 },
      "klines": { "status": "ok", "latency_ms": 100, "candles": 5 }
    }
  }
}
```

Status is `ok`, `degraded`, or `error`. This is a manual diagnostic, not a high-frequency probe.

### GET /api/provider-health/llm

Canonical sanitized health for the active Tifa provider.

```json
{
  "provider": "ollama",
  "active_provider": "ollama",
  "assistant_enabled": true,
  "configured": true,
  "model": "gemma4:e4b-it-qat",
  "status": "ok",
  "stream": { "enabled": true, "timeout_ms": 25000, "retry_limit": 1 },
  "request": { "timeout_ms": 20000, "retry_limit": 1 },
  "circuit": {
    "enabled": true,
    "state": "closed",
    "failure_count": 0,
    "cooldown_ms": 60000,
    "opened_until": null,
    "threshold": 3
  },
  "budget": {
    "provider": "gemini",
    "monthly_cap_usd": 5,
    "hard_stop_usd": 4.5,
    "degrade_threshold_usd": 4,
    "monthly_spend_usd": 0,
    "monthly_requests": 0,
    "remaining_hard_stop_usd": 4.5,
    "status": "ok",
    "failure_mode": "fail_closed"
  },
  "updated_at": "2026-09-07T00:00:00.000Z"
}
```

The budget block remains Gemini-specific even when Ollama is active.

### GET /api/provider-health/ollama

Compatibility health surface. It adds `host` when Ollama is active. The payload reflects the configured active-provider snapshot; use `/llm` for provider-neutral monitoring.

### GET /api/provider-health/gemini

Compatibility health surface retained for Phase 1 clients and tests. It currently reflects the active-provider snapshot plus Gemini budget status; the suffix does not force Gemini execution.

No health response contains provider keys or smoke tokens.

## Tifa Chat

### POST /api/tifa

Non-streaming grounded assistant response.

```json
{
  "message": "Summarize provider health.",
  "context": {
    "page": "/ops",
    "assetId": "bitcoin",
    "timeframe": "1h"
  }
}
```

- `message`: required non-empty string.
- Context fields are optional and validated.
- Auth: protected.

```json
{
  "ok": true,
  "answer": "...",
  "provider": "ollama",
  "model": "gemma4:e4b-it-qat",
  "tool_context": {
    "intent": "provider_health",
    "tool_orchestration": {
      "tools_requested": ["provider_health_explainer"],
      "tools_used": ["provider_health_explainer"],
      "warnings": []
    }
  },
  "budget": { "status": "ok" }
}
```

`provider` can be `ollama`, `gemini`, or `tool-only`. Provider/tool errors are sanitized.

### POST /api/tifa/stream

SSE equivalent of the chat route. Headers include:

```text
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

Stable event names:

```text
start
tool
budget
delta
done
error
```

A provider failure before a delta can fall back to pseudo-streamed tool-only text. A failure after partial provider output emits sanitized `STREAM_PROVIDER_ERROR` and closes without a second answer.

Invalid input returns an SSE `error` event. Unauthorized requests return HTTP 401 with an SSE `error` frame.

## Tifa Tools

All routes in this section are protected when auth is enabled.

### GET /api/tifa-tools/market-context

Returns compact Top 100 context:

- global market cap/volume and BTC/ETH dominance.
- first 20 ranked assets for bounded prompting.
- five strongest and weakest 24-hour assets computed from the full universe.
- catalog/freshness metadata and disclaimer.

### GET /api/tifa-tools/asset-analysis

```text
/api/tifa-tools/asset-analysis?assetId=bitcoin&tf=1h
```

Binance-enabled assets return latest ticker price, timeframe, Nexus signal, and rules summary.

Market-only response:

```json
{
  "ok": true,
  "context_type": "asset_analysis",
  "mode": "market-only",
  "analysis_enabled": false,
  "asset": { "id": "tether", "symbol": "USDT" },
  "timeframe": { "label": "1H", "binance": "1h" },
  "reason": "USDT is configured as a stablecoin market-only asset. Nexus MA/checklist analysis is disabled."
}
```

Non-Binance assets use a distinct Binance-unavailable reason.

### GET /api/tifa-tools/budget-status

Returns Gemini monthly cap, hard stop, degrade threshold, estimated spend/request count, remaining amount, status, and failure mode.

### GET /api/tifa-tools/provider-health-explainer

Normalizes lightweight health into check counts, slowest check, issues, explanation, and disclaimer.

### GET /api/tifa-tools/deep-health-explainer

Normalizes eight-canary health into per-symbol price/kline status, slow symbols, issues, explanation, and disclaimer.

### GET /api/tifa-tools/ops-summary

Combines provider, deep, active LLM, and budget context:

```json
{
  "ok": true,
  "context_type": "ops_summary",
  "status": "ok",
  "executive": {
    "headline": "Ops diagnostics are healthy.",
    "status": "ok",
    "provider_status": "ok",
    "deep_health_status": "ok",
    "gemini_status": "ok",
    "budget_status": "ok"
  },
  "issues": [],
  "recommendations": []
}
```

`gemini_status` is a legacy field name in the current contract and represents the active provider health summary.

### GET|POST /api/tifa-tools/orchestrate

Directly invokes intent mapping and allowlisted tools.

GET:

```text
/api/tifa-tools/orchestrate?message=ops+summary&page=/ops
```

POST:

```json
{
  "message": "Explain provider health",
  "context": { "page": "/ops" },
  "tools": ["provider_health_explainer"]
}
```

Unknown tools cannot execute. User input cannot choose an arbitrary external URL.

## Auth Routes (Public)

### POST /api/auth/login

Accepts `username` and `password` when auth is enabled. Success sets the signed HTTP-only session cookie.

Errors include:

- `400 AUTH_DISABLED`
- `401 INVALID_CREDENTIALS`
- `429 RATE_LIMITED` with `Retry-After`
- `500 AUTH_CONFIG_ERROR`

### POST /api/auth/logout

Clears the session cookie.

### GET /api/auth/me

Returns authentication status and user name. Auth-disabled mode reports the local user as authenticated. A valid near-expiry session can be rotated.

## GET /api/version (Public)

```json
{
  "app": "nexus-crypto",
  "version": "0.1.0",
  "commit": "full-commit-sha",
  "short_commit": "abcdef0",
  "build_time": "2026-09-07T00:00:00Z",
  "next": "16.3.4",
  "node": "v22.18.0",
  "env": "production",
  "updated_at": "2026-09-07T00:00:00.000Z"
}
```

The deploy script injects commit/build metadata into its managed production env block. Values may be `unknown` outside that flow.
