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
```

Defaults:

- `NEXUS_AUTH_ENABLED` must be `1` to enable auth.
- `NEXUS_AUTH_COOKIE_NAME` defaults to `nexus_session`.
- `NEXUS_AUTH_SESSION_TTL_SECONDS` defaults to `86400`.
- `NEXUS_AUTH_COOKIE_SECURE` defaults to off for LAN HTTP. Set it to `1` only when serving over HTTPS.

## Generate credentials

Generate a password hash:

```bash
node scripts/generate_auth_password_hash.mjs "your-password"
```

Generate a session secret:

```bash
openssl rand -hex 32
```

Example `.env.production.local`:

```text
NEXUS_AUTH_ENABLED=1
NEXUS_AUTH_USERNAME=admin
NEXUS_AUTH_PASSWORD_HASH=scrypt:...
NEXUS_AUTH_SECRET=...
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

Auth v1 protects UI pages:

- `/`
- `/asset/*`

Auth v1 keeps API routes public for deploy, health, and smoke workflows:

- `/api/version`
- `/api/provider-health`
- `/api/crypto-price`
- `/api/crypto-klines`
- `/api/market-snapshot`
- `/api/btc-price`
- `/api/btc-klines`

Smoke remains public:

```bash
NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" ./scripts/smoke_crypto_assets_contract.sh
```
