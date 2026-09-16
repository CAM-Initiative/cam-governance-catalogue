import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceConfigPath = resolve(repoRoot, "src", "config", "registrySources.json");
const outputDir = resolve(repoRoot, "docs", "data");
const fallbackPath = resolve(outputDir, "vigil-registry-fallback.json");
const syncMetaPath = resolve(outputDir, "vigil-registry-sync-meta.json");
const strictSync = process.env.VIGIL_SYNC_STRICT === "1";
const recordBranch = process.env.VIGIL_RECORD_BRANCH;

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

function searchTerms(record) {
  if (Array.isArray(record.search_terms) && record.search_terms.length) {
    return record.search_terms.filter((value) => typeof value === "string" && value.trim());
  }

  const values = [];
  const add = (value) => {
    if (typeof value === "string" && value.trim()) values.push(value.trim());
    else if (Array.isArray(value)) value.forEach(add);
  };

  const primary = record.primary_classification && typeof record.primary_classification === "object"
    ? record.primary_classification
    : {};
  const secondary = Array.isArray(record.secondary_classifications)
    ? record.secondary_classifications
    : [];

  [
    record.vendor_cluster,
    record.primary_evidenced_vendors,
    record.evidenced_vendors,
    record.evidenced_products_or_services,
    record.evidenced_models_or_runtimes,
    record.product_or_service,
    record.specific_model_or_runtime,
    record.model_or_product,
    record.system_type,
    record.interface_surface,
    record.primary_jurisdiction,
    record.regulatory_surface,
    record.sector,
    record.primary_source_title,
    record.primary_source_platform,
    record.primary_source_type,
    record.source_platforms,
    record.source_types,
    secondary.flatMap((item) => item && typeof item === "object" ? [item.class_id, item.family_id] : []),
  ].forEach(add);

  const seen = new Map();
  for (const value of values) {
    const key = value.toLocaleLowerCase();
    if (!seen.has(key)) seen.set(key, value);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function compactIncidentRecord(record) {
  const primary = record.primary_classification && typeof record.primary_classification === "object"
    ? record.primary_classification
    : {};
  const terms = searchTerms(record);
  const primaryClassId = record.primary_class_id ?? primary.class_id;
  const primaryFamilyId = record.primary_family_id ?? primary.family_id;
  const directSecondary = Array.isArray(record.secondary_classifications)
    ? record.secondary_classifications
        .filter((item) => item && typeof item === "object")
        .map((item) => item.class_id)
        .filter((value) => typeof value === "string" && value.trim())
    : [];
  const secondaryClassIds = [...new Set(
    (directSecondary.length ? directSecondary : terms.filter((value) => /^VIGIL-FC-\d+$/i.test(value)))
      .filter((value) => value !== primaryClassId),
  )];

  const projected = {
    id: record.id,
    record_type: record.record_type,
    record_state: record.record_state,
    record_version: record.record_version,
    record_last_updated: record.record_last_updated,
    date_recorded: record.date_recorded,
    title: record.title,
    summary: record.summary,
    platform_or_vendor: record.platform_or_vendor,
    severity: record.severity,
    classification_status: record.classification_status,
    classification_role: record.classification_role,
    primary_class_id: primaryClassId,
    primary_family_id: primaryFamilyId,
    secondary_class_ids: secondaryClassIds,
    occurred_from: record.occurred_from,
    search_terms: terms,
    path: record.path,
    github_blob_url: recordBranch && record.path
      ? `https://github.com/${registrySources.vigil.repo}/blob/${recordBranch}/${record.path}`
      : record.github_blob_url,
    raw_url: recordBranch && record.path
      ? `https://raw.githubusercontent.com/${registrySources.vigil.repo}/${recordBranch}/${record.path}`
      : record.raw_url,
  };

  return Object.fromEntries(
    Object.entries(projected).filter(([, value]) => value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length)),
  );
}

function publicFallbackRegistry(registry) {
  return {
    ...registry,
    records: registry.records.map(compactIncidentRecord),
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
  const upstreamFingerprint = registry.records
    .map((record) => [
      record.id,
      record.record_version,
      record.record_last_updated,
      record.severity,
      record.classification_status,
      record.classification_role,
      record.primary_class_id,
      record.primary_family_id,
    ].map((value) => value ?? "").join("|"))
    .join("\n");

  await writeFile(syncMetaPath, `${JSON.stringify({
    synced_at_utc: new Date().toISOString(),
    source_url: configuredRegistryUrl,
    fallback_file: "docs/data/vigil-registry-fallback.json",
    record_count: registry.records.length,
    record_type: "incident",
    status: syncStatus,
    upstream_state: {
      latest_record_id: registry.records.at(-1)?.id ?? null,
      latest_record_updated: registry.records
        .map((record) => record.record_last_updated)
        .filter((value) => typeof value === "string")
        .sort()
        .at(-1) ?? null,
      fingerprint: Buffer.from(upstreamFingerprint).toString("base64"),
    },
  }, null, 2)}\n`);

  console.log(`${syncStatus === "fetched" ? "Synced" : "Retained"} VIGIL Incident fallback from ${registrySource}`);
} catch (error) {
  console.error("Failed to sync VIGIL Incident fallback");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
