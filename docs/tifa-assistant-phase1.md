# TifaWidget Assistant Phase 1

> Historical rollout notes. For the current provider-neutral runtime, Ollama production setup, tool-only behavior, chat history, and Web Speech support, see [TifaWidget Assistant](tifa-assistant.md).

## Overview

TifaWidget is a floating assistant layer for Nexus Crypto. Phase 1 ships:

- Widget on `/`, `/asset/[id]`, `/ops`
- Chat APIs: `POST /api/tifa`, `POST /api/tifa/stream`
- Tool APIs:
  - `GET /api/tifa-tools/market-context`
  - `GET /api/tifa-tools/asset-analysis?assetId=bitcoin&tf=1h`
  - `GET /api/tifa-tools/budget-status`
- Initial Gemini provider gateway and budget guard with fail-closed mode

## Environment

Use `.env.example` as baseline.

Important variables:

- `TIFA_ASSISTANT_ENABLED` (`0` disables assistant; default enabled otherwise)
- `GEMINI_API_KEY` (server-side only, never sent to client)
- `GEMINI_MODEL` (default `gemini-3-flash-preview`)
- `NEXUS_GEMINI_*` budget policy variables

## Budget Policy

Policy file: `.gemini_budget_policy`

- Monthly cap: `5.00 USD`
- Hard stop: `4.50 USD`
- Degrade threshold: `4.00 USD`
- Failure mode: `fail_closed`
- Ledger: `runtime/gemini_budget/gemini_monthly_ledger.csv`
- State: `runtime/gemini_budget/gemini_budget_state.json`

If budget guard is unavailable and mode is fail-closed, Gemini requests are blocked.

## Phase 1.1 Hardening

- Contract tests for:
  - `POST /api/tifa`
  - `POST /api/tifa/stream`
- Secret-leak prevention tests for:
  - `/api/tifa`
  - `/api/tifa/stream`
  - `/api/tifa-tools/budget-status`
  - `/api/provider-health/gemini`
- True Gemini streaming path is enabled when:
  - `GEMINI_STREAM_ENABLED=1`
- Safe fallback path:
  - missing key -> tool-only mode
  - budget hard stop -> blocked provider call
  - circuit open -> tool-only pseudo stream
  - provider stream init failure (before any provider delta) -> tool-only pseudo stream
- Provider stream failure after partial delta:
  - emit sanitized `STREAM_PROVIDER_ERROR`
  - close SSE stream safely (no second fallback answer)
- Circuit breaker controls provider calls:
  - `GEMINI_CIRCUIT_BREAKER_ENABLED=1`
  - `GEMINI_CIRCUIT_FAILURE_THRESHOLD=3`
  - `GEMINI_CIRCUIT_COOLDOWN_MS=60000`
- Provider health endpoint now returns circuit + stream request settings:
  - `GET /api/provider-health/gemini`

### True Streaming Fallback Behavior

- Missing key, budget block, circuit open, or provider stream init failure -> tool-only pseudo stream.
- Provider stream failure after partial delta -> emit sanitized `STREAM_PROVIDER_ERROR` and close the SSE stream.

This avoids mixing partial vendor output with a second fallback answer after the client has already received provider-generated deltas.

## Smoke Validation

Run:

```bash
npm run smoke:tifa
```

This verifies:

- market context
- asset analysis for BTC/ETH/SOL/DOGE
- stablecoin market-only behavior for USDT/USDC
- budget status route
- no secret leakage in `/api/tifa` response
