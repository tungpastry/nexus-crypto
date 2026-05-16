# API Reference

## Auth Behavior Summary

- If `NEXUS_AUTH_ENABLED != "1"`: all routes behave as open market-data APIs.
- If auth is enabled:
  - Protected market-data routes require either:
    - valid session cookie, or
    - `Authorization: Bearer <NEXUS_SMOKE_AUTH_TOKEN>` when configured.
  - Public operational routes remain public: `/api/version`, `/api/provider-health`, `/api/provider-health/deep`, and auth routes.
  - Tifa tool routes use the existing API auth protection where required.

Unauthorized protected calls return:

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

---

## GET /api/crypto-price?symbol=BTCUSDT

Purpose: Get validated Binance price payload for allowed symbols.

Query params:

- `symbol` required (`BTCUSDT`, `ETHUSDT`, `BNBUSDT`, `XRPUSDT`, `SOLUSDT`, `TRXUSDT`, `SHIBUSDT`, `DOGEUSDT`)

Auth:

- Protected when auth is enabled.

Example response:

```json
{
  "provider": "binance",
  "symbol": "BTCUSDT",
  "price": "80457.17000000",
  "updated_at": "2026-05-16T00:00:00.000Z",
  "cache": { "status": "hit", "age_ms": 1300, "ttl_ms": 5000 }
}
```

Errors:

- `400 UNSUPPORTED_SYMBOL`
- `502 PRICE_PROVIDER_ERROR` when upstream fails and no stale cache is available
- `200` degraded stale response with `status: "degraded"` + `PRICE_PROVIDER_STALE` when stale cache is available

---

## GET /api/crypto-klines?symbol=BTCUSDT&tf=1h

Purpose: Get validated Binance OHLCV candles.

Query params:

- `symbol` required (same allowlist as above)
- `tf` required (`15m`, `30m`, `1h`, `4h`, `1d`, `1w`)

Auth:

- Protected when auth is enabled.

Example response:

```json
{
  "provider": "binance",
  "symbol": "BTCUSDT",
  "tf": "1h",
  "updated_at": "2026-05-16T00:00:00.000Z",
  "candles": [
    { "time": 1710000000000, "open": 68000, "high": 69000, "low": 67500, "close": 68500, "volume": 1234.56 }
  ],
  "cache": { "status": "miss", "age_ms": 0, "ttl_ms": 60000 }
}
```

Errors:

- `400 UNSUPPORTED_SYMBOL`
- `400 UNSUPPORTED_TIMEFRAME`
- `502 KLINES_PROVIDER_ERROR` when upstream fails and no stale cache is available
- `200` degraded stale response with `status: "degraded"` + `KLINES_PROVIDER_STALE` when stale cache is available

---

## GET /api/market-snapshot

Purpose: Return CoinGecko-style global snapshot and Top 10 asset rows.

Auth:

- Protected when auth is enabled.

Example response:

```json
{
  "provider": "coingecko",
  "updated_at": "2026-05-16T00:00:00.000Z",
  "global": {
    "market_cap_usd": 123,
    "volume_24h_usd": 45,
    "btc_dominance": 50.1,
    "eth_dominance": 16.2
  },
  "assets": [],
  "cache": { "status": "hit", "age_ms": 4200 }
}
```

Degraded cases:

- If provider fails and RAM/file cache exists: `status: "degraded"` with stale cached payload and `MARKET_SNAPSHOT_STALE`.
- If no cache exists: degraded fallback structure with null market values.

---

## GET /api/provider-health

Purpose: Operational health view for Binance + market snapshot route behavior.

Auth:

- Public.

Example response:

```json
{
  "provider": "nexus_crypto",
  "status": "ok",
  "updated_at": "2026-05-16T00:00:00.000Z",
  "checks": {
    "binance_price": { "status": "ok", "latency_ms": 122 },
    "binance_klines": { "status": "ok", "latency_ms": 177 },
    "market_snapshot": { "status": "ok", "latency_ms": 240 },
    "market_snapshot_cache_status": { "status": "ok", "value": "hit" },
    "market_snapshot_age_ms": { "status": "ok", "value": 980 }
  }
}
```

Notes:

- Route status can be `ok` or `degraded`.
- When auth is enabled and smoke token exists, provider-health includes bearer auth for internal market-snapshot checks.
- This is the lightweight readiness check and should be preferred for frequent probes.

