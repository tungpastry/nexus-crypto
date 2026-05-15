# Next.js Upgrade Review - P8

## Goal

- Upgrade Next.js from 16.0.0 to 16.2.6.
- Resolve remaining Next critical and bundled PostCSS moderate vulnerabilities where possible without `npm audit fix --force`.
- Check whether bundled baseline-browser-mapping notice is gone.

## Before

- next version: 16.0.0
- eslint-config-next version: 16.0.0
- react version: 19.2.0
- react-dom version: 19.2.0
- npm audit count: 2 total
  - critical: 1 (`next`)
  - moderate: 1 (`postcss` bundled under Next)
- Baseline notice status: present in `npm run dev` / `npm run build` because Next 16.0.0 bundled an older compiled Browserslist/Baseline copy.
- Audit report: `reports/npm-audit-before-next-upgrade-20260515-175017.json`

## After

- next version: 16.2.6
- eslint-config-next version: 16.2.6
- react version: 19.2.0
- react-dom version: 19.2.0
- npm audit count: 2 total
  - critical: 0
  - high: 0
  - moderate: 2 (`next`, `postcss` bundled under Next)
- Baseline notice status: gone from `npm run dev` and `npm run build` output.
- Audit report: `reports/npm-audit-after-next-upgrade-20260515-175124.json`

## Validation

- `npm install`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npm audit`: still reports 2 moderate vulnerabilities.
- `npm run start -- -p 3200`: PASS.
- Runtime readiness loop against `/api/provider-health`: `APP_READY=PASS`.
- `NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" ./scripts/smoke_crypto_assets_contract.sh`: PASS.

Smoke result:

```text
CRYPTO_PRICE_BTCUSDT=PASS
CRYPTO_KLINES_BTCUSDT=PASS
CRYPTO_PRICE_ETHUSDT=PASS
CRYPTO_KLINES_ETHUSDT=PASS
CRYPTO_PRICE_BNBUSDT=PASS
CRYPTO_KLINES_BNBUSDT=PASS
CRYPTO_PRICE_XRPUSDT=PASS
CRYPTO_KLINES_XRPUSDT=PASS
CRYPTO_PRICE_SOLUSDT=PASS
CRYPTO_KLINES_SOLUSDT=PASS
CRYPTO_PRICE_TRXUSDT=PASS
CRYPTO_KLINES_TRXUSDT=PASS
CRYPTO_PRICE_SHIBUSDT=PASS
CRYPTO_KLINES_SHIBUSDT=PASS
CRYPTO_PRICE_DOGEUSDT=PASS
CRYPTO_KLINES_DOGEUSDT=PASS
NEGATIVE_UNSUPPORTED_SYMBOL=PASS
NEGATIVE_UNSUPPORTED_TIMEFRAME=PASS
PROVIDER_HEALTH=PASS
```

## Decision

`MANUAL_REVIEW_REQUIRED`

Ship status:

- The Next critical advisory is resolved by moving from 16.0.0 to 16.2.6.
- The baseline-browser-mapping notice is resolved for dev/build.
- Build, lint, start, and smoke pass.
- `npm audit` still reports 2 moderate vulnerabilities because the registry metadata marks Next 16.2.6 as depending on vulnerable bundled `postcss@8.4.31`.

Remaining audit details:

| Severity | Package | Dependency path | npm suggested fix | Breaking change | Recommendation |
|---|---|---|---|---|---|
| moderate | `next` | root -> `next@16.2.6` | `next@9.3.3` via `npm audit fix --force` | Yes, major downgrade | `DEFER` |
| moderate | `postcss` | root -> `next@16.2.6` -> bundled `postcss@8.4.31` | `next@9.3.3` via `npm audit fix --force` | Yes, major downgrade | `DEFER` |

## Notes

- Confirmed no `npm audit fix --force` was used.
- React and React DOM were not changed.
- No app logic files were modified.
- API behavior files were not modified.
- Nexus score, checklist, and TradingView chart logic were not modified.
- Local `node_modules` had a stale nested `minimatch` install artifact during validation; rebuilding that generated dependency folder with `npm install` restored lint successfully without source changes.
