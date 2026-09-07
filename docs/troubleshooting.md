# Troubleshooting

This guide covers common operational issues for Nexus Crypto SaaS 2026 on Ubuntu Server.

## 1) Health probe fails right after restart

Symptom:

- First `curl` to `/api/provider-health` fails immediately after restart.

Action:

- This can be normal during startup warmup.
- Use the deploy wait-loop behavior and wait for `APP_READY=PASS`.

## 2) `DEPLOY_RUNTIME_PASS_BUT_REPO_DIRTY=1`

Symptom:

- Deploy runtime checks passed, but repository is dirty afterward.

Action:

```bash
git status --short
git diff -- package-lock.json | sed -n '1,220p'
```

With current deploy flow (`npm ci`), lockfile drift should be rare. Inspect any non-ignored modified file before next deploy.

## 3) `package-lock.json` modified after deploy

Expected behavior now:

- Deploy script uses `npm ci`, which should not mutate lockfile.

If it still changes:

1. Confirm script version on server is up to date.
2. Confirm no manual `npm install` was run in production repo.
3. Inspect lock diff and investigate platform/tooling drift.

## 4) `/api/provider-health` returns `degraded`

Possible causes:

- Upstream provider instability or rate limit.
- Temporary network errors.
- Stale cache fallback in market snapshot path.

Actions:

```bash
curl -sS http://127.0.0.1:3200/api/provider-health | python3 -m json.tool
sudo journalctl -u nexus-crypto.service -n 120 --no-pager
```

Review `checks.market_snapshot`, `checks.market_snapshot_cache_status`, and `checks.market_snapshot_age_ms`.

## 5) `npm audit` reports vulnerabilities

Current project note:

- The reviewed dependency baseline currently passes `npm audit` with zero known advisories.
- A future advisory should be handled through a controlled dependency update and lockfile review.

Action:

- Do not run `npm audit fix --force`.
- Track advisories and resolve via controlled framework upgrades.

## 6) Service not listening on port 3200

Actions:

```bash
sudo systemctl status nexus-crypto.service --no-pager
sudo journalctl -u nexus-crypto.service -n 120 --no-pager
ss -ltnp | grep ':3200' || true
```

## 7) Auth-enabled smoke fails

When `NEXUS_AUTH_ENABLED=1`, protected market-data APIs require session or bearer token.

Actions:

1. Confirm `NEXUS_SMOKE_AUTH_TOKEN` is set in deploy environment.
2. Ensure smoke command receives token env.
3. Verify `/api/version` and `/api/provider-health` remain public.
4. Verify the Tifa/market request receives the bearer token without printing it.

## 8) Login redirect loop

Possible causes:

- Invalid `NEXUS_AUTH_SECRET`.
- Cookie configuration mismatch.
- Session TTL/time skew issues.

Actions:

1. Verify auth env values in `.env.production.local`.
2. Verify server time sync.
3. Check `/api/auth/me` response with browser cookie.

## 9) Proxy convention check

For Next.js 16+, auth gate should use root `proxy.ts`.

Verify:

```bash
test -f proxy.ts && echo "HAS_PROXY"
test ! -f middleware.ts && echo "NO_MIDDLEWARE_FILE"
```

## 10) Ollama is configured but Tifa falls back to tool-only

Check the canonical active-provider endpoint:

```bash
curl -sS http://127.0.0.1:3200/api/provider-health/llm | python3 -m json.tool
```

Inspect:

- `active_provider`, `configured`, and `model`.
- request/stream timeout and retry settings.
- circuit state and failure count.

Then confirm Ubuntu can reach the configured Ollama host. A cold model can exceed a short timeout; `OLLAMA_KEEP_ALIVE` and a provider warm-up reduce this. Do not expose the Ollama endpoint to browser code or print credentials from env files.

## 11) LLM circuit is open

An `open` circuit blocks repeated provider calls and returns grounded tool-only answers. It is process-local.

Actions:

1. Fix provider connectivity/model availability.
2. Wait for the configured cooldown; the next allowed request enters `half_open`.
3. Confirm a successful probe returns the circuit to `closed`.
4. Restarting the service resets in-memory circuit state, but should not replace root-cause diagnosis.

## 12) Gemini budget is degraded or blocked

Read the sanitized budget status:

```bash
curl -sS -H "Authorization: Bearer <smoke-token>" \
  http://127.0.0.1:3200/api/tifa-tools/budget-status | python3 -m json.tool
```

- `degraded`: projected spend crossed the configured degrade threshold; output may be constrained.
- `blocked`: projected spend reached the hard stop or the fail-closed guard could not establish safe state.

Do not edit ledger/state files casually or bypass the guard. Ollama local inference does not consume Gemini budget.

## 13) Catalog or market-only behavior is unexpected

```bash
npm run assets:check
node -e "const c=require('./app/config/assets.generated.json'); console.log(c.metadata)"
```

The current committed baseline is 100 assets, 52 Binance-enabled, 48 market-only, and 8 canaries. Catalog membership changes only through `npm run assets:refresh` and reviewed generated output.

For one asset inspect `marketOnlyReason`, `binanceSymbol`, feature flags, and `binancePriceTickSize`. Do not patch generated rows manually.

## 14) Binance price precision looks wrong

Live Feed and Decision Matrix use the asset's committed `PRICE_FILTER.tickSize`.

Actions:

1. Run `npm run assets:check`.
2. Confirm the asset has a valid `binancePriceTickSize`.
3. Remember Live Feed is ticker price (5-second cadence), while Matrix `Kline Close` is candle data (60-second cadence).
4. If Binance changed filters, regenerate and review the catalog rather than adding formatter exceptions.

## 15) Turbopack NFT tracing warning returns

The current Next.js 16.3.4 baseline builds without the previous dynamic-filesystem/NFT tracing warning. If it returns:

```bash
npm run build 2>&1 | tee /tmp/nexus-build.log
grep -Ei "NFT|unexpected file|Dynamic filesystem access" /tmp/nexus-build.log
```

Check runtime path resolution and preserve the existing Turbopack ignore annotation. Do not weaken budget/runtime path validation merely to silence tracing.

## 16) Tifa stream fails after partial output

If a provider fails after sending deltas, the server emits sanitized `STREAM_PROVIDER_ERROR` and closes the SSE response. It intentionally does not append a second tool-only answer to partial provider text.

If the provider fails before any delta, the route can pseudo-stream a grounded tool-only fallback. Use browser network tools and provider health to distinguish these cases.
