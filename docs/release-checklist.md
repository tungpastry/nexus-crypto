# Nexus Crypto Release Checklist

## Pre-deploy

- [ ] Confirm branch is `main`.
- [ ] Confirm git status is clean.
- [ ] Review latest commit.
- [ ] Run `git diff --check`.
- [ ] Run `npm run assets:check`.
- [ ] For local development only: run `npm install` when dependencies changed.
- [ ] For release validation and production parity: run `npm ci`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `npm audit`; the current accepted baseline is zero known vulnerabilities.
- [ ] Run `bash -n` against deploy, crypto smoke, and Tifa smoke scripts.
- [ ] Confirm the catalog reports 100 assets, 52 Binance-enabled assets, and 8 deep-health canaries.
- [ ] Confirm every Binance-enabled asset has valid committed `binancePriceTickSize`.
- [ ] Confirm `proxy.ts` exists and `middleware.ts` does not exist.
- [ ] Confirm build has no middleware convention deprecation warning.
- [ ] Confirm build has no Turbopack NFT/dynamic-filesystem tracing warning.
- [ ] Confirm no secret or generated runtime file appears in the diff.

## Deploy

- [ ] Run `scripts/deploy_ubuntu_server.sh`.
- [ ] Confirm `APP_READY=PASS`.
- [ ] Confirm `/api/provider-health` is `ok` or acceptably `degraded`.
- [ ] Confirm `/api/provider-health/deep` reports `scope=core-canary` and 8 checks.
- [ ] Confirm `/api/provider-health/llm` reports the intended active provider/model.
- [ ] Confirm `/api/version` commit matches `git rev-parse HEAD`.
- [ ] Confirm `smoke_crypto_assets_contract.sh` passes.
- [ ] Confirm `npm run smoke:tifa` passes with the production environment without printing secrets.
- [ ] Confirm `.env.production.local` has `NEXUS_AUTH_ENABLED=1` if auth is desired.
- [ ] Confirm deploy script prints `DEPLOY_PASS=1`.

## Post-deploy

- [ ] Confirm systemd is active/running.
- [ ] Confirm port `3200` is listening.
- [ ] Confirm homepage loads.
- [ ] Confirm asset workspace loads.
- [ ] Confirm `/ops` loads and deep health refresh remains manual.
- [ ] Confirm `/login` loads.
- [ ] Confirm both Black Pink and Wikipedia Glass themes persist after reload.
- [ ] Confirm one Binance workspace uses tick-size precision in Live Feed and Kline Close.
- [ ] Confirm one stablecoin and one Binance-unavailable asset remain market-only.
- [ ] Confirm invalid login fails when auth is enabled.
- [ ] Confirm valid login redirects to dashboard when auth is enabled.
- [ ] Confirm unauthenticated `/` redirects to `/login` when auth is enabled.
- [ ] Confirm logout clears session.
- [ ] Confirm `/api/version` remains public.
- [ ] Confirm `/api/provider-health` remains public.
- [ ] Confirm the full provider-health route family remains public.
- [ ] Confirm smoke still passes.
- [ ] Confirm auth-enabled selected API without auth returns `401`.
- [ ] Confirm auth-enabled selected API works with bearer token.
- [ ] Confirm auth-enabled selected API works with session cookie.
- [ ] Confirm smoke passes with `NEXUS_SMOKE_AUTH_TOKEN`.
- [ ] Confirm wrong login attempts trigger `429` after configured threshold.
- [ ] Confirm correct login clears the rate-limit key.
- [ ] Confirm `/api/auth/me` can refresh/rotate a near-expiry session cookie.
- [ ] Confirm `VersionBadge` shows expected short commit.
- [ ] Confirm Tifa reports the selected Ollama/Gemini provider or grounded tool-only mode.
- [ ] Confirm no provider key/smoke token appears in JSON or SSE.
- [ ] Confirm git status is clean.
- [ ] Confirm Mac, `origin/main`, and Ubuntu resolve to the same commit.
- [ ] Record release in `CHANGELOG.md`.

## Rollback notes

- Identify previous stable commit.
- Use `git checkout` or `git reset` only with explicit approval.
- Run `npm ci`.
- Run `npm run assets:check`.
- Run `npm run build`.
- Restart service.
- Confirm health, version, crypto smoke, and Tifa smoke.
