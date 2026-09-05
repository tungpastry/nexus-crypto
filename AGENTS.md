# AGENTS.md — nexus-crypto

Next.js 16 + React 19 + TypeScript market-data dashboard (Top 10 Nexus Universe). No trade execution, no custody, no financial advice copy.

## Commands

- Dev (non-default port): `npm run dev` → `http://localhost:3200`
- Validate in this order (matches CI + `CONTRIBUTING.md`): `npm run lint` → `npm run test` → `npm run build`
- Single test file: `npx vitest run <path>` (e.g. `npx vitest run app/lib/auth/api.test.ts`)
- Node 22 LTS required (prod ref `v22.18.0`). Prod installs with `npm ci`; local dev uses `npm install`.
- Tifa smoke (needs running app): `NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" NEXUS_SMOKE_AUTH_TOKEN="$(grep '^NEXUS_SMOKE_AUTH_TOKEN=' .env.production.local | cut -d= -f2-)" npm run smoke:tifa`
- Auth hash helper: `npm run auth:hash`

## Architecture (not obvious from filenames)

- `proxy.ts` (root) is the auth gate — Next.js 16 convention, not `middleware.ts`. `/` `/asset/*` `/ops` redirect to `/login` when `NEXUS_AUTH_ENABLED=1`; `/api/*` stays public at proxy level (per-route auth via bearer/session instead).
- Entry points: `app/page.tsx` (overview), `app/asset/[id]/page.tsx` (workspace), `app/ops/page.tsx` (diagnostics).
- Source of truth for assets: `app/config/assets.ts` (`NEXUS_ASSETS`, `findAssetById`). Stablecoins (USDT/USDC) are market-only: `enableChart/enableMA/enableChecklist = false` — smoke and Tifa tests assert `analysis_enabled: false, mode: "market-only"`.
- Market data: `app/lib/binance.ts` + `app/lib/serverCache.ts` + `app/api/market-snapshot/*` (cache/stale fallback). Decision logic: `app/lib/nexusAlgorithm.ts` → states `No Trade | Watch | Ready | Confirmed`.
- Tifa assistant libs: `tifa-core/` (chat), `tifa-nexus/` (intent/market+asset context), `tifa-provider-gateway/` (Gemini + circuit breaker + redaction), `tifa-tools/` (explainers/orchestrator), `tifa-runtime/` (session/config), `gemini-budget/` (guard/ledger). Prompt: `prompts/TIFA_NEXUS_CRYPTO_RUNTIME.md`, runtime dir `runtime/` (gitignored).
- Deploy: `scripts/deploy_ubuntu_server.sh` = dirty guard → pull `--ff-only` → `npm ci` → lint/test/build → systemd restart → health wait-loop → smoke. Never run deploy script from an agent session without explicit request.

## Env & secrets

- Never commit or print `.env*` (gitignored: `.env`, `.env*.local`). Never `cat` `.env.production.local`; use `grep '^KEY='` for single values only.
- Live Gemini needs `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3-flash-preview`, `GEMINI_STREAM_ENABLED=1`, `GEMINI_CIRCUIT_BREAKER_ENABLED=1`. No-secret-leak is contract-tested (`noSecretLeak.test.ts`, smoke `TIFA_PHASE2_NO_SECRET_LEAK`) — never interpolate keys/tokens into responses, SSE events, or logs.
- Auth env: `NEXUS_AUTH_ENABLED/USERNAME/PASSWORD_HASH/SECRET`, `NEXUS_SMOKE_AUTH_TOKEN`. Do not run `npm audit fix --force` (see `docs/troubleshooting.md`).

## Conventions

- Path alias: `@/*` → repo root (`tsconfig.json`).
- ESLint relaxations in `eslint.config.mjs`: `@typescript-eslint/no-explicit-any: off`, `react-hooks/set-state-in-effect: off`. Turbopack NFT tracing warning from runtime config import chain is a known roadmap item — don't chase it.
- Branch `feature|fix|chore|docs/...`, commits `feat|fix|docs|chore(scope): ...`. Keep patches focused; preserve API/auth/deploy contracts.
- Docs that matter: `docs/api-reference.md`, `docs/auth-lan-local.md`, `docs/deployment.md`, `docs/troubleshooting.md` (proxy convention check, dirty-repo and `degraded` health triage).
