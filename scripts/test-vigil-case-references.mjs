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
  assert.match(caseFile, /VIGIL Observatory Alignment Taxonomy/);
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

test("Affected systems expose evidence-bounded agent and occurrence metadata in web and PDF", async () => {
  const [helper, caseFile, report] = await Promise.all([
    readFile(resolve(repoRoot, "src/lib/vigilAffectedSystems.ts"), "utf8"),
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
  ]);

  assert.match(helper, /context\.agent_context/);
  assert.match(helper, /context\.occurrence_environment/);
  assert.match(helper, /count_basis/);
  assert.match(helper, /At least \$\{min\}/);
  assert.match(helper, /Mixed testing \/ live/);
  assert.match(helper, /Provider \/ internal/);
  assert.match(helper, /joinedText\(context\.interface_surface\)/);
  assert.doesNotMatch(helper, /evidence_basis|source_record_refs|environment_detail/);

  for (const source of [caseFile, report]) {
    assert.match(source, /dedupeAffectedSystems/);
    assert.match(source, /label="Agent configuration"/);
    assert.match(source, /label="Agent count"/);
    assert.match(source, /label="Occurrence setting"/);
    assert.match(source, /label="Testing conducted by"/);
  }
});

test("Case File source contains no escaped newline text between hero cards", async () => {
  const source = await caseFileSource();
  assert.doesNotMatch(source, /<\/section>}\\n\\n/);
});

test("Case File Section 02 orders factual basis, taxonomy assessment, harm and external assessments without duplicate headings", async () => {
  const source = await caseFileSource();
  const assessmentRenderer = source.match(/if \(stageId === "diagnose"\)[\s\S]*?if \(stageId === "conclusion"\)/)?.[0] ?? "";
  const factualIndex = assessmentRenderer.indexOf("vigil-diagnosis-factual-basis");
  const taxonomyIndex = assessmentRenderer.indexOf("<CaseTaxonomyAssessment raw={incident.raw} />");
  const harmIndex = assessmentRenderer.indexOf("VIGIL OBSERVATORY REAL-WORLD HARM ASSESSMENT");
  const externalIndex = assessmentRenderer.indexOf("EXTERNAL ASSESSMENTS");

  assert.ok(factualIndex >= 0 && taxonomyIndex > factualIndex && harmIndex > taxonomyIndex && externalIndex > harmIndex);
  assert.doesNotMatch(assessmentRenderer, />GOVERNANCE ASSESSMENT</);
  assert.doesNotMatch(assessmentRenderer, />Factual basis</);
  assert.doesNotMatch(assessmentRenderer, /Governance significance/);
  assert.doesNotMatch(assessmentRenderer, /vigil-diagnosis-assessment-summary|\{governanceConclusion\}/);
  assert.doesNotMatch(assessmentRenderer, /vigil-diagnosis-reading-stack/);
});

test("Governance significance is integrated under Conclusion while taxonomy assessment remains its own Section 02 card", async () => {
  const source = await caseFileSource();
  const assessmentRenderer = source.match(/if \(stageId === "diagnose"\)[\s\S]*?if \(stageId === "conclusion"\)/)?.[0] ?? "";
  const conclusionRenderer = source.match(/if \(stageId === "conclusion"\)[\s\S]*?if \(stageId === "references"\)/)?.[0] ?? "";
  assert.doesNotMatch(assessmentRenderer, />GOVERNANCE ASSESSMENT</);
  assert.doesNotMatch(assessmentRenderer, />Factual basis</);
  assert.match(assessmentRenderer, /<CaseTaxonomyAssessment raw=\{incident\.raw\} \/>/);
  assert.doesNotMatch(assessmentRenderer, /Governance significance/);
  assert.match(conclusionRenderer, /vigil-conclusion-governance-significance/);
  assert.match(conclusionRenderer, /vigil-case-subheading[\s\S]*<h3 className="vigil-case-editorial-subheading">Governance significance<\/h3>/);
  assert.doesNotMatch(conclusionRenderer, /vigil-governance-significance-card/);
});

