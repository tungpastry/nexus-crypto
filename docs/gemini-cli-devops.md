# Gemini CLI DevOps Agent

## Purpose

This document describes the local Gemini CLI DevOps layer for Nexus Crypto SaaS 2026.

This layer is for repository maintenance only. It is not a runtime trading assistant, not a financial advisor, and not a trade execution system.

## Current Baseline

- Repository: `tungpastry/nexus-crypto`
- Product: Nexus Crypto SaaS 2026
- Runtime: Next.js 16 App Router
- Production reference: Ubuntu Server, port `3200`, service `nexus-crypto.service`
- DevOps context update commit: `fce6b64e92a6acb404a7272aa96fef1cae3a11fb`

Commit `fce6b64e92a6acb404a7272aa96fef1cae3a11fb` updated:

- `bin/nxgcli.sh`
- `bootstrap.txt`
- `load_context.txt`
- `system_prompt.txt`
- `package-lock.json`

## Entrypoint

Canonical command:

```bash
cd /home/nexus/projects/nexus-crypto
./bin/nxgcli.sh "inspect repo and propose next safe slice"
```

The wrapper checks that Gemini CLI is installed and that `bootstrap.txt` exists, then executes:

```bash
gemini --context @bootstrap.txt "$@"
```

## Context Chain

```text
bin/nxgcli.sh
→ bootstrap.txt
→ load_context.txt
→ system_prompt.txt
```

### `bootstrap.txt`

Defines repository identity, product scope, allowed work areas, hard boundaries, Phase 2 context, and the slice workflow.

Important constraints:

- do not fabricate command output
- do not claim tests passed without actual output
- do not expose or print secrets
- do not modify credentials
- do not bypass auth
- do not bypass Gemini budget guard
- do not bypass no-secret leakage checks
- do not add trade execution behavior
- do not turn TifaWidget into a trading bot

### `load_context.txt`

Defines the selective repository context Gemini CLI should inspect first.

It includes:

- repo metadata
- Next.js app shell
- config files
- API routes
- Tifa Assistant routes
- Tifa core/libs
- UI components
- documentation
- smoke/deploy scripts

It explicitly warns not to load `.env` or print secrets.

### `system_prompt.txt`

Defines the Gemini CLI role as a DevOps-aware repository agent:

- Next.js architect
- TypeScript/API contract reviewer
- testing and smoke-contract assistant
- safe Git workflow assistant

It defines API contract rules, UI contract rules, security rules, ops awareness, allowed Git operations, and validation policy.

## Slice Workflow

Every Gemini CLI task should follow:

```text
Inspect → Plan → Implement → Harden → Close
```

### Inspect

- identify exact files
- verify current behavior from file contents
- do not guess paths

### Plan

- propose minimal safe slice
- list files to change
- list validation commands

### Implement

- produce scoped patch only
- avoid unrelated changes

### Harden

- add validation, smoke test, contract test, or error handling when relevant
- preserve backward compatibility

### Close

- summarize changed files
- state validation commands
- state remaining risks
- recommend commit message

## Safe Work Areas

Gemini CLI may inspect and improve:

- `app/api/`
- `app/components/`
- `app/config/`
- `app/lib/`
- `docs/`
- `scripts/`
- `README.md`
- `CHANGELOG.md`
- release checklist
- deployment scripts and systemd notes when explicitly requested

## Protected Areas And Rules

Gemini CLI must not:

- print `.env`
- print `GEMINI_API_KEY`
- print `NEXUS_SMOKE_AUTH_TOKEN`
- expose server-only config to frontend
- bypass auth middleware/proxy
- bypass Gemini budget guard
- bypass circuit breaker
- remove no-secret leakage checks
- add trade execution behavior
- claim service status without command output
- claim deployment success without logs

## Tifa Phase 2 Safety Rules

Phase 2 includes:

- `/api/tifa-tools/provider-health-explainer`
- `/api/tifa-tools/deep-health-explainer`
- `/api/tifa-tools/ops-summary`
- `/api/tifa-tools/orchestrate`
- `app/lib/tifa-tools/orchestrator.ts`
- `docs/tifa-assistant-phase2.md`
- extended `scripts/smoke_tifa_assistant.sh`

When changing this area:

- preserve allowlist routing
- preserve intent-to-tool mapping behavior
- preserve partial failure warnings
- preserve no-secret leakage behavior
- add/update tests when changing orchestration logic
- update docs when changing endpoint contracts

## Validation Policy

Normal code changes:

```bash
npm run lint
npm run test
npm run build
```

Tifa/Gemini changes:

```bash
export NEXUS_CRYPTO_BASE_URL="http://127.0.0.1:3200"
export NEXUS_SMOKE_AUTH_TOKEN="$(grep '^NEXUS_SMOKE_AUTH_TOKEN=' .env.production.local | cut -d= -f2-)"
npm run smoke:tifa
```

Provider/API checks:

```bash
curl -sS http://127.0.0.1:3200/api/provider-health | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/provider-health/deep | python3 -m json.tool
curl -sS http://127.0.0.1:3200/api/provider-health/gemini | python3 -m json.tool
```

Production service check:

```bash
sudo systemctl status nexus-crypto.service --no-pager -l
```

## Safe Git Operations

Allowed for small, scoped work:

```bash
git status --short
git diff -- <file>
git add <file>
git commit -m "type(scope): message"
git push origin <branch>
```

Disallowed unless explicitly approved:

```bash
git reset --hard
git clean -fd
git rebase -i
git push --force
```

## Recommended Task Prompt Template

```text
Inspect Nexus Crypto repo at current main. Propose one minimal safe slice to improve <area>. Follow Inspect → Plan → Implement → Harden → Close. Do not print secrets. Preserve auth, Gemini budget guard, circuit breaker, no-secret checks, and API compatibility. List exact files to change and validation commands before patching.
```

## Current Recommended Next Slices

1. Add TTL cache for `/api/tifa-tools/ops-summary`.
2. Add orchestration warning visibility in `/ops` UI.
3. Add full chat intent-to-tool integration test.
4. Fix old Turbopack NFT tracing warning from runtime config import chain.
5. Expand CI depth for Tifa smoke where safe.
