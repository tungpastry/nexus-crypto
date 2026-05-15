# npm Audit Summary

Audit time: 2026-05-15 17:43:19 +07

Runtime:

- Node.js: v25.9.0
- npm: 11.12.1

Reports:

- Initial audit JSON: `reports/npm-audit-20260515-174233.json`
- Post-fix audit JSON: `reports/npm-audit-after-20260515-174259.json`

## Baseline Browser Mapping

Action taken:

- Ran `npm i baseline-browser-mapping@latest -D`.
- `baseline-browser-mapping` is now pinned in `devDependencies` as `^2.10.29`.

Result:

- `npm install` and `npm run lint` no longer print the baseline-browser-mapping notice.
- `npm run dev` and `npm run build` still print the notice because Next.js 16.0.0 uses a bundled compiled Browserslist/Baseline copy under `node_modules/next/dist/compiled/browserslist`. Updating the standalone package cannot replace that bundled copy.

Recommendation:

- `MANUAL_REVIEW_REQUIRED`: resolve with a deliberate Next.js patch upgrade, likely `next@16.2.6`, after release validation. Do not suppress the warning with environment variables unless the team explicitly accepts hiding the notice.

## Audit Before Safe Fix

Command:

```bash
npm audit --json > reports/npm-audit-20260515-174233.json
```

Total vulnerabilities before `package-lock-only` fix:

- Critical: 1
- High: 4
- Moderate: 5
- Low: 0
- Total: 10

| Severity | Package | Dependency path | Fix available | Breaking change | Recommendation |
|---|---|---|---|---|---|
| critical | `next` | root -> `next@16.0.0` | `next@16.2.6` | No semver-major, but outside exact pinned range `16.0.0` | `MANUAL_REVIEW_REQUIRED` |
| high | `axios` | root -> `axios` | true | No | `SAFE_AUTO_FIX` |
| high | `flatted` | root -> `eslint` -> `file-entry-cache` -> `flat-cache` -> `flatted` | true | No | `SAFE_AUTO_FIX` |
| high | `minimatch` | root -> `eslint` -> `minimatch`; root -> `eslint-config-next` -> TypeScript ESLint chain -> `minimatch` | true | No | `SAFE_AUTO_FIX` |
| high | `picomatch` | root -> `eslint-config-next` -> `@next/eslint-plugin-next` -> `fast-glob` -> `micromatch` -> `picomatch`; TypeScript ESLint resolver chain -> `picomatch` | true | No | `SAFE_AUTO_FIX` |
| moderate | `ajv` | root -> `eslint` -> `ajv` | true | No | `SAFE_AUTO_FIX` |
| moderate | `brace-expansion` | root -> `eslint` -> `minimatch` -> `brace-expansion`; TypeScript ESLint chain -> `brace-expansion` | true | No | `SAFE_AUTO_FIX` |
| moderate | `follow-redirects` | root -> `axios` -> `follow-redirects` | true | No | `SAFE_AUTO_FIX` |
| moderate | `js-yaml` | root -> `eslint` -> `@eslint/eslintrc` -> `js-yaml` | true | No | `SAFE_AUTO_FIX` |
| moderate | `postcss` | root -> `next@16.0.0` -> bundled `postcss@8.4.31` | `next@16.2.6` | No semver-major, but outside exact pinned range `16.0.0` | `MANUAL_REVIEW_REQUIRED` |

## Safe Fix Applied

Command:

```bash
npm audit fix --package-lock-only
```

Result:

- Ran without `--force`.
- Updated package-lock resolutions only where npm could safely resolve within allowed ranges.
- Notable safe updates include `axios@1.16.1`, `follow-redirects@1.16.0`, `ajv@6.15.0`, `brace-expansion@1.1.14` / `2.1.0`, `flatted@3.4.2`, `js-yaml@4.1.1`, `minimatch@3.1.5` / `9.0.9`, and `picomatch@2.3.2` / `4.0.4`.

## Audit After Safe Fix

Command:

```bash
npm audit
```

Remaining vulnerabilities:

- Critical: 1
- High: 0
- Moderate: 1
- Low: 0
- Total: 2

| Severity | Package | Dependency path | Fix available | Breaking change | Recommendation |
|---|---|---|---|---|---|
| critical | `next` | root -> `next@16.0.0` | `next@16.2.6` | No semver-major, but requires changing exact pinned package version | `MANUAL_REVIEW_REQUIRED` |
| moderate | `postcss` | root -> `next@16.0.0` -> bundled `postcss@8.4.31` | `next@16.2.6` | No semver-major, but requires changing exact pinned package version | `MANUAL_REVIEW_REQUIRED` |

Defer rationale:

- `npm audit fix --package-lock-only` cannot update exact-pinned `next: "16.0.0"`.
- `npm audit` recommends `npm audit fix --force` for the remaining issues because it would rewrite the direct Next.js version.
- This phase explicitly avoids `npm audit fix --force` and avoids changing Next.js without a dedicated upgrade/QA pass.

Next recommended patch:

- Review and test `next@16.2.6` with the existing React 19.2.0 setup.
- If validation passes, ship a separate framework-security patch for Next.js.

## Validation

- `npm install`: PASS; still reports 2 remaining vulnerabilities from Next/PostCSS.
- `npm run lint`: PASS; no baseline-browser-mapping notice.
- `npm run build`: PASS; baseline-browser-mapping notice still appears from Next's bundled compiled dependency.

Smoke test:

- `NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200" ./scripts/smoke_crypto_assets_contract.sh`: PASS.
