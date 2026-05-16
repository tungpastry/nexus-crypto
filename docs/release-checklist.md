# Nexus Crypto Release Checklist

## Pre-deploy

- [ ] Confirm branch is `main`.
- [ ] Confirm git status is clean.
- [ ] Review latest commit.
- [ ] For local development only: run `npm install` when dependencies changed.
- [ ] For release validation and production parity: run `npm ci`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Review `npm audit`; confirm no critical vulnerabilities.
- [ ] Confirm `proxy.ts` exists and `middleware.ts` does not exist.
- [ ] Confirm build has no middleware convention deprecation warning.

## Deploy

- [ ] Run `scripts/deploy_ubuntu_server.sh`.
- [ ] Confirm `APP_READY=PASS`.
- [ ] Confirm `/api/provider-health` is `ok` or acceptably `degraded`.
- [ ] Confirm `/api/version` commit matches `git rev-parse HEAD`.
- [ ] Confirm `smoke_crypto_assets_contract.sh` passes.
- [ ] Confirm `.env.production.local` has `NEXUS_AUTH_ENABLED=1` if auth is desired.
- [ ] Confirm deploy script prints `DEPLOY_PASS=1`.

## Post-deploy

- [ ] Confirm systemd is active/running.
- [ ] Confirm port `3200` is listening.
- [ ] Confirm homepage loads.
- [ ] Confirm asset workspace loads.
- [ ] Confirm `/login` loads.
- [ ] Confirm invalid login fails when auth is enabled.
- [ ] Confirm valid login redirects to dashboard when auth is enabled.
- [ ] Confirm unauthenticated `/` redirects to `/login` when auth is enabled.
- [ ] Confirm logout clears session.
- [ ] Confirm `/api/version` remains public.
- [ ] Confirm `/api/provider-health` remains public.
- [ ] Confirm smoke still passes.
- [ ] Confirm auth-enabled selected API without auth returns `401`.
- [ ] Confirm auth-enabled selected API works with bearer token.
- [ ] Confirm auth-enabled selected API works with session cookie.
- [ ] Confirm smoke passes with `NEXUS_SMOKE_AUTH_TOKEN`.
- [ ] Confirm wrong login attempts trigger `429` after configured threshold.
- [ ] Confirm correct login clears the rate-limit key.
- [ ] Confirm `/api/auth/me` can refresh/rotate a near-expiry session cookie.
- [ ] Confirm `VersionBadge` shows expected short commit.
- [ ] Confirm git status is clean.
- [ ] Record release in `CHANGELOG.md`.

## Rollback notes

- Identify previous stable commit.
- Use `git checkout` or `git reset` only with explicit approval.
- Run `npm ci`.
- Run `npm run build`.
- Restart service.
- Confirm health and smoke tests.
