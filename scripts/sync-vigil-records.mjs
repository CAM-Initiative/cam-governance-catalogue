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

const forbiddenIndexPayloadKeys = new Set([
  "system_context",
  "source_records",
  "failure_classification",
  "triage",
  "source_summary",
  "system_summary",
  "jurisdiction_summary",
  "classification_summary",
  "triage_summary",
  "proposal_summary",
  "external_relevance_summary",
  "change_summary",
  "verification_summary",
  "impact_summary",
  "cam_summary",
  "corpus_implementation",
  "public_display",
  "relevant_corpus_provisions",
  "applied_corpus_repairs",
  "proposed_amendments",
  "proposed_corpus_amendments",
]);

function textFrom(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const values = value.map(textFrom).filter(Boolean);
    return values.length ? values.join(", ") : undefined;
  }
  return undefined;
}

function nestedValue(record, path) {
  return path.split(".").reduce((current, part) => {
    if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
    return current && typeof current === "object" && !Array.isArray(current) ? current[part] : undefined;
  }, record);
}

function firstText(record, paths) {
  for (const path of paths) {
    const value = textFrom(nestedValue(record, path));
    if (value) return value;
  }
  return undefined;
}

function listFrom(value) {
  const values = Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
  return values.flatMap((item) => {
    if (typeof item === "string") return item.split(/\s*\|\s*|\s*;\s*/).map((entry) => entry.trim()).filter(Boolean);
    const text = textFrom(item);
    return text ? [text] : [];
  });
}

function uniqueStrings(values) {
  const seen = new Set();
  return values.filter((value) => {
    const cleaned = String(value ?? "").trim();
    if (!cleaned) return false;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectKeyedStrings(value, keyPattern, depth = 0) {
  if (depth > 8 || value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectKeyedStrings(item, keyPattern, depth + 1));
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, item]) => {
    if (keyPattern.test(key)) return listFrom(item);
    return collectKeyedStrings(item, keyPattern, depth + 1);
  });
}

function publicSearchProjection(record) {
  const detailBlocks = [
    record.public_display,
    record.corpus_implementation,
    record.relevant_corpus_provisions,
    record.applied_corpus_repairs,
    record.proposed_amendments,
    record.proposed_corpus_amendments,
  ].filter(Boolean);
  const instrumentPattern = /^(?:instrument_id|instrument_code|instrument_title|principal_instruments|changed_instruments|instruments_amended)$/i;
  const sectionPattern = /^(?:section|section_number|section_heading|heading|principal_sections|relevant_sections)$/i;
  const domainPattern = /^(?:domain|domains|relevant_domains|affected_domains|changed_domains|target_domains)$/i;
  const searchPattern = /^(?:instrument_id|instrument_code|instrument_title|canonical_file_path|section|section_number|section_heading|heading|action|current_status|relationship_to_failure|relevant_domains|record_chain)$/i;

  const principalInstruments = uniqueStrings([
    ...listFrom(record.principal_instruments),
    ...detailBlocks.flatMap((block) => collectKeyedStrings(block, instrumentPattern)),
    ...listFrom(record.specific_model_or_runtime).filter((value) => /\bCAM-[A-Z0-9-]+\b/i.test(value)),
  ]);
  const principalSections = uniqueStrings([
    ...listFrom(record.principal_sections),
    ...detailBlocks.flatMap((block) => collectKeyedStrings(block, sectionPattern)),
  ]);
  const relevantDomains = uniqueStrings([
    ...listFrom(record.relevant_domains),
    ...detailBlocks.flatMap((block) => collectKeyedStrings(block, domainPattern)),
  ]);
  const corpusSearchTerms = uniqueStrings([
    ...listFrom(record.corpus_search_terms),
    ...principalInstruments,
    ...principalSections,
    ...relevantDomains,
    ...detailBlocks.flatMap((block) => collectKeyedStrings(block, searchPattern)),
  ]).slice(0, 160);

  return {
    public_finding: firstText(record, ["public_finding", "public_display.public_finding", "summary"]),
    relevant_domains: relevantDomains.length ? relevantDomains : undefined,
    principal_instruments: principalInstruments.length ? principalInstruments : undefined,
    principal_sections: principalSections.length ? principalSections : undefined,
    corpus_search_terms: corpusSearchTerms.length ? corpusSearchTerms : undefined,
    repair_state: firstText(record, ["repair_state", "public_display.repair_state", "implementation_state", "change_status", "mitigation_status"]),
    display_contract_status: firstText(record, ["display_contract_status", "public_display.display_contract_status"]),
  };
}

function projectedPlatform(record) {
  return firstText(record, [
    "system_context.platform_or_vendor",
    "platform_or_vendor",
    "observed_system_vendor",
    "observed_vendor",
    "system_vendor",
    "source_records.0.source_platform",
    "source_platform",
  ]);
}

function projectedProduct(record) {
  return firstText(record, [
    "system_context.product_or_service",
    "system_context.specific_model_or_runtime",
    "system_or_product",
    "model_or_product",
    "model_or_algorithm",
    "source_records.0.system_or_product",
    "source_records.0.model_or_algorithm",
  ]);
}

function projectLeanIndexRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return record;

  const projected = Object.fromEntries(
    Object.entries(record).filter(([key]) => !forbiddenIndexPayloadKeys.has(key)),
  );
  const platform = projectedPlatform(record);
  const product = projectedProduct(record);
  const publicProjection = publicSearchProjection(record);

  if (platform) {
    projected.platform_label = platform;
    projected.affected_platform_label = platform;
    projected.source_platform = platform;
    projected.observed_vendor = platform;
  }
  if (product) projected.observed_product = product;
  for (const [key, value] of Object.entries(publicProjection)) {
    if (value !== undefined) projected[key] = value;
  }

  return projected;
}

function projectLeanIndexRecords(registry) {
  if (!registry || typeof registry !== "object" || !Array.isArray(registry.records)) return registry;
  return {
    ...registry,
    records: registry.records.map(projectLeanIndexRecord),
  };
}

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
  const fallbackRegistry = projectLeanIndexRecords(syncStatus === "fetched"
    ? await buildCombinedFallback(masterRegistry, registrySource)
    : masterRegistry);

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