test("governance interpretation is projected only in Conclusion across web and deterministic PDF", async () => {
  const [caseFile, report, sections] = await Promise.all([
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/lib/vigilCaseSections.ts"), "utf8"),
  ]);
  const caseAssessment = caseFile.match(/if \(stageId === "diagnose"\)[\s\S]*?if \(stageId === "conclusion"\)/)?.[0] ?? "";
  const caseConclusion = caseFile.match(/if \(stageId === "conclusion"\)[\s\S]*?if \(stageId === "references"\)/)?.[0] ?? "";
  const reportAssessment = report.match(/<Stage number="02" label="Assessment">[\s\S]*?<Stage number="03" label="Classification">/)?.[0] ?? "";
  const reportConclusion = report.match(/<Stage number="05" label="Conclusion">[\s\S]*?<Stage number="06" label="References">/)?.[0] ?? "";

  assert.doesNotMatch(caseAssessment, /\{governanceConclusion\}/);
  assert.match(caseConclusion, /\{governanceConclusion\}/);
  assert.doesNotMatch(reportAssessment, /\{governanceConclusion\}/);
  assert.match(reportConclusion, /\{governanceConclusion\}/);
  assert.match(sections, /id: "conclusion",[\s\S]*number: "05",[\s\S]*label: "Conclusion"/);
  assert.match(sections, /id: "references",[\s\S]*number: "06",[\s\S]*label: "References"/);
});

test("Case File moves assessment limits from Section 02 to the closing References disclaimer", async () => {
  const source = await caseFileSource();
  const assessmentRenderer = source.match(/if \(stageId === "diagnose"\)[\s\S]*?if \(stageId === "conclusion"\)/)?.[0] ?? "";
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
  assert.doesNotMatch(referencesRenderer, /EXTERNAL ASSESSMENTS/);
  assert.doesNotMatch(referencesRenderer, /externalAssessments\.map|unmatchedExternalAssessments\.map/);
});

