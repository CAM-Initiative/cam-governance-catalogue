import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = resolve(repoRoot, "docs", "vigil", "VIGIL.Records.Index.json");
const syncMetaPath = resolve(repoRoot, "docs", "vigil", "VIGIL.SyncMeta.json");
const defaultRemoteSource =
  "https://raw.githubusercontent.com/CAM-Initiative/VIGIL/main/vigil/VIGIL.Records.Index.json";

function resolveSource() {
  return process.env.VIGIL_RECORDS_SOURCE || defaultRemoteSource;
}

async function loadSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: {
        "Accept": "application/json,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent": "cam-governance-catalogue-vigil-sync",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  const sourcePath = isAbsolute(source) ? source : resolve(repoRoot, source);
  return readFile(sourcePath, "utf8");
}

function validateJson(sourceText, source) {
  let parsed;

  try {
    parsed = JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`VIGIL records loaded from ${source} are not valid JSON: ${error.message}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`VIGIL records loaded from ${source} must be a top-level JSON object`);
  }

  if (!Array.isArray(parsed.records)) {
    throw new Error(`VIGIL records loaded from ${source} must include a top-level records array`);
  }

  if (typeof parsed.record_count !== "number") {
    throw new Error(`VIGIL records loaded from ${source} must include a numeric record_count`);
  }

  if (parsed.record_count !== parsed.records.length) {
    throw new Error(
      `VIGIL records loaded from ${source} have record_count ${parsed.record_count}, but records.length is ${parsed.records.length}`,
    );
  }

  if (!Object.hasOwn(parsed, "generated_from")) {
    throw new Error(`VIGIL records loaded from ${source} must include generated_from provenance`);
  }

  if (parsed.records.length < 1) {
    throw new Error(`VIGIL records loaded from ${source} must include at least one record`);
  }

  return parsed;
}

const source = resolveSource();

try {
  await mkdir(dirname(outputPath), { recursive: true });
  const sourceText = await loadSource(source);
  const parsed = validateJson(sourceText, source);
  await writeFile(outputPath, sourceText.endsWith("\n") ? sourceText : `${sourceText}\n`);
  await writeFile(
    syncMetaPath,
    `${JSON.stringify(
      {
        source_url: source,
        synced_at_utc: new Date().toISOString(),
        record_count: parsed.record_count,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Synced VIGIL records from ${source}`);
  console.log("Wrote docs/vigil/VIGIL.Records.Index.json");
  console.log("Wrote docs/vigil/VIGIL.SyncMeta.json");
} catch (error) {
  console.error(`Failed to sync VIGIL records from ${source}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
