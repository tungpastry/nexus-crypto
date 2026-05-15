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

section "FETCH"
git fetch origin

section "PULL"
git pull --ff-only origin "$BRANCH"

section "INSTALL"
npm install

section "LINT"
npm run lint

section "TEST"
npm run test

section "BUILD"
npm run build

section "AUDIT"
npm audit || true

section "RESTART"
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
