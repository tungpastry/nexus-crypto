# API Reference

## Auth Behavior Summary
- If `NEXUS_AUTH_ENABLED != "1"`: all routes behave as open market-data APIs.
- If auth is enabled:
  - Protected market-data routes require either:
    - valid session cookie, or
    - `Authorization: Bearer <NEXUS_SMOKE_AUTH_TOKEN>` (when configured).
  - Public operational routes remain public: `/api/version`, `/api/provider-health`, `/api/provider-health/deep`, and auth routes.

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
  "candles": [{ "time": 1710000000000, "open": 68000, "high": 69000, "low": 67500, "close": 68500, "volume": 1234.56 }],
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
