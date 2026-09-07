# TifaWidget Assistant

## Current Architecture

Tifa is a grounded assistant embedded on Home, Asset Workspace, and Ops. It answers from server-provided market, asset, budget, and provider-health context. It must not invent prices, promise outcomes, execute trades, or expose credentials.

Current production uses Ollama with `gemma4:e4b-it-qat`. Gemini API remains an optional provider. The configured provider is selected server-side; there is no automatic cross-provider switch.

## Request Flow

```text
message and page context
  -> input validation
  -> intent resolution
  -> allowlisted tool orchestration
  -> grounded context and runtime prompt
  -> budget preflight
  -> selected Ollama or Gemini provider
  -> provider response or local tool-only fallback
  -> optional session append
```

The Gemini budget preflight remains in the common path. Local Ollama requests are recorded as zero-cost/bypassed local inference; Gemini requests obey the configured cap, degrade threshold, hard stop, and fail-closed policy.

## Provider Selection

Set `TIFA_LLM_PROVIDER` to `ollama` or `gemini`.

### Ollama

Current defaults:

```text
TIFA_LLM_PROVIDER=ollama
OLLAMA_HOST=http://192.168.1.7:11434
OLLAMA_MODEL=gemma4:e4b-it-qat
OLLAMA_TIMEOUT_MS=20000
OLLAMA_RETRY_LIMIT=1
OLLAMA_STREAM_TIMEOUT_MS=25000
OLLAMA_STREAM_RETRY_LIMIT=1
OLLAMA_THINK=0
OLLAMA_KEEP_ALIVE=30m
```

The adapter uses Ollama's OpenAI-compatible `/v1/chat/completions` endpoint. Thinking is disabled so user-facing content remains in the response content stream. Ollama must be reachable from the Next.js server; the browser never contacts it directly.

### Gemini API

Gemini uses a server-side API key and defaults to `gemini-3-flash-preview`. Controls include request/stream timeout, retry limits, circuit breaker, output limit, temperature, and streaming enablement.

Never expose `GEMINI_API_KEY` to client code, JSON, SSE, logs, docs, or committed env files.

### Tool-only fallback

When the selected provider is missing, blocked, unavailable, circuit-open, or fails before producing a usable answer, Tifa returns a deterministic answer formatted from tool context. It does not silently invoke the other provider.

For streams:

- Provider unavailable before deltas: use pseudo-streamed tool-only text.
- Provider failure after partial deltas: emit sanitized `STREAM_PROVIDER_ERROR` and close; do not mix a second answer into the partial provider output.

## Tool Orchestration

The registry in `app/lib/tifa-tools/registry.ts` allowlists:

- `market_context`
- `asset_analysis`
- `budget_status`
- `gemini_provider_health` (legacy internal name for the active-provider snapshot)
- `provider_health`
- `deep_provider_health`
- `provider_health_explainer`
- `deep_health_explainer`
- `ops_summary`

Supported intents cover market snapshot, asset analysis, stablecoin explanation, budget, provider health, deep health, ops summary, system explanation, and unknown input.

User input cannot supply an arbitrary URL or executable tool. Unsupported tool names are rejected or returned as warnings. Partial tool failures can degrade to the remaining safe context.

## Context Boundaries

### Market context

Market context reads the full Top 100 snapshot for leaders/laggards, but bounds prompt rows to control tokens. It includes catalog size, global metrics, changes, mode, freshness, and a market-data disclaimer.

### Asset analysis

Binance-enabled assets receive Nexus Algorithm v1.1 context. Stablecoins and Binance-unavailable assets return `mode: "market-only"`, `analysis_enabled: false`, and an explicit reason without attempting MA/checklist analysis.

### Ops context

Phase 2 explainers normalize lightweight provider health, eight-canary deep health, active LLM health, circuit state, and Gemini budget status into executive summaries and issue lists.

## API Contracts

- `POST /api/tifa`: non-streaming JSON answer.
- `POST /api/tifa/stream`: SSE answer.
- `GET /api/tifa-tools/market-context`
- `GET /api/tifa-tools/asset-analysis`
- `GET /api/tifa-tools/budget-status`
- `GET /api/tifa-tools/provider-health-explainer`
- `GET /api/tifa-tools/deep-health-explainer`
- `GET /api/tifa-tools/ops-summary`
- `GET|POST /api/tifa-tools/orchestrate`

When LAN auth is enabled, these routes require a valid session or smoke bearer token.

SSE event names are stable:

```text
start
tool
budget
delta
done
error
```

## Browser UX

- The widget appears on Home, Asset Workspace, and Ops.
- Quick actions adapt to page context.
- Chat history is persisted per page context in browser local storage.
- Operators can clear history from the panel.
- Assistant bubbles can use browser Web Speech text-to-speech when supported.
- Vietnamese voices are preferred when available; speech availability and voice quality depend on the browser/OS.
- Client history is separate from server JSONL session records under the ignored runtime directory.

## Circuit Breakers And Retry

Ollama and Gemini have process-local circuit states:

- `closed`: requests run normally.
- `open`: provider calls are temporarily blocked.
- `half_open`: one probe is allowed after cooldown.

Success closes/resets the circuit; repeated failures open it. Process restart resets in-memory circuit state.

## Gemini Budget Guard

Versioned policy: `.gemini_budget_policy`.

| Guard | Default |
| --- | ---: |
| Monthly cap | 5.00 USD |
| Degrade threshold | 4.00 USD |
| Hard stop | 4.50 USD |
| Maximum monthly requests | 500 |
| Failure mode | `fail_closed` |

Ledger and state files live under ignored `runtime/gemini_budget/`. The estimate is an application guardrail, not an exact billing statement.

## Health And Ops

Use `GET /api/provider-health/llm` as the canonical active-provider endpoint. It exposes sanitized configuration status, model, stream/retry/timeout settings, circuit state, and Gemini budget status.

`/api/provider-health/ollama` and `/api/provider-health/gemini` are compatibility surfaces that currently reflect the active provider snapshot. Do not infer that the route suffix forces that provider.

The `/ops` page combines this status with lightweight readiness, deep canary diagnostics, summaries, and issues.

## Runtime Data

Generated data is ignored:

- `runtime/tifa_chat_sessions/*.jsonl`
- `runtime/gemini_budget/gemini_monthly_ledger.csv`
- `runtime/gemini_budget/gemini_budget_state.json`

There is no database or Redis. Runtime files are single-host operational artifacts.

## Security Guarantees

- Provider keys and smoke tokens stay server-side.
- Client-facing errors pass through redaction.
- Tests and smoke scripts assert that known test secrets do not appear in JSON or SSE.
- Tool calls are allowlisted.
- No dynamic user-provided provider URL is executed.
- Tifa is observation and explanation tooling only.

## Historical Notes

See [Phase 1/1.1](tifa-assistant-phase1.md) and [Phase 2](tifa-assistant-phase2.md) for rollout history. This document is the current provider-neutral reference.
