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
  const publicDisplayPath = join(tempDir, "vigilPublicDisplay.mjs");
  const presentationPath = join(tempDir, "vigilPresentation.mjs");

  await transpileModuleToTemp("src/lib/vigilRegistry.ts", registryPath, (source) => source
    .replace('import registrySources from "@/config/registrySources.json";', `const registrySources = ${JSON.stringify(config)};`)
    .replace(/import\.meta\.env\.BASE_URL/g, '"/"'));
  await transpileModuleToTemp("src/lib/vigilPublicDisplay.ts", publicDisplayPath);
  await transpileModuleToTemp("src/lib/vigilPresentation.ts", presentationPath, (source) => source
    .replace('import { githubBlobUrlForRecord, rawUrlForRecord, type UnknownRecord } from "@/lib/vigilRegistry";', 'import { githubBlobUrlForRecord, rawUrlForRecord } from "./vigilRegistry.mjs";')
    .replace('import { deriveVigilPublicDisplay, type PublicRecordDisplay } from "@/lib/vigilPublicDisplay";', 'import { deriveVigilPublicDisplay } from "./vigilPublicDisplay.mjs";'));

  const modules = {
    registry: await import(registryPath),
    publicDisplay: await import(publicDisplayPath),
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

    const canonicalPriority = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0003",
      title: "Canonical platform projection priority",
      system_context: { platform_or_vendor: "OpenAI", product_or_service: "ChatGPT" },
      observed_vendor: "Lower priority vendor",
      source_records: [{ source_platform: "Lower priority source", system_or_product: "Lower priority product" }],
    });
    assert.equal(canonicalPriority.platform_label, "OpenAI");
    assert.equal(canonicalPriority.affected_platform_label, "OpenAI");
    assert.equal(canonicalPriority.observed_vendor, "OpenAI");
    assert.equal(canonicalPriority.observed_product, "ChatGPT");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("collapsed VIGIL row omits record-file link while keeping readable public fields", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const collapsedRow = page.slice(page.indexOf('aria-controls={detailsPanelId}'), page.indexOf('{isExpanded &&'));
  assert.match(collapsedRow, /record\.title/);
  assert.match(collapsedRow, /record\.platform_label/);
  assert.match(collapsedRow, /record\.type_label/);
  assert.doesNotMatch(collapsedRow, /Source ↗/);
  assert.doesNotMatch(collapsedRow, /Open record/);
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

test("VIGIL detail loader fetches canonical record JSON from raw_url", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { loadVigilRecordDetail } = modules.registry;
    const requested = [];
    const canonical = { id: "VIGIL-2026-OBS-0099", title: "Canonical detail title", canonical_only: true };
    const detail = await loadVigilRecordDetail({ id: "lean-index", raw_url: "https://example.test/vigil/record.json" }, async (url, init) => {
      requested.push({ url, init });
      return { ok: true, json: async () => canonical };
    });

    assert.deepEqual(detail, canonical);
    assert.equal(requested.length, 1);
    assert.match(requested[0].url, /^https:\/\/example\.test\/vigil\/record\.json\?v=/);
    assert.equal(requested[0].init.cache, "no-store");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL detail loader derives canonical raw URL from path", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { loadVigilRecordDetail } = modules.registry;
    let requestedUrl = "";
    await loadVigilRecordDetail({ id: "lean-index", path: "vigil/records/example.json" }, async (url) => {
      requestedUrl = url;
      return { ok: true, json: async () => ({ id: "canonical-from-path" }) };
    });

    assert.match(requestedUrl, /^https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Vigil\/main\/vigil\/records\/example\.json\?v=/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL normalization supports lean index entries without detailed summary objects", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0100",
      title: "Lean index title",
      summary: "Collapsed row summary only",
      record_type: "observation",
      record_state: "watching",
      date_recorded: "2026-06-01",
      source_platform: "GitHub",
      observed_vendor: "OpenAI",
      severity: "medium",
      triage_priority: "review",
      path: "vigil/records/lean.json",
    });

    assert.equal(record.title, "Lean index title");
    assert.equal(record.summary, "Collapsed row summary only");
    assert.equal(record.record_state, "watching");
    assert.equal(record.platform_label, "OpenAI");
    assert.equal(record.affected_platform_label, "OpenAI");
    assert.equal(record.source_platform, "GitHub");
    assert.equal(record.observed_vendor, "OpenAI");
    assert.equal(record.severity, "medium");
    assert.equal(record.triage_priority, "review");
    assert.equal(record.raw.path, "vigil/records/lean.json");
    assert.match(record.raw_url, /^https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Vigil\/main\/vigil\/records\/lean\.json$/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("PATCH public display exposes complete literal corpus amendments", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const { matchesVigilSearch } = modules.publicDisplay;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-PATCH-0099",
      record_type: "patch",
      record_state: "closed-actioned",
      title: "Exact runtime repair",
      summary: "A literal runtime repair was adopted.",
      corpus_implementation: {
        implementation_outcome: "corpus-amendment",
        amendments: [{
          instrument_id: "CAM-BS2025-AEON-003-SCH-02",
          canonical_file_path: "Governance/Constitution/CAM-BS2025-AEON-003-SCH-02.md",
          section: "§7.4.1",
          section_heading: "Weak Trigger and Premature Tool Invocation Constraint",
          action: "amended",
          final_adopted_wording: "Tool invocation SHALL remain proportionate to the active task authority.",
          implemented_date: "2026-07-20",
          verified_against: "0123456789abcdef0123456789abcdef01234567",
          verification_status: "verified",
          current_status: "current",
        }],
      },
    });

    assert.equal(record.publicDisplay.patch.contractStatus, "complete-amendment");
    assert.equal(record.publicDisplay.lifecycleLabel, "Closed—actioned");
    assert.equal(record.publicDisplay.corpusProvisions[0].complete, true);
    assert.equal(record.publicDisplay.corpusProvisions[0].finalWording, "Tool invocation SHALL remain proportionate to the active task authority.");
    assert.equal(matchesVigilSearch(record.searchText, "AEON-003 §7.4.1"), true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("PATCH public display preserves actioned lifecycle while identifying incomplete implementation detail", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-PATCH-0100",
      record_type: "patch",
      record_state: "closed-actioned",
      title: "Description without literal wording",
      change_details: {
        changed_instruments: ["CAM-BS2025-AEON-003-SCH-02"],
        implemented_changes: [{
          section: "§7.4.1",
          description: "The section was updated.",
        }],
      },
    });

    assert.equal(record.publicDisplay.patch.contractStatus, "incomplete");
    assert.equal(record.publicDisplay.lifecycleLabel, "Closed—actioned");
    assert.equal(record.publicDisplay.repairState, "Actioned · implementation details incomplete");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("PATCH public display accepts an explicit no-corpus-change declaration", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-PATCH-0101",
      record_type: "patch",
      record_state: "closed-actioned",
      title: "Verified pre-existing coverage",
      corpus_implementation: {
        implementation_outcome: "pre-existing-control",
        no_corpus_text_changed: true,
        no_corpus_change_explanation: "The PATCH verified and linked an existing control.",
      },
      repair_provenance: {
        retrospective_synthesis: true,
        instruments_amended: [],
        instruments_relied_upon_without_amendment: ["CAM-BS2025-AEON-006-SCH-07"],
        coverage_origin: [{
          instrument_id: "CAM-BS2025-AEON-006-SCH-07",
          relevant_sections: ["§3"],
          action: "relied-upon",
        }],
      },
    });

    assert.equal(record.publicDisplay.patch.contractStatus, "complete-no-corpus-change");
    assert.equal(record.publicDisplay.patch.explicitNoCorpusTextChange, true);
    assert.equal(record.publicDisplay.lifecycleLabel, "Closed—actioned");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL page implements dedicated public views and CAELESTIS authority notice", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  assert.match(page, /function ObservationDetailView/);
  assert.match(page, /function FailureModeDetailView/);
  assert.match(page, /function ProposalDetailView/);
  assert.match(page, /function PatchDetailView/);
  assert.match(page, /function groupCorpusProvisions/);
  assert.match(page, /Applied corpus repairs/);
  assert.match(page, /CAELESTIS remains the authoritative governance corpus/);
  assert.doesNotMatch(page, /Actioned status withheld/);
  assert.match(page, /Implementation details incomplete/);
  assert.match(page, /View current instrument/);
  assert.doesNotMatch(page, /Current CAELESTIS provision/);
});

