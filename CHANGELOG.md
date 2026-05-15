# Changelog

## [Unreleased]

### Added

- P11: LAN local credential authentication.
- P11: HTTP-only signed session cookie.
- P11: Login, logout, and auth status routes.
- P11: Middleware UI page protection for `/` and `/asset/*`.
- P11: Password hash generator for local auth setup.
- P12: Protected selected market-data API routes when LAN auth is enabled.
- P12: Smoke/deploy bearer token support for protected API checks.
- P12: Login attempt rate limiting.
- P12: Session rotation through the auth status route.

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
