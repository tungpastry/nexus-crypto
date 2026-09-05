#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${NEXUS_CRYPTO_REPO_DIR:-/home/nexus/projects/nexus-crypto}"
BASE_URL="${NEXUS_CRYPTO_BASE_URL:-http://127.0.0.1:3200}"
SERVICE="${NEXUS_CRYPTO_SERVICE:-nexus-crypto.service}"
BRANCH="${NEXUS_CRYPTO_BRANCH:-main}"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"
PORT="$(printf '%s\n' "$BASE_URL" | sed -E 's#^[a-zA-Z]+://[^:/]+:([0-9]+).*#\1#')"
if [[ "$PORT" == "$BASE_URL" ]]; then
  PORT="3200"
fi

section() {
  echo
  echo "===== $1 ====="
}

show_runtime_diagnostics() {
  section "SERVICE STATUS"
  sudo systemctl status "$SERVICE" --no-pager || true

  section "SERVICE JOURNAL"
  sudo journalctl -u "$SERVICE" -n 120 --no-pager || true

  section "PORT CHECK"
  ss -ltnp | grep ":$PORT" || true

  section "PACKAGE VERSIONS"
  npm ls next react react-dom eslint-config-next baseline-browser-mapping postcss || true
}

load_local_env() {
  local env_file="$1"
  [[ -f "$env_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" == *=* ]] || continue

    local key="${line%%=*}"
    local value="${line#*=}"
    if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      export "$key=$value"
    fi
  done < "$env_file"
}

section "DEPLOY CONFIG"
echo "REPO_DIR=$REPO_DIR"
echo "BASE_URL=$BASE_URL"
echo "SERVICE=$SERVICE"
echo "BRANCH=$BRANCH"
echo "PORT=$PORT"

cd "$REPO_DIR"

section "PRE-DEPLOY GIT STATUS"
git status --short
git log --oneline -5

if [[ "$ALLOW_DIRTY" != "1" && -n "$(git status --short)" ]]; then
  echo "DEPLOY_ABORTED_REPO_DIRTY=1"
  echo "Set ALLOW_DIRTY=1 only if you intentionally want to deploy from a dirty tree."
  exit 1
fi

section "SUDO PRE-AUTH"
# npm ci + lint/test/build can outlast the sudo timestamp (15 min), which
# would fail the RESTART stage much later. Pre-auth here to fail fast; the
# RESTART stage re-validates right before restarting.
if ! sudo -v; then
  echo "SUDO_AUTH_REQUIRED=1"
  echo "Run 'sudo -v' first (password), then re-run deploy."
  exit 1
fi

section "FETCH"
git fetch origin

section "PULL"
git pull --ff-only origin "$BRANCH"

GIT_COMMIT_SHA="$(git rev-parse HEAD)"
GIT_SHORT_SHA="$(git rev-parse --short HEAD)"
BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

section "RELEASE METADATA"
echo "RELEASE_COMMIT=$GIT_SHORT_SHA"
echo "RELEASE_BUILD_TIME=$BUILD_TIME"
ENV_FILE=".env.production.local"
touch "$ENV_FILE"
chmod 600 "$ENV_FILE"
env_tmp="$(mktemp)"
awk '
  /^# BEGIN NEXUS RELEASE METADATA$/ { skip=1; next }
  /^# END NEXUS RELEASE METADATA$/ { skip=0; next }
  !skip { print }
' "$ENV_FILE" > "$env_tmp"
cat >> "$env_tmp" <<EOF
# BEGIN NEXUS RELEASE METADATA
GIT_COMMIT_SHA=$GIT_COMMIT_SHA
NEXT_PUBLIC_GIT_COMMIT_SHA=$GIT_COMMIT_SHA
BUILD_TIME=$BUILD_TIME
NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME
# END NEXUS RELEASE METADATA
EOF
mv "$env_tmp" "$ENV_FILE"
chmod 600 "$ENV_FILE"
load_local_env "$ENV_FILE"

section "INSTALL"
npm ci

section "LINT"
npm run lint

section "TEST"
npm run test

section "BUILD"
npm run build

section "AUDIT"
npm audit || true

section "RESTART"
# Re-validate right before restart: long INSTALL/LINT/TEST/BUILD phases may
# have expired the timestamp cached at SUDO PRE-AUTH. Non-interactive refresh
# first (extends a still-valid timestamp without prompting), interactive
# prompt as fallback for terminal runs.
sudo -n -v 2>/dev/null || sudo -v
sudo systemctl restart "$SERVICE"

section "WAIT FOR PROVIDER HEALTH"
app_ready=0
for _ in {1..30}; do
  if curl -fsS "$BASE_URL/api/provider-health" >/dev/null; then
    echo "APP_READY=PASS"
    app_ready=1
    break
  fi
  sleep 1
done

if [[ "$app_ready" != "1" ]]; then
  echo "APP_READY=FAIL"
  show_runtime_diagnostics
  exit 1
fi

section "VERSION CHECK"
version_file="$(mktemp)"
curl -sS "$BASE_URL/api/version" -o "$version_file"
GIT_COMMIT_SHA="$GIT_COMMIT_SHA" \
GIT_SHORT_SHA="$GIT_SHORT_SHA" \
BUILD_TIME="$BUILD_TIME" \
python3 - "$version_file" <<'PY'
import json
import os
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
expected_commit = os.environ["GIT_COMMIT_SHA"]
expected_short = os.environ["GIT_SHORT_SHA"]
expected_build_time = os.environ["BUILD_TIME"]

assert payload.get("app") == "nexus-crypto", "version app mismatch"
assert payload.get("commit") == expected_commit, "version commit mismatch"
assert payload.get("short_commit") == expected_short, "short commit mismatch"
assert payload.get("build_time") == expected_build_time, "build time mismatch"
assert payload.get("next"), "missing next version"
assert str(payload.get("node", "")).startswith("v"), "missing node version"
print("VERSION_METADATA=PASS")
PY
rm -f "$version_file"

section "SMOKE AUTH"
if [[ "${NEXUS_AUTH_ENABLED:-0}" == "1" ]]; then
  if [[ -z "${NEXUS_SMOKE_AUTH_TOKEN:-}" ]]; then
    echo "NEXUS_SMOKE_AUTH_TOKEN is required for smoke when NEXUS_AUTH_ENABLED=1"
    exit 1
  fi
  export NEXUS_SMOKE_AUTH_TOKEN
  echo "SMOKE_AUTH_TOKEN=CONFIGURED"
else
  echo "SMOKE_AUTH_TOKEN=NOT_REQUIRED"
fi

section "SMOKE"
NEXUS_CRYPTO_BASE_URL="$BASE_URL" ./scripts/smoke_crypto_assets_contract.sh

section "FINAL STATUS"
git status --short
git log -1 --oneline

if [[ -n "$(git status --short)" ]]; then
  echo "DEPLOY_RUNTIME_PASS_BUT_REPO_DIRTY=1"
  echo "Inspect drift before the next deploy. Common command:"
  echo "git diff -- package-lock.json | sed -n '1,220p'"
  exit 2
fi

echo "DEPLOY_PASS=1"
