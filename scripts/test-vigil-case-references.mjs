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
  assert.match(caseFile, /VIGIL Observatory Failure Taxonomy/);
  assert.match(caseFile, /VIGIL Harm Impact Methodology/);
  assert.match(caseFile, /https:\/\/www\.cam-initiative\.org\/observatory\/severity-methodology/);
  assert.match(caseFile, /Internal records/);
  assert.doesNotMatch(caseFile, /taxonomyReferences\.map\(\(reference/);
  assert.match(component, /External classification \/ rating/);
  assert.match(component, /VIGIL relationship/);
  assert.match(caseFile, /stageId === "diagnose"/);
  assert.match(caseFile, /vigil-external-assessment-table/);
  assert.match(caseFile, /Assessor/);
  assert.match(caseFile, /Conclusion/);
  assert.match(caseFile, /Classification \/ scheme/);
  assert.doesNotMatch(caseFile, /ExternalAssessmentList assessments=\{externalAssessments\}/);
  assert.match(sync, /external_assessments: Array\.isArray\(record\.external_assessments\)/);
});

test("Case File source contains no escaped newline text between hero cards", async () => {
  const source = await caseFileSource();
  assert.doesNotMatch(source, /<\/section>}\\n\\n/);
});

test("Case File Section 02 follows governance assessment, factual basis, governance significance, harm order", async () => {
  const source = await caseFileSource();
  const assessmentRenderer = source.match(/if \(stageId === "diagnose"\)[\s\S]*?if \(stageId === "references"\)/)?.[0] ?? "";
  const governanceIndex = assessmentRenderer.indexOf("VIGIL Observatory governance assessment");
  const harmIndex = assessmentRenderer.indexOf("Harm Impact Assessment");
  const factualIndex = assessmentRenderer.indexOf("Factual basis");
  const significanceIndex = assessmentRenderer.indexOf("Governance significance");

  assert.ok(governanceIndex >= 0 && factualIndex > governanceIndex && significanceIndex > factualIndex && harmIndex > significanceIndex);
  assert.match(assessmentRenderer, /vigil-diagnosis-assessment-details/);
  assert.doesNotMatch(assessmentRenderer, /vigil-diagnosis-reading-stack/);
});

test("Factual basis and Governance significance stay inside the governance assessment card", async () => {
  const source = await caseFileSource();
  const card = source.match(/<section className="vigil-diagnosis-definition">[\s\S]*?<\/section>\n\n        <section className="vigil-severity-assessment"/)?.[0] ?? "";
  assert.match(card, /VIGIL Observatory governance assessment/);
  assert.match(card, /Factual basis/);
  assert.match(card, /Governance significance/);
  assert.match(card, /vigil-diagnosis-assessment-details/);
});

test("Case File moves assessment limits from Section 02 to the closing References disclaimer", async () => {
  const source = await caseFileSource();
  const assessmentRenderer = source.match(/if \(stageId === "diagnose"\)[\s\S]*?if \(stageId === "references"\)/)?.[0] ?? "";
  const referencesRenderer = source.match(/if \(stageId === "references"\)[\s\S]*?return null;/)?.[0] ?? "";

  assert.ok(assessmentRenderer, "Assessment renderer must remain present");
  assert.ok(referencesRenderer, "References renderer must remain present");
  assert.doesNotMatch(assessmentRenderer, /Limits of the assessment/);
  assert.doesNotMatch(assessmentRenderer, /vigil-diagnosis-limitations/);
  assert.match(referencesRenderer, /Use and reliance notice/);
  assert.match(referencesRenderer, /Limits of the assessment/);
  assert.match(referencesRenderer, /assessmentLimitItems\.length > 0/);
  assert.match(referencesRenderer, /<TextList items=\{assessmentLimitItems\} \/>/);
  assert.match(source, /nonAssessedHarmDimensionLimitItems\(harmImpactAssessment\)/);
  assert.match(source, /assessmentLimitItems = \[\.\.\.assessmentBoundaries, \.\.\.harmDimensionLimitItems\]/);
  assert.match(referencesRenderer, /vigil-reference-limits-label/);
  assert.match(referencesRenderer, /vigil-reference-disclaimer/);
});

