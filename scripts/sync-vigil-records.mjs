import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = resolve(repoRoot, "docs", "vigil");
const syncMetaPath = resolve(outputDir, "VIGIL.SyncMeta.json");
const defaultRemoteBase = "https://raw.githubusercontent.com/CAM-Initiative/VIGIL/main/vigil";
const registerFiles = [
  "VIGIL.ActiveRecords.json",
  "VIGIL.ClosedRecords.json",
  "VIGIL.Records.Index.json",
];
const strictSync = process.env.VIGIL_SYNC_STRICT === "1";

function resolveSource(fileName) {
  const specificEnvName = `VIGIL_${fileName.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}_SOURCE`;
  const specificSource = process.env[specificEnvName];
  if (specificSource) return specificSource;

  if (process.env.VIGIL_RECORDS_SOURCE && fileName === "VIGIL.Records.Index.json") {
    return process.env.VIGIL_RECORDS_SOURCE;
  }

  const sourceBase = process.env.VIGIL_RECORDS_SOURCE_BASE || defaultRemoteBase;
  if (/^https?:\/\//i.test(sourceBase)) {
    return `${sourceBase.replace(/\/$/, "")}/${fileName}`;
  }

  const localBase = isAbsolute(sourceBase) ? sourceBase : resolve(repoRoot, sourceBase);
  return resolve(localBase, fileName);
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

function validateRegisterJson(sourceText, source, fileName) {
  let parsed;

  try {
    parsed = JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`VIGIL register loaded from ${source} is not valid JSON: ${error.message}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`VIGIL register loaded from ${source} must be a top-level JSON object`);
  }

  if (!Array.isArray(parsed.records)) {
    throw new Error(`VIGIL register loaded from ${source} must include a top-level records array`);
  }

  if (typeof parsed.record_count === "number" && parsed.record_count !== parsed.records.length) {
    throw new Error(
      `VIGIL register loaded from ${source} has record_count ${parsed.record_count}, but records.length is ${parsed.records.length}`,
    );
  }

  if (!Object.hasOwn(parsed, "generated_from")) {
    throw new Error(`VIGIL register loaded from ${source} must include generated_from provenance`);
  }

  if (fileName === "VIGIL.Records.Index.json" && parsed.records.length < 1) {
    throw new Error(`VIGIL index loaded from ${source} must include at least one record`);
  }

  return parsed;
}

try {
  await mkdir(outputDir, { recursive: true });
  const syncedFiles = [];

  for (const fileName of registerFiles) {
    const source = resolveSource(fileName);
    let sourceText;
    let syncStatus = "fetched";
    try {
      sourceText = await loadSource(source);
    } catch (error) {
      const existingPath = resolve(outputDir, fileName);
      if (strictSync) throw error;
      try {
        sourceText = await readFile(existingPath, "utf8");
        syncStatus = "stale_local_copy";
        console.warn(`Unable to fetch ${fileName} from ${source}; keeping existing local copy for this build.`);
      } catch {
        console.warn(`Unable to fetch ${fileName} from ${source}; no existing local copy is available, so this optional register was not written.`);
        continue;
      }
    }
    const parsed = validateRegisterJson(sourceText, source, fileName);
    await writeFile(resolve(outputDir, fileName), sourceText.endsWith("\n") ? sourceText : `${sourceText}\n`);
    syncedFiles.push({ file: fileName, source_url: source, record_count: parsed.record_count ?? parsed.records.length, status: syncStatus });
    console.log(`${syncStatus === "fetched" ? "Synced" : "Retained"} ${fileName} from ${source}`);
  }

  await writeFile(
    syncMetaPath,
    `${JSON.stringify(
      {
        synced_at_utc: new Date().toISOString(),
        files: syncedFiles,
      },
      null,
      2,
    )}\n`,
  );

  console.log("Wrote docs/vigil VIGIL register copies and VIGIL.SyncMeta.json");
} catch (error) {
  console.error("Failed to sync VIGIL generated registers");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
