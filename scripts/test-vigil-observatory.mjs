import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);

async function transpile(sourcePath, outputPath, transform = (source) => source) {
  const source = transform(await readFile(resolve(repoRoot, sourcePath), "utf8"));
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, moduleResolution: ts.ModuleResolutionKind.Bundler, resolveJsonModule: true }, fileName: sourcePath }).outputText;
  await writeFile(outputPath, output);
}

async function loadModules() {
  const tempDir = await mkdtemp(join(tmpdir(), "vigil-incident-test-"));
  const config = JSON.parse(await readFile(resolve(repoRoot, "src/config/registrySources.json"), "utf8"));
  const registryPath = join(tempDir, "registry.mjs");
  const displayPath = join(tempDir, "display.mjs");
  const presentationPath = join(tempDir, "presentation.mjs");
  await transpile("src/lib/vigilRegistry.ts", registryPath, (source) => source.replace('import registrySources from "@/config/registrySources.json";', `const registrySources = ${JSON.stringify(config)};`).replace(/import\.meta\.env\.BASE_URL/g, '"/"'));
  await transpile("src/lib/vigilPublicDisplay.ts", displayPath);
  await transpile("src/lib/vigilPresentation.ts", presentationPath, (source) => source
    .replace('import { githubBlobUrlForRecord, rawUrlForRecord, type UnknownRecord } from "@/lib/vigilRegistry";', 'import { githubBlobUrlForRecord, rawUrlForRecord } from "./registry.mjs";')
    .replace('import { deriveIncidentPublicDisplay, type IncidentPublicDisplay } from "@/lib/vigilPublicDisplay";', 'import { deriveIncidentPublicDisplay } from "./display.mjs";'));
  return { tempDir, registry: await import(registryPath), display: await import(displayPath), presentation: await import(presentationPath) };
}

test("normalization accepts canonical Incidents and rejects retired record classes", async () => {
  const modules = await loadModules();
  try {
    const raw = { id: "VIGIL-INC-000001", record_type: "incident", title: "Canonical Incident", system_context: { platform_or_vendor: "OpenAI", product_or_service: "ChatGPT" }, severity_assessment: { severity: "S3" } };
    const incident = modules.presentation.normalizeVigilRecord(raw);
    assert.equal(incident.record_type, "incident");
    assert.equal(incident.platform_label, "OpenAI");
    assert.equal(incident.severity, "S3");
    for (const retired of [{ id: "VIGIL-2026-FM-0001", record_type: "failure_mode" }, { id: "VIGIL-2026-OBS-0001", record_type: "observation" }, { id: "VIGIL-2026-RESEARCH-0001", record_type: "research" }]) assert.throws(() => modules.presentation.normalizeVigilRecord(retired), /canonical Incident ID and record type/);
    assert.deepEqual(modules.presentation.normalizeRecords({ records: [raw, { id: "VIGIL-2026-FM-0001", record_type: "failure_mode" }] }).map((item) => item.id), ["VIGIL-INC-000001"]);
  } finally { await rm(modules.tempDir, { recursive: true, force: true }); }
});

test("Incident search covers occurrence, source, severity and taxonomy fields", async () => {
  const modules = await loadModules();
  try {
    const incident = modules.presentation.normalizeVigilRecord({ id: "VIGIL-INC-000081", record_type: "incident", title: "Service price variation", summary: "Observed price variation in a bounded service cohort.", source_records: [{ source_title: "Consumer investigation", source_platform: "Consumer Reports" }], severity_assessment: { severity: "S3", materialised_consequence: "Some participants paid more." }, taxonomy_classification: { classification_status: "classified", primary_family: { family_id: "VIGIL-FT-FAM-001" } } });
    assert.equal(modules.display.matchesVigilSearch(incident.searchText, "consumer reports s3"), true);
    assert.equal(modules.display.matchesVigilSearch(incident.searchText, "unrelated publisher"), false);
  } finally { await rm(modules.tempDir, { recursive: true, force: true }); }
});

