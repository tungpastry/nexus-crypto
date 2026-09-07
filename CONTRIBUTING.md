# Contributing

Thanks for helping improve Nexus Crypto SaaS 2026.

## Setup

`Node.js 22 LTS` is the supported contributor baseline.

```bash
npm install
npm run dev
```

## Branch Naming

- `feature/...`
- `fix/...`
- `chore/...`
- `docs/...`

## Commit Convention

- `feat(scope): ...`
- `fix(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`

## Validation Before PR

```bash
git diff --check
npm run assets:check
npm run lint
npm run test
npm run build
npm audit
```

Documentation-only patches should still run `git diff --check` and validate relative Markdown links. Run the full gate whenever metadata or executable files change.

## Asset Catalog Changes

- Treat `app/config/assets.generated.json` as generated output.
- Update reviewed mappings in `scripts/asset-overrides.json`, then run `npm run assets:refresh`.
- Review membership, capability, tick-size, and canary changes before committing.
- Never refresh the catalog as an incidental part of an unrelated patch.
- Keep deep health scoped to the explicitly marked eight canaries unless a dedicated design changes that contract.

## Do Not Commit

- `.env*`
- `node_modules/`
- build outputs (`.next/`, `out/`)
- secrets, tokens, private keys
- generated runtime data under `runtime/` and `.runtime/`

## Scope and Safety Notes

- Keep patches focused and reviewable.
- Avoid unrelated refactors.
- Preserve API/auth/deploy contracts unless explicitly requested.
- Keep Tifa tools allowlisted and provider credentials server-side.
- Do not run `npm audit fix --force`.
- Nexus Crypto is a market-data dashboard and does not provide trading advice.

See the [documentation index](docs/index.md) for architecture, API, catalog, algorithm, assistant, and operations guides.
