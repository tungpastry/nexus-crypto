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

## 5) `npm audit` reports moderate vulnerabilities

Current project note:

- Some moderate advisories may remain in bundled upstream toolchain paths.

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
