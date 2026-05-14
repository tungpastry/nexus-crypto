#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if ! command -v gemini >/dev/null 2>&1; then
 echo "ERROR: gemini CLI not found in PATH"
 echo "Install/login Gemini CLI first, then retry."
 exit 1
fi
if [[ ! -f "bootstrap.txt" ]]; then
 echo "ERROR: bootstrap.txt not found at repo root"
 exit 1
fi
# Canonical Gemini CLI DevOps entrypoint for Nexus Crypto
# Usage:
#   ./bin/nxgcli.sh "inspect repo and propose next safe slice"
#   ./bin/nxgcli.sh @prompts/some_task.txt
exec gemini --context @bootstrap.txt "$@"