test("Incident Case File retains evidence context and moves governance interpretation to Conclusion", async () => {
  const source = await caseFileSource();
  const observationRenderer = source.match(/if \(stageId === "observe"\)[\s\S]*?if \(stageId === "classify"\)/)?.[0] ?? "";
  const conclusionRenderer = source.match(/if \(stageId === "conclusion"\)[\s\S]*?if \(stageId === "references"\)/)?.[0] ?? "";

  assert.ok(observationRenderer, "Observation renderer must remain present");
  assert.match(source, /vigil_assessment\.factual_basis/);
  assert.match(source, /vigil_assessment\.governance_interpretation/);
  assert.match(source, /vigil-diagnosis-factual-basis/);
  assert.doesNotMatch(conclusionRenderer, /VIGIL Observatory conclusion/);
  assert.match(conclusionRenderer, /\{governanceConclusion\}/);
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
  assert.match(report, /<Stage number="05" label="Conclusion">/);
  assert.match(report, /<Stage number="06" label="References">/);
  assert.match(printable, /label: "Repair"/);
  assert.match(printable, /label: "Conclusion"/);
  assert.match(printable, /number: "06", label: "References"/);
  assert.match(report, /report-external-assessment-table/);
  assert.match(report, /externalAssessments\.map/);
  assert.doesNotMatch(report, /ExternalAssessmentList assessments=\{externalAssessments\} compact/);
  assert.match(report, /data-report-taxonomy-reference-list/);
  assert.match(printable, /data-report-taxonomy-reference-list/);
  assert.match(printable, /VIGIL Observatory Alignment Taxonomy/);
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


test("inline Case File references activate Section 06 before resolving their anchors", async () => {
  const source = await caseFileSource();

  assert.match(source, /CASE_REFERENCE_HASH_PATTERN/);
  assert.match(source, /vigil-evidence-reference-/);
  assert.match(source, /vigil-failure-taxonomy-reference/);
  assert.match(source, /vigil-harm-methodology-reference/);
  assert.match(source, /pendingReferenceTarget/);
  assert.match(source, /setActiveStage\("references"\)/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /scrollIntoView/);
  assert.match(source, /history\.replaceState/);
  assert.match(source, /onClick=\{handleCaseReferenceClick\}/);
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

test("Classification and Repair cite the single numbered VIGIL Alignment Taxonomy reference instead of row-level source links", async () => {
  const [component, caseFile, report, printable, css, reportCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/components/vigil/CaseTaxonomyClassification.tsx"), "utf8"),
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-printable.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-classification-table.css"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-deterministic-report.css"), "utf8"),
  ]);

  assert.doesNotMatch(component, /View taxonomy source|View canonical taxonomy source|vigil-classification-source-link/);
  assert.match(component, /Fidelity classes and their governing invariants are defined in the/);
  assert.match(component, /The governing invariants shown here are defined in the/);
  assert.match(component, /VIGIL Observatory Alignment Taxonomy \[\{taxonomyReferenceNumber\}\]/);
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


test("Harm Impact assessment uses one context-sensitive methodology footer", async () => {
  const [matrix, caseFile, report] = await Promise.all([
    readFile(resolve(repoRoot, "src/components/vigil/HarmImpactMatrix.tsx"), "utf8"),
    caseFileSource(),
    readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8"),
  ]);
  assert.doesNotMatch(matrix, /Harm assessment summary:|Assessment date|Overall severity|vigil-harm-summary-row/);
  assert.doesNotMatch(matrix, /coverageNote|assessment\.coverage_note|className="vigil-harm-summary"/);
  assert.doesNotMatch(matrix, /className="vigil-harm-no-harm-basis"/);
  assert.match(matrix, /const derivationNote = noMaterialisedHarmBasis/);
  assert.match(matrix, /No materialised downstream harm was established for the bounded occurrence/);
  assert.match(matrix, /S1 is assigned under the VIGIL-HIM positive no-materialised-harm pathway/);
  assert.match(matrix, /<strong>Basis:<\/strong> \{noMaterialisedHarmBasis\}/);
  assert.match(matrix, /No defensible overall severity band could be derived because no Harm Impact dimension could be banded and positive no-materialised-harm was not established/);
  assert.match(matrix, /SU denotes an unassessed evidence state, not a sixth severity band/);
  assert.match(matrix, /Overall harm severity is determined by the highest supported materialised harm across the assessed dimensions/);
  assert.doesNotMatch(matrix, /Harm impact is assessed across 11 dimensions on a five-band severity axis/);
  assert.ok(matrix.indexOf("vigil-harm-assessment-table") < matrix.indexOf("vigil-harm-derivation-note"));
  assert.doesNotMatch(caseFile, /vigil-harm-classification-intro/);
  assert.doesNotMatch(report, /report-harm-classification-intro/);
});

test("Harm derivation note uses plain under-table text without a callout side band", async () => {
  const [webCss, reportCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/vigil-incident-severity-refinement.css"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-deterministic-report.css"), "utf8"),
  ]);

  assert.match(webCss, /\.vigil-case-file-page \.vigil-harm-matrix\.is-assessment \.vigil-harm-derivation-note \{[\s\S]*padding: 0;[\s\S]*border: 0;[\s\S]*background: transparent;/);
  assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-harm-derivation-note \{[\s\S]*padding: 0 !important;[\s\S]*border: 0 !important;[\s\S]*background: transparent !important;/);
});

test("External assessment tables match comparable table typography in web and PDF", async () => {
  const [webCss, reportCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/vigil-case-file-polish.css"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-deterministic-report.css"), "utf8"),
  ]);

  assert.match(webCss, /\.vigil-case-file-page \.vigil-external-assessment-table \{[\s\S]*font-size: 1\.02rem[\s\S]*line-height: 1\.62/);
  assert.match(webCss, /\.vigil-case-file-page \.vigil-external-assessment-table thead th \{[\s\S]*font-size: 0\.8rem/);
  assert.match(reportCss, /\.report-external-assessment-table \{[\s\S]*font-size: 0\.96rem[\s\S]*line-height: 1\.56/);
  assert.match(reportCss, /\.report-external-assessment-table thead th \{[\s\S]*font-size: 0\.78rem/);
  assert.match(reportCss, /@media print \{[\s\S]*\.report-external-assessment-table,[\s\S]*font-size: 11\.5pt !important;[\s\S]*line-height: 1\.5 !important;/);
  assert.match(reportCss, /@media print \{[\s\S]*\.report-external-assessment-table thead th \{[\s\S]*font-size: 10pt !important;/);
});

test("Classification and Repair tables keep readable body and legend typography", async () => {
  const css = await readFile(resolve(repoRoot, "src/vigil-classification-table.css"), "utf8");
  assert.match(css, /\.vigil-case-file-page \.vigil-classification-table tbody td \{[\s\S]*font-size: 1\.02rem[\s\S]*line-height: 1\.62/);
  assert.match(css, /\.vigil-case-file-page \.vigil-repair-table tbody td \{[\s\S]*font-size: 1\.02rem[\s\S]*line-height: 1\.62/);
  assert.match(css, /\.vigil-alignment-legend \{[\s\S]*font-size: 0\.92rem[\s\S]*line-height: 1\.5/);
  assert.match(css, /\.vigil-alignment-legend-item > span:last-child > strong \{[\s\S]*font-size: 0\.92rem/);
});


test("EXTERNAL ASSESSMENTS cite Evidence sources without creating a second References subsection", async () => {
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
  const reportReferences = report.match(/<Stage number="06" label="References">[\s\S]*?<\/Stage>/)?.[0] ?? "";
  assert.doesNotMatch(caseReferences, /EXTERNAL ASSESSMENTS/);
  assert.doesNotMatch(reportReferences, /EXTERNAL ASSESSMENTS/);
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


test("Harm derivation footer remains footnote-sized after removing duplicated lead-in prose", async () => {
  const [matrix, css, reportCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/components/vigil/HarmImpactMatrix.tsx"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-incident-severity-refinement.css"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-deterministic-report.css"), "utf8"),
  ]);
  assert.doesNotMatch(matrix, /className="vigil-harm-summary"|className="vigil-harm-no-harm-basis"/);
  assert.match(css, /\.vigil-harm-derivation-note \{[\s\S]*font-size: 0\.76rem/);
  assert.match(reportCss, /\.vigil-harm-derivation-note \{[\s\S]*font-size: 0\.76rem/);
});


test("mobile Assessment prose stays viewport-bound while Harm tables remain horizontally scrollable", async () => {
  const [polishCss, harmCss] = await Promise.all([
    readFile(resolve(repoRoot, "src/vigil-case-file-polish.css"), "utf8"),
    readFile(resolve(repoRoot, "src/vigil-incident-severity-refinement.css"), "utf8"),
  ]);

  assert.match(polishCss, /@media \(max-width: 820px\)[\s\S]*#case-diagnose[\s\S]*min-width: 0;[\s\S]*max-width: 100%;/);
  assert.match(polishCss, /\.vigil-diagnosis-assessment-details p,[\s\S]*white-space: normal;[\s\S]*overflow-wrap: anywhere;/);

  assert.match(harmCss, /@media \(max-width: 760px\)[\s\S]*\.vigil-harm-matrix-scroll \{[\s\S]*overflow-x: auto;[\s\S]*-webkit-overflow-scrolling: touch;/);
  assert.match(harmCss, /@media \(max-width: 760px\)[\s\S]*\.vigil-harm-methodology-table \{[\s\S]*min-width: 1120px;/);
  assert.match(harmCss, /@media \(max-width: 760px\)[\s\S]*\.vigil-harm-assessment-table \{[\s\S]*min-width: 800px;/);

  assert.match(harmCss, /\.vigil-harm-methodology-table \{[\s\S]*min-width: 1680px;/);
  assert.match(harmCss, /\.vigil-harm-assessment-table \{[\s\S]*min-width: 1040px;/);
});


test("taxonomy, harm and external assessments remain distinct Stage 02 sections in that order", async () => {
  const source = await caseFileSource();
  const assessmentRenderer = source.match(/if \(stageId === "diagnose"\)[\s\S]*?if \(stageId === "conclusion"\)/)?.[0] ?? "";
  const taxonomyStart = assessmentRenderer.indexOf("<CaseTaxonomyAssessment raw={incident.raw} />");
  const harmStart = assessmentRenderer.indexOf("VIGIL OBSERVATORY REAL-WORLD HARM ASSESSMENT");
  const externalStart = assessmentRenderer.indexOf('className="vigil-severity-assessment vigil-external-assessment-section"');
  assert.ok(taxonomyStart > 0 && harmStart > taxonomyStart && externalStart > harmStart);
  assert.match(assessmentRenderer, /vigil-external-assessment-section/);
  assert.match(assessmentRenderer, /EXTERNAL ASSESSMENTS/);
});