# Nexus Crypto Documentation

This directory contains the current operating and engineering documentation for Nexus Crypto. The product is a market-data and decision-support dashboard: it does not execute trades, custody funds, or provide financial recommendations.

## Start Here

### Product users

- [README](../README.md): product overview, screenshots, features, and quick start.
- [Asset Catalog](asset-catalog.md): what the Top 100 universe contains and why some workspaces are market-only.
- [Nexus Algorithm](nexus-algorithm.md): how Decision Matrix metrics, rules, score, risk, and workflow state are calculated.
- [Tifa Assistant](tifa-assistant.md): grounded tools, providers, streaming, browser history, and speech.

### Contributors

- [Architecture](architecture.md): runtime boundaries and data flow.
- [API Reference](api-reference.md): routes, authentication, response contracts, and errors.
- [Contributing](../CONTRIBUTING.md): setup, branch discipline, and required checks.
- [LAN Local Authentication](auth-lan-local.md): page and API protection.

### Operators

- [Deployment](deployment.md): Ubuntu Server deployment and service validation.
- [Release Checklist](release-checklist.md): pre-deploy and post-deploy gates.
- [Troubleshooting](troubleshooting.md): provider, auth, catalog, assistant, and service diagnostics.

## Historical Tifa Notes

- [Tifa Phase 1 and 1.1](tifa-assistant-phase1.md)
- [Tifa Phase 2](tifa-assistant-phase2.md)

Those files preserve rollout history. Use [Tifa Assistant](tifa-assistant.md) for the current provider-neutral architecture.

## Source Of Truth

Documentation describes the committed runtime. When a value can change through catalog refresh or deployment, verify it against:

- `app/config/assets.generated.json` for catalog membership and capability counts.
- `package.json` for framework and dependency versions.
- `.env.example` for non-secret environment contracts.
- `/api/version` for the deployed commit/build.
- `/api/provider-health/llm` for the active assistant provider.

Never add real credentials, tokens, private network secrets, or `.env.production.local` contents to documentation.
