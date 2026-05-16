#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${NEXUS_CRYPTO_BASE_URL:-http://127.0.0.1:3200}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl_with_auth() {
  if [[ -n "${NEXUS_SMOKE_AUTH_TOKEN:-}" ]]; then
    curl -sS -H "Authorization: Bearer ${NEXUS_SMOKE_AUTH_TOKEN}" "$@"
  else
    curl -sS "$@"
  fi
}

echo "TIFA_SMOKE_BASE_URL=$BASE_URL"

market_file="$TMP_DIR/market-context.json"
curl_with_auth "${BASE_URL}/api/tifa-tools/market-context" -o "$market_file"
python3 - "$market_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("ok") is True
assert payload.get("context_type") == "market_snapshot"
assert "top_assets" in payload
print("TIFA_MARKET_CONTEXT=PASS")
PY

for pair in "bitcoin:BTC" "ethereum:ETH" "solana:SOL" "dogecoin:DOGE"; do
  asset_id="${pair%%:*}"
  symbol="${pair##*:}"
  file="$TMP_DIR/asset-${asset_id}.json"
  curl_with_auth "${BASE_URL}/api/tifa-tools/asset-analysis?assetId=${asset_id}&tf=1h" -o "$file"
  python3 - "$file" "$asset_id" "$symbol" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
asset_id = sys.argv[2]
symbol = sys.argv[3]
assert payload.get("ok") is True
assert payload.get("context_type") == "asset_analysis"
assert payload.get("analysis_enabled") is True
assert payload.get("asset", {}).get("id") == asset_id
assert payload.get("asset", {}).get("symbol") == symbol
assert payload.get("signal", {}).get("state") in ("No Trade", "Watch", "Ready", "Confirmed")
print(f"TIFA_ASSET_{symbol}=PASS")
PY
done

for pair in "tether:USDT" "usd-coin:USDC"; do
  asset_id="${pair%%:*}"
  symbol="${pair##*:}"
  file="$TMP_DIR/asset-${asset_id}.json"
  curl_with_auth "${BASE_URL}/api/tifa-tools/asset-analysis?assetId=${asset_id}&tf=1h" -o "$file"
  python3 - "$file" "$symbol" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
symbol = sys.argv[2]
assert payload.get("ok") is True
assert payload.get("analysis_enabled") is False
assert payload.get("mode") == "market-only"
assert payload.get("asset", {}).get("symbol") == symbol
print(f"TIFA_STABLECOIN_{symbol}=PASS")
PY
done

budget_file="$TMP_DIR/budget-status.json"
curl_with_auth "${BASE_URL}/api/tifa-tools/budget-status" -o "$budget_file"
python3 - "$budget_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("provider") == "gemini"
assert payload.get("status") in ("ok", "degraded", "blocked")
assert "monthly_spend_usd" in payload
print("TIFA_BUDGET_STATUS=PASS")
PY

tifa_file="$TMP_DIR/tifa.json"
curl_with_auth \
  -H "Content-Type: application/json" \
  -d '{"message":"Market hôm nay thế nào?","context":{"page":"/"}}' \
  "${BASE_URL}/api/tifa" -o "$tifa_file"
python3 - "$tifa_file" <<'PY'
import json
import os
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("ok") is True
assert isinstance(payload.get("answer"), str) and payload["answer"]
serialized = json.dumps(payload)
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    assert api_key not in serialized
assert "GEMINI_API_KEY" not in serialized
print("TIFA_CHAT_NO_SECRET_LEAK=PASS")
PY
