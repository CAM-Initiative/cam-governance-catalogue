import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const canonicalRegistryUrl = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Incidents.Index.json";
const canonicalBlobUrl = "https://github.com/CAM-Initiative/Vigil/blob/main/vigil/VIGIL.Incidents.Index.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const config = JSON.parse(await readFile(resolve(repoRoot, "src/config/registrySources.json"), "utf8"));
assert(config.vigil.incident_registry_index_url === canonicalRegistryUrl, "VIGIL must use the canonical main-branch Incident index");
assert(config.vigil.incident_registry_github_blob_url === canonicalBlobUrl, "VIGIL Incident source link must use the canonical main branch");
assert(!("registry_index_url" in config.vigil), "VIGIL must not expose a generic multi-record registry source");
assert(!("github_blob_url" in config.vigil), "VIGIL must not expose a generic multi-record registry link");

const activeFiles = [
  "src/lib/vigilRegistry.ts",
  "src/lib/vigilPresentation.ts",
  "src/lib/vigilPublicDisplay.ts",
  "scripts/sync-vigil-records.mjs",
  "src/public/vigil-ux-enhancements.js",
];
const retiredTokens = ["failure_modes", "related_failure_modes", "related_observations", "patch_notes", "proposals", "VIGIL.Failures.Index", "VIGIL.Observations.Index", "VIGIL.Research.Index", "VIGIL.Learn.Index", "_canonical_markdown_body", "loadVigilRegistryRecords"];
for (const file of activeFiles) {
  const source = await readFile(resolve(repoRoot, file), "utf8");
  for (const token of retiredTokens) assert(!source.includes(token), `${file} still contains retired VIGIL consumer token ${token}`);
  assert(!/CAM-Initiative\/Vigil\/(?:blob\/)?[0-9a-f]{7,40}\//i.test(source), `${file} pins VIGIL to a commit`);
}

const loader = await readFile(resolve(repoRoot, "src/lib/vigilRegistry.ts"), "utf8");
assert(loader.includes("cacheBustUrl(liveRegistryUrl)"), "Incident registry fetch must use cache busting");
assert(loader.includes('record.record_type !== "incident"'), "Registry loader must exclude non-Incident records");
assert(loader.includes("if (record.path)"), "Canonical record links must prefer durable record paths");
assert(loader.includes("VIGIL_REGISTRY_SOURCE.branch"), "Canonical record paths must resolve against the configured canonical branch");

const fallback = JSON.parse(await readFile(resolve(repoRoot, "docs/data/vigil-registry-fallback.json"), "utf8"));
assert(Array.isArray(fallback.records) && fallback.records.length > 0, "VIGIL fallback must contain Incident records");
assert(fallback.records.every((record) => record?.record_type === "incident"), "VIGIL fallback must not publish retired record classes");
assert(fallback.records.every((record) => Array.isArray(record.search_terms) && record.search_terms.length > 0), "VIGIL fallback must retain compact search terms");
for (const forbidden of [
  "severity_assessment",
  "severity_assessment_basis",
  "harm_impact_assessment",
  "primary_classification",
  "secondary_classifications",
  "diagnostic_provenance_summary",
  "interpretive_provenance_summary",
  "evidence_access_summary",
  "external_incident_references",
  "legacy_provenance",
]) {
  assert(fallback.records.every((record) => !(forbidden in record)), `VIGIL fallback must not embed canonical detail field ${forbidden}`);
}
assert(fallback.records.every((record) => typeof record.path === "string" && typeof record.raw_url === "string"), "VIGIL fallback must retain canonical record routing");
assert(fallback.records.every((record) => record.raw_url.includes("/CAM-Initiative/Vigil/main/")), "Published VIGIL fallback raw URLs must target canonical main, never a retired working branch");
assert(fallback.records.every((record) => record.github_blob_url.includes("/CAM-Initiative/Vigil/blob/main/")), "Published VIGIL fallback GitHub URLs must target canonical main, never a retired working branch");

const syncMeta = JSON.parse(await readFile(resolve(repoRoot, "docs/data/vigil-registry-sync-meta.json"), "utf8"));
assert(syncMeta.status === "fetched", "Published VIGIL fallback must come from a successful live fetch");
assert(syncMeta.record_count === fallback.records.length, "VIGIL sync metadata record count must match fallback");
assert(syncMeta.upstream_state && typeof syncMeta.upstream_state === "object", "VIGIL sync metadata must record upstream state");
assert(typeof syncMeta.upstream_state.fingerprint === "string" && syncMeta.upstream_state.fingerprint.length > 0, "VIGIL sync metadata must include an upstream fingerprint");

console.log(`VIGIL lightweight Incident registry validation passed (${fallback.records.length} fallback Incidents).`);