test("Incident detail derives source evidence without mixing in taxonomy reasoning", async () => {
  const modules = await loadModules();
  try {
    const raw = { id: "VIGIL-INC-000001", record_type: "incident", summary: "A production database was deleted.", vigil_assessment: { factual_basis: "The preserved report records the deletion." }, taxonomy_classification: { classification_basis: "A separate structural classification rationale." }, source_records: [{ source_title: "Incident report", source_context: "The source reports deletion.", evidence_status: "supported" }] };
    const detail = modules.display.deriveIncidentPublicDetail(raw);
    assert.equal(detail.evidence[0].whatHappened, raw.summary);
    assert.equal(detail.evidence[0].confirmedEvidence, raw.source_records[0].source_context);
    assert.equal(detail.evidence[0].evidenceStatus, "supported");
    assert.notEqual(detail.evidence[0].confirmedEvidence, raw.taxonomy_classification.classification_basis);
  } finally { await rm(modules.tempDir, { recursive: true, force: true }); }
});

test("registry loading uses only the canonical Incident index and Incident fallback", async () => {
  const modules = await loadModules();
  try {
    assert.equal(modules.registry.VIGIL_INCIDENT_REGISTRY_URL, "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Incidents.Index.json");
    const incident = { id: "VIGIL-INC-000001", record_type: "incident", title: "Incident" };
    const live = await modules.registry.loadVigilIncidentRecords(async () => new Response(JSON.stringify({ records: [incident, { id: "VIGIL-2026-FM-0001", record_type: "failure_mode" }] })), "https://example.test/incidents.json", "");
    assert.deepEqual(live.records, [incident]);
    const requests = [];
    const fallback = await modules.registry.loadVigilIncidentRecords(async (url) => { requests.push(url); if (url.startsWith("https://example.test/live")) throw new Error("offline"); return new Response(JSON.stringify({ records: [incident] })); }, "https://example.test/live", "/data/fallback.json");
    assert.equal(fallback.loadedFromFallback, true);
    assert.deepEqual(requests.map((url) => url.split("?")[0]), ["https://example.test/live", "/data/fallback.json"]);
  } finally { await rm(modules.tempDir, { recursive: true, force: true }); }
});

test("detail loader accepts Incident JSON and rejects retired record payloads", async () => {
  const modules = await loadModules();
  try {
    const incident = await modules.registry.loadVigilRecordDetail({ path: "vigil/records/incidents/VIGIL-INC-000001.json" }, async () => new Response(JSON.stringify({ id: "VIGIL-INC-000001", record_type: "incident" })));
    assert.equal(incident.record_type, "incident");
    await assert.rejects(() => modules.registry.loadVigilRecordDetail({ raw_url: "https://example.test/record.json" }, async () => new Response(JSON.stringify({ id: "VIGIL-2026-OBS-0001", record_type: "observation" }))), /canonical detail must be an Incident JSON object/);
  } finally { await rm(modules.tempDir, { recursive: true, force: true }); }
});

test("Case File keeps structured occurrence severity in Diagnosis", async () => {
  const caseFile = await readFile(resolve(repoRoot, "src/pages/vigil-case-file.tsx"), "utf8");
  const taxonomy = await readFile(resolve(repoRoot, "src/components/vigil/CaseTaxonomyClassification.tsx"), "utf8");
  for (const field of ["materialised_consequence", "affected_scope", "seriousness_and_persistence", "quantitative_information", "evidentiary_limits", "band_rationale"]) assert.match(caseFile, new RegExp(`severity_assessment\\.${field}`));
  assert.match(caseFile, /stageId === "diagnose"[\s\S]*Occurrence-level severity/);
  assert.doesNotMatch(taxonomy, /severity_assessment|severityLabel/);
});

test("active routes and sync source have no retired registry-class machinery", async () => {
  const [app, loader, sync, enhancements] = await Promise.all([readFile(resolve(repoRoot, "src/App.tsx"), "utf8"), readFile(resolve(repoRoot, "src/lib/vigilRegistry.ts"), "utf8"), readFile(resolve(repoRoot, "scripts/sync-vigil-records.mjs"), "utf8"), readFile(resolve(repoRoot, "src/public/vigil-ux-enhancements.js"), "utf8")]);
  for (const retired of ["failure_modes", "observations", "research", "patch_notes", "proposals", "VIGIL.Learn.Index.json", "_canonical_markdown_body"]) assert.doesNotMatch(`${loader}\n${sync}\n${enhancements}`, new RegExp(retired, "i"));
  for (const route of ["/failure-modes", "/observatory/lessons", "/observatory/repairs", "/vigil"]) assert.equal(app.includes(`path=\"${route}`), false);
  assert.match(app, /path="\/observatory\/cases"/);
  assert.match(app, /path="\/observatory\/knowledge-base\/failure-taxonomy"/);
});
