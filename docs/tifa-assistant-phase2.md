# TifaWidget Assistant Phase 2

> Historical rollout notes. For the current provider-neutral runtime and Ollama-first production baseline, see [TifaWidget Assistant](tifa-assistant.md).

## Overview

Phase 2 adds deep tool orchestration for ops diagnostics while preserving Phase 1.1 safety controls:

- Budget guard (fail-closed)
- Gemini circuit breaker
- SSE event contract (`start`, `tool`, `budget`, `delta`, `done`, `error`)
- No-secret leakage behavior
- Tool-only fallback when Gemini is unavailable or blocked

Current validated state:

```text
PHASE 2 OPS ORCHESTRATION: GREEN
PROVIDER GATEWAY: GREEN
NO-SECRET SMOKE: PASS
```

## New Tool Endpoints

- `GET /api/tifa-tools/provider-health-explainer`
- `GET /api/tifa-tools/deep-health-explainer`
- `GET /api/tifa-tools/ops-summary`
- `GET|POST /api/tifa-tools/orchestrate`

All routes use existing API auth protection and only execute allowlisted tools.

## Orchestration Layer

Phase 2 introduces:

- Tool registry allowlist:
  - `market_context`
  - `asset_analysis`
  - `budget_status`
  - `gemini_provider_health`
  - `provider_health`
  - `deep_provider_health`
  - `provider_health_explainer`
  - `deep_health_explainer`
  - `ops_summary`
- Intent-to-tool mapping:
  - `market_snapshot`
  - `asset_analysis`
  - `stablecoin_explain`
  - `budget_status`
  - `provider_health`
  - `deep_health`
  - `ops_summary`
  - `system_explain`
  - `unknown`
- Fallback-safe orchestration:
  - per-tool failures are captured as warnings
  - chat runtime remains operational with partial context
  - unsupported tools cannot execute

## Chat Runtime Integration

`/api/tifa` and `/api/tifa/stream` consume orchestrated context via chat core.

Runtime flow:

```text
message
→ resolve intent
→ select allowlisted tools
→ execute tools
→ normalize tool context
→ budget preflight
→ Gemini provider or tool-only fallback
→ budget postflight
→ append chat session
```

For ops/provider/deep-health questions, Tifa can ground responses using:

- provider health explainer
- deep health explainer
- Gemini provider health summary
- ops executive summary
- budget guard status

If orchestration data is partial, Tifa still responds with available context and safety disclaimer.

## Live Gemini Provider

When `GEMINI_API_KEY` is configured, Tifa can answer with the live Gemini provider.

Recommended production env:

```text
GEMINI_API_KEY=<redacted>
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_STREAM_ENABLED=1
GEMINI_TIMEOUT_MS=20000
GEMINI_RETRY_LIMIT=1
GEMINI_STREAM_TIMEOUT_MS=25000
GEMINI_STREAM_RETRY_LIMIT=1
GEMINI_CIRCUIT_BREAKER_ENABLED=1
GEMINI_CIRCUIT_FAILURE_THRESHOLD=3
GEMINI_CIRCUIT_COOLDOWN_MS=60000
GEMINI_MAX_OUTPUT_TOKENS=1600
```

Expected `/api/provider-health/gemini` live indicators:

```json
{
  "configured": true,
  "status": "ok",
  "model": "gemini-3-flash-preview",
  "circuit": { "state": "closed", "failure_count": 0 },
  "budget": { "status": "ok" }
}
```

If `GEMINI_API_KEY` is missing, Tifa remains usable through tool-only fallback.

## Budget Guard

Budget guard behavior:

- Monthly cap policy: 5 USD
- Hard stop: 4.5 USD
- Degrade threshold: 4 USD
- Failure mode: fail-closed
- Preflight runs before provider execution
- Postflight records success/failure and estimated cost

Budget status appears in:

- `/api/tifa-tools/budget-status`
- `/api/provider-health/gemini`
- `/api/tifa` response metadata
- `/ops` Gemini Assistant Status panel

## Circuit Breaker

Circuit breaker states:

- `closed`: provider is healthy
- `open`: provider calls are blocked during cooldown
- `half_open`: provider may be probed after cooldown

Tifa must not bypass circuit breaker state. Provider failures are sanitized before they reach client-facing payloads.

## Ops UI Enhancements

`/ops` includes richer summary panels:

- Ops Executive Summary
- Provider Health Summary
- Deep Health Summary
- Ops Issues & Recommendations

Existing diagnostics panels remain intact:

- Provider Health (lightweight readiness)
- Provider Deep Health (manual deep diagnostics)
- Gemini Assistant Status

## Quick Actions

Ops quick actions include:

- Ops Summary
- Provider Health
- Deep Health
- Gemini Budget

## Smoke Coverage (Phase 2)

`npm run smoke:tifa` checks:

```text
TIFA_MARKET_CONTEXT=PASS
TIFA_ASSET_BTC=PASS
TIFA_ASSET_ETH=PASS
TIFA_ASSET_SOL=PASS
TIFA_ASSET_DOGE=PASS
TIFA_STABLECOIN_USDT=PASS
TIFA_STABLECOIN_USDC=PASS
TIFA_BUDGET_STATUS=PASS
TIFA_PROVIDER_HEALTH_GEMINI=PASS
TIFA_PROVIDER_HEALTH_EXPLAINER=PASS
TIFA_DEEP_HEALTH_EXPLAINER=PASS
TIFA_OPS_SUMMARY=PASS
TIFA_TOOL_ORCHESTRATOR=PASS
TIFA_CHAT_NO_SECRET_LEAK=PASS
TIFA_STREAM_CONTRACT=PASS
TIFA_STREAM_NO_SECRET_LEAK=PASS
TIFA_PHASE2_NO_SECRET_LEAK=PASS
```

## Security Notes

- No dynamic external URL execution from user input.
- Tool orchestration uses strict allowlist routing.
- `GEMINI_API_KEY` and `NEXUS_SMOKE_AUTH_TOKEN` are redacted and never returned in client-facing payloads.
- Phase 2 adds explainers and summaries only; no trade execution behavior.
- Tifa output is diagnostic/decision-support context only, not financial advice.

## Known Follow-up Tasks

- Add TTL cache for `/api/tifa-tools/ops-summary`.
- Add UI surface for orchestration warnings.
- Add full chat intent-to-tool integration tests.
