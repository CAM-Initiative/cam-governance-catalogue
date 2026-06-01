import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);

async function transpileModuleToTemp(sourcePath, outputPath, transform = (text) => text) {
  const source = transform(await readFile(resolve(repoRoot, sourcePath), "utf8"));
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      resolveJsonModule: true,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText;
  await writeFile(outputPath, transpiled);
}

async function loadVigilModules() {
  const tempDir = await mkdtemp(join(tmpdir(), "vigil-observatory-test-"));
  const config = JSON.parse(await readFile(resolve(repoRoot, "src/config/registrySources.json"), "utf8"));
  const registryPath = join(tempDir, "vigilRegistry.mjs");
  const presentationPath = join(tempDir, "vigilPresentation.mjs");

  await transpileModuleToTemp("src/lib/vigilRegistry.ts", registryPath, (source) => source
    .replace('import registrySources from "@/config/registrySources.json";', `const registrySources = ${JSON.stringify(config)};`)
    .replace(/import\.meta\.env\.BASE_URL/g, '"/"'));
  await transpileModuleToTemp("src/lib/vigilPresentation.ts", presentationPath, (source) => source
    .replace('import { githubBlobUrlForRecord, rawUrlForRecord, type UnknownRecord } from "@/lib/vigilRegistry";', 'import { githubBlobUrlForRecord, rawUrlForRecord } from "./vigilRegistry.mjs";'));

  const modules = {
    registry: await import(registryPath),
    presentation: await import(presentationPath),
  };
  return { tempDir, modules };
}

test("VIGIL normalization exposes human-readable title and only uses ID as last title fallback", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const titled = normalizeVigilRecord({
      id: "VIGIL-2026-FM-0001",
      record_identity: { title: "Human Readable Registry Title" },
      summary: "Summary fallback should not override identity title",
    });
    assert.equal(titled.title, "Human Readable Registry Title");

    const untitled = normalizeVigilRecord({ id: "VIGIL-2026-FM-0002" });
    assert.equal(untitled.title, "VIGIL-2026-FM-0002");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL normalization resolves source and platform display fields", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const systemPlatform = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0001",
      title: "System summary platform",
      github_blob_url: "https://github.com/CAM-Initiative/Vigil/blob/main/vigil/records/example.json",
      raw_url: "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/records/example.json",
      system_summary: { platform_or_vendor: "OpenAI" },
      source_summary: { primary_source_platform: "GitHub", primary_source_type: "issue" },
    });
    assert.equal(systemPlatform.platform_label, "OpenAI");
    assert.equal(systemPlatform.github_blob_url, "https://github.com/CAM-Initiative/Vigil/blob/main/vigil/records/example.json");

    const sourceFallback = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0002",
      title: "Source fallback platform",
      source_records: [{ source_platform: "TikTok" }],
    });
    assert.equal(sourceFallback.platform_label, "TikTok");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("collapsed VIGIL row keeps clean public source presentation", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const collapsedRow = page.slice(page.indexOf('aria-controls={detailsPanelId}'), page.indexOf('{isExpanded &&'));
  assert.match(collapsedRow, /record\.title/);
  assert.match(collapsedRow, /record\.platform_label/);
  assert.match(collapsedRow, /record\.type_label/);
  assert.match(collapsedRow, /Source ↗/);
  assert.doesNotMatch(collapsedRow, /Raw JSON/);
  assert.doesNotMatch(collapsedRow, /record\.id/);
});

test("VIGIL live registry resolver follows master child indexes without deprecated files", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { resolveVigilRegistryRecords, VIGIL_REGISTRY_URL } = modules.registry;
    assert.equal(VIGIL_REGISTRY_URL, "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Registry.Index.json");

    const requested = [];
    const fetcher = async (url) => {
      requested.push(url);
      return {
        ok: true,
        json: async () => ({ records: [{ id: "VIGIL-2026-FM-0003", title: "Loaded from child registry" }] }),
      };
    };
    const records = await resolveVigilRegistryRecords({ registries: { failure_modes: { raw_url: "https://example.test/vigil/failure-modes.json" } } }, fetcher);
    assert.equal(records.length, 1);
    assert.equal(records[0].title, "Loaded from child registry");
    assert.equal(records[0].source_registry, "failure_modes");
    assert.equal(requested.length, 1);
    for (const url of requested) {
      assert.doesNotMatch(url, /VIGIL\.(Records|ActiveRecords|ClosedRecords|Records\.Index)\.json/);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
