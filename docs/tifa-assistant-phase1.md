# TifaWidget Assistant Phase 1

## Overview

TifaWidget is a floating assistant layer for Nexus Crypto. Phase 1 ships:

- Widget on `/`, `/asset/[id]`, `/ops`
- Chat APIs: `POST /api/tifa`, `POST /api/tifa/stream`
- Tool APIs:
  - `GET /api/tifa-tools/market-context`
  - `GET /api/tifa-tools/asset-analysis?assetId=bitcoin&tf=1h`
  - `GET /api/tifa-tools/budget-status`
- Gemini provider gateway and budget guard with fail-closed mode

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
