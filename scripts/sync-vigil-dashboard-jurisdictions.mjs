/**
 * Generate a small, auditable jurisdiction index for the globe.
 * Only jurisdictional_context.primary_jurisdiction from canonical case detail
 * is admitted. Titles, search terms, vendor HQs and place-name guesses are not.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const inputPath = resolve(root, "docs/data/vigil-registry-fallback.json");
const outputPath = resolve(root, "docs/data/vigil-dashboard-jurisdictions.json");
const sourceConfig = JSON.parse(await readFile(resolve(root, "src/config/registrySources.json"), "utf8"));
const branch = process.env.VIGIL_RECORD_BRANCH || sourceConfig.vigil.branch;
const repo = sourceConfig.vigil.repo;
const index = JSON.parse(await readFile(inputPath, "utf8"));
let previous = { records: [] };
try { previous = JSON.parse(await readFile(outputPath, "utf8")); } catch { /* initial run */ }

const cached = new Map((previous.records ?? []).map(record => [record.id, record]));
const cases = [...(index.records ?? [])].filter(item => item.record_type === "incident");
let cursor = 0;
let unavailable = 0;
const results = new Array(cases.length);

async function resolveCase(record) {
  const earlier = cached.get(record.id);
  // Versioned cache avoids repeating hundreds of downloads on every push.
  if (earlier && earlier.version === record.record_version && typeof earlier.jurisdiction === "string") {
    return earlier;
  }
  if (!/^vigil\/records\/incidents\/VIGIL-INC-\d{6}\.json$/.test(record.path ?? "")) {
    unavailable += 1;
    return { id: record.id, version: record.record_version, jurisdiction: "" };
  }
  const url = `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${record.path}`;
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const detail = await response.json();
    if (detail.id !== record.id || detail.record_type !== "incident") throw new Error("identity mismatch");
    const jurisdiction = detail.jurisdictional_context?.primary_jurisdiction;
    return {
      id: record.id,
      version: record.record_version,
      jurisdiction: typeof jurisdiction === "string" ? jurisdiction.trim() : "",
    };
  } catch (error) {
    unavailable += 1;
    // Keep a previously verified projection only if it corresponds to the
    // current canonical record version. Never mislabel stale geography as live.
    console.warn(`Dashboard geography: ${record.id} unavailable (${error.message}).`);
    return { id: record.id, version: record.record_version, jurisdiction: "" };
  }
}

async function worker() {
  while (cursor < cases.length) {
    const index = cursor++;
    results[index] = await resolveCase(cases[index]);
  }
}
await Promise.all(Array.from({ length: Math.min(8, cases.length) }, worker));
const projection = {
  source: "VIGIL canonical Incident jurisdictional_context.primary_jurisdiction",
  record_count: cases.length,
  records: results.sort((a, b) => a.id.localeCompare(b.id)),
};
const output = JSON.stringify(projection, null, 2) + "\n";
const existing = await readFile(outputPath, "utf8").catch(() => "");
if (existing !== output) await writeFile(outputPath, output);
console.log(`Jurisdiction projection: ${results.filter(r => r.jurisdiction).length}/${cases.length} explicitly recorded; ${unavailable} detail fetches unavailable.`);
