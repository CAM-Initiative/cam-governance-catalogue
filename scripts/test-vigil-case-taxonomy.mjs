import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const caseFile = await readFile(resolve(repoRoot, "src/pages/vigil-case-file.tsx"), "utf8");
const caseLibrary = await readFile(resolve(repoRoot, "src/pages/vigil-cases.tsx"), "utf8");
const datasets = await readFile(resolve(repoRoot, "src/pages/datasets.tsx"), "utf8");
const printableReport = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report-printable.tsx"), "utf8");
const polishCss = await readFile(resolve(repoRoot, "src/polish.css"), "utf8");
const reportCss = await readFile(resolve(repoRoot, "src/vigil-deterministic-report.css"), "utf8");
const taxonomyPanel = await readFile(resolve(repoRoot, "src/components/vigil/CaseTaxonomyClassification.tsx"), "utf8");
const taxonomyLoader = await readFile(resolve(repoRoot, "src/lib/vigilFailureTaxonomy.ts"), "utf8");
const taxonomyClassification = await readFile(resolve(repoRoot, "src/lib/vigilTaxonomyClassification.ts"), "utf8");
const vigilRegistry = await readFile(resolve(repoRoot, "src/lib/vigilRegistry.ts"), "utf8");
const evidenceCard = await readFile(resolve(repoRoot, "src/components/vigil/EvidenceCard.tsx"), "utf8");
const mainTs = await readFile(resolve(repoRoot, "src/main.tsx"), "utf8");
const deterministicReport = await readFile(resolve(repoRoot, "src/pages/evidence-chain-report-deterministic.tsx"), "utf8");
const darkAppearanceCss = await readFile(resolve(repoRoot, "src/dark-appearance.css"), "utf8");
const shell = await readFile(resolve(repoRoot, "src/components/layout/Shell.tsx"), "utf8");

assert.match(caseFile, /import \{ CaseTaxonomyClassification, CaseTaxonomyRepair \} from "@\/components\/vigil\/CaseTaxonomyClassification"/);
assert.match(caseFile, /stageId === "classify"[\s\S]*<CaseTaxonomyClassification raw=\{incident\.raw\}/);
assert.match(caseFile, /stageId === "repair"[\s\S]*<CaseTaxonomyRepair raw=\{incident\.raw\}/);

assert.match(taxonomyPanel, /raw\.taxonomy_classification/);
assert.match(taxonomyPanel, /primary_family/);
assert.match(taxonomyPanel, /primary_class/);
assert.match(taxonomyPanel, /secondary_classifications/);
assert.match(taxonomyPanel, /family_id/);
assert.match(taxonomyPanel, /class_id/);
assert.match(taxonomyPanel, /classById/);
assert.match(taxonomyPanel, /familyById/);
assert.match(taxonomyPanel, /Primary structural mechanism/);
assert.match(taxonomyPanel, /Additional independently evidenced structural mechanisms/);

assert.match(taxonomyPanel, /vigil-classification-card/);
assert.match(taxonomyPanel, /vigil-classification-layout/);
assert.match(taxonomyPanel, /vigil-classification-metadata/);
assert.match(taxonomyPanel, /vigil-repair-invariant-card/);

for (const detail of [
  "What this failure means",
  "Canonical definition",
  "Why this Case File maps here",
  "Classification metadata",
  "Failure family",
  "Failure class",
  "Taxonomy version",
  "View canonical taxonomy source",
]) {
  assert.match(taxonomyPanel, new RegExp(detail), `missing selective taxonomy detail: ${detail}`);
}