---

## GET /api/provider-health/deep

Purpose: Deep multi-asset provider check across all Binance-enabled Nexus symbols.

Auth:

- Public.

Coverage:

- `BTCUSDT`, `ETHUSDT`, `BNBUSDT`, `XRPUSDT`, `SOLUSDT`, `TRXUSDT`, `SHIBUSDT`, `DOGEUSDT`
- For each symbol, checks both price and `1h` klines (`limit=5`).

Example response:

```json
{
  "provider": "nexus_crypto",
  "mode": "deep",
  "status": "ok",
  "updated_at": "2026-05-16T00:00:00.000Z",
  "summary": {
    "symbols_total": 8,
    "symbols_ok": 8,
    "symbols_warn": 0,
    "symbols_error": 0,
    "latency_ms": 956
  },
  "checks": {
    "BTCUSDT": {
      "status": "ok",
      "price": { "status": "ok", "latency_ms": 80 },
      "klines": { "status": "ok", "latency_ms": 101, "candles": 5 }
    }
  }
}
```

Notes:

- Use this endpoint for manual diagnostics/monitoring depth.
- Avoid high-frequency polling; it performs a wider provider fanout than `/api/provider-health`.

---

## GET /api/provider-health/gemini

Purpose: Client-safe Gemini provider, stream, circuit breaker, and budget health surface.

Auth:

- Public operational health endpoint.

Example response:

```json
{
  "provider": "gemini",
  "assistant_enabled": true,
  "configured": true,
  "model": "gemini-3-flash-preview",
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
    "model": "gemini-3-flash-preview",
    "current_month": "2026-05",
    "monthly_cap_usd": 5,
    "hard_stop_usd": 4.5,
    "degrade_threshold_usd": 4,
    "monthly_spend_usd": 0.01,
    "monthly_requests": 1,
    "remaining_hard_stop_usd": 4.49,
    "status": "ok",
    "failure_mode": "fail_closed"
  },
  "updated_at": "2026-05-16T00:00:00.000Z"
}
```

Notes:

- `configured=false` means Tifa can still run in tool-only fallback mode.
- Secrets are never returned.

---

## POST /api/tifa

Purpose: Non-streaming TifaWidget Assistant response using orchestrated tool context and Gemini/tool-only fallback.

Auth:

- Protected when auth is enabled.

Example request:

```json
{
  "message": "Tóm tắt ops summary hiện tại thật ngắn trong 5 bullet.",
  "context": { "page": "/ops" }
}
```

Example response shape:

```json
{
  "ok": true,
  "answer": "...",
  "provider": "gemini",
  "model": "gemini-3-flash-preview",
  "tool_context": {
    "intent": "ops_summary",
    "ops_summary_context": { "status": "ok" },
    "tool_orchestration": {
      "tools_requested": ["ops_summary"],
      "tools_used": ["ops_summary"],
      "warnings": []
    }
  },
  "budget": { "status": "ok", "reason": "GEMINI_BUDGET_OK" }
}
```

Provider can be `gemini` or `tool-only` depending on config, budget, circuit, and provider availability.

---

## POST /api/tifa/stream

Purpose: SSE streaming TifaWidget Assistant response.

Auth:

- Protected when auth is enabled.

SSE event contract:

```text
event: start
event: tool
event: budget
event: delta
event: done
event: error
```

Notes:

- The event contract must remain stable.
- Provider errors are sanitized.
- Stream responses must not leak secrets.

---

## GET /api/tifa-tools/market-context

Purpose: Return grounded market snapshot context for Tifa.

Auth:

- Protected when auth is enabled.

---

## GET /api/tifa-tools/asset-analysis

Purpose: Return grounded asset analysis context for Tifa.

Auth:

- Protected when auth is enabled.

Notes:

- Stablecoins return market-only context.
- Nexus MA/checklist automation is disabled for USDT/USDC.

---

## GET /api/tifa-tools/budget-status

Purpose: Return Gemini budget guard status.

Auth:

- Protected when auth is enabled.

Key fields:

```text
monthly_cap_usd
hard_stop_usd
degrade_threshold_usd
monthly_spend_usd
monthly_requests
remaining_hard_stop_usd
status
failure_mode
```

---

## GET /api/tifa-tools/provider-health-explainer

