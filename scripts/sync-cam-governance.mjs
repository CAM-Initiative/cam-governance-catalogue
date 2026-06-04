import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceConfigPath = resolve(repoRoot, "src", "config", "registrySources.json");
const outputDir = resolve(repoRoot, "docs", "data");
const fallbackPath = resolve(outputDir, "cam-governance-fallback.json");
const syncMetaPath = resolve(outputDir, "cam-governance-sync-meta.json");
const legacySnapshotPath = resolve(outputDir, "cam-governance.json");
const strictSync = process.env.CAM_SYNC_STRICT === "1";

const registrySources = JSON.parse(await readFile(sourceConfigPath, "utf8"));
const configuredRegistryUrl = registrySources.cam?.registry_index_url;
const registrySource = process.env.CAM_GOVERNANCE_SOURCE || configuredRegistryUrl;

if (!registrySource) {
  throw new Error("CAM governance registry source is not configured in src/config/registrySources.json");
}

function resolveLocalSource(source) {
  return isAbsolute(source) ? source : resolve(repoRoot, source);
}

async function loadSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: {
        "Accept": "application/json,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent": "cam-governance-catalogue-cam-sync",
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return response.text();
  }

  return readFile(resolveLocalSource(source), "utf8");
}

function parseGovernanceIndex(sourceText, source) {
  try {
    const parsed = JSON.parse(sourceText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("must be a top-level JSON object");
    }
    if (!Array.isArray(parsed.items)) {
      throw new Error("must include an items array");
    }
    if (typeof parsed.count === "number" && parsed.count !== parsed.items.length) {
      throw new Error(`declares count ${parsed.count} but contains ${parsed.items.length} items`);
    }
    parsed.items.forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(`items[${index}] must be a JSON object`);
      }
      if (typeof item.id !== "string" || !item.id.trim()) {
        throw new Error(`items[${index}] must include a non-empty id`);
      }
      if (typeof item.link !== "string" || !item.link.trim()) {
        throw new Error(`items[${index}] must include a non-empty link`);
      }
    });
    return { ...parsed, count: parsed.items.length };
  } catch (error) {
    throw new Error(`CAM governance index loaded from ${source} is not valid catalogue JSON: ${error.message}`);
  }
}

try {
  await mkdir(outputDir, { recursive: true });

  let sourceText;
  let sourceUsed = registrySource;
  let syncStatus = "fetched";
  let previousMeta = {};

  try {
    previousMeta = JSON.parse(await readFile(syncMetaPath, "utf8"));
  } catch {
    previousMeta = {};
  }

  try {
    sourceText = await loadSource(registrySource);
  } catch (error) {
    if (strictSync) throw error;

    try {
      sourceText = await readFile(fallbackPath, "utf8");
      sourceUsed = "docs/data/cam-governance-fallback.json";
      syncStatus = "stale_local_copy";
      console.warn(`Unable to fetch live CAM governance index from ${registrySource}; keeping existing fallback copy for this build.`);
    } catch {
      sourceText = await readFile(legacySnapshotPath, "utf8");
      sourceUsed = "docs/data/cam-governance.json";
      syncStatus = "legacy_local_copy";
      console.warn(`Unable to fetch live CAM governance index from ${registrySource}; seeded fallback from legacy cam-governance.json.`);
    }
  }

  const governanceIndex = parseGovernanceIndex(sourceText, sourceUsed);

  const syncedAt = new Date().toISOString();
  const previousDataFetchedAt = typeof previousMeta.data_fetched_at_utc === "string"
    ? previousMeta.data_fetched_at_utc
    : typeof previousMeta.synced_at_utc === "string"
      ? previousMeta.synced_at_utc
      : undefined;
  const dataFetchedAt = syncStatus === "stale_local_copy" && previousDataFetchedAt
    ? previousDataFetchedAt
    : syncedAt;

  await writeFile(fallbackPath, `${JSON.stringify(governanceIndex, null, 2)}\n`);
  await writeFile(
    syncMetaPath,
    `${JSON.stringify({
      synced_at_utc: syncedAt,
      data_fetched_at_utc: dataFetchedAt,
      source_url: registrySource,
      source_used: sourceUsed,
      source_path: registrySources.cam?.source_path,
      fallback_file: "docs/data/cam-governance-fallback.json",
      legacy_snapshot_file: "docs/data/cam-governance.json",
      record_count: governanceIndex.items.length,
      status: syncStatus,
    }, null, 2)}\n`,
  );

  console.log(`${syncStatus === "fetched" ? "Synced" : "Retained"} CAM governance fallback from ${sourceUsed}`);
} catch (error) {
  console.error("Failed to sync CAM governance fallback");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
