# Changelog

## [Unreleased]

### Added

- Public repository documentation set:
  - `docs/architecture.md`
  - `docs/api-reference.md`
  - `docs/deployment.md`
  - `docs/troubleshooting.md`
- Community and metadata files:
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `LICENSE`
- P11: LAN local credential authentication.
- P11: HTTP-only signed session cookie.
- P11: Login, logout, and auth status routes.
- P11: Middleware UI page protection for `/` and `/asset/*`.
- P11: Password hash generator for local auth setup.
- P12: Protected selected market-data API routes when LAN auth is enabled.
- P12: Smoke/deploy bearer token support for protected API checks.
- P12: Login attempt rate limiting.
- P12: Session rotation through the auth status route.
- Provider health deep endpoint for multi-asset Binance diagnostics.
- Nexus Algorithm v1.1 with ATR volatility, volume confirmation, support/resistance context, optional MTF agreement, and workflow state output.
- TifaWidget Assistant Phase 1:
  - floating chat widget on Home, Asset Workspace, and Ops
  - `/api/tifa` and `/api/tifa/stream` (SSE pseudo-stream)
  - tool routes for market context, asset analysis, and Gemini budget status
  - Gemini provider gateway with tool-only fallback when key is missing
  - Gemini budget guard (5 USD/month policy, hard stop, fail-closed ledger flow)
  - Gemini assistant status panel on `/ops`
- TifaWidget Assistant Phase 1.1 hardening:
  - contract coverage for `/api/tifa` and `/api/tifa/stream`
  - no-secret leakage tests for JSON/SSE/provider-health outputs
  - Gemini stream path with safe fallback to tool-only pseudo stream
  - Gemini circuit breaker with open/half-open/closed states and health exposure

### Changed

- Next.js convention migration: root `middleware.ts` replaced by `proxy.ts`.
- Ubuntu production deploy dependency install is deterministic via `npm ci`.
- Branding/UI polish landed:
  - logo banner in README
  - Nexus logo/favicon asset refresh
  - reusable Nexus SaaS footer
  - Black Pink Glass SaaS 2026 visual rollout

## 2026-05-15 - Nexus Crypto Hardening Batch

### Added

- P1/P2: Split Top 10 Nexus Universe home from per-asset workspace pages.
- P3: Binance price and kline TTL cache with stale fallback.
- P4: Provider health checks now inspect the real market snapshot route and cache status.
- P6: Negative smoke tests for unsupported symbols and timeframes.
- P9: Vitest unit tests for server cache and Nexus Algorithm.
- P9: `/api/version` endpoint.
- P9: Ubuntu deploy script with health wait-loop and smoke gate.
- P9: GitHub Actions CI.
- P10: Version metadata injection through generated production env.
- P10: Release/version badge on the home page.
- P10: Release checklist.

### Changed

- P5: Removed unused Chart.js stack; TradingView remains the primary chart engine.
- P8: Upgraded Next.js from 16.0.0 to 16.2.6.
- P2: Nexus Score is direction-aware for bull, bear, and neutral contexts.
- Home page stays focused on market overview; chart/checklist workflow lives in `/asset/[id]`.

### Fixed

- P1: Hardened localStorage parsing and TradingView runtime lifecycle.
- P3/P4: Reduced Binance/CoinGecko pressure with server cache and persistent market snapshot fallback.
- P6: Smoke coverage now catches allowlist regressions.

### Security

- P7/P8: npm audit reviewed; critical Next advisory resolved.
- Remaining: 2 moderate bundled Next/PostCSS advisories documented; no force downgrade.

### Ops

- Ubuntu Server deploy target: `/home/nexus/projects/nexus-crypto`.
- Service: `nexus-crypto.service`.
- Port: `3200`.