Purpose: Normalize `/api/provider-health` into assistant/UI-friendly readiness explanation.

Auth:

- Protected when auth is enabled.

Example response shape:

```json
{
  "ok": true,
  "context_type": "provider_health_explainer",
  "status": "ok",
  "summary": {
    "total_checks": 5,
    "ok_checks": 5,
    "warn_checks": 0,
    "error_checks": 0,
    "slowest_check": "Market snapshot",
    "slowest_latency_ms": 708
  },
  "issues": [],
  "explanation": "Provider readiness checks are healthy. Binance price/klines and market snapshot are responding normally.",
  "disclaimer": "Market data only. No trade execution or financial recommendations."
}
```

---

## GET /api/tifa-tools/deep-health-explainer

Purpose: Normalize `/api/provider-health/deep` into assistant/UI-friendly multi-symbol diagnostics.

Auth:

- Protected when auth is enabled.

Example response shape:

```json
{
  "ok": true,
  "context_type": "deep_health_explainer",
  "status": "ok",
  "summary": {
    "symbols_total": 8,
    "symbols_ok": 8,
    "symbols_warn": 0,
    "symbols_error": 0,
    "latency_ms": 504,
    "slow_symbols": [
      { "symbol": "DOGEUSDT", "latency_ms": 492 }
    ]
  },
  "issues": [],
  "explanation": "Deep provider diagnostics are healthy across Binance-enabled assets."
}
```

---

## GET /api/tifa-tools/ops-summary

Purpose: Return executive ops summary combining provider health, deep health, Gemini health, and budget status.

Auth:

- Protected when auth is enabled.

Example response shape:

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
  "recommendations": ["All monitored ops diagnostics are healthy at this time."]
}
```

---

## GET|POST /api/tifa-tools/orchestrate

Purpose: Test or invoke the Phase 2 Tifa tool orchestration layer directly.

Auth:

- Protected when auth is enabled.

GET example:

```text
/api/tifa-tools/orchestrate?message=ops+summary&page=/ops
```

POST example:

```json
{
  "message": "provider health explain",
  "context": { "page": "/ops" },
  "tools": ["provider_health_explainer"]
}
```

Example response shape:

```json
{
  "ok": true,
  "intent": "provider_health",
  "tools_requested": ["provider_health_explainer"],
  "tools_used": ["provider_health_explainer"],
  "outputs": {},
  "warnings": []
}
```

Security notes:

- Requested tools are filtered through the strict allowlist.
- Unsupported tools are ignored or reported as warnings.
- No dynamic external URL execution is allowed from user input.

---

## GET /api/version

Purpose: Expose release/runtime metadata for deploy verification and footer badge.

Auth:

- Public.

Example response:

```json
{
  "app": "nexus-crypto",
  "version": "0.1.0",
  "commit": "1ba0b57e0c7e8ef9712095e816fc32f8e10bddb6",
  "short_commit": "1ba0b57",
  "build_time": "2026-05-16T00:00:00Z",
  "next": "16.2.6",
  "node": "v22.18.0",
  "env": "production",
  "updated_at": "2026-05-16T00:00:00.000Z"
}
```

---

## GET /api/btc-price (legacy)

Purpose: Legacy compatibility route for BTC price contract.

Auth:

- Protected when auth is enabled.

Response shape:

```json
{
  "price": "80169.73000000",
  "updated_at": "2026-05-16T00:00:00.000Z"
}
```

---

## GET /api/btc-klines?tf=4h (legacy)

Purpose: Legacy compatibility route returning candle array for BTC.

Auth:

- Protected when auth is enabled.

Query params:

- `tf` required (`15m`, `30m`, `1h`, `4h`, `1d`, `1w`)

Response shape:

- Legacy candle array (not wrapped with provider metadata).

---

## Auth Endpoints

### POST /api/auth/login

- Public.
- Input JSON: `username`, `password`.
- Returns `200` with session cookie on success.
- Error cases:
  - `400 AUTH_DISABLED`
  - `500 AUTH_CONFIG_ERROR`
  - `401 INVALID_CREDENTIALS`
  - `429 RATE_LIMITED`

### POST /api/auth/logout

- Public.
- Clears session cookie, returns `{ "ok": true }`.

### GET /api/auth/me

- Public.
- Returns auth status payload.
- Rotates session cookie when near expiry if rotation is enabled.
