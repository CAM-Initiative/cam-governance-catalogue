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

test("VIGIL normalization exposes record citation version and last update", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0020",
      record_type: "observation",
      record_identity: {
        title: "Citation metadata observation",
        version: "1.0",
        updated: "2026-07-25",
      },
    });
    assert.equal(record.record_version, "1.0");
    assert.equal(record.record_last_updated, "2026-07-25");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL search indexes source metadata as conjunctive discovery fields", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const { matchesVigilSearch } = modules.publicDisplay;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0199",
      record_type: "observation",
      title: "Runtime security event",
      summary: "A verified security incident involving an evaluation pathway.",
      primary_source_title: "OpenAI and Hugging Face partner to address security incident",
      primary_source_platform: "OpenAI",
      source_platforms: ["OpenAI", "Hugging Face"],
      source_types: ["official-source"],
    });

    assert.equal(matchesVigilSearch(record.searchText, "Hugging Face"), true);
    assert.equal(matchesVigilSearch(record.searchText, "Hugging Face security incident"), true);
    assert.equal(matchesVigilSearch(record.searchText, "Reuters"), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL normalization never fabricates placeholder record identifiers", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeRecords, normalizeVigilRecord } = modules.presentation;
    const records = normalizeRecords([
      { summary: "Missing canonical identity" },
      { id: "VIGIL-1", summary: "Malformed identity" },
      { id: "VIGIL-2026-FM-0001", record_type: "failure_mode", title: "Canonical record" },
    ]);

    assert.deepEqual(records.map((record) => record.id), ["VIGIL-2026-FM-0001"]);
    assert.throws(
      () => normalizeVigilRecord({ summary: "Missing canonical identity" }),
      /does not contain a canonical record ID/,
    );
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

test("red-team proposal uses its declared chain and excludes contextual records", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const proposal = normalizeVigilRecord({
      id: "VIGIL-2026-PROP-0019",
      record_type: "proposal",
      linked_records: {
        related_failure_modes: ["VIGIL-2026-FM-0047"],
        related_proposals: ["VIGIL-2026-PROP-0017"],
        research: ["VIGIL-2026-RESEARCH-0002"],
        contextual_relations: [
          { record_id: "VIGIL-2026-FM-0002", relationship: "adjacent-control-problem", chain_inclusion: false },
          { record_id: "VIGIL-2026-FM-0044", relationship: "supporting-mechanism", chain_inclusion: false },
        ],
      },
      repair_scope: {
        primary_failure_mode: "VIGIL-2026-FM-0047",
        additional_resolved_failure_modes: [],
      },
    });

    assert.deepEqual(proposal.publicDisplay.chain, {
      observations: ["VIGIL-2026-RESEARCH-0002"],
      failureModes: ["VIGIL-2026-FM-0047"],
      proposals: ["VIGIL-2026-PROP-0019"],
      patches: [],
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("collapsed VIGIL row omits record-file link while keeping readable public fields", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const collapsedRow = page.slice(page.indexOf('aria-controls={detailsPanelId}'), page.indexOf('{isExpanded &&'));
  assert.match(collapsedRow, /record\.title/);
  assert.match(collapsedRow, /record\.platform_label/);
  assert.match(collapsedRow, /recordTypeLabel\(record\.record_type\)/);
  assert.doesNotMatch(collapsedRow, /Source ↗/);
  assert.doesNotMatch(collapsedRow, /Open record/);
  assert.doesNotMatch(collapsedRow, /Raw JSON/);
  assert.doesNotMatch(collapsedRow, /record\.id/);
});

test("generated evidence reports use declared source evidence from observations and failure modes", async () => {
  const report = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report.tsx"), "utf8");
  assert.match(report, /state\.chain\.observations/);
  assert.match(report, /state\.chain\.failureModes/);
  assert.match(report, /function ObservationEvidenceRecord/);
  assert.match(report, /function SupportingEvidence/);
  assert.match(report, /supportingSourceEvidence/);
  assert.match(report, /function isVigilRecordCitationSource/);
  assert.match(report, /function externalSourceEvidenceFor/);
  assert.match(report, /VIGIL Interpretation/);
  assert.doesNotMatch(report, /VIGIL CITATION/);
  assert.doesNotMatch(report, /function VigilCitation/);
  assert.doesNotMatch(report, /<VigilCitation record=\{record\}/);
  assert.match(report, /record_version/);
  assert.match(report, /recordTitle: record\.title/);
  assert.match(report, /recordVersion: record\.record_version/);
  assert.match(report, /recordLastUpdated: record\.record_last_updated/);
  assert.match(report, /record_last_updated/);
  assert.match(report, /VIGIL Observatory/);
  assert.doesNotMatch(report, /Record ID:/);
  assert.doesNotMatch(report, /Record Title:/);
  assert.doesNotMatch(report, /Record Version:/);
  assert.doesNotMatch(report, /Record Last Update:/);
  assert.match(report, /What was observed/);
  assert.match(report, /Context/);
  assert.match(report, /Interpretation/);
  assert.match(report, /label: "Observation"/);
  assert.match(report, /label: "Classification"/);
  assert.match(report, /label: "Diagnosis"/);
  assert.match(report, /The implemented corpus repair, relied-upon control, verification, and residual monitoring/);
  assert.match(report, /Corpus implementation by instrument section/);
  assert.match(report, /bg-\[hsl\(var\(--cam-corpus-heading\)\)\]/);
  assert.match(report, /bg-\[hsl\(var\(--cam-corpus-metadata\)\)\]/);
  assert.doesNotMatch(report, /External source evidence/);
  assert.doesNotMatch(report, /The external source is shown first/);
  assert.doesNotMatch(report, /VIGIL observation record/);
  assert.doesNotMatch(report, /Open external source/);
  assert.doesNotMatch(report, /View in Observatory/);
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

test("VIGIL detail loader parses Markdown research records as front matter plus body", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { loadVigilRecordDetail } = modules.registry;
    let jsonCalled = false;
    const detail = await loadVigilRecordDetail({ id: "lean-index", raw_url: "https://example.test/vigil/records/research/2026/VIGIL-2026-RESEARCH-0002.md" }, async (url, init) => ({
      ok: true,
      text: async () => "---\nid: VIGIL-2026-RESEARCH-0002\nrecord_type: research\ntitle: Red-team governance research\ndomains: [OPERATIONS, SECURITY]\nsources:\n  - https://example.test/source\n---\n\n# Research finding\n\nThe Markdown body remains available for public reading.\n",
      json: async () => { jsonCalled = true; return {}; },
    }));

    assert.equal(jsonCalled, false);
    assert.equal(detail.id, "VIGIL-2026-RESEARCH-0002");
    assert.equal(detail.record_type, "research");
    assert.equal(detail.title, "Red-team governance research");
    assert.deepEqual(detail.domains, ["OPERATIONS", "SECURITY"]);
    assert.deepEqual(detail.sources, ["https://example.test/source"]);
    assert.match(detail._canonical_markdown_body, /# Research finding/);
    assert.match(detail._canonical_markdown_body, /Markdown body remains available/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL detail loader preserves JSON front matter used by canonical research artefacts", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { loadVigilRecordDetail } = modules.registry;
    const detail = await loadVigilRecordDetail({ raw_url: "https://example.test/vigil/records/research/2026/VIGIL-2026-RESEARCH-0002.md" }, async () => ({
      ok: true,
      text: async () => `---\n{\n  "id": "VIGIL-2026-RESEARCH-0002",\n  "record_type": "research",\n  "title": "Red-team governance research",\n  "summary": "A concise public research summary.",\n  "domains": ["ETHICS", "SECURITY"],\n  "linked_records": { "related_proposals": ["VIGIL-2026-PROP-0019"] }\n}\n---\n\n# Research finding\n\nThe canonical Markdown body remains available for public reading.`,
      json: async () => { throw new Error("Markdown must not be parsed as JSON response data"); },
    }));

    assert.equal(detail.id, "VIGIL-2026-RESEARCH-0002");
    assert.equal(detail.record_type, "research");
    assert.equal(detail.summary, "A concise public research summary.");
    assert.deepEqual(detail.domains, ["ETHICS", "SECURITY"]);
    assert.deepEqual(detail.linked_records, { related_proposals: ["VIGIL-2026-PROP-0019"] });
    assert.match(detail._canonical_markdown_body, /# Research finding\n\nThe canonical Markdown body/);
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

test("PATCH v2 entries are authoritative and expose literal, pinned verification detail", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-PATCH-0025",
      record_type: "patch",
      record_state: "closed-actioned",
      date_implemented: "2026-07-23",
      corpus_implementation: {
        implementation_outcome: "implemented",
        canonical_state: "branch-only",
        entries: [
          {
            instrument_id: "CAM-EQ2026-ETHICS-001-PLATINUM",
            canonical_path: "Governance/Charters/CAM-EQ2026-ETHICS-001-PLATINUM.md",
            section: "§2.2",
            section_heading: "Objective–Pathway Ethical Admissibility",
            change_kind: "added",
            prior_text: null,
            resulting_text: "Ethical admissibility applies independently to the objective and pathway.",
            source: {
              repository: "CAM-Initiative/Caelestis",
              commit: "bd22cad95de6b78c4c613353eadacda9b8253e0e",
              path: "Governance/Charters/CAM-EQ2026-ETHICS-001-PLATINUM.md",
              direct_url: "https://github.com/CAM-Initiative/Caelestis/blob/bd22cad95de6b78c4c613353eadacda9b8253e0e/Governance/Charters/CAM-EQ2026-ETHICS-001-PLATINUM.md",
            },
            verification: {
              status: "verified-branch-only",
              exact_text_match: true,
              current_clause_status: "current",
            },
          },
          {
            instrument_id: "CAM-EQ2026-SECURITY-002-PLATINUM",
            canonical_path: "Governance/Charters/CAM-EQ2026-SECURITY-002-PLATINUM.md",
            section: "§2.2.11",
            section_heading: "Source-Authority Separation Boundary",
            change_kind: "relied-upon",
            prior_text: "Existing control text.",
            resulting_text: "Existing control text.",
            source: {
              commit: "bd22cad95de6b78c4c613353eadacda9b8253e0e",
              direct_url: "https://github.com/CAM-Initiative/Caelestis/blob/bd22cad95de6b78c4c613353eadacda9b8253e0e/Governance/Charters/CAM-EQ2026-SECURITY-002-PLATINUM.md",
            },
            verification: {
              status: "verified-branch-only",
              exact_text_match: true,
              current_clause_status: "current",
            },
          },
        ],
      },
      implementation_verification: {
        verification_status: "verified-branch-only",
        implementation_state: "branch-only",
      },
      repair_provenance: {
        coverage_origin: [{
          instrument_id: "CAM-EQ2026-ETHICS-001-PLATINUM",
          canonical_path: "Governance/Charters/CAM-EQ2026-ETHICS-001-PLATINUM.md",
          relevant_sections: ["§2.2 Objective–Pathway Ethical Admissibility"],
        }],
      },
    });

    const provisions = record.publicDisplay.corpusProvisions;
    assert.equal(record.publicDisplay.patch.contractStatus, "complete-amendment");
    assert.equal(record.publicDisplay.patch.verificationStatus, "Verified on Caelestis working branch · exact text match · not yet canonical");
    assert.equal(provisions.length, 2, "legacy coverage_origin must not duplicate authoritative v2 entries");
    assert.equal(provisions[0].action, "added");
    assert.equal(provisions[0].finalWording, "Ethical admissibility applies independently to the objective and pathway.");
    assert.equal(provisions[0].implementedDate, "2026-07-23");
    assert.equal(provisions[0].verifiedAgainst, "bd22cad95de6b78c4c613353eadacda9b8253e0e");
    assert.equal(provisions[0].verificationStatus, "Verified on Caelestis working branch · exact text match · not yet canonical");
    assert.equal(provisions[0].currentStatus, "current");
    assert.match(provisions[0].canonicalUrl, /Caelestis\/blob\/bd22cad9/);
    assert.equal(provisions[1].action, "relied-upon");
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
  assert.match(page, /Existing control—unchanged/);
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

test("vendor pills use stable vendor-specific colours", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  assert.match(page, /const vendorTones/);
  assert.match(page, /\\bopenai\\b/);
  assert.match(page, /\\banthropic\\b/);
  assert.match(page, /\\bxai\\b/);
  assert.match(page, /\\bgoogle\\b/);
  assert.match(page, /\\bmeta\\b/);
  assert.match(page, /\\bmicrosoft\\b/);
  assert.match(page, /\\breplit\\b/);
  assert.match(page, /function pillTone/);
  assert.match(page, /pillTone\(label, item\)/);
});

test("literal PATCH wording is present but collapsed by default", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const wordingDisclosure = page.slice(
    page.indexOf('<details className="group/wording'),
    page.indexOf("{patchMode && provision.previousWording"),
  );
  assert.match(wordingDisclosure, /<summary/);
  assert.match(wordingDisclosure, /Final adopted wording/);
  assert.match(wordingDisclosure, /Literal wording removed/);
  assert.match(wordingDisclosure, /<blockquote/);
  assert.doesNotMatch(wordingDisclosure, /<details[^>]*\sopen(?:=|>)/);
});

test("VIGIL detail hierarchy leads with the chain and omits the redundant metadata bundle", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const expandedRecord = page.slice(page.indexOf('{isExpanded && ('), page.indexOf('<details className="mt-4'));

  assert.match(expandedRecord, /<RecordChainView/);
  assert.doesNotMatch(page, /CompactRecordMetadata/);
  assert.match(page, /Generate report/);
  assert.doesNotMatch(expandedRecord, /grid gap-3 rounded-lg border border-border\/70 bg-background\/30 p-3 md:grid-cols-2 xl:grid-cols-4/);
  assert.doesNotMatch(page, /title="Linked Records"/);
  assert.doesNotMatch(page, /label: "Source repair status"/);
  assert.match(page, /md:hidden[^\n]*>↓</);
});

test("Evidence Chain Report is a dedicated print-friendly route and preserves incomplete stages", async () => {
  const app = await readFile(resolve(repoRoot, "src/App.tsx"), "utf8");
  const report = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report.tsx"), "utf8");

  assert.match(app, /path="\/observatory\/reports\/:recordId"/);
  assert.match(report, /Print \/ Save as PDF/);
  assert.match(report, /not yet linked/);
  assert.match(report, /A repair may still be in development/);
  assert.match(report, /Observation \/ Research/);
  assert.match(report, /VIGIL preserves the evidence-to-repair-and-learning audit trail/);
  assert.match(report, /function RecordLedger/);
  assert.match(report, /function ObservationStage/);
  assert.match(report, /function ClassificationStage/);
  assert.match(report, /function DiagnoseStage/);
  assert.match(report, /function RepairStage/);
  assert.match(report, /function LearnStage/);
  assert.match(report, /function isExternalObservationEvidence/);
  assert.match(report, /record\.record_type === "research"/);
  assert.match(report, /observedVendor\.includes\("cam initiative"\)/);
  assert.doesNotMatch(report, /function ReportRecord/);
  assert.match(report, /primary linked VIGIL records/);
  assert.match(report, /function reportChainWithKnownRecords/);
});

test("expanded VIGIL records keep all post-chain detail sections collapsed by default", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const detailStart = page.indexOf("function ObservationDetailView");
  const detailEnd = page.indexOf("function recordExportText");
  const detailViews = page.slice(detailStart, detailEnd);

  assert.doesNotMatch(detailViews, /<DetailSection[^>]*\bdefaultOpen/);
  assert.doesNotMatch(detailViews, /<SummaryBlock[^>]*\bdefaultOpen/);
  assert.match(page, /Generated evidence-chain reports/);
  assert.match(page, /The report does not follow contextual links/);
});

test("Evidence Chain Report keeps citation details at the end and reflows diagnosis content", async () => {
  const report = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report.tsx"), "utf8");

  assert.doesNotMatch(report, /report-step-index/);
  assert.match(report, /function collectCitations/);
  assert.match(report, /function externalSourceEvidenceFor/);
  assert.match(report, /for \(const record of records\) for \(const source of externalSourceEvidenceFor\(record\)\)/);
  assert.match(report, /record\.github_blob_url \|\| record\.raw_url \|\| undefined/);
  assert.match(report, /recordTitle: record\.title/);
  assert.match(report, /recordVersion: record\.record_version/);
  assert.match(report, /recordLastUpdated: record\.record_last_updated/);
  assert.match(report, /const citation = vigilCitationNumber\(id, citations\)/);
  assert.match(report, /aria-label=.*Citation.*citation/);
  assert.match(report, /citations=\{citations\}/);
  assert.doesNotMatch(report, /VIGIL canonical record/);
  assert.match(report, /function Citations/);
  assert.match(report, /<cite className="not-italic">/);
  assert.match(report, /VIGIL Observatory/);
  assert.doesNotMatch(report, /grid gap-x-4 gap-y-1 text-xs/);
  assert.doesNotMatch(report, /Record Version:/);
  assert.doesNotMatch(report, /Record Last Update:/);
  assert.match(report, /function normalizeReportRecord/);
  assert.match(report, /VIGIL Interpretation/);
  assert.doesNotMatch(report, /function VigilCitation/);
  assert.doesNotMatch(report, /VIGIL CITATION/);
  assert.match(report, /kind: "vigil"/);
  assert.match(report, /generatedAt: new Date\(\)\.toISOString\(\)/);
  assert.match(report, /type="checkbox"/);
  assert.match(report, /Problem Diagnosed/);
  assert.match(report, /VIGIL Proposal/);
  assert.doesNotMatch(report, /External source evidence/);
  assert.doesNotMatch(report, /The external source is shown first/);
  assert.doesNotMatch(report, /VIGIL observation record/);
  assert.doesNotMatch(report, /Affected domains.*record\.affected_domains/);
  assert.doesNotMatch(report, /Affected parties or interests.*record\.publicDisplay\.failure/);
  assert.doesNotMatch(report, /Decision status.*record\.publicDisplay\.proposal/);
  assert.doesNotMatch(report, /Proposal type.*record\.proposal_type/);
  assert.doesNotMatch(report, /External relevance.*record\.external_relevance/);
  assert.doesNotMatch(report, /Proposed outcome/);
  assert.match(report, /chain\.patches\.length > 0/);
});

test("home Evidence to Repair steps use readable cards within a horizontal scroll region", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/home.tsx"), "utf8");

  assert.match(page, /role="region" aria-label="VIGIL evidence-to-repair six-step method"/);
  assert.match(page, /overflow-x-auto overflow-y-hidden/);
  assert.match(page, /min-h-\[220px\] w-\[260px\]/);
  assert.match(page, /font-mono text-sm font-medium uppercase/);
  assert.match(page, /text-base font-normal leading-relaxed text-muted-foreground/);
  assert.doesNotMatch(page, /min-h-\[175px\] w-\[160px\]/);
  assert.doesNotMatch(page, /text-\[13px\] font-light/);
});

test("responsive shell and evidence reports use available width and readable type", async () => {
  const shell = await readFile(resolve(repoRoot, "src/components/layout/Shell.tsx"), "utf8");
  const home = await readFile(resolve(repoRoot, "src/pages/home.tsx"), "utf8");
  const report = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report.tsx"), "utf8");
  const polishCss = await readFile(resolve(repoRoot, "src/polish.css"), "utf8");
  const diagnosis = report.slice(report.indexOf("function DiagnoseStage"), report.indexOf("function ProvisionTable"));

  assert.match(shell, /aria-label="Footer" className="flex w-full max-w-full flex-wrap/);
  assert.doesNotMatch(shell, /aria-label="Footer" className="flex flex-nowrap/);
  assert.match(home, /w-full max-w-\[100rem\]/);
  assert.match(home, /lg:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(27rem,0\.85fr\)\]/);
  assert.match(report, /report-page container mx-auto w-full max-w-7xl px-4/);
  assert.match(report, /<div className="sm:col-span-2"><Narrative label="Interpretation"/);
  assert.doesNotMatch(report, /text-\[(?:9|10|11)px\]/);
  assert.match(report, /text-base leading-relaxed text-foreground\/85/);
  assert.doesNotMatch(diagnosis, /RecordHeading/);
  assert.match(diagnosis, /Problem Diagnosed/);
  assert.match(diagnosis, /VIGIL Proposal/);
  assert.match(polishCss, /font-size: 0\.75rem;/);
});

test("Repair corpus provisions use the CAM Corpus visual hierarchy", async () => {
  const report = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report.tsx"), "utf8");
  const palette = await readFile(resolve(repoRoot, "src/index.css"), "utf8");
  const provisions = report.slice(report.indexOf("function provisionActionLabel"), report.indexOf("function RepairStage"));

  assert.match(provisions, /Existing control — no amendment required/);
  assert.match(provisions, /Existing applicable wording/);
  assert.match(provisions, /function CorpusWording/);
  assert.match(provisions, /<strong key=\{index\}>/);
  assert.match(palette, /--cam-corpus-selected: 38 34% 82%;/);
  assert.match(palette, /--cam-corpus-heading: var\(--cam-corpus-selected\);/);
  assert.match(palette, /--cam-corpus-metadata: var\(--secondary\);/);
  assert.match(provisions, /bg-\[hsl\(var\(--cam-corpus-heading\)\)\]/);
  assert.match(provisions, /bg-\[hsl\(var\(--cam-corpus-metadata\)\)\]/);
  assert.doesNotMatch(provisions, /hsl\(145_/);
  assert.match(provisions, /Verification:<\/span>/);
  assert.match(provisions, /font-mono text-cam-gold underline/);
  assert.match(provisions, /const sourceUrl = provision\.canonicalUrl \?\? provision\.implementationUrl/);
  assert.doesNotMatch(provisions, /provision\.currentStatus/);
  assert.doesNotMatch(provisions, /View verified corpus source/);
  assert.doesNotMatch(provisions, /sm:grid-cols-\[minmax\(0,0\.8fr\)_minmax\(0,1fr\)\]/);
});

test("VIGIL result actions stay with the record count and pagination", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const filterGridIndex = page.indexOf('className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"');
  const actionsIndex = page.indexOf('aria-label="VIGIL results actions"');

  assert.ok(filterGridIndex >= 0, "The VIGIL filter grid should remain present.");
  assert.ok(actionsIndex > filterGridIndex, "Clear and export controls should follow the filter grid in the results toolbar.");
  assert.match(page, />\s*Clear filters\s*</);
  assert.match(page, />\s*Export current view\s*</);
});

test("generated reports suppress duplicated observation preambles", async () => {
  const report = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report.tsx"), "utf8");
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");

  assert.match(report, /function distinctObservationPreamble/);
  assert.match(report, /normalizedNarrative\(preamble\) === normalizedNarrative\(observed\)/);
  assert.match(report, /preamble && <div/);
  assert.match(report, /report-section-excluded/);
  assert.match(page, /Generate report →/);
  assert.match(page, /bg-\[hsl\(38_48%_90%\)\]/);
  assert.doesNotMatch(page, /bg-\[hsl\(146_35%_24%\)\]/);
});

test("public interface legibility pass standardises VIGIL typography, controls, and type labels", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const home = await readFile(resolve(repoRoot, "src/pages/home.tsx"), "utf8");
  const indexCss = await readFile(resolve(repoRoot, "src/index.css"), "utf8");
  const polishCss = await readFile(resolve(repoRoot, "src/polish.css"), "utf8");

  assert.match(page, /className="vigil-about-panel/);
  assert.match(page, /className="vigil-detail-surface/);
  assert.match(page, /\{index \+ 1\}\. \{step\.label\}/);
  assert.match(page, /cam-parchment-card rounded-lg border/);
  assert.match(page, /failure_mode: "Failure Mode"/);
  assert.match(page, /patch_note: "Patch"/);
  assert.match(page, /border-rose-300 bg-rose-50/);
  assert.match(page, /border-blue-300 bg-blue-50/);
  assert.match(page, /border-orange-400 bg-orange-50/);
  assert.match(page, /border-emerald-300 bg-emerald-50/);
  assert.match(page, /bg-\[hsl\(38_48%_90%\)\].*Generate report/);
  assert.doesNotMatch(page, /bg-foreground[^"]*">Generate report/);
  assert.match(home, /text-\[17px\] leading-relaxed/);
  assert.match(home, /font-mono text-sm font-semibold uppercase/);
  assert.match(indexCss, /button\[aria-pressed="false"\]:hover/);
  assert.match(polishCss, /\.vigil-detail-surface p:not/);
  assert.match(polishCss, /font-size: 1rem !important/);
});

test("expanded VIGIL header keeps the record ID with its icon controls and removes redundant search help", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  const detailHeader = page.slice(page.indexOf('className="vigil-detail-surface'), page.indexOf('{detailLoad?.status === "loading"'));

  assert.match(detailHeader, /flex flex-wrap items-center justify-between gap-3/);
  assert.match(detailHeader, /detailRecord\.id/);
  assert.match(detailHeader, /Copy raw JSON/);
  assert.match(detailHeader, /Download raw JSON/);
  assert.match(detailHeader, /Collapse record/);
  assert.doesNotMatch(page, /vigil-search-help/);
  assert.doesNotMatch(page, /Source titles, publishers, source types, source platforms, vendors, jurisdictions, and source domains are searchable metadata/);
});
test("Observatory PATCH rows keep verification compact and move commentary into wording detail", async () => {
  const page = await readFile(resolve(repoRoot, "src/pages/vigil.tsx"), "utf8");
  assert.match(page, /const verificationMark = provision\.complete \? "✓" : "—"/);
  assert.match(page, /Verification detail/);
  assert.doesNotMatch(page, /patchMode \? verification : provision\.currentStatus/);
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
  assert.doesNotMatch(page, /View source record/);
  assert.doesNotMatch(page, /Technical JSON/);
  assert.doesNotMatch(page, /Open record/);
  assert.doesNotMatch(page, /Record path:/);
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
