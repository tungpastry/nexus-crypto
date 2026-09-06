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

SYMBOLS=(
  BTCUSDT
  ETHUSDT
  BNBUSDT
  XRPUSDT
  SOLUSDT
  TRXUSDT
  SHIBUSDT
  DOGEUSDT
)

for symbol in "${SYMBOLS[@]}"; do
  price_file="$TMP_DIR/crypto-price-${symbol}.json"
  curl_with_auth "${BASE_URL}/api/crypto-price?symbol=${symbol}" -o "$price_file"
  python3 - "$price_file" "$symbol" <<'PY'
import json
import sys
from datetime import datetime
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
symbol = sys.argv[2]
assert payload.get("provider") == "binance", "provider must be binance"
assert payload.get("symbol") == symbol, "symbol mismatch"
assert payload.get("price") not in (None, ""), "missing price"
updated_at = payload.get("updated_at")
assert isinstance(updated_at, str) and updated_at, "missing updated_at"
datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
print(f"CRYPTO_PRICE_{symbol}=PASS")
PY

  klines_file="$TMP_DIR/crypto-klines-${symbol}.json"
  curl_with_auth "${BASE_URL}/api/crypto-klines?symbol=${symbol}&tf=4h" -o "$klines_file"
  python3 - "$klines_file" "$symbol" <<'PY'
import json
import sys
from datetime import datetime
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
symbol = sys.argv[2]
assert payload.get("provider") == "binance", "provider must be binance"
assert payload.get("symbol") == symbol, "symbol mismatch"
assert payload.get("tf") == "4h", "timeframe mismatch"
assert isinstance(payload.get("candles"), list) and payload["candles"], "missing candles"
latest = payload["candles"][-1]
for key in ("time", "open", "high", "low", "close", "volume"):
    assert key in latest, f"latest candle missing {key}"
datetime.fromisoformat(payload["updated_at"].replace("Z", "+00:00"))
print(f"CRYPTO_KLINES_{symbol}=PASS")
PY
done

snapshot_file="$TMP_DIR/market-snapshot.json"
curl_with_auth "${BASE_URL}/api/market-snapshot" -o "$snapshot_file"
python3 - "$snapshot_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assets = payload.get("assets")
assert payload.get("provider") == "coingecko"
assert payload.get("universe_size") == 100
assert isinstance(payload.get("catalog_version"), str) and payload["catalog_version"]
assert isinstance(payload.get("catalog_generated_at"), str) and payload["catalog_generated_at"]
assert isinstance(assets, list) and len(assets) == 100
assert len({asset.get("id") for asset in assets}) == 100
print("MARKET_SNAPSHOT_NEXUS_100=PASS")
PY

deep_health_file="$TMP_DIR/provider-health-deep.json"
curl -sS "${BASE_URL}/api/provider-health/deep" -o "$deep_health_file"
python3 - "$deep_health_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("provider") == "nexus_crypto"
assert payload.get("mode") == "deep"
assert payload.get("scope") == "core-canary"
assert payload.get("summary", {}).get("symbols_total") == 8
assert len(payload.get("checks", {})) == 8
assert payload.get("available_symbols_total", 0) >= 8
print("PROVIDER_DEEP_HEALTH_CORE_CANARY=PASS")
PY

negative_symbol_file="$TMP_DIR/negative-unsupported-symbol.json"
negative_symbol_code="$(
  curl_with_auth \
    -o "$negative_symbol_file" \
    -w "%{http_code}" \
    "${BASE_URL}/api/crypto-price?symbol=INVALID"
)"
test "$negative_symbol_code" = "400"
python3 - "$negative_symbol_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("error", {}).get("code") == "UNSUPPORTED_SYMBOL"
print("NEGATIVE_UNSUPPORTED_SYMBOL=PASS")
PY

negative_timeframe_file="$TMP_DIR/negative-unsupported-timeframe.json"
negative_timeframe_code="$(
  curl_with_auth \
    -o "$negative_timeframe_file" \
    -w "%{http_code}" \
    "${BASE_URL}/api/crypto-klines?symbol=BTCUSDT&tf=2h"
)"
test "$negative_timeframe_code" = "400"
python3 - "$negative_timeframe_file" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("error", {}).get("code") == "UNSUPPORTED_TIMEFRAME"
print("NEGATIVE_UNSUPPORTED_TIMEFRAME=PASS")
PY

health_file="$TMP_DIR/provider-health.json"
curl -sS "${BASE_URL}/api/provider-health" -o "$health_file"
python3 - "$health_file" <<'PY'
import json
import sys
from datetime import datetime
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert payload.get("provider") == "nexus_crypto", "provider mismatch"
assert payload.get("status") in ("ok", "degraded"), "invalid health status"
assert isinstance(payload.get("checks"), dict), "missing checks"
for key in (
    "binance_price",
    "binance_klines",
    "market_snapshot",
    "market_snapshot_cache_status",
    "market_snapshot_age_ms",
):
    assert key in payload["checks"], f"missing {key}"
    assert "status" in payload["checks"][key], f"missing {key}.status"
datetime.fromisoformat(payload["updated_at"].replace("Z", "+00:00"))
print("PROVIDER_HEALTH=PASS")
PY