test("VIGIL proposal targets suppress empty tables and repeated instrument relationships", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  assert.match(page, /const visibleProvisions = patchMode/);
  assert.match(page, /relationshipIsInstrumentRepeat/);
  assert.match(page, /visibleProvisions\.length > 0/);
  assert.match(page, /displayRelationship/);
});

test("affected parties render as readable text rather than coloured pills", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const affectedPartiesTreatment = page.slice(
    page.indexOf('label === "Affected parties or interests"'),
    page.indexOf("return (", page.indexOf('label === "Affected parties or interests"') + 50),
  );
  assert.match(page, /label === "Affected parties or interests"/);
  assert.match(page, /chips\.join\("; "\)/);
  assert.doesNotMatch(affectedPartiesTreatment, /chipTone/);
});

test("VIGIL detail hierarchy leads with the chain and keeps metadata compact", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const expandedRecord = page.slice(page.indexOf('{isExpanded && ('), page.indexOf('<details className="mt-4'));

  assert.ok(expandedRecord.indexOf("<RecordChainView") < expandedRecord.indexOf("<CompactRecordMetadata"));
  assert.doesNotMatch(expandedRecord, /grid gap-3 rounded-lg border border-border\/70 bg-background\/30 p-3 md:grid-cols-2 xl:grid-cols-4/);
  assert.doesNotMatch(page, /title="Linked Records"/);
  assert.doesNotMatch(page, /label: "Source repair status"/);
});

