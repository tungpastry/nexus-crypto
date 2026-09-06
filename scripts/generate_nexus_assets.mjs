#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildNexusCatalog } from "./nexus-assets-lib.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_DIR = path.dirname(SCRIPT_DIR);
const OUTPUT_FILE = path.join(REPO_DIR, "app/config/assets.generated.json");
const OVERRIDES_FILE = path.join(SCRIPT_DIR, "asset-overrides.json");
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
const BINANCE_URL =
  "https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT&symbolStatus=TRADING&showPermissionSets=false";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (response.ok) return response.json();

    if ((response.status === 429 || response.status >= 500) && attempt === 0) {
      const retryAfter = Number.parseInt(response.headers.get("retry-after") || "1", 10);
      await sleep(Math.min(Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000, 5000));
      continue;
    }
    throw new Error(`Provider request failed with HTTP ${response.status}`);
  }
  throw new Error("Provider request retry exhausted");
}

async function main() {
  const shouldWrite = process.argv.includes("--write");
  const overrides = JSON.parse(await readFile(OVERRIDES_FILE, "utf8"));
  const [coins, exchangeInfo] = await Promise.all([
    fetchJson(COINGECKO_URL),
    fetchJson(BINANCE_URL),
  ]);
  const catalog = buildNexusCatalog({
    coins,
    exchangeInfo,
    overrides,
    generatedAt: new Date().toISOString(),
  });

  console.log(`NEXUS_ASSET_CATALOG_VERSION=${catalog.metadata.catalogVersion}`);
  console.log(`NEXUS_ASSET_COUNT=${catalog.metadata.universeSize}`);
  console.log(`NEXUS_BINANCE_ENABLED=${catalog.metadata.binanceEnabledCount}`);
  console.log(`NEXUS_MARKET_ONLY=${catalog.metadata.marketOnlyCount}`);

  if (!shouldWrite) {
    console.log("NEXUS_ASSET_CATALOG_WRITE=SKIPPED (use --write)");
    return;
  }
  await writeFile(OUTPUT_FILE, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`NEXUS_ASSET_CATALOG_WRITE=PASS`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Asset catalog generation failed");
  process.exitCode = 1;
});
