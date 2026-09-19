import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);

async function caseFileSource() {
  return readFile(resolve(repoRoot, "src/pages/vigil-case-file.tsx"), "utf8");
}

async function reportSources() {
  return Promise.all([
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-printable.tsx"), "utf8"),
  ]);
}

test("External Assessments remain a typed, optional layer distinct from evidence and registry links", async () => {
  const [caseFile, parser, component, sync] = await Promise.all([
    caseFileSource(),
    readFile(resolve(repoRoot, "src/lib/vigilExternalAssessments.ts"), "utf8"),
    readFile(resolve(repoRoot, "src/components/vigil/ExternalAssessmentList.tsx"), "utf8"),
    readFile(resolve(repoRoot, "scripts/sync-vigil-records.mjs"), "utf8"),
  ]);

  assert.match(parser, /raw\.external_assessments/);
  assert.match(parser, /raw\.external_incident_references/);
  assert.doesNotMatch(parser, /source_records/);
  assert.match(caseFile, /externalAssessments\.length > 0/);
  assert.match(caseFile, /External incident records/);
  assert.match(caseFile, /Taxonomy and methodology references/);
  assert.match(component, /External classification \/ rating/);
  assert.match(component, /VIGIL relationship/);
  assert.match(caseFile, /Inclusion does not imply endorsement/);
  assert.match(sync, /external_assessments: Array\.isArray\(record\.external_assessments\)/);
});

test("Case File source contains no escaped newline text between hero cards", async () => {
  const source = await caseFileSource();
  assert.doesNotMatch(source, /<\/section>}\\n\\n/);
});

test("Case File References remain bibliographic and do not republish evidence commentary", async () => {
  const source = await caseFileSource();
  const evidenceMapper = source.match(/function externalEvidenceFor[\s\S]*?function dedupeEvidence/)?.[0] ?? "";
  const referencesRenderer = source.match(/if \(stageId === "references"\)[\s\S]*?return null;/)?.[0] ?? "";

  assert.ok(evidenceMapper, "externalEvidenceFor() must remain present");
  assert.ok(referencesRenderer, "References renderer must remain present");

  assert.match(evidenceMapper, /publisher:/);
  assert.match(evidenceMapper, /date:/);
  assert.match(evidenceMapper, /url:/);
  assert.doesNotMatch(evidenceMapper, /source_context|relevance_note|source\.description/);
  assert.doesNotMatch(referencesRenderer, /source\.description/);
});

test("Incident Case File retains evidence context and VIGIL Observatory interpretation", async () => {
  const source = await caseFileSource();
  const observationRenderer = source.match(/if \(stageId === "observe"\)[\s\S]*?if \(stageId === "classify"\)/)?.[0] ?? "";

  assert.ok(observationRenderer, "Observation renderer must remain present");
  assert.match(source, /vigil_assessment\.factual_basis/);
  assert.match(source, /vigil_assessment\.governance_interpretation/);
  assert.match(source, /VIGIL Observatory governance assessment/);
});

test("Incident Case File projects taxonomy-derived class-invariant repair, not implementation state", async () => {
  const source = await caseFileSource();

  for (const obsolete of [
    "Existing coverage",
    "Gap identified",
    "Required governance change",
    "Target instruments / insertion points",
    "No PATCH is linked yet",
    "cam_internal.target_instruments",
  ]) assert.doesNotMatch(source, new RegExp(obsolete.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

  assert.match(source, /stageId === "repair"/);
  assert.match(source, /<CaseTaxonomyRepair raw=\{incident\.raw\}/);
  assert.match(source, /VIGIL_INCIDENT_CASE_SECTIONS/);
  assert.match(source, /vigil_assessment\.governance_interpretation/);
  assert.match(source, /diagnostic_provenance/);
});

test("deterministic Incident print and PDF projections include class-invariant Repair without legacy repair machinery", async () => {
  const [report, printable] = await reportSources();
  const combined = `${report}\n${printable}`;

  for (const obsolete of [
    "Existing coverage",
    "Gap identified",
    "Required governance change",
    "Target instruments / insertion points",
    "No PATCH is linked yet",
  ]) assert.doesNotMatch(combined, new RegExp(obsolete.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

  assert.match(report, /vigil_assessment\.governance_interpretation/);
  assert.match(report, /vigil_assessment\.factual_basis/);
  assert.match(report, /label="Classification"/);
  assert.match(report, /label="Repair"/);
  assert.match(report, /label="References"/);
  assert.match(printable, /label: "Repair"/);
  assert.match(report, /ExternalAssessmentList assessments=\{externalAssessments\} compact/);
  assert.match(report, /data-report-taxonomy-reference-list/);
  assert.match(printable, /data-report-taxonomy-reference-list/);
  assert.doesNotMatch(report, /report-reference-number">\[\{index \+ 1\}\]/);
  assert.doesNotMatch(printable, /referenceBaseCountRef/);
  assert.match(report, /report-reference-number" aria-hidden="true"/);
});
