# Ubuntu Server Deployment

## Reference Target

| Item | Value |
| --- | --- |
| Repository | `/home/nexus/projects/nexus-crypto` |
| Branch | `main` |
| Service | `nexus-crypto.service` |
| Port | `3200` |
| Node | 22 LTS (current reference `v22.18.0`) |
| Install | `npm ci` |

Operational endpoints:

- `http://127.0.0.1:3200/api/provider-health`
- `http://127.0.0.1:3200/api/provider-health/deep`
- `http://127.0.0.1:3200/api/provider-health/llm`
- `http://127.0.0.1:3200/api/version`

## Preferred Deploy

Only deploy from a clean Ubuntu working tree:

```bash
cd /home/nexus/projects/nexus-crypto
git status --short

NEXUS_CRYPTO_REPO_DIR="/home/nexus/projects/nexus-crypto" \
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" \
NEXUS_CRYPTO_SERVICE="nexus-crypto.service" \
NEXUS_CRYPTO_BRANCH="main" \
./scripts/deploy_ubuntu_server.sh
```

The script performs:

1. Branch and dirty-tree guard.
2. Fetch and fast-forward-only pull.
3. Managed release metadata update in ignored `.env.production.local`.
4. Deterministic `npm ci`.
5. Dependency audit output.
6. Lint, tests, and production build.
7. `systemd` restart.
8. Readiness wait loop.
9. Version/commit verification.
10. Top 100 crypto smoke.
11. Final clean-tree check.

Successful output includes:

```text
APP_READY=PASS
VERSION_METADATA=PASS
NEXUS_ASSET_COUNT=100
NEXUS_DEEP_HEALTH_CANARIES=8
DEPLOY_PASS=1
```

The Tifa smoke is run separately because it requires the service environment and, when auth is enabled, the smoke token.

## Production Environment

Do not commit or print `.env.production.local`. The deploy script preserves application/auth/provider values and replaces only its managed release metadata block.

### LAN auth

See [LAN Local Authentication](auth-lan-local.md). Auth-disabled mode is supported, but the production reference can enable it with a signed session and smoke bearer token.

### Ollama primary

Current production provider:

```text
TIFA_ASSISTANT_ENABLED=1
TIFA_LLM_PROVIDER=ollama
TIFA_LLM_FALLBACK_ORDER=ollama
OLLAMA_HOST=http://<ollama-host>:11434
OLLAMA_MODEL=gemma4:e4b-it-qat
OLLAMA_TIMEOUT_MS=20000
OLLAMA_RETRY_LIMIT=1
OLLAMA_STREAM_TIMEOUT_MS=25000
OLLAMA_STREAM_RETRY_LIMIT=1
OLLAMA_THINK=0
OLLAMA_KEEP_ALIVE=30m
OLLAMA_CIRCUIT_BREAKER_ENABLED=1
OLLAMA_CIRCUIT_FAILURE_THRESHOLD=3
OLLAMA_CIRCUIT_COOLDOWN_MS=60000
```

The Ubuntu host must be able to reach the Ollama host. Do not expose Ollama directly to the browser.

### Optional Gemini API

To select Gemini:

```text
TIFA_LLM_PROVIDER=gemini
TIFA_LLM_FALLBACK_ORDER=gemini
GEMINI_API_KEY=<server-side secret>
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_STREAM_ENABLED=1
```

The budget guard and circuit breaker remain required on this path. Store the key only in ignored/server-managed environment. The application does not use Gemini CLI.

Provider failure degrades to a grounded tool-only response. There is no automatic Ollama-to-Gemini or Gemini-to-Ollama failover.

## Manual Validation

```bash
sudo systemctl is-active nexus-crypto.service
sudo systemctl status nexus-crypto.service --no-pager -l
ss -ltnp | grep ':3200' || true

curl -sS http://127.0.0.1:3200/api/provider-health | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/provider-health/deep | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/provider-health/llm | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/version | python3 -m json.tool
```

Expected checks:

- lightweight provider status is `ok` or an understood temporary `degraded`.
- deep scope is `core-canary`, total checks are 8, and available symbols are 52 for the current catalog.
- LLM endpoint names the active provider/model without exposing credentials.
- version commit matches `git rev-parse HEAD`.

## Runtime Smoke

With auth disabled, scripts need no bearer token. With auth enabled, load the existing token into the process without echoing it.

```bash
cd /home/nexus/projects/nexus-crypto
export NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200"

./scripts/smoke_crypto_assets_contract.sh
npm run smoke:tifa
```

Crypto smoke validates Top 100 membership, representative Binance and market-only workspaces, invalid symbols/timeframes, public health/version, and deep-canary scope.

Tifa smoke validates market/asset context, stablecoin behavior, budget/provider health, Phase 2 explainers/orchestration, SSE events, and no-secret leakage.

## Manual Build (Debug Only)

Prefer the deploy script. For controlled diagnosis:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
npm ci
npm run assets:check
git diff --check
npm run lint
npm run test
npm run build
npm audit
```

Then restart and run all health/smoke checks. Manual builds do not automatically guarantee correct release metadata; verify `/api/version`.

## Rollback

1. Identify a reviewed stable commit.
2. Obtain explicit approval before changing the production checkout.
3. Move to the approved revision without discarding unknown work.
4. Run `npm ci`, catalog check, lint, test, build, and audit.
5. Restart service and run all health/version/smoke checks.

Do not use `git reset --hard` as routine recovery.

## Security And Hygiene

- Never run `npm audit fix --force`.
- Never commit or print credentials, provider URLs containing keys, session secrets, or smoke tokens.
- Keep `package-lock.json` committed and unchanged by deploy.
- Do not run `npm install` in the production repository.
- Keep generated `runtime/` and `.runtime/` files ignored.
- Stop on a failed validation/deploy gate; preserve diagnostics instead of masking the failure.
