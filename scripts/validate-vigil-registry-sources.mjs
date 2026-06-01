import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const filesToScan = ["src/pages/vigil.tsx", "src/lib/vigilRegistry.ts", "src/lib/vigilPresentation.ts", "README.md", "scripts/sync-vigil-records.mjs"];
const deprecatedFileNames = [
  ["VIGIL", "Active" + "Records", "json"].join("."),
  ["VIGIL", "Closed" + "Records", "json"].join("."),
  ["VIGIL", "Records", "Index", "json"].join("."),
  ["VIGIL", "Records", "json"].join("."),
];
const deprecatedFolders = [
  ["vigil", "records", "observations", ""].join("/"),
  ["vigil", "records", "proposals", ""].join("/"),
  ["vigil", "records", "failures", ""].join("/"),
];
const canonicalRegistryUrl = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Registry.Index.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of filesToScan) {
  const text = await readFile(resolve(repoRoot, file), "utf8");
  for (const forbidden of [...deprecatedFileNames, ...deprecatedFolders]) {
    assert(!text.includes(forbidden), `${file} still references ${forbidden}`);
  }
  assert(!/github\.com\/CAM-Initiative\/Vigil\/blob\/[0-9a-f]{7,40}\//i.test(text), `${file} pins a VIGIL blob link to a commit`);
  assert(!/raw\.githubusercontent\.com\/CAM-Initiative\/Vigil\/[0-9a-f]{7,40}\//i.test(text), `${file} pins a VIGIL raw link to a commit`);
}

const sourceConfig = JSON.parse(await readFile(resolve(repoRoot, "src/config/registrySources.json"), "utf8"));
assert(sourceConfig.vigil.registry_index_url === canonicalRegistryUrl, "VIGIL registry source must use the default-branch master index URL");
assert(sourceConfig.vigil.github_blob_url === "https://github.com/CAM-Initiative/Vigil/blob/main/vigil/VIGIL.Registry.Index.json", "VIGIL GitHub blob URL must point to the default-branch master index");

const loader = await readFile(resolve(repoRoot, "src/lib/vigilRegistry.ts"), "utf8");
assert(loader.includes("cacheBustUrl(liveRegistryUrl)"), "Live registry fetch should use cache busting");
assert(loader.includes("Array.isArray(registry.records)"), "Loader should support a combined records array");
assert(loader.includes("registryPointerEntries(registry.registries)"), "Loader should support child registry pointers");
assert(loader.includes("pointer.raw_url"), "Loader should fetch child registries from raw_url when available");
assert(loader.includes("record.github_blob_url"), "Source links should prefer registry github_blob_url");
assert(loader.includes("record.raw_url"), "Raw links should prefer registry raw_url");
assert(loader.includes("${record.path}"), "Fallback links should use record.path");
assert(!loader.includes("record_type") || !loader.includes("/${record_type}"), "Fallback links must not be built from record_type plus id");

const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
for (const label of ["Failure Modes", "Observations", "Proposals", "Patch Notes"]) {
  assert(page.includes(label), `Record type filter should expose ${label}`);
}
assert(page.includes("record.record_state"), "State filters should read record_state");
assert(page.includes("VIGIL registry could not be loaded from the live registry source"), "UI should show a clear live-registry failure message");
assert((page + loader).includes("Showing cached fallback registry data"), "UI should show a cached fallback message");

console.log("VIGIL registry source validation passed.");
