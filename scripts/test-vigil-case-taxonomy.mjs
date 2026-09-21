import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [
  caseFile,
  report,
  reportCss,
  printableReport,
  polishCss,
  mainTs,
  shell,
  darkAppearanceCss,
] = await Promise.all([
  readFile(new URL("../src/pages/vigil-case-file.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/pages/evidence-chain-report-deterministic.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/vigil-deterministic-report.css", import.meta.url), "utf8"),
  readFile(new URL("../src/pages/evidence-chain-report-printable.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/vigil-case-file-polish.css", import.meta.url), "utf8"),
  readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/layout/Shell.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/dark-appearance.css", import.meta.url), "utf8"),
]);

// Canonical Case File retains taxonomy-derived Classification and Repair without
// reviving retired record machinery.
assert.match(caseFile, /CaseTaxonomyClassification/);
assert.match(caseFile, /CaseTaxonomyRepair/);
assert.doesNotMatch(caseFile, /deriveFailureModePublicDetail/);
assert.doesNotMatch(caseFile, /failureId=/);
assert.doesNotMatch(caseFile, /incident-specific assessment rather than the full methodology reference table/);
assert.match(caseFile, /<HarmImpactMatrix[\s\S]*assessment=\{harmImpactAssessment\}[\s\S]*evidenceReferenceNumbers=\{harmEvidenceReferenceNumbers\}[\s\S]*methodologyReferenceNumber=\{harmMethodologyReferenceNumber\}[\s\S]*methodologyReferenceHref="#vigil-harm-methodology-reference"/);
assert.doesNotMatch(caseFile, /Repair is shown only for mappings classified as failures/);
assert.doesNotMatch(caseFile, /Successful-invariant exemplar mappings remain in Classification/);
assert.doesNotMatch(caseFile, /vigil-repair-boundary/);
assert.match(caseFile, /Failure-occurrence and ambiguous-boundary mappings contribute their governing invariants to Repair/);

// Deterministic report retains the same canonical projection.
assert.match(report, /CaseTaxonomyClassification/);
assert.match(report, /CaseTaxonomyRepair/);
assert.doesNotMatch(report, /deriveFailureModePublicDetail/);
assert.doesNotMatch(report, /failureId=/);