test("Reference numbering does not leak into disclaimer bullet lists", async () => {
  const css = await readFile(resolve(repoRoot, "src/vigil-reference-list-cleanup.css"), "utf8");
  assert.match(css, /vigil-case-bibliography > \.vigil-reference-subsection > ol > li/);
  assert.doesNotMatch(css, /vigil-case-bibliography li::before/);
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
  assert.doesNotMatch(referencesRenderer, /<ExternalAssessmentList assessments=\{externalAssessments\}/);
  assert.doesNotMatch(referencesRenderer, /External assessments/);
  assert.doesNotMatch(referencesRenderer, /externalAssessments\.map|unmatchedExternalAssessments\.map/);
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
  assert.match(report, /report-external-assessment-table/);
  assert.match(report, /externalAssessments\.map/);
  assert.doesNotMatch(report, /ExternalAssessmentList assessments=\{externalAssessments\} compact/);
  assert.match(report, /data-report-taxonomy-reference-list/);
  assert.match(printable, /data-report-taxonomy-reference-list/);
  assert.match(printable, /VIGIL Observatory Failure Taxonomy/);
  assert.match(printable, /VIGIL Harm Impact Methodology/);
  assert.match(printable, /https:\/\/www\.cam-initiative\.org\/observatory\/severity-methodology/);
  assert.match(printable, /https:\/\/www\.cam-initiative\.org\/observatory\/knowledge-base\/failure-taxonomy/);
  assert.doesNotMatch(printable, /reportIncident\.taxonomyReferences\.map/);
  assert.match(report, /Internal records/);
  assert.doesNotMatch(report, /report-reference-number">\[\{index \+ 1\}\]/);
  assert.doesNotMatch(printable, /referenceBaseCountRef/);
  assert.match(report, /report-reference-number" aria-hidden="true"/);
});


test("all non-assessed harm dimension rollups move to References and PDF limits deterministically", async () => {
  const [matrix, caseFile, printable, cleanupCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/components/vigil/HarmImpactMatrix.tsx"), "utf8"),
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-printable.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-harm-assessment-cleanup.css"), "utf8"),
  ]);

  assert.match(matrix, /export function nonAssessedHarmDimensionLimitItems/);
  assert.match(matrix, /assessment_status !== "assessed"/);
  assert.match(matrix, /rollupLabel\(status\)/);
  assert.doesNotMatch(matrix, /\{rollups\.map/);
  assert.match(caseFile, /\.\.\.nonAssessedHarmDimensionLimitItems|nonAssessedHarmDimensionLimitItems\(harmImpactAssessment\)/);
  assert.match(printable, /nonAssessedHarmDimensionLimitItems\(harmAssessment\)/);
  assert.doesNotMatch(cleanupCss, /vigil-harm-no-harm-basis \+ \.vigil-harm-method-note \+ \.vigil-harm-coverage/);
});


test("harm rows resolve source_records evidence to the numbered Evidence sources in web and PDF", async () => {
  const [caseFile, report, matrix] = await Promise.all([
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/components/vigil/HarmImpactMatrix.tsx"), "utf8"),
  ]);

  for (const source of [caseFile, report]) {
    assert.match(source, /sourceRecordRefs/);
    assert.match(source, /source_records\[\$\{sourceIndex\}\]/);
    assert.match(source, /externalSources\.flatMap\(\(source, index\) => source\.sourceRecordRefs\.map/);
    assert.match(source, /evidenceReferenceNumbers=\{harmEvidenceReferenceNumbers\}/);
  }
  assert.match(matrix, /row\.evidence_refs/);
  assert.match(matrix, /evidenceReferenceNumbers\?\.\[ref\]/);
  assert.match(matrix, /href=\{\`#vigil-evidence-reference-/);
  assert.match(report, /id=\{\`vigil-evidence-reference-\$\{index \+ 1\}\`\}/);
});


test("Incident artefact captions use one label plus numbered evidence reference", async () => {
  const source = await caseFileSource();
  const css = await readFile(resolve(repoRoot, "src/vigil-case-file-polish.css"), "utf8");
  assert.match(source, /evidenceReferenceNumberForUrl/);
  assert.match(source, /vigil-incident-artefact-reference/);
  assert.match(source, /#vigil-evidence-reference-/);
  assert.doesNotMatch(source, /View originating source/);
  assert.doesNotMatch(source, /\{artefact\.caption && <span>/);
  assert.match(css, /\.vigil-incident-artefact-reference/);
});

test("Classification and Repair cite the single numbered VIGIL Failure Taxonomy reference instead of row-level source links", async () => {
  const [component, caseFile, report, printable, css, reportCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/components/vigil/CaseTaxonomyClassification.tsx"), "utf8"),
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-printable.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-classification-table.css"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-deterministic-report.css"), "utf8"),
  ]);

  assert.doesNotMatch(component, /View taxonomy source|View canonical taxonomy source|vigil-classification-source-link/);
  assert.match(component, /Failure classes and their governing invariants are defined in the/);
  assert.match(component, /The governing invariants shown here are defined in the/);
  assert.match(component, /VIGIL Observatory Failure Taxonomy \[\{taxonomyReferenceNumber\}\]/);
  assert.match(caseFile, /taxonomyReferenceNumber = taxonomyReferences\.length/);
  assert.match(caseFile, /id="vigil-failure-taxonomy-reference"/);
  assert.match(caseFile, /taxonomyReferenceHref="#vigil-failure-taxonomy-reference"/);
  assert.match(report, /taxonomyReferenceNumber = hasTaxonomyReference/);
  assert.match(report, /taxonomyReferenceHref="#vigil-failure-taxonomy-reference"/);
  assert.match(printable, /id="vigil-failure-taxonomy-reference"/);
  assert.match(css, /\.vigil-taxonomy-reference-note \{[\s\S]*font-size: 0\.92rem/);
  assert.match(reportCss, /\.vigil-taxonomy-reference-note \{[\s\S]*font-size: 0\.9rem/);
});

test("Harm derivation note cites the numbered VIGIL Harm Impact Methodology reference in web and PDF", async () => {
  const [matrix, caseFile, report, printable, cleanupCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/components/vigil/HarmImpactMatrix.tsx"), "utf8"),
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-printable.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-harm-assessment-cleanup.css"), "utf8"),
  ]);

  assert.match(matrix, /vigil-harm-methodology-reference/);
  assert.match(matrix, /methodologyReferenceNumber/);
  assert.match(matrix, /methodologyReferenceHref/);
  assert.match(caseFile, /harmMethodologyReferenceNumber = harmImpactAssessment/);
  assert.match(caseFile, /id="vigil-harm-methodology-reference"/);
  assert.match(caseFile, /methodologyReferenceHref="#vigil-harm-methodology-reference"/);
  assert.match(report, /harmMethodologyReferenceNumber = harmImpactAssessment/);
  assert.match(report, /hasTaxonomyReference/);
  assert.match(printable, /id="vigil-harm-methodology-reference"/);
  assert.match(printable, /hasTaxonomyReference=\{Boolean\(reportIncident\?\.taxonomyReferences\.length\)\}/);
  assert.match(cleanupCss, /\.vigil-harm-methodology-reference \{[\s\S]*font-size: inherit !important/);
});

test("Governance assessment uses one divider before each peer subsection", async () => {
  const css = await readFile(resolve(repoRoot, "src/vigil-case-file-polish.css"), "utf8");
  const container = css.match(/\.vigil-case-file-page \.vigil-diagnosis-assessment-details \{[\s\S]*?\}/)?.[0] ?? "";
  assert.doesNotMatch(container, /border-top/);
  assert.match(css, /\.vigil-case-file-page \.vigil-diagnosis-assessment-details > section \{[\s\S]*border-top: 1px solid/);
  assert.match(css, /\.vigil-case-file-page \.vigil-diagnosis-assessment-details > section \+ section \{[\s\S]*margin-top: 1rem/);
});


test("Harm Impact assessment leads with the substantive summary and closes with the method note", async () => {
  const [matrix, caseFile, report] = await Promise.all([
    readFile(resolve(repoRoot, "src/components/vigil/HarmImpactMatrix.tsx"), "utf8"),
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
  ]);
  assert.doesNotMatch(matrix, /Harm assessment summary:|Assessment date|Overall severity|vigil-harm-summary-row/);
  assert.match(matrix, /className="vigil-harm-summary"/);
  assert.doesNotMatch(matrix, /vigil-harm-coverage vigil-harm-summary/);
  assert.match(matrix, /Harm impact is assessed across 11 dimensions on a five-band severity axis/);
  assert.ok(matrix.indexOf("vigil-harm-summary") < matrix.indexOf("vigil-harm-assessment-table"));
  assert.ok(matrix.indexOf("vigil-harm-assessment-table") < matrix.indexOf("vigil-harm-derivation-note"));
  assert.doesNotMatch(caseFile, /vigil-harm-classification-intro/);
  assert.doesNotMatch(report, /report-harm-classification-intro/);
});

test("Classification and Repair tables keep readable body and legend typography", async () => {
  const css = await readFile(resolve(repoRoot, "src/vigil-classification-table.css"), "utf8");
  assert.match(css, /\.vigil-case-file-page \.vigil-classification-table tbody td \{[\s\S]*font-size: 1\.02rem[\s\S]*line-height: 1\.62/);
  assert.match(css, /\.vigil-case-file-page \.vigil-repair-table tbody td \{[\s\S]*font-size: 1\.02rem[\s\S]*line-height: 1\.62/);
  assert.match(css, /\.vigil-alignment-legend \{[\s\S]*font-size: 0\.92rem[\s\S]*line-height: 1\.5/);
  assert.match(css, /\.vigil-alignment-legend-item > span:last-child > strong \{[\s\S]*font-size: 0\.92rem/);
});


test("External assessments cite Evidence sources without creating a second References subsection", async () => {
  const [caseFile, report] = await Promise.all([
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
  ]);
  for (const source of [caseFile, report]) {
    assert.match(source, /externalAssessmentEvidenceReferenceNumber/);
    assert.match(source, /#vigil-evidence-reference-/);
    assert.doesNotMatch(source, /unmatchedExternalAssessments/);
  }
  const caseReferences = caseFile.match(/if \(stageId === "references"\)[\s\S]*?return null;/)?.[0] ?? "";
  const reportReferences = report.match(/<Stage number="05" label="References">[\s\S]*?<\/Stage>/)?.[0] ?? "";
  assert.doesNotMatch(caseReferences, /External assessments/);
  assert.doesNotMatch(reportReferences, /External assessments/);
});

test("Taxonomy and methodology references expose version and revision metadata in web and PDF", async () => {
  const [caseFile, printable, taxonomy] = await Promise.all([
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-printable.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/lib/vigilTaxonomyClassification.ts"), "utf8"),
  ]);
  for (const source of [caseFile, printable]) {
    assert.match(source, /Version /);
    assert.match(source, /Revised /);
  }
  assert.match(taxonomy, /referenceVersion/);
  assert.match(taxonomy, /referencePublicationDate/);
  assert.match(printable, /loadHarmMethodologyMetadata/);
});

test("Reference subsection boundaries do not double the divider before Internal records", async () => {
  const css = await readFile(resolve(repoRoot, "src/vigil-reference-list-cleanup.css"), "utf8");
  assert.match(css, /vigil-reference-subsection > ol > li:last-child[\s\S]*border-bottom: 0/);
});


test("Harm summary is plain narrative with spacing before the table and the derivation is footnote-sized", async () => {
  const [matrix, css, reportCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/components/vigil/HarmImpactMatrix.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-incident-severity-refinement.css"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-deterministic-report.css"), "utf8"),
  ]);
  assert.match(matrix, /className="vigil-harm-summary"/);
  assert.doesNotMatch(matrix, /vigil-harm-coverage vigil-harm-summary/);
  assert.match(css, /\.vigil-harm-summary \{[\s\S]*margin: 0 0 1\.05rem[\s\S]*border: 0/);
  assert.match(css, /\.vigil-harm-derivation-note \{[\s\S]*font-size: 0\.76rem/);
  assert.match(reportCss, /\.vigil-harm-derivation-note \{[\s\S]*font-size: 0\.76rem/);
});
