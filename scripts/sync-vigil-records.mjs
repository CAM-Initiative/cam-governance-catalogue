import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = resolve(repoRoot, "docs", "vigil", "VIGIL.Records.Index.json");
const defaultLocalSource = resolve(repoRoot, "..", "VIGIL", "vigil", "VIGIL.Records.Index.json");
const defaultRemoteSource =
  "https://raw.githubusercontent.com/CAM-Initiative/VIGIL/main/vigil/VIGIL.Records.Index.json";

function resolveSource() {
  if (process.env.VIGIL_RECORDS_SOURCE) {
    return process.env.VIGIL_RECORDS_SOURCE;
  }

  if (existsSync(defaultLocalSource)) {
    return defaultLocalSource;
  }

  return defaultRemoteSource;
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
  try {
    JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`VIGIL records loaded from ${source} are not valid JSON: ${error.message}`);
  }
}

const source = resolveSource();

async function loadSourceWithExistingOutputFallback(source) {
  try {
    return { source, text: await loadSource(source) };
  } catch (error) {
    const shouldUseExistingOutput =
      source === defaultRemoteSource && existsSync(outputPath) && !process.env.VIGIL_RECORDS_SOURCE;

    if (!shouldUseExistingOutput) {
      throw error;
    }

    console.warn(`Unable to fetch ${source}; using existing docs/vigil/VIGIL.Records.Index.json`);
    console.warn(error instanceof Error ? error.message : error);
    return { source: outputPath, text: await readFile(outputPath, "utf8") };
  }
}

try {
  await mkdir(dirname(outputPath), { recursive: true });
  const { source: loadedSource, text: sourceText } = await loadSourceWithExistingOutputFallback(source);
  validateJson(sourceText, loadedSource);
  await writeFile(outputPath, sourceText.endsWith("\n") ? sourceText : `${sourceText}\n`);
  console.log(`Synced VIGIL records from ${loadedSource}`);
  console.log("Wrote docs/vigil/VIGIL.Records.Index.json");
} catch (error) {
  console.error(`Failed to sync VIGIL records from ${source}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