assert.match(taxonomyPanel, /exemplar \? "Failure boundary this exemplar tests" : "What this failure means"/);
assert.match(taxonomyPanel, /className="vigil-substantive-label">Canonical definition/);
assert.match(taxonomyPanel, /exemplar \? "Why this Case File is an exemplar" : "Why this Case File maps here"/);
assert.doesNotMatch(taxonomyPanel, /vigil-diagnostic-meta-label">What this failure means/);
assert.match(taxonomyPanel, /vigil-diagnostic-meta-label">Classification metadata/);

assert.match(caseFile, /<HarmImpactMatrix assessment=/);
assert.match(caseFile, /className="vigil-substantive-label">Factual basis/);
assert.match(caseFile, /className="vigil-substantive-label">Governance significance/);
assert.match(caseFile, /vigil-diagnostic-meta-label">Assessment provenance/);

assert.match(taxonomyPanel, /export function CaseTaxonomyRepair/);
assert.match(taxonomyPanel, /Governing class invariant/);
assert.match(taxonomyPanel, /Additional class invariant/);
assert.match(taxonomyPanel, /classificationClass\.invariant/);
assert.match(taxonomyPanel, /governingClassInvariants/);
assert.match(taxonomyPanel, /The broader family invariant is not substituted here/);
assert.match(taxonomyPanel, /does not substitute the broader family invariant/);
assert.match(taxonomyPanel, /does not currently identify the specific CAELESTIS constitutional or run-time provision/);
assert.doesNotMatch(taxonomyPanel, /family\.invariant/);
assert.doesNotMatch(taxonomyPanel, /Technical taxonomy record/);
assert.doesNotMatch(taxonomyPanel, /Canonical examples/);
assert.doesNotMatch(taxonomyPanel, /Recognition subtypes and historical folded classes/);

for (const state of [
  "classified",
  "provisionally-classified",
  "classification-disputed",
  "requires-human-review",
  "unclassified",
  "family-only",
  "candidate-new-class",
  "unmapped",
  "deferred",
]) {
  assert.match(taxonomyPanel, new RegExp(`\\"${state}\\"`), `missing explicit taxonomy state ${state}`);
}

assert.match(taxonomyPanel, /currently proposed taxonomy mapping for a disputed classification/);
assert.match(taxonomyPanel, /No legacy taxonomy fallback has been applied/);
assert.doesNotMatch(taxonomyPanel, /OPS\.FF/);
assert.doesNotMatch(taxonomyPanel, /canonical_failure_group/);
assert.doesNotMatch(taxonomyPanel, /taxonomy_reference/);
assert.doesNotMatch(taxonomyPanel, /failure_subtype/);

assert.match(taxonomyLoader, /VIGIL\.FailureTaxonomy\.Index\.json/);
assert.match(taxonomyLoader, /index\.families\.map/);
assert.match(taxonomyLoader, /entry\.file/);
assert.match(taxonomyLoader, /CAM-Initiative\/Vigil\/main/);
assert.doesNotMatch(taxonomyLoader, /agent\/bounded-incident-classification-provenance-repair/);
assert.match(taxonomyLoader, /subtypes\?: FailureTaxonomySubtype\[\]/);
assert.match(taxonomyLoader, /invariant\?: string/);

// Main builds consume the canonical branch; an explicit build-time override keeps
// the paired website feature branch consistent with the VIGIL feature branch.
assert.doesNotMatch(vigilRegistry, /VIGIL_WORKING_BRANCH/);
assert.doesNotMatch(vigilRegistry, /vigilPreviewUrl/);
assert.match(vigilRegistry, /VITE_VIGIL_REGISTRY_URL/);
assert.match(vigilRegistry, /VITE_VIGIL_RECORD_BRANCH/);
assert.match(vigilRegistry, /VIGIL_REGISTRY_SOURCE\.incident_registry_index_url/);
assert.match(vigilRegistry, /if \(record\.raw_url\) return record\.raw_url/);
assert.match(vigilRegistry, /VIGIL_REGISTRY_SOURCE\.branch/);

assert.doesNotMatch(evidenceCard, /Evidence confidence/);
for (const label of ["Source role", "Source residence", "Evidence modality", "Direct artefact review"]) {
  assert.match(evidenceCard, new RegExp(label), `missing source-level evidence metadata: ${label}`);
}

assert.match(caseLibrary, /taxonomyFailureTypeLabel/);
assert.match(caseLibrary, /classificationStatusLabel\(record\)/);
assert.match(caseLibrary, /classificationStatusCounts\(records\)/);
assert.match(caseLibrary, /canonicalComparisonKey\(classificationStatusLabel\(record\)\)/);
assert.match(caseLibrary, />Classification<\/span>/);
assert.match(caseLibrary, /SortHeading label="Classification" sortKey="classification"/);
assert.match(caseLibrary, /taxonomyFailureTypeLabel\(record\.raw\)/);
assert.doesNotMatch(caseLibrary, /Failure type/);
assert.doesNotMatch(caseLibrary, /Taxonomy status/);
assert.doesNotMatch(caseLibrary, /record\.failure_family/);

assert.match(caseFile, /loadTaxonomyReferenceTargets\(incident\.raw\)/);
assert.match(caseFile, /taxonomyReferences\.map/);
assert.match(caseFile, /VIGIL Observatory Failure Taxonomy/);
assert.match(caseFile, /reference\.id} — \{reference\.title/);
assert.match(caseFile, /collectTaxonomyEvidence\(taxonomyReferences\)/);
assert.match(caseFile, /taxonomyEvidenceReferences\.map/);
assert.match(caseFile, /Taxonomy evidence supporting/);
assert.match(caseFile, /reference\.taxonomyVersion/);
assert.doesNotMatch(caseFile, /vigil-case-file-summary/);
assert.match(taxonomyClassification, /dataset\.sourceRoot/);
assert.match(taxonomyClassification, /indexEntry\.file/);
assert.match(taxonomyClassification, /relationship: "primary" \| "secondary" \| "family-only" \| "exemplar"/);
assert.match(taxonomyClassification, /successful-invariant/);
assert.match(taxonomyClassification, /record\.classification_status/);
assert.match(taxonomyClassification, /record\.classification_role/);
assert.match(taxonomyClassification, /directStatus === "classified"/);
assert.match(taxonomyClassification, /return "Exemplar"/);
assert.match(taxonomyClassification, /classification-disputed/);
assert.match(taxonomyClassification, /requires-human-review/);

// Dataset downloads use canonical VIGIL main only.
assert.match(datasets, /VIGIL\.Observatory\.FailureTaxonomy\.FullReference\.pdf/);
assert.match(datasets, /VIGIL-Failure-Taxonomy-Full-Reference\.pdf/);
assert.match(datasets, /Download PDF reference/);
assert.match(datasets, /const taxonomyStatus = state\.taxonomyVersion/);
assert.match(datasets, /status=\{taxonomyStatus\}/);
assert.match(datasets, /: "Technical reference"/);
assert.match(datasets, /downloadRemoteFile/);
assert.match(datasets, /response\.blob\(\)/);
assert.match(datasets, /anchor\.download = filename/);
assert.match(datasets, /canonical machine-readable taxonomy remains maintained in VIGIL Observatory/);
assert.match(datasets, /title="VIGIL Observatory Failure Taxonomy"/);
assert.doesNotMatch(datasets, /title="AI Governance Failure Taxonomy"/);
assert.match(datasets, /CAM-Initiative\/Vigil\/main\/vigil\/taxonomy\/generated/);
assert.doesNotMatch(datasets, /agent\/bounded-incident-classification-provenance-repair/);
assert.doesNotMatch(datasets, /Download HTML reference/);
assert.doesNotMatch(datasets, /VIGIL\.FailureTaxonomy\.FullReference\.html/);

assert.match(printableReport, /loadTaxonomyReferenceTargets\(raw\)/);
assert.match(printableReport, /report-taxonomy-reference/);
assert.match(printableReport, /document\.title = `VIGIL Observatory Case File — \$\{compactIncidentId\(reportIncident\.id\)\} — \$\{reportIncident\.title\}`/);
assert.match(printableReport, /VIGIL Observatory Failure Taxonomy/);
assert.match(printableReport, /\{ number: "04", label: "Repair" \}/);
assert.match(printableReport, /\{ number: "05", label: "References" \}/);

assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-evidence-grid \{\s*display: block !important;/s);
assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-evidence-source-actions \{\s*display: none !important;/s);
assert.match(reportCss, /vigil-classification-layout/);
assert.match(reportCss, /vigil-repair-invariant-card/);
assert.match(reportCss, /\.report-substantive-label,\s*\n\.vigil-deterministic-report-host \.vigil-substantive-label/);
assert.match(reportCss, /\.vigil-classification-reading > section > p:last-child,[\s\S]*font-family: var\(--app-font-sans\) !important;/);
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

assert.match(polishCss, /report print styling now lives exclusively/);
assert.doesNotMatch(polishCss, /@page \{ margin: 1\.45cm 1\.35cm; \}/);
assert.doesNotMatch(polishCss, /Forced page-per-stage pagination created blank and nearly blank pages/);

assert.match(deterministicReport, /className="report-hero"/);
assert.match(deterministicReport, /const isExemplar = classification === "Exemplar"/);
assert.match(deterministicReport, /className="report-exemplar-callout"/);
assert.match(deterministicReport, /The system worked as intended\./);
assert.match(deterministicReport, /successful governance outcome, not a failure occurrence/);
assert.match(deterministicReport, /className="report-section-header"/);
assert.match(deterministicReport, /<HarmImpactMatrix assessment=/);
assert.match(deterministicReport, /className="report-reference-list"/);
assert.match(deterministicReport, /className="report-substantive-label">Factual basis/);
assert.match(deterministicReport, /className="report-label">Assessment provenance/);
assert.doesNotMatch(deterministicReport, /const summary =/);
assert.doesNotMatch(mainTs, /vigil-deterministic-report-typography-contract\.css/);

assert.match(printableReport, /Use and reliance notice/);
assert.match(printableReport, /does not constitute legal, regulatory, security, assurance, certification, risk, or other professional advice/);
assert.match(printableReport, /Third parties remain responsible for verifying the cited source material/);
assert.match(printableReport, /© 2026 CAM Initiative\. All rights reserved\./);
assert.doesNotMatch(printableReport, /© 2026 Dr Michelle O'Rourke/);
assert.match(printableReport, /All rights reserved/);
assert.doesNotMatch(printableReport, /requires permission/);
assert.doesNotMatch(printableReport, /VIGIL Observatory Licence and Reuse Terms/);
assert.doesNotMatch(printableReport, /CC BY-NC-SA 4\.0/);
assert.match(reportCss, /\.report-reliance-notice/);
assert.match(reportCss, /\.report-copyright/);

console.log("VIGIL Observatory Case File taxonomy, canonical-main sources, richer source metadata and deterministic report contract passed");


test("Deterministic report harm matrix must fit the printable width", async () => {
  const reportCss = await read("src/vigil-deterministic-report.css");
  assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-harm-assessment-table \{[\s\S]*width: 100%;[\s\S]*min-width: 0;[\s\S]*table-layout: fixed;/);
  assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-harm-matrix-scroll \{[\s\S]*max-width: 100%;[\s\S]*overflow: visible;/);
  assert.match(reportCss, /overflow-wrap: anywhere/);
  assert.match(reportCss, /white-space: normal/);
});
