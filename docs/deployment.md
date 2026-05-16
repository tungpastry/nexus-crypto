# Deployment (Ubuntu Server)

This project is deployed on Ubuntu Server with `systemd` and a deterministic install flow.

## Reference Production Target

- Repo path: `/home/nexus/projects/nexus-crypto`
- Service: `nexus-crypto.service`
- Port: `3200`
- Health endpoint: `http://127.0.0.1:3200/api/provider-health`
- Deep health endpoint: `http://127.0.0.1:3200/api/provider-health/deep`
- Gemini health endpoint: `http://127.0.0.1:3200/api/provider-health/gemini`
- Version endpoint: `http://127.0.0.1:3200/api/version`
- Tifa smoke command: `npm run smoke:tifa`

## Preferred Deploy Flow

Use the deploy script in this repository:

```bash
cd /home/nexus/projects/nexus-crypto

NEXUS_CRYPTO_REPO_DIR="/home/nexus/projects/nexus-crypto" \
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" \
NEXUS_CRYPTO_SERVICE="nexus-crypto.service" \
NEXUS_CRYPTO_BRANCH="main" \
./scripts/deploy_ubuntu_server.sh
```

The script runs:

1. Dirty-tree guard.
2. `git fetch` + fast-forward pull.
3. Release metadata injection to `.env.production.local` (managed block only).
4. `npm ci` for deterministic dependency install.
5. `npm run lint`, `npm run test`, `npm run build`.
6. `npm audit` (informational, non-blocking in script).
7. `systemd` restart.
8. Wait-loop on `/api/provider-health`.
9. `/api/version` metadata verification.
10. Smoke test gate.
11. Final clean-tree check.

## Manual Pull/Build/Restart Flow

Use this when intentionally bypassing the deploy script for a controlled debug deploy:

```bash
cd /home/nexus/projects/nexus-crypto

git fetch origin
git checkout main
git pull origin main

npm ci

git diff --check
npm run lint
npm test
npm run build

sudo systemctl restart nexus-crypto.service
sleep 3
sudo systemctl status nexus-crypto.service --no-pager -l
```

Then run smoke:

```bash
cd /home/nexus/projects/nexus-crypto

export NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200"
export NEXUS_SMOKE_AUTH_TOKEN="$(grep '^NEXUS_SMOKE_AUTH_TOKEN=' .env.production.local | cut -d= -f2-)"

npm run smoke:tifa
```

## Why `npm ci` (not `npm install`) in Production

`npm ci` installs exactly from `package-lock.json` and avoids lockfile drift during deploy. This keeps deploys reproducible and prevents post-deploy dirty working trees.

Use `npm install` only for local development or intentional dependency updates.

## Auth-Aware Smoke Behavior

When LAN auth is enabled (`NEXUS_AUTH_ENABLED=1`), provide `NEXUS_SMOKE_AUTH_TOKEN` so protected market-data and Tifa tool APIs can be checked by smoke:

```bash
export NEXUS_SMOKE_AUTH_TOKEN="<token>"
```

Public deploy/readiness routes remain available:

- `/api/version`
- `/api/provider-health`
- `/api/provider-health/deep`
- `/api/provider-health/gemini`

## Gemini Live Provider Setup

Tifa can run in tool-only mode when no Gemini key is configured. To enable the live Gemini provider, add `GEMINI_API_KEY` to `.env.production.local` without printing the value.

Secure input example:

```bash
cd /home/nexus/projects/nexus-crypto

read -s -p "Paste GEMINI_API_KEY: " GEMINI_API_KEY_VALUE
echo
export GEMINI_API_KEY_VALUE
```

Then update `.env.production.local` using a redaction-safe script or editor. Recommended live settings:

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

Restart and check Gemini health:

```bash
sudo systemctl restart nexus-crypto.service
sleep 3
curl -sS http://127.0.0.1:3200/api/provider-health/gemini | python3 -m json.tool
```

Expected live indicators:

```json
{
  "configured": true,
  "status": "ok",
  "circuit": { "state": "closed" },
  "budget": { "status": "ok" }
}
```

## Manual Validation Commands

```bash
sudo systemctl status nexus-crypto.service --no-pager -l
curl -sS http://127.0.0.1:3200/api/provider-health | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/provider-health/deep | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/provider-health/gemini | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/version | python3 -m json.tool
```

Smoke with auth token:

```bash
cd /home/nexus/projects/nexus-crypto

export NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200"
export NEXUS_SMOKE_AUTH_TOKEN="$(grep '^NEXUS_SMOKE_AUTH_TOKEN=' .env.production.local | cut -d= -f2-)"

npm run smoke:tifa
```

Expected Phase 2 PASS lines:

```text
TIFA_PROVIDER_HEALTH_EXPLAINER=PASS
TIFA_DEEP_HEALTH_EXPLAINER=PASS
TIFA_OPS_SUMMARY=PASS
TIFA_TOOL_ORCHESTRATOR=PASS
TIFA_PHASE2_NO_SECRET_LEAK=PASS
```

Use `/api/provider-health` for frequent readiness checks. Use `/api/provider-health/deep` for manual multi-asset diagnostics.

## Rollback Notes

Rollback should be explicit and controlled:

1. Identify previous stable commit.
2. Checkout/reset only with explicit approval.
3. Run `npm ci`.
4. Run `npm run lint`, `npm test`, and `npm run build`.
5. Restart service.
6. Re-check health + smoke.

Avoid `git reset --hard` unless explicitly approved for a rollback operation.

## Security Notes

- Do **not** run `npm audit fix --force` in production.
- Do not commit `.env.production.local` or any secret.
- Keep auth secrets/token values out of logs.
- Do not print `GEMINI_API_KEY` or `NEXUS_SMOKE_AUTH_TOKEN`.
- Keep `npm run smoke:tifa` no-secret checks passing after every Tifa/Gemini change.
- Do not bypass Gemini budget guard, circuit breaker, or API auth protections.
