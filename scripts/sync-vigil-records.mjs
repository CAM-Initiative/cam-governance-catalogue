import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceConfigPath = resolve(repoRoot, "src", "config", "registrySources.json");
const outputDir = resolve(repoRoot, "docs", "data");
const fallbackPath = resolve(outputDir, "vigil-registry-fallback.json");
const syncMetaPath = resolve(outputDir, "vigil-registry-sync-meta.json");
const strictSync = process.env.VIGIL_SYNC_STRICT === "1";

const registrySources = JSON.parse(await readFile(sourceConfigPath, "utf8"));
const configuredRegistryUrl = registrySources.vigil.registry_index_url;
const registrySource = process.env.VIGIL_REGISTRY_SOURCE || configuredRegistryUrl;

function resolveLocalSource(source) {
  return isAbsolute(source) ? source : resolve(repoRoot, source);
}

async function loadSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: {
        "Accept": "application/json,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent": "cam-governance-catalogue-vigil-sync",
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return response.text();
  }

  return readFile(resolveLocalSource(source), "utf8");
}

function parseRegistry(sourceText, source) {
  try {
    const parsed = JSON.parse(sourceText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("must be a top-level JSON object");
    }
    return parsed;
  } catch (error) {
    throw new Error(`VIGIL registry loaded from ${source} is not valid JSON: ${error.message}`);
  }
}

function registryEntries(registries) {
  if (Array.isArray(registries)) return registries.filter((entry) => entry && typeof entry === "object");
  if (!registries || typeof registries !== "object") return [];
  return Object.entries(registries)
    .filter(([, entry]) => entry && typeof entry === "object")
    .map(([key, entry]) => ({ key, ...entry }));
}

function recordsFrom(payload) {
  if (Array.isArray(payload?.records)) return payload.records;
  for (const key of ["failure_modes", "observations", "proposals", "patch_notes", "items"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

async function buildCombinedFallback(masterRegistry, source) {
  const directRecords = recordsFrom(masterRegistry);
  if (Array.isArray(masterRegistry.records)) return { ...masterRegistry, records: directRecords };

  const childRegistries = registryEntries(masterRegistry.registries);
  const childRecordSets = await Promise.all(childRegistries.map(async (entry, index) => {
    const childSource = entry.raw_url || entry.registry_index_url || entry.url;
    if (!childSource) return [];
    const childText = await loadSource(childSource);
    const childRegistry = parseRegistry(childText, childSource);
    return recordsFrom(childRegistry).map((record) => ({
      ...(record && typeof record === "object" ? record : { summary: record }),
      source_registry: record?.source_registry ?? entry.key ?? childSource ?? `registry-${index + 1}`,
    }));
  }));

  return {
    ...masterRegistry,
    records: childRecordSets.flat(),
    fallback_generated_from: source,
  };
}

try {
  await mkdir(outputDir, { recursive: true });

  let sourceText;
  let syncStatus = "fetched";
  try {
    sourceText = await loadSource(registrySource);
  } catch (error) {
    if (strictSync) throw error;
    try {
      sourceText = await readFile(fallbackPath, "utf8");
      syncStatus = "stale_local_copy";
      console.warn(`Unable to fetch live VIGIL registry from ${registrySource}; keeping existing fallback copy for this build.`);
    } catch {
      console.warn(`Unable to fetch live VIGIL registry from ${registrySource}; no existing fallback copy is available, so no fallback was written.`);
      process.exit(0);
    }
  }

  const masterRegistry = parseRegistry(sourceText, registrySource);
  const fallbackRegistry = syncStatus === "fetched"
    ? await buildCombinedFallback(masterRegistry, registrySource)
    : masterRegistry;

  if (!Array.isArray(fallbackRegistry.records)) {
    throw new Error("VIGIL fallback registry must include a records array after resolution");
  }

  await writeFile(fallbackPath, `${JSON.stringify(fallbackRegistry, null, 2)}\n`);
  await writeFile(
    syncMetaPath,
    `${JSON.stringify({
      synced_at_utc: new Date().toISOString(),
      source_url: registrySource,
      fallback_file: "docs/data/vigil-registry-fallback.json",
      record_count: fallbackRegistry.records.length,
      status: syncStatus,
    }, null, 2)}\n`,
  );

  console.log(`${syncStatus === "fetched" ? "Synced" : "Retained"} VIGIL registry fallback from ${registrySource}`);
} catch (error) {
  console.error("Failed to sync VIGIL registry fallback");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
