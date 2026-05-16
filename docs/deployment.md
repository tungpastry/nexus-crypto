# Deployment (Ubuntu Server)

This project is deployed on Ubuntu Server with `systemd` and a deterministic install flow.

## Reference Production Target

- Repo path: `/home/nexus/projects/nexus-crypto`
- Service: `nexus-crypto.service`
- Port: `3200`
- Health endpoint: `http://127.0.0.1:3200/api/provider-health`
- Version endpoint: `http://127.0.0.1:3200/api/version`

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

## Why `npm ci` (not `npm install`) in Production

`npm ci` installs exactly from `package-lock.json` and avoids lockfile drift during deploy. This keeps deploys reproducible and prevents post-deploy dirty working trees.

## Auth-Aware Smoke Behavior

When LAN auth is enabled (`NEXUS_AUTH_ENABLED=1`), provide `NEXUS_SMOKE_AUTH_TOKEN` so protected market-data APIs can be checked by smoke:

```bash
export NEXUS_SMOKE_AUTH_TOKEN="<token>"
```

Public deploy/readiness routes remain available:

- `/api/version`
- `/api/provider-health`

## Manual Validation Commands

```bash
sudo systemctl status nexus-crypto.service --no-pager
curl -sS http://127.0.0.1:3200/api/provider-health | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/provider-health/deep | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/version | python3 -m json.tool
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" ./scripts/smoke_crypto_assets_contract.sh
```

Use `/api/provider-health` for frequent readiness checks. Use `/api/provider-health/deep` for manual multi-asset diagnostics.

## Rollback Notes

Rollback should be explicit and controlled:

1. Identify previous stable commit.
2. Checkout/reset only with explicit approval.
3. Run `npm ci`.
4. Run `npm run build`.
5. Restart service.
6. Re-check health + smoke.

## Security Notes

- Do **not** run `npm audit fix --force` in production.
- Do not commit `.env.production.local` or any secret.
- Keep auth secrets/token values out of logs.
