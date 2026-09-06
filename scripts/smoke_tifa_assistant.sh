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
assert payload.get("universe_size") == 100
assert isinstance(payload.get("top_assets"), list) and len(payload["top_assets"]) <= 20
assert isinstance(payload.get("leaders_24h"), list) and payload["leaders_24h"]
assert isinstance(payload.get("laggards_24h"), list) and payload["laggards_24h"]
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

market_only_file="$TMP_DIR/asset-hyperliquid.json"
curl_with_auth "${BASE_URL}/api/tifa-tools/asset-analysis?assetId=hyperliquid&tf=1h" -o "$market_only_file"
python3 - "$market_only_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("ok") is True
assert payload.get("analysis_enabled") is False
assert payload.get("mode") == "market-only"
assert "verified Binance Spot/USDT" in payload.get("reason", "")
print("TIFA_MARKET_ONLY_BINANCE_UNAVAILABLE=PASS")
PY

budget_file="$TMP_DIR/budget-status.json"
curl_with_auth "${BASE_URL}/api/tifa-tools/budget-status" -o "$budget_file"
python3 - "$budget_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("provider") in ("gemini", "ollama")
assert payload.get("status") in ("ok", "degraded", "blocked")
assert "monthly_spend_usd" in payload
print("TIFA_BUDGET_STATUS=PASS")
PY

provider_file="$TMP_DIR/provider-health-gemini.json"
curl_with_auth "${BASE_URL}/api/provider-health/gemini" -o "$provider_file"
python3 - "$provider_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("provider") in ("gemini", "ollama")
assert isinstance(payload.get("circuit"), dict), "missing circuit"
assert payload["circuit"].get("state") in ("closed", "open", "half_open")
print("TIFA_PROVIDER_HEALTH_GEMINI=PASS")
PY

ollama_file="$TMP_DIR/provider-health-ollama.json"
curl_with_auth "${BASE_URL}/api/provider-health/ollama" -o "$ollama_file"
python3 - "$ollama_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("provider") == "ollama", payload.get("provider")
assert payload.get("active_provider") == "ollama", payload.get("active_provider")
assert payload.get("configured") is True
assert isinstance(payload.get("circuit"), dict), "missing circuit"
assert payload["circuit"].get("state") in ("closed", "open", "half_open")
print("TIFA_PROVIDER_HEALTH_OLLAMA=PASS")
PY

llm_file="$TMP_DIR/provider-health-llm.json"
curl_with_auth "${BASE_URL}/api/provider-health/llm" -o "$llm_file"
python3 - "$llm_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("active_provider") == "ollama", payload.get("active_provider")
assert payload.get("configured") is True
print("TIFA_PROVIDER_HEALTH_LLM_ALIAS=PASS")
PY

provider_explainer_file="$TMP_DIR/provider-health-explainer.json"
curl_with_auth "${BASE_URL}/api/tifa-tools/provider-health-explainer" -o "$provider_explainer_file"
python3 - "$provider_explainer_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("ok") is True
assert payload.get("context_type") == "provider_health_explainer"
assert payload.get("status") in ("ok", "degraded")
print("TIFA_PROVIDER_HEALTH_EXPLAINER=PASS")
PY

deep_explainer_file="$TMP_DIR/deep-health-explainer.json"
curl_with_auth "${BASE_URL}/api/tifa-tools/deep-health-explainer" -o "$deep_explainer_file"
python3 - "$deep_explainer_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("ok") is True
assert payload.get("context_type") == "deep_health_explainer"
assert payload.get("status") in ("ok", "degraded", "error")
print("TIFA_DEEP_HEALTH_EXPLAINER=PASS")
PY

ops_summary_file="$TMP_DIR/ops-summary.json"
curl_with_auth "${BASE_URL}/api/tifa-tools/ops-summary" -o "$ops_summary_file"
python3 - "$ops_summary_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("ok") is True
assert payload.get("context_type") == "ops_summary"
assert payload.get("status") in ("ok", "degraded", "error")
assert isinstance(payload.get("issues"), list)
print("TIFA_OPS_SUMMARY=PASS")
PY

orchestrate_file="$TMP_DIR/orchestrate.json"
curl_with_auth \
  -H "Content-Type: application/json" \
  -d '{"message":"ops executive summary","context":{"page":"/ops"}}' \
  "${BASE_URL}/api/tifa-tools/orchestrate" -o "$orchestrate_file"
python3 - "$orchestrate_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("ok") is True
assert "tools_used" in payload
assert isinstance(payload.get("warnings"), list)
print("TIFA_TOOL_ORCHESTRATOR=PASS")
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
assert payload.get("provider") in ("ollama", "tool-only"), payload.get("provider")
serialized = json.dumps(payload)
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    assert api_key not in serialized
assert "GEMINI_API_KEY" not in serialized
print("TIFA_CHAT_NO_SECRET_LEAK=PASS")
PY

stream_file="$TMP_DIR/tifa-stream.txt"
curl_with_auth \
  -N \
  -H "Content-Type: application/json" \
  -d '{"message":"Market hôm nay thế nào?","context":{"page":"/"}}' \
  "${BASE_URL}/api/tifa/stream" -o "$stream_file"
python3 - "$stream_file" <<'PY'
import os
import sys
from pathlib import Path

payload = Path(sys.argv[1]).read_text()
assert "event: start" in payload
assert ("event: delta" in payload) or ("event: error" in payload)
secret = os.getenv("GEMINI_API_KEY", "")
if secret:
    assert secret not in payload
assert "key=" not in payload.lower()
print("TIFA_STREAM_CONTRACT=PASS")
print("TIFA_STREAM_NO_SECRET_LEAK=PASS")
PY

python3 - "$tifa_file" "$stream_file" "$ops_summary_file" "$orchestrate_file" <<'PY'
import json
import os
import sys
from pathlib import Path

secret = os.getenv("GEMINI_API_KEY", "")
blobs = [
    Path(sys.argv[1]).read_text(),
    Path(sys.argv[2]).read_text(),
    Path(sys.argv[3]).read_text(),
    Path(sys.argv[4]).read_text(),
]
for blob in blobs:
    low = blob.lower()
    assert "key=" not in low
    assert "nexus_smoke_auth_token" not in low
    if secret:
        assert secret not in blob

print("TIFA_PHASE2_NO_SECRET_LEAK=PASS")
PY
