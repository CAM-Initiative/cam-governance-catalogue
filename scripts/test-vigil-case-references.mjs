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

test("Incident Case File retains evidence context and VIGIL interpretation", async () => {
  const source = await caseFileSource();
  const observationRenderer = source.match(/if \(stageId === "observe"\)[\s\S]*?if \(stageId === "classify"\)/)?.[0] ?? "";

  assert.ok(observationRenderer, "Observation renderer must remain present");
  assert.match(source, /vigil_assessment\.factual_basis/);
  assert.match(source, /vigil_assessment\.governance_interpretation/);
  assert.match(source, /VIGIL governance assessment/);
});

test("Incident Case File does not project CAM coverage or repair state", async () => {
  const source = await caseFileSource();

  for (const obsolete of [
    "Existing coverage",
    "Gap identified",
    "Required governance change",
    "Target instruments / insertion points",
    "No PATCH is linked yet",
    "cam_internal.target_instruments",
    'stageId === "repair"',
  ]) assert.doesNotMatch(source, new RegExp(obsolete.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

  assert.match(source, /VIGIL_INCIDENT_CASE_SECTIONS/);
  assert.match(source, /vigil_assessment\.governance_interpretation/);
  assert.match(source, /diagnostic_provenance/);
});

test("deterministic Incident print and PDF projections omit repair sections", async () => {
  const [report, printable] = await reportSources();
  const combined = `${report}\n${printable}`;

  for (const obsolete of [
    "Existing coverage",
    "Gap identified",
    "Required governance change",
    "Target instruments / insertion points",
    "No PATCH is linked yet",
    'label="Repair"',
    'label: "Repair"',
  ]) assert.doesNotMatch(combined, new RegExp(obsolete.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

  assert.match(report, /vigil_assessment\.governance_interpretation/);
  assert.match(report, /vigil_assessment\.factual_basis/);
  assert.match(report, /label="Classification"/);
  assert.match(report, /label="References"/);
});
