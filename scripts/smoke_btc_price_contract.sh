#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${NEXUS_CRYPTO_BASE_URL:-http://127.0.0.1:3200}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -sS "${BASE_URL}/api/btc-price" -o "$TMP_DIR/btc-price.json"
python3 - "$TMP_DIR/btc-price.json" <<'PY'
import json
import sys
from datetime import datetime
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert "price" in payload, "missing price"
assert payload.get("price") not in (None, ""), "empty price"
updated_at = payload.get("updated_at")
assert isinstance(updated_at, str) and updated_at, "missing updated_at"
parsed = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
assert parsed.tzinfo is not None, "updated_at must be timezone-aware"
print("BTC_PRICE_CONTRACT=PASS")
PY

curl -sS "${BASE_URL}/api/btc-klines?tf=4h" -o "$TMP_DIR/btc-klines.json"
python3 - "$TMP_DIR/btc-klines.json" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text())
assert isinstance(payload, list), "klines response must be a list"
assert payload, "klines response must not be empty"
assert "time" in payload[-1], "latest kline missing time"
print("BTC_KLINES_CONTRACT=PASS")
PY
