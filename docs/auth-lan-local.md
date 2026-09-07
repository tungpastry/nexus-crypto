# LAN Local Authentication

Nexus Crypto supports a simple LAN-local credential gate for dashboard pages. It is disabled by default and does not use OAuth, a database, or NextAuth.

## Environment variables

```text
NEXUS_AUTH_ENABLED=1
NEXUS_AUTH_USERNAME=admin
NEXUS_AUTH_PASSWORD_HASH=scrypt:<salt_hex>:<hash_hex>
NEXUS_AUTH_SECRET=<random hex secret>
NEXUS_AUTH_COOKIE_NAME=nexus_session
NEXUS_AUTH_SESSION_TTL_SECONDS=86400
NEXUS_AUTH_COOKIE_SECURE=0
NEXUS_SMOKE_AUTH_TOKEN=<random smoke token>
NEXUS_AUTH_LOGIN_MAX_ATTEMPTS=5
NEXUS_AUTH_LOGIN_WINDOW_SECONDS=300
NEXUS_AUTH_LOGIN_LOCK_SECONDS=300
NEXUS_AUTH_SESSION_ROTATION_ENABLED=1
```

Defaults:

- `NEXUS_AUTH_ENABLED` must be `1` to enable auth.
- `NEXUS_AUTH_COOKIE_NAME` defaults to `nexus_session`.
- `NEXUS_AUTH_SESSION_TTL_SECONDS` defaults to `86400`.
- `NEXUS_AUTH_COOKIE_SECURE` defaults to off for LAN HTTP. Set it to `1` only when serving over HTTPS.
- `NEXUS_SMOKE_AUTH_TOKEN` is optional, but required for deploy smoke tests when auth is enabled.
- Login rate limits default to 5 failed attempts per 300 seconds, with a 300 second lock.
- Session rotation is enabled by default and can be disabled with `NEXUS_AUTH_SESSION_ROTATION_ENABLED=0`.

## Generate credentials

Generate a password hash:

```bash
node scripts/generate_auth_password_hash.mjs "your-password"
```

Generate a session secret:

```bash
openssl rand -hex 32
```

Generate a smoke/deploy token:

```bash
openssl rand -hex 32
```

Example `.env.production.local`:

```text
NEXUS_AUTH_ENABLED=1
NEXUS_AUTH_USERNAME=admin
NEXUS_AUTH_PASSWORD_HASH=scrypt:...
NEXUS_AUTH_SECRET=...
NEXUS_SMOKE_AUTH_TOKEN=...
NEXUS_AUTH_COOKIE_NAME=nexus_session
NEXUS_AUTH_SESSION_TTL_SECONDS=86400
```

`.env.production.local` is ignored by git. The deploy script preserves these auth variables and only updates its managed release metadata block.

## Restart and test

Restart the service:

```bash
sudo systemctl restart nexus-crypto.service
```

Open the login page:

```text
http://192.168.1.30:3200/login
```

Auth protects UI pages:

- `/`
- `/asset/*`
- `/ops`

UI protection is enforced by root [`proxy.ts`](../proxy.ts) (Next.js proxy convention), not the deprecated `middleware.ts` file convention.

These routes remain public for deploy, readiness, and login workflows:

- `/api/version`
- `/api/provider-health`
- `/api/provider-health/deep`
- `/api/provider-health/llm`
- `/api/provider-health/ollama`
- `/api/provider-health/gemini`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`

## P12 API Protection

When `NEXUS_AUTH_ENABLED=1`, selected market data APIs require either a valid browser session cookie or:

```text
Authorization: Bearer <NEXUS_SMOKE_AUTH_TOKEN>
```

Protected APIs:

- `/api/crypto-price`
- `/api/crypto-klines`
- `/api/market-snapshot`
- `/api/btc-price`
- `/api/btc-klines`
- `/api/tifa`
- `/api/tifa/stream`
- `/api/tifa-tools/market-context`
- `/api/tifa-tools/asset-analysis`
- `/api/tifa-tools/budget-status`
- `/api/tifa-tools/provider-health-explainer`
- `/api/tifa-tools/deep-health-explainer`
- `/api/tifa-tools/ops-summary`
- `/api/tifa-tools/orchestrate`

Auth disabled mode keeps these APIs public for local development.

The root proxy treats all `/api/*` paths as public at the routing layer. Protection for the list above is enforced inside each route handler with `requireApiAuth`. This keeps health/version/auth endpoints public while preserving session/bearer checks on data and assistant surfaces.

Smoke with auth enabled:

```bash
NEXUS_SMOKE_AUTH_TOKEN="..." \
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" \
./scripts/smoke_crypto_assets_contract.sh
```

## Login rate limit

Failed login attempts are tracked in memory by client IP and normalized username. Configure with:

```text
NEXUS_AUTH_LOGIN_MAX_ATTEMPTS=5
NEXUS_AUTH_LOGIN_WINDOW_SECONDS=300
NEXUS_AUTH_LOGIN_LOCK_SECONDS=300
```

The response after lock is HTTP `429` with `RATE_LIMITED`. A successful login clears failures for that IP/username key.

## Session rotation

`/api/auth/me` refreshes the HTTP-only session cookie when the session has less than half of its TTL remaining. This keeps active LAN sessions alive without changing the logout behavior.

Set `NEXUS_AUTH_COOKIE_SECURE=1` only when the application is served over HTTPS. The current reference deployment is LAN HTTP; public tunnel configuration is outside this repository's current deployment baseline.
