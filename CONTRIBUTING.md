# Contributing

Thanks for helping improve Nexus Crypto SaaS 2026.

## Setup

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
npm run lint
npm run test
npm run build
```

## Do Not Commit

- `.env*`
- `node_modules/`
- build outputs (`.next/`, `out/`)
- secrets, tokens, private keys

## Scope and Safety Notes

- Keep patches focused and reviewable.
- Avoid unrelated refactors.
- Preserve API/auth/deploy contracts unless explicitly requested.
- Nexus Crypto is a market-data dashboard and does not provide trading advice.
