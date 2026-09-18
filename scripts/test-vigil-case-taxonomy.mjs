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
assert.match(caseFile, /<HarmImpactMatrix assessment=\{harmImpactAssessment\} methodology=\{severityMethodology\} assessedOn=\{severityAssessedOn\} \/>/);
assert.doesNotMatch(caseFile, /Repair is shown only for mappings classified as failures/);
assert.doesNotMatch(caseFile, /Successful-invariant exemplar mappings remain in Classification/);
assert.doesNotMatch(caseFile, /vigil-repair-boundary/);

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
assert.match(reportCss, /font-size: 12pt !important/);
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
assert.match(reportCss, /@page \{[\s\S]*size: A4;[\s\S]*margin: 14mm 13mm 16mm;/);
assert.match(reportCss, /break-after: avoid-page/);

assert.match(reportCss, /main\.container > footer,/);
assert.doesNotMatch(printableReport, /deterministic print projection of the corresponding VIGIL Case File/);

assert.doesNotMatch(polishCss, /@page \{ margin: 1\.45cm 1\.35cm; \}/);
assert.doesNotMatch(polishCss, /Forced page-per-stage pagination created blank and nearly blank pages/);

assert.match(report, /className="report-hero"/);
assert.match(report, /const isExemplar = classification === "Exemplar"/);
assert.match(report, /className=\{`report-exemplar-callout\$\{hasMixedExecution \? " is-mixed-execution" : ""\}`\}/);
assert.match(report, /The system worked as intended\./);
assert.match(report, /successful governance outcome, not a failure-classified Incident/);
assert.match(report, /className="report-section-header"/);
assert.match(report, /<Stage number="01" label="Incident">/);
assert.match(report, /className="report-occurrence-card"/);
assert.match(report, /className="vigil-evidence-kicker">Incident summary/);
assert.match(report, /data-report-postscript/);
assert.doesNotMatch(report, /<details className="vigil-evidence-limitations"/);
assert.match(report, /<HarmImpactMatrix assessment=\{harmImpactAssessment\} compact methodology=\{severityMethodology\} assessedOn=\{severityAssessedOn\} \/>/);
assert.doesNotMatch(report, /report-metadata-grid report-metadata-grid--2"><Field label="Methodology"/);
assert.match(report, /className="report-reference-list"/);
assert.match(report, /className="report-substantive-label">Factual basis/);
assert.doesNotMatch(report, /Assessment provenance/);
assert.doesNotMatch(report, /<EvidenceCard/);
assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-classification-report-cards \{[\s\S]*display: none !important;/);
assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-classification-web-table \{[\s\S]*display: block !important;/);
assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-repair-metadata-panel \{[\s\S]*display: none !important;/);
assert.match(reportCss, /\.report-observation-summary > \.report-substantive-label[\s\S]*font-size: 1\.08rem !important;/);
assert.match(reportCss, /\.report-occurrence-card[\s\S]*border: 1px solid/);
assert.match(reportCss, /Final print-flow refinement: open numbered sections/);
assert.match(reportCss, /@media print \{[\s\S]*\.report-section \{[\s\S]*border: 0 !important;/);
assert.match(reportCss, /\.report-affected-systems \{[\s\S]*break-inside: avoid-page/);
assert.match(reportCss, /\.vigil-repair-web-table,[\s\S]*break-inside: avoid-page/);
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