// Print/report typography and publication hierarchy remain coherent.
assert.match(reportCss, /\.vigil-evidence-reading-stack > \.vigil-evidence-column p,[\s\S]*font-family: var\(--app-font-sans\) !important;/);
assert.doesNotMatch(reportCss, /\.report-label,\s*\n\.vigil-deterministic-report-host \.report-substantive-label,/);
assert.match(reportCss, /report-hero-meta/);
assert.match(reportCss, /Publication hierarchy correction: narrative and analytical prose is the paper surface/);
assert.match(reportCss, /\.report-metadata-panel,[\s\S]*\.vigil-evidence-metadata-panel,[\s\S]*background: hsl\(var\(--report-panel-strong\)\) !important;/);
assert.match(reportCss, /\.report-subpanel,[\s\S]*\.vigil-evidence-reading-stack > \.vigil-evidence-column,[\s\S]*background: hsl\(var\(--report-paper\)\) !important;/);
assert.match(reportCss, /@media print \{[\s\S]*background: #f1f1ee !important;/);
assert.match(reportCss, /report-section-header/);
assert.match(reportCss, /report-analysis-grid/);
assert.match(reportCss, /report-reference-list/);
assert.match(reportCss, /font-size: 11pt !important/);
assert.doesNotMatch(reportCss, /font-size: 12pt !important/);
assert.match(reportCss, /--report-paper: 0 0% 100%/);
assert.match(reportCss, /--report-panel: 0 0% 100%/);
assert.match(reportCss, /background: #fff !important/);
assert.match(reportCss, /\.report-document \{[\s\S]*color-scheme: light;[\s\S]*--foreground: var\(--report-ink\);[\s\S]*--muted-foreground: var\(--report-muted\);[\s\S]*background: hsl\(var\(--report-paper\)\)/);
assert.match(reportCss, /\.report-section p:not\([\s\S]*color: hsl\(var\(--report-ink\) \/ 0\.9\) !important;/);
assert.match(reportCss, /\.report-exemplar-callout \{[\s\S]*background: hsl\(var\(--report-success-panel\)\)/);
assert.match(reportCss, /@media print \{[\s\S]*\.report-exemplar-callout \{[\s\S]*background: #edf6ef !important;/);
assert.match(reportCss, /\.vigil-deterministic-report-host \.site-header,[\s\S]*display: none !important;/);
assert.match(shell, /className="site-header sticky/);
assert.match(darkAppearanceCss, /\.site-header \{[\s\S]*background-color: hsl\(var\(--background\)\) !important;/);
assert.doesNotMatch(darkAppearanceCss, /(?:^|\n)header \{/);
assert.doesNotMatch(reportCss, /font-size: 9\.6pt !important/);
assert.doesNotMatch(reportCss, /font-size: 7\.2pt !important/);
assert.match(reportCss, /break-after: avoid-page/);

assert.match(reportCss, /main\.container > footer,/);
assert.doesNotMatch(printableReport, /deterministic print projection of the corresponding VIGIL Case File/);

assert.doesNotMatch(polishCss, /@page \{ margin: 1\.45cm 1\.35cm; \}/);
assert.doesNotMatch(polishCss, /Forced page-per-stage pagination created blank and nearly blank pages/);

assert.match(report, /className="report-hero"/);
assert.match(report, /const isExemplar = classification === "Exemplar"/);
assert.match(report, /const isFailure = classification === "Classified"/);
assert.match(report, /className=\{`report-exemplar-callout\$\{hasMixedExecution \? " is-mixed-execution" : ""\}`\}/);
assert.match(report, /The system worked as intended\./);
assert.match(report, /The governing invariants assessed did not demonstrate alignment\./);
assert.match(report, /Failure-classified Incident/);
assert.match(report, /successful governance outcome, not a failure-classified Incident/);
assert.match(report, /className="report-section-header"/);
assert.match(report, /<Stage number="01" label="Incident">/);
assert.match(report, /className="report-occurrence-card"/);
assert.match(report, /className="vigil-evidence-kicker">Incident summary/);
assert.match(report, /incidentArtefactsFor/);
assert.match(report, /className="report-incident-artefacts"/);
assert.match(report, /report-observation-summary[\s\S]*report-affected-systems[\s\S]*report-incident-artefacts/);
assert.match(reportCss, /report-diagnosis > \.report-severity-assessment[\s\S]*border-top: 1px solid/);
assert.match(reportCss, /report-severity-assessment > \.vigil-harm-matrix[\s\S]*border-top: 0 !important/);
assert.match(reportCss, /\.report-document \{[\s\S]*hyphens: none !important/);
assert.match(reportCss, /report-reference-url,[\s\S]*overflow-wrap: anywhere !important/);
assert.match(reportCss, /report-incident-artefact-link,[\s\S]*max-width: 68% !important/);
assert.match(report, /<img src=\{artefact\.renderUrl\}/);
assert.match(report, /function evidenceReferenceNumberForUrl/);
assert.match(report, /className="report-inline-reference" href=\{\`#vigil-evidence-reference-\$\{referenceNumber\}\`\}/);
assert.doesNotMatch(report, /View originating source/);
assert.match(reportCss, /\.report-incident-artefact figcaption \{[\s\S]*display: flex;[\s\S]*align-items: baseline;/);
assert.match(reportCss, /\.report-external-assessment-table \{[\s\S]*font-size: 0\.96rem;/);
assert.match(reportCss, /@media print \{[\s\S]*\.report-external-assessment-table,[\s\S]*font-size: 11\.5pt !important;/);
assert.match(report, /data-report-postscript/);
assert.doesNotMatch(report, /<details className="vigil-evidence-limitations"/);
assert.match(report, /<HarmImpactMatrix[\s\S]*assessment=\{harmImpactAssessment\}[\s\S]*compact[\s\S]*evidenceReferenceNumbers=\{harmEvidenceReferenceNumbers\}[\s\S]*methodologyReferenceNumber=\{harmMethodologyReferenceNumber\}[\s\S]*methodologyReferenceHref="#vigil-harm-methodology-reference"/);
assert.doesNotMatch(report, /report-metadata-grid report-metadata-grid--2"><Field label="Methodology"/);
assert.match(report, /className="report-reference-list"/);
assert.match(report, /Internal records/);
assert.match(report, /report-external-assessment-table/);
assert.match(report, /externalAssessmentDate\(assessment\.date\)/);
assert.match(report, /className="vigil-library-kicker">EXTERNAL ASSESSMENTS<\/p>/);
assert.doesNotMatch(report, /className="report-substantive-label">EXTERNAL ASSESSMENTS<\/h4>/);
assert.match(reportCss, /\.report-external-assessments > \.vigil-library-kicker \{[\s\S]*margin: 0 0 0\.55rem/);
assert.doesNotMatch(report, /<ExternalAssessmentList assessments=\{externalAssessments\} compact/);
assert.match(report, /className="report-substantive-label">Factual basis/);
assert.match(report, /GOVERNANCE ASSESSMENT[\s\S]*Factual basis[\s\S]*Governance significance[\s\S]*REAL-WORLD HARM ASSESSMENT/);
assert.match(reportCss, /\.report-assessment-details > section > \.report-substantive-label,[\s\S]*\.report-assessment-details > \.vigil-taxonomy-assessment > \.vigil-substantive-label \{[\s\S]*font-size: 1\.05rem !important;[\s\S]*font-weight: 700 !important;/);
assert.match(reportCss, /@media print \{[\s\S]*\.report-assessment-details > section > \.report-substantive-label,[\s\S]*\.report-assessment-details > \.vigil-taxonomy-assessment > \.vigil-substantive-label \{[\s\S]*font-size: 11\.5pt !important;[\s\S]*font-weight: 700 !important;/);
assert.doesNotMatch(report, /report-harm-classification-intro/);
assert.match(report, /report-assessment-details/);
assert.match(printableReport, /nonAssessedHarmDimensionLimitItems/);
assert.match(reportCss, /Final PDF width containment/);
assert.match(reportCss, /margin: 20mm 0 18mm/);
assert.match(reportCss, /padding: 0 13mm !important/);
assert.match(reportCss, /Physical A4 safe area/);
assert.match(reportCss, /Deterministic vertical pagination/);
assert.match(reportCss, /data-report-stage="02"[\s\S]*break-before: page !important/);
assert.match(reportCss, /data-report-stage="06"[\s\S]*page-break-before: always !important/);
assert.match(reportCss, /vigil-classification-family-row[\s\S]*break-after: avoid-page !important/);
assert.match(reportCss, /grid-template-columns: 9mm minmax\(0, 1fr\) !important/);
assert.match(reportCss, /overflow-wrap: break-word !important/);
assert.match(printableReport, /Limits of the assessment/);
assert.doesNotMatch(report, /Assessment provenance/);
assert.doesNotMatch(report, /<EvidenceCard/);
assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-classification-report-cards \{[\s\S]*display: none !important;/);
assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-classification-web-table \{[\s\S]*display: block !important;/);
assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-repair-metadata-panel \{[\s\S]*display: none !important;/);
assert.match(reportCss, /\.report-observation-summary > \.report-substantive-label[\s\S]*font-size: 1\.08rem !important;/);
assert.match(reportCss, /Deterministic report consistency: the numbered stage is the section container/);
assert.match(reportCss, /\.report-occurrence-card,[\s\S]*border: 0 !important/);
assert.match(reportCss, /\.vigil-classification-web-table,[\s\S]*border: 0 !important/);
assert.match(reportCss, /\.report-incident-artefact-link[\s\S]*max-width: 75%/);
assert.match(reportCss, /Final print-flow refinement: open numbered sections/);
assert.match(reportCss, /\.report-flow,[\s\S]*display: block !important;/);
assert.match(reportCss, /\.report-intro \{[\s\S]*break-inside: avoid-page/);
assert.match(reportCss, /\.report-assessment-limits \{[\s\S]*break-inside: auto !important/);
assert.match(reportCss, /\.report-empty \{[\s\S]*border: 0 !important/);
assert.match(reportCss, /@media print \{[\s\S]*\.report-section \{[\s\S]*border: 0 !important;/);
assert.match(reportCss, /\.report-affected-systems \{[\s\S]*break-inside: avoid-page/);
assert.match(reportCss, /\.vigil-repair-web-table,[\s\S]*break-inside: auto !important/);
assert.match(reportCss, /\.report-severity-assessment > \.report-metadata-grid[\s\S]*background: transparent !important;/);
assert.doesNotMatch(report, /const summary =/);
assert.doesNotMatch(mainTs, /vigil-deterministic-report-typography-contract\.css/);

assert.match(printableReport, /Use and reliance notice/);
assert.match(printableReport, /Limits of the assessment/);
assert.match(printableReport, /report-postscript/);
assert.match(printableReport, /no resolved failure-classified mapping/);
assert.match(printableReport, /does not constitute legal, regulatory, security, assurance, certification, risk, or other professional advice/);
assert.match(printableReport, /Third parties remain responsible for verifying the cited source material/);
assert.match(printableReport, /© 2026 CAM Initiative\. All rights reserved\./);
assert.doesNotMatch(printableReport, /© 2026 Dr Michelle O'Rourke/);
assert.match(printableReport, /All rights reserved/);
assert.doesNotMatch(printableReport, /requires permission/);
assert.doesNotMatch(printableReport, /VIGIL Observatory Licence and Reuse Terms/);


const taxonomyAssessment = await readFile(new URL("../src/components/vigil/CaseTaxonomyAssessment.tsx", import.meta.url), "utf8");
assert.match(taxonomyAssessment, /vigil_assessment/);
assert.match(taxonomyAssessment, /source_clause_analysis/);
assert.match(taxonomyAssessment, /VIGIL taxonomy assessment/);
assert.match(taxonomyAssessment, /Recovered governance principle/);
assert.match(taxonomyAssessment, /Taxonomy assessment/);
assert.match(taxonomyAssessment, /Canonical failure classes, alignment outcomes and classification basis are stated once in Section 03/);
assert.doesNotMatch(taxonomyAssessment, /class_id/);
assert.doesNotMatch(taxonomyAssessment, /VIGIL-FC-/);
assert.match(caseFile, /Governance significance[\s\S]*<CaseTaxonomyAssessment raw=\{incident\.raw\} \/>[\s\S]*REAL-WORLD HARM ASSESSMENT/);
assert.match(report, /Governance significance[\s\S]*<CaseTaxonomyAssessment raw=\{incident\.raw\} \/>[\s\S]*REAL-WORLD HARM ASSESSMENT/);
assert.match(polishCss, /\.vigil-taxonomy-assessment-table th:nth-child\(1\)/);
assert.match(reportCss, /\.vigil-taxonomy-assessment-table th:nth-child\(1\)/);

assert.match(taxonomyAssessment, /vigil-external-assessment-table vigil-taxonomy-assessment-table/);
assert.doesNotMatch(taxonomyAssessment, /report-external-assessment-table/);
assert.doesNotMatch(taxonomyAssessment, />\\\\n/);
assert.doesNotMatch(taxonomyAssessment, /vigil-taxonomy-assessment-row/);
assert.match(caseFile, /<CaseTaxonomyAssessment raw=\{incident\.raw\} \/>[\s\S]*<\/section>[\s\S]*vigil-external-assessment-section[\s\S]*EXTERNAL ASSESSMENTS[\s\S]*REAL-WORLD HARM ASSESSMENT[\s\S]*REAL-WORLD HARM ASSESSMENT/);
assert.match(report, /<CaseTaxonomyAssessment raw=\{incident\.raw\} \/>[\s\S]*EXTERNAL ASSESSMENTS[\s\S]*REAL-WORLD HARM ASSESSMENT/);

assert.match(caseFile, /GOVERNANCE ASSESSMENT/);
assert.match(caseFile, /EXTERNAL ASSESSMENTS/);
assert.match(caseFile, /REAL-WORLD HARM ASSESSMENT[\s\S]*REAL-WORLD HARM ASSESSMENT/);
assert.doesNotMatch(caseFile, />Harm classification<\/p>/);
assert.match(report, /GOVERNANCE ASSESSMENT/);
assert.match(report, /EXTERNAL ASSESSMENTS/);
assert.match(report, /REAL-WORLD HARM ASSESSMENT[\s\S]*REAL-WORLD HARM ASSESSMENT/);
assert.match(reportCss, /Peer assessment headings share one deterministic report contract/);

assert.match(taxonomyAssessment, /className="vigil-substantive-label" id="vigil-taxonomy-assessment-heading">VIGIL taxonomy assessment<\/h4>/);
assert.match(polishCss, /vigil-taxonomy-assessment-table[\s\S]*table-layout: fixed/);
assert.match(polishCss, /vigil-taxonomy-assessment-table td:first-child[\s\S]*white-space: normal/);
assert.match(reportCss, /Taxonomy assessment table mirrors the External assessments table/);

assert.match(report, /report-peer-assessment-heading">EXTERNAL ASSESSMENTS/);
assert.match(report, /report-peer-assessment-heading">REAL-WORLD HARM ASSESSMENT/);
assert.doesNotMatch(report, />Harm Impact Assessment<\/h4>/);
assert.doesNotMatch(caseFile, />Harm Impact Assessment<\/h3>/);
assert.match(reportCss, /\.report-peer-assessment-heading \{[\s\S]*margin: 0 0 0\.55rem !important;[\s\S]*padding: 0 !important;/);
