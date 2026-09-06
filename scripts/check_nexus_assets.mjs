#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateGeneratedCatalog } from "./nexus-assets-lib.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(SCRIPT_DIR, "../app/config/assets.generated.json");

try {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  validateGeneratedCatalog(catalog);
  console.log(`NEXUS_ASSET_CATALOG_CHECK=PASS`);
  console.log(`NEXUS_ASSET_COUNT=${catalog.metadata.universeSize}`);
  console.log(`NEXUS_BINANCE_ENABLED=${catalog.metadata.binanceEnabledCount}`);
  console.log(`NEXUS_DEEP_HEALTH_CANARIES=8`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Asset catalog validation failed");
  process.exitCode = 1;
}
