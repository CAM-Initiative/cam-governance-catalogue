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
const configuredRegistryUrl = registrySources.vigil.incident_registry_index_url;
const registrySource = process.env.VIGIL_REGISTRY_SOURCE || configuredRegistryUrl;

function resolveLocalSource(source) {
  return isAbsolute(source) ? source : resolve(repoRoot, source);
}

async function loadSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: {
        Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent": "cam-governance-catalogue-vigil-sync",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return response.text();
  }
  return readFile(resolveLocalSource(source), "utf8");
}

function parseIncidentRegistry(sourceText, source) {
  let parsed;
  try {
    parsed = JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`VIGIL Incident registry loaded from ${source} is not valid JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !Array.isArray(parsed.records)) {
    throw new Error(`VIGIL Incident registry loaded from ${source} must contain a records array`);
  }
  if (!parsed.records.length || parsed.records.some((record) => record?.record_type !== "incident")) {
    throw new Error(`VIGIL Incident registry loaded from ${source} must contain only canonical Incident records`);
  }
  return parsed;
}

function publicFallbackRegistry(registry) {
  const compatibilityOnlyIndexFields = new Set([
    "severity_assessment_basis",
    "interpretive_provenance_summary",
    "diagnostic_provenance_summary",
    "evidence_access_summary",
  ]);
  return {
    ...registry,
    records: registry.records.map((record) => Object.fromEntries(
      Object.entries(record).filter(([key]) => !compatibilityOnlyIndexFields.has(key)),
    )),
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
      console.warn(`Unable to fetch the live VIGIL Incident registry from ${registrySource}; keeping the existing Incident fallback for this build.`);
    } catch {
      console.warn(`Unable to fetch the live VIGIL Incident registry from ${registrySource}; no existing fallback is available.`);
      process.exit(0);
    }
  }

  const registry = parseIncidentRegistry(sourceText, registrySource);
  const fallbackRegistry = publicFallbackRegistry(registry);
  await writeFile(fallbackPath, `${JSON.stringify(fallbackRegistry)}\n`);
  await writeFile(syncMetaPath, `${JSON.stringify({
    synced_at_utc: new Date().toISOString(),
    source_url: configuredRegistryUrl,
    fallback_file: "docs/data/vigil-registry-fallback.json",
    record_count: registry.records.length,
    record_type: "incident",
    status: syncStatus,
  }, null, 2)}\n`);

  console.log(`${syncStatus === "fetched" ? "Synced" : "Retained"} VIGIL Incident fallback from ${registrySource}`);
} catch (error) {
  console.error("Failed to sync VIGIL Incident fallback");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
