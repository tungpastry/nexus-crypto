# TifaWidget Assistant Phase 2

## Overview

Phase 2 adds deep tool orchestration for ops diagnostics while preserving Phase 1.1 safety controls:

- Budget guard (fail-closed)
- Gemini circuit breaker
- SSE event contract (`start`, `tool`, `budget`, `delta`, `done`, `error`)
- No-secret leakage behavior

## New Tool Endpoints

- `GET /api/tifa-tools/provider-health-explainer`
- `GET /api/tifa-tools/deep-health-explainer`
- `GET /api/tifa-tools/ops-summary`
- `GET|POST /api/tifa-tools/orchestrate`

All routes use existing API auth protection and only execute allowlisted tools.

## Orchestration Layer

Phase 2 introduces:

- Tool registry allowlist (`market_context`, `asset_analysis`, `budget_status`, `gemini_provider_health`, `provider_health`, `deep_provider_health`, explainer tools, and `ops_summary`)
- Intent-to-tool mapping (`market_snapshot`, `asset_analysis`, `stablecoin_explain`, `budget_status`, `provider_health`, `deep_health`, `ops_summary`, `system_explain`, `unknown`)
- Fallback-safe orchestration:
  - per-tool failures are captured as warnings
  - chat runtime remains operational with partial context

## Chat Runtime Integration

`/api/tifa` and `/api/tifa/stream` now consume orchestrated context via chat core.

For ops/provider/deep-health questions, Tifa can ground responses using:

- provider health explainer
- deep health explainer
- Gemini provider health summary
- ops executive summary

If orchestration data is partial, Tifa still responds with available context and safety disclaimer.

## Ops UI Enhancements

`/ops` now includes richer summary panels:

- Ops Executive Summary
- Provider Health Summary
- Deep Health Summary
- Ops Issues & Recommendations

Existing diagnostics panels remain intact:

- Provider Health (lightweight readiness)
- Provider Deep Health (manual deep diagnostics)
- Gemini Assistant Status

## Quick Actions

Ops quick actions now include:

- Ops Summary
- Provider Health
- Deep Health
- Gemini Budget

## Smoke Coverage (Phase 2)

`npm run smoke:tifa` now checks:

- `TIFA_PROVIDER_HEALTH_EXPLAINER=PASS`
- `TIFA_DEEP_HEALTH_EXPLAINER=PASS`
- `TIFA_OPS_SUMMARY=PASS`
- `TIFA_TOOL_ORCHESTRATOR=PASS`
- `TIFA_PHASE2_NO_SECRET_LEAK=PASS`

## Security Notes

- No dynamic external URL execution from user input.
- Tool orchestration uses strict allowlist routing.
- `GEMINI_API_KEY` and `NEXUS_SMOKE_AUTH_TOKEN` are redacted and never returned in client-facing payloads.
- Phase 2 adds explainers and summaries only; no trade execution behavior.

