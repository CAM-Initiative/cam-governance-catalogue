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
assert(loader.includes("record.github_blob_url"), "Canonical record links must prefer registry github_blob_url");
assert(loader.includes("record.raw_url"), "Canonical raw links must prefer registry raw_url");

const fallback = JSON.parse(await readFile(resolve(repoRoot, "docs/data/vigil-registry-fallback.json"), "utf8"));
assert(Array.isArray(fallback.records) && fallback.records.length > 0, "VIGIL fallback must contain Incident records");
assert(fallback.records.every((record) => record?.record_type === "incident"), "VIGIL fallback must not publish retired record classes");
assert(fallback.records.every((record) => !("severity_assessment_basis" in record)), "VIGIL fallback must not republish the compatibility-only severity blob");
assert(fallback.records.some((record) => record.severity_assessment?.materialised_consequence), "VIGIL fallback must retain structured occurrence-level severity analysis");

console.log(`VIGIL Incident-only registry validation passed (${fallback.records.length} fallback Incidents).`);
