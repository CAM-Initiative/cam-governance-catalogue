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

  return {
    tempDir,
    modules: {
      registry: await import(registryPath),
      publicDisplay: await import(publicDisplayPath),
      presentation: await import(presentationPath),
    },
  };
}

test("VIGIL normalization preserves canonical public identity and citation metadata", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0020",
      record_type: "observation",
      record_identity: {
        title: "Human Readable Registry Title",
        version: "1.0",
        updated: "2026-07-25",
      },
      summary: "Summary fallback should not override identity title",
    });
    assert.equal(record.title, "Human Readable Registry Title");
    assert.equal(record.record_version, "1.0");
    assert.equal(record.record_last_updated, "2026-07-25");

    const untitled = normalizeVigilRecord({ id: "VIGIL-2026-FM-0002" });
    assert.equal(untitled.title, "VIGIL-2026-FM-0002");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL normalization rejects non-canonical identifiers and indexes source metadata for search", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeRecords, normalizeVigilRecord } = modules.presentation;
    const { matchesVigilSearch } = modules.publicDisplay;

    const records = normalizeRecords([
      { summary: "Missing canonical identity" },
      { id: "VIGIL-1", summary: "Malformed identity" },
      { id: "VIGIL-2026-FM-0001", record_type: "failure_mode", title: "Canonical record" },
    ]);
    assert.deepEqual(records.map((record) => record.id), ["VIGIL-2026-FM-0001"]);
    assert.throws(() => normalizeVigilRecord({ summary: "Missing canonical identity" }), /does not contain a canonical record ID/);

    const searchable = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0199",
      record_type: "observation",
      title: "Runtime security event",
      summary: "A verified security incident involving an evaluation pathway.",
      primary_source_title: "OpenAI and Hugging Face partner to address security incident",
      primary_source_platform: "OpenAI",
      source_platforms: ["OpenAI", "Hugging Face"],
      source_types: ["official-source"],
    });
    assert.equal(matchesVigilSearch(searchable.searchText, "Hugging Face security incident"), true);
    assert.equal(matchesVigilSearch(searchable.searchText, "Reuters"), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL normalization resolves canonical system and platform fields", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const record = normalizeVigilRecord({
      id: "VIGIL-2026-OBS-0003",
      title: "Canonical platform projection priority",
      system_context: { platform_or_vendor: "OpenAI", product_or_service: "ChatGPT" },
      observed_vendor: "Lower priority vendor",
      source_records: [{ source_platform: "Lower priority source", system_or_product: "Lower priority product" }],
    });
    assert.equal(record.platform_label, "OpenAI");
    assert.equal(record.affected_platform_label, "OpenAI");
    assert.equal(record.observed_vendor, "OpenAI");
    assert.equal(record.observed_product, "ChatGPT");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("declared VIGIL chains exclude contextual records that are not chain members", async () => {
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
      repair_scope: { primary_failure_mode: "VIGIL-2026-FM-0047", additional_resolved_failure_modes: [] },
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

test("VIGIL model-2.0 normalization keeps severity, priority, monitoring and repair independent", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord, shouldShowCurrentPriority, vigilOperationalRank } = modules.presentation;
    const active = normalizeVigilRecord({
      id: "VIGIL-2026-FM-0101",
      record_type: "failure_mode",
      record_state: "active",
      failure_classification: { severity: "S1" },
      triage: { triage_priority: "P1", triage_status: "action-required" },
      ecosystem_status: { monitoring_required: true },
      repair_status: { status: "unrepaired" },
    });
    const monitored = normalizeVigilRecord({
      id: "VIGIL-2026-FM-0102",
      record_type: "failure_mode",
      record_state: "monitoring",
      failure_classification: { severity: "S1" },
      triage: { triage_priority: "PN", triage_status: "monitoring" },
      ecosystem_status: { monitoring_required: true },
      repair_status: { status: "repaired" },
    });
    const closed = normalizeVigilRecord({
      id: "VIGIL-2026-FM-0103",
      record_type: "failure_mode",
      record_state: "closed",
      failure_classification: { severity: "S3" },
      triage: { triage_priority: "PN", triage_status: "closed" },
      ecosystem_status: { monitoring_required: false },
      repair_status: { status: "repaired" },
    });

    assert.equal(active.severity, "S1");
    assert.equal(active.triage_priority, "P1");
    assert.equal(active.triage_status, "action-required");
    assert.equal(active.monitoring_required, true);
    assert.equal(active.repair_status, "unrepaired");
    assert.equal(shouldShowCurrentPriority(active.triage_priority), true);
    assert.equal(shouldShowCurrentPriority(monitored.triage_priority), false);
    assert.ok(vigilOperationalRank(active) < vigilOperationalRank(monitored));
    assert.ok(vigilOperationalRank(monitored) < vigilOperationalRank(closed));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL live registry resolver follows the master child indexes", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { resolveVigilRegistryRecords, VIGIL_REGISTRY_URL } = modules.registry;
    assert.equal(VIGIL_REGISTRY_URL, "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Registry.Index.json");

    const requested = [];
    const fetcher = async (url) => {
      requested.push(url);
      return { ok: true, json: async () => ({ records: [{ id: "VIGIL-2026-FM-0003", title: "Loaded from child registry" }] }) };
    };
    const records = await resolveVigilRegistryRecords({ registries: { failure_modes: { raw_url: "https://example.test/vigil/failure-modes.json" } } }, fetcher);
    assert.equal(records.length, 1);
    assert.equal(records[0].source_registry, "failure_modes");
    assert.equal(requested.length, 1);
    assert.doesNotMatch(requested[0], /VIGIL\.(Records|ActiveRecords|ClosedRecords|Records\.Index)\.json/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("VIGIL detail loader uses canonical raw URLs and parses Markdown research records", async () => {
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
    assert.match(requested[0].url, /^https:\/\/example\.test\/vigil\/record\.json\?v=/);
    assert.equal(requested[0].init.cache, "no-store");

    let jsonCalled = false;
    const research = await loadVigilRecordDetail(
      { id: "lean-index", raw_url: "https://example.test/vigil/records/research/2026/VIGIL-2026-RESEARCH-0002.md" },
      async () => ({
        ok: true,
        text: async () => "---\nid: VIGIL-2026-RESEARCH-0002\nrecord_type: research\ntitle: Red-team governance research\ndomains: [OPERATIONS, SECURITY]\nsources:\n  - https://example.test/source\n---\n\n# Research finding\n\nThe Markdown body remains available for public reading.\n",
        json: async () => { jsonCalled = true; return {}; },
      }),
    );
    assert.equal(jsonCalled, false);
    assert.equal(research.id, "VIGIL-2026-RESEARCH-0002");
    assert.deepEqual(research.domains, ["OPERATIONS", "SECURITY"]);
    assert.match(research._canonical_markdown_body, /# Research finding/);

    let pathUrl = "";
    await loadVigilRecordDetail({ id: "lean-index", path: "vigil/records/example.json" }, async (url) => {
      pathUrl = url;
      return { ok: true, json: async () => ({ id: "canonical-from-path" }) };
    });
    assert.match(pathUrl, /^https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Vigil\/main\/vigil\/records\/example\.json\?v=/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("PATCH public display preserves literal amendments, verification state and explicit no-change outcomes", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeVigilRecord } = modules.presentation;
    const amended = normalizeVigilRecord({
      id: "VIGIL-2026-PATCH-0099",
      record_type: "patch",
      record_state: "closed-actioned",
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
    assert.equal(amended.publicDisplay.patch.contractStatus, "complete-amendment");
    assert.equal(amended.publicDisplay.corpusProvisions[0].complete, true);
    assert.equal(amended.publicDisplay.corpusProvisions[0].finalWording, "Tool invocation SHALL remain proportionate to the active task authority.");

    const incomplete = normalizeVigilRecord({
      id: "VIGIL-2026-PATCH-0100",
      record_type: "patch",
      record_state: "closed-actioned",
      change_details: { changed_instruments: ["CAM-BS2025-AEON-003-SCH-02"], implemented_changes: [{ section: "§7.4.1", description: "The section was updated." }] },
    });
    assert.equal(incomplete.publicDisplay.patch.contractStatus, "incomplete");
    assert.equal(incomplete.publicDisplay.repairState, "Actioned · implementation details incomplete");

    const noChange = normalizeVigilRecord({
      id: "VIGIL-2026-PATCH-0101",
      record_type: "patch",
      record_state: "closed-actioned",
      corpus_implementation: {
        implementation_outcome: "pre-existing-control",
        no_corpus_text_changed: true,
        no_corpus_change_explanation: "The PATCH verified and linked an existing control.",
      },
      repair_provenance: {
        retrospective_synthesis: true,
        instruments_amended: [],
        instruments_relied_upon_without_amendment: ["CAM-BS2025-AEON-006-SCH-07"],
        coverage_origin: [{ instrument_id: "CAM-BS2025-AEON-006-SCH-07", relevant_sections: ["§3"], action: "relied-upon" }],
      },
    });
    assert.equal(noChange.publicDisplay.patch.contractStatus, "complete-no-corpus-change");
    assert.equal(noChange.publicDisplay.patch.explicitNoCorpusTextChange, true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("PATCH v2 entries remain authoritative and do not duplicate legacy coverage", async () => {
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
        entries: [{
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
            direct_url: "https://github.com/CAM-Initiative/Caelestis/blob/bd22cad95de6b78c4c613353eadacda9b8253e0e/Governance/Charters/CAM-EQ2026-ETHICS-001-PLATINUM.md",
          },
          verification: { status: "verified-branch-only", exact_text_match: true, current_clause_status: "current" },
        }],
      },
      implementation_verification: { verification_status: "verified-branch-only", implementation_state: "branch-only" },
      repair_provenance: {
        coverage_origin: [{ instrument_id: "CAM-EQ2026-ETHICS-001-PLATINUM", canonical_path: "Governance/Charters/CAM-EQ2026-ETHICS-001-PLATINUM.md", relevant_sections: ["§2.2 Objective–Pathway Ethical Admissibility"] }],
      },
    });
    const provisions = record.publicDisplay.corpusProvisions;
    assert.equal(record.publicDisplay.patch.contractStatus, "complete-amendment");
    assert.equal(provisions.length, 1, "legacy coverage_origin must not duplicate authoritative v2 entries");
    assert.equal(provisions[0].action, "added");
    assert.equal(provisions[0].implementedDate, "2026-07-23");
    assert.equal(provisions[0].verifiedAgainst, "bd22cad95de6b78c4c613353eadacda9b8253e0e");
    assert.match(provisions[0].canonicalUrl, /Caelestis\/blob\/bd22cad9/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("failure-mode projections preserve canonical family counts and evidence boundaries", async () => {
  const { tempDir, modules } = await loadVigilModules();
  try {
    const { normalizeRecords, deriveFailureFamilyCounts } = modules.presentation;
    const { deriveFailureModePublicDetail } = modules.publicDisplay;
    const records = normalizeRecords([
      { id: "VIGIL-2026-FM-0201", record_type: "failure_mode", title: "One", failure_family: "execution", severity: "S2", triage_priority: "P0" },
      { id: "VIGIL-2026-FM-0202", record_type: "failure_mode", title: "Two", failure_family: "execution", severity: "S3", triage_priority: "PN" },
      { id: "VIGIL-2026-FM-0203", record_type: "failure_mode", title: "Three", failure_family: "epistemic", severity: "S1", triage_priority: "P2" },
    ]);
    assert.deepEqual(deriveFailureFamilyCounts(records).map(({ label, count }) => [label, count]), [
      ["Epistemic Failures", 1],
      ["Execution Failures", 2],
    ]);

    const detail = deriveFailureModePublicDetail({
      id: "VIGIL-2026-FM-0204",
      record_type: "failure_mode",
      failure_mode_definition: "A bounded definition.",
      failure_threshold: "The observed behaviour crosses the declared threshold.",
      source_records: [{
        source_title: "Primary source",
        source_context: "The source reports the event.",
        relevance_note: "VIGIL interprets the event as evidence of recurrence.",
        primary_artefact_access: { access_status: "metadata only", limitations: ["Full artefact unavailable."] },
        interpretive_reliance: "No direct audiovisual verification is asserted.",
      }],
    });
    assert.equal(detail.evidence[0].confirmedEvidence, "The source reports the event.");
    assert.equal(detail.evidence[0].interpretiveConclusion, "VIGIL interprets the event as evidence of recurrence.");
    assert.deepEqual(detail.evidence[0].evidenceBoundary, ["Full artefact unavailable."]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("generated VIGIL fallback remains lean while preserving public projection fields", async () => {
  const syncScript = await readFile(resolve(repoRoot, "scripts/sync-vigil-records.mjs"), "utf8");
  assert.match(syncScript, /"corpus_implementation"/);
  assert.match(syncScript, /"public_display"/);
  assert.match(syncScript, /principal_instruments/);
  assert.match(syncScript, /principal_sections/);
  assert.match(syncScript, /corpus_search_terms/);
  assert.match(syncScript, /display_contract_status/);

  const fallback = JSON.parse(await readFile(resolve(repoRoot, "docs/data/vigil-registry-fallback.json"), "utf8"));
  assert.ok(Array.isArray(fallback.records));
  assert.ok(fallback.records.length > 0);
  const forbidden = new Set([
    "system_context", "source_records", "failure_classification", "triage", "source_summary", "system_summary",
    "jurisdiction_summary", "classification_summary", "triage_summary", "proposal_summary", "external_relevance_summary",
    "change_summary", "verification_summary", "impact_summary", "cam_summary", "corpus_implementation", "public_display",
    "relevant_corpus_provisions", "applied_corpus_repairs", "proposed_amendments", "proposed_corpus_amendments",
  ]);
  for (const entry of fallback.records) {
    for (const key of forbidden) assert.equal(Object.hasOwn(entry, key), false, `${entry.id} includes forbidden nested ${key}`);
    assert.equal(typeof entry.platform_label, "string", `${entry.id} is missing platform_label`);
    assert.equal(typeof entry.affected_platform_label, "string", `${entry.id} is missing affected_platform_label`);
    assert.equal(typeof entry.source_platform, "string", `${entry.id} is missing source_platform`);
    assert.equal(typeof entry.observed_vendor, "string", `${entry.id} is missing observed_vendor`);
    assert.ok(Object.keys(entry).length <= 56, `${entry.id} lean index entry is too large`);
  }
});

test("public Observatory routes use Case Files and intentionally omit the retired full ledger", async () => {
  const app = await readFile(resolve(repoRoot, "src/App.tsx"), "utf8");
  assert.match(app, /path="\/observatory\/cases\/:recordId"/);
  assert.match(app, /path="\/observatory\/cases"/);
  assert.match(app, /path="\/observatory\/failure-modes\/:recordId"/);
  assert.match(app, /path="\/observatory\/failure-modes"/);
  assert.match(app, /path="\/observatory\/incidents"/);
  assert.match(app, /path="\/observatory\/repairs"/);
  assert.match(app, /path="\/observatory\/reports\/:recordId"/);
  assert.match(app, /path="\/observatory\/knowledge-base\/standards-sources\/:sourceKey"/);
  assert.match(app, /path="\/observatory\/knowledge-base\/failure-taxonomy"/);
  assert.doesNotMatch(app, /<Route path="\/observatory\/ledger"/);
  assert.match(app, /Former \/observatory\/ledger public surface .* intentionally not routed/);
  assert.match(app, /component=\{VigilCases\}/);
  assert.match(app, /component=\{VigilCaseFile\}/);
});

test("Case Files are the current FM-centred public investigation surface", async () => {
  const cases = await readFile(resolve(repoRoot, "src/pages/vigil-cases.tsx"), "utf8");
  const caseFile = await readFile(resolve(repoRoot, "src/pages/vigil-case-file.tsx"), "utf8");
  const evidenceRepair = await readFile(resolve(repoRoot, "src/lib/vigilEvidenceRepair.ts"), "utf8");
  const nav = await readFile(resolve(repoRoot, "src/components/vigil/VigilObservatoryNav.tsx"), "utf8");

  assert.match(cases, /<h1 id="case-files-heading">Case Files<\/h1>/);
  assert.match(cases, /Describe the behaviour you’re seeing/);
  assert.match(cases, /matchesVigilSearch\(record\.searchText, search\)/);
  assert.match(cases, /useState<SortState>\(\{ key: "id", direction: "desc" \}\)/);
  assert.match(cases, /\/observatory\/cases\/\$\{encodeURIComponent\(record\.id\)\}/);

  assert.match(evidenceRepair, /number: "01",\s*label: "Observation"/s);
  assert.match(evidenceRepair, /number: "02",\s*label: "Diagnosis"/s);
  assert.match(evidenceRepair, /number: "03",\s*label: "Classification"/s);
  assert.match(evidenceRepair, /number: "04",\s*label: "Repair"/s);
  assert.match(evidenceRepair, /number: "05",\s*label: "Learn"/s);
  assert.match(evidenceRepair, /number: "06",\s*label: "References"/s);
  assert.ok(evidenceRepair.indexOf('label: "Diagnosis"') < evidenceRepair.indexOf('label: "Classification"'));

  assert.match(caseFile, /CASE_VIEWS = VIGIL_EVIDENCE_REPAIR_SECTIONS/);
  assert.match(caseFile, /VIGIL_EVIDENCE_REPAIR_SECTIONS\.map/);
  assert.match(caseFile, /stageId === "references"/);
  assert.match(caseFile, /Generate report \/ PDF/);
  assert.match(caseFile, /\/observatory\/reports\/\$\{encodeURIComponent\(reportId\)\}/);
  assert.match(nav, /return null/);
  assert.doesNotMatch(nav, /Full Ledger/);
});

test("About VIGIL, homepage and shell reflect the current public information architecture", async () => {
  const home = await readFile(resolve(repoRoot, "src/pages/home.tsx"), "utf8");
  const about = await readFile(resolve(repoRoot, "src/pages/vigil-about.tsx"), "utf8");
  const shell = await readFile(resolve(repoRoot, "src/components/layout/Shell.tsx"), "utf8");
  const shellCss = await readFile(resolve(repoRoot, "src/vigil-page-shell.css"), "utf8");

  assert.match(home, /CAM Initiative · Open AI Governance/);
  assert.match(home, /CAM_HERO/);
  assert.match(home, /VIGIL_HERO/);
  assert.match(home, /home-main-rail-layout/);
  assert.match(home, /home-sticky-governance/);
  assert.match(home, /w-full max-w-\[100rem\]/);
  assert.match(home, /text-\[17px\] leading-relaxed/);
  assert.match(home, /font-mono text-sm uppercase/);
  assert.match(home, /href="\/observatory\/about"/);

  assert.match(about, /role="region" aria-label="VIGIL six-stage evidence-to-repair report model"/);
  assert.match(about, /VIGIL_EVIDENCE_REPAIR_SECTIONS\.map/);
  assert.match(about, /Failure families organise the landscape/);
  assert.match(about, /AI Governance Standards/);
  assert.match(shellCss, /\.vigil-about-flow-scroll/);
  assert.match(shellCss, /overflow-x: auto/);

  assert.match(shell, /href: "\/observatory\/cases", label: "VIGIL Case Files"/);
  assert.match(shell, /href: "\/observatory\/knowledge-base", label: "VIGIL Knowledge Base"/);
  assert.match(shell, /aria-label="Footer" className="flex w-full max-w-full flex-wrap/);
  assert.doesNotMatch(shell, /Full Ledger/);
});

test("deterministic report route preserves the six-stage Case File composition and PDF controls", async () => {
  const app = await readFile(resolve(repoRoot, "src/App.tsx"), "utf8");
  const printable = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report-printable.tsx"), "utf8");
  const deterministic = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8");

  assert.match(app, /EvidenceChainReport from "@\/pages\/evidence-chain-report-printable"/);
  assert.match(app, /path="\/observatory\/reports\/:recordId"/);
  assert.match(printable, /EvidenceChainReportDeterministic/);
  assert.match(printable, /\["01", "Observation"\]|number: "01", label: "Observation"/);
  assert.match(printable, /number: "02", label: "Diagnosis"/);
  assert.match(printable, /number: "03", label: "Classification"/);
  assert.match(printable, /number: "04", label: "Repair"/);
  assert.match(printable, /number: "05", label: "Learn"/);
  assert.match(printable, /number: "06", label: "References"/);
  assert.match(printable, /aria-label="PDF section controls"/);
  assert.match(printable, /type="checkbox"/);
  assert.match(printable, /section\.dataset\.reportIncluded/);
  assert.match(deterministic, /const REPORT_STAGES = \[/);
  assert.match(deterministic, /\["01", "Observation"\]/);
  assert.match(deterministic, /\["02", "Diagnosis"\]/);
  assert.match(deterministic, /\["03", "Classification"\]/);
  assert.match(deterministic, /\["04", "Repair"\]/);
  assert.match(deterministic, /\["05", "Learn"\]/);
  assert.match(deterministic, /\["06", "References"\]/);
  assert.doesNotMatch(deterministic, /text-\[(?:9|10|11)px\]/);
});