test("failure repair status projects a clean status and next action from structured data", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-FM-0999",
      record_type: "failure_mode",
      record_state: "closed-actioned",
      repair_status: {
        status: "closed",
        next_action: "Incorporated into PATCH-0099.",
      },
    });

    assert.equal(record.publicDisplay.repairState, "Closed");
    assert.equal(record.publicDisplay.failure.repairStatus, "closed");
    assert.equal(record.publicDisplay.failure.repairNextAction, "Incorporated into PATCH-0099.");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL fallback sync projects corpus search fields without copying literal implementation blocks", async () => {
  const syncScript = await readFile(resolve(repoRoot, "scripts/sync-vigil-records.mjs"), "utf8");
  assert.match(syncScript, /"corpus_implementation"/);
  assert.match(syncScript, /"public_display"/);
  assert.match(syncScript, /principal_instruments/);
  assert.match(syncScript, /principal_sections/);
  assert.match(syncScript, /corpus_search_terms/);
  assert.match(syncScript, /display_contract_status/);
});

test("generated VIGIL fallback keeps lean records with projected platform metadata", async () => {
  const fallback = JSON.parse(await readFile(resolve(repoRoot, "docs/data/vigil-registry-fallback.json"), "utf8"));
  assert.ok(Array.isArray(fallback.records));
  assert.ok(fallback.records.length > 0);

  const forbidden = new Set([
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

  for (const entry of fallback.records) {
    for (const key of forbidden) assert.equal(Object.hasOwn(entry, key), false, `${entry.id} includes forbidden nested ${key}`);
    assert.equal(typeof entry.platform_label, "string", `${entry.id} is missing platform_label`);
    assert.equal(typeof entry.affected_platform_label, "string", `${entry.id} is missing affected_platform_label`);
    assert.equal(typeof entry.source_platform, "string", `${entry.id} is missing source_platform`);
    assert.equal(typeof entry.observed_vendor, "string", `${entry.id} is missing observed_vendor`);
    assert.ok(Object.keys(entry).length < 55, `${entry.id} lean index entry is too large`);
  }

  assert.ok(fallback.records.some((entry) => typeof entry.observed_product === "string" && entry.observed_product.length > 0));
});

test("VIGIL page lazy-loads details and warns when canonical detail falls back to index entry", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  assert.match(page, /loadVigilRecordDetail\(record\.raw\)/);
  assert.match(page, /detailDisplayRecord\(record, raw\)/);
  assert.match(page, /detailRecord = detailLoad\?\.status === "ready" \? detailLoad\.displayRecord : record/);
  assert.match(page, /Detailed canonical record could not be loaded\. Showing the registry index entry instead\./);
  assert.match(page, /JSON\.stringify\(detailRecord\.raw, null, 2\)/);
});

test("VIGIL per-record copy and download load canonical detail before exporting JSON", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const copyFunction = page.slice(page.indexOf("async function copyRecordJson"), page.indexOf("async function downloadRecordJson"));
  const downloadFunction = page.slice(page.indexOf("async function downloadRecordJson"), page.indexOf("function toggleExpandedRecord"));

  assert.match(copyFunction, /await ensureRecordDetail\(record, recordKey\)/);
  assert.match(copyFunction, /JSON\.stringify\(detailJson, null, 2\)/);
  assert.doesNotMatch(copyFunction, /JSON\.stringify\(record\.raw, null, 2\)/);
  assert.match(downloadFunction, /await ensureRecordDetail\(record, recordKey\)/);
  assert.match(downloadFunction, /JSON\.stringify\(detailJson, null, 2\)/);
  assert.doesNotMatch(downloadFunction, /JSON\.stringify\(record\.raw, null, 2\)/);
});
