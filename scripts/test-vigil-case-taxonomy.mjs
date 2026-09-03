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

assert.match(caseFile, /import \{ CaseTaxonomyClassification \} from "@\/components\/vigil\/CaseTaxonomyClassification"/);
assert.match(caseFile, /stageId === "classify"[\s\S]*<CaseTaxonomyClassification raw=\{incident\.raw\}/);

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

assert.match(taxonomyPanel, /vigil-evidence-card vigil-taxonomy-record-card/);
assert.match(taxonomyPanel, /vigil-evidence-header/);
assert.match(taxonomyPanel, /vigil-evidence-source-meta/);
assert.match(taxonomyPanel, /vigil-evidence-grid/);

for (const detail of [
  "Technical taxonomy record",
  "Governing family invariant",
  "Family definition",
  "Inclusion rule",
  "Exclusion rule",
  "Family scope",
  "Recognition conditions",
  "Class exclusions",
  "Canonical examples",
  "Taxonomy relationships",
  "Aliases",
  "Why this Case File maps here",
  "Recognition subtypes and historical folded classes",
  "Historical class ID",
]) {
  assert.match(taxonomyPanel, new RegExp(detail), `missing canonical taxonomy detail: ${detail}`);
}

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

// Both local and production rendering consume the canonical VIGIL main branch.
assert.doesNotMatch(vigilRegistry, /VIGIL_WORKING_BRANCH/);
assert.doesNotMatch(vigilRegistry, /vigilPreviewUrl/);
assert.match(vigilRegistry, /VIGIL_INCIDENT_REGISTRY_URL = VIGIL_REGISTRY_SOURCE\.incident_registry_index_url/);
assert.match(vigilRegistry, /if \(record\.raw_url\) return record\.raw_url/);
assert.match(vigilRegistry, /VIGIL_REGISTRY_SOURCE\.branch/);

assert.doesNotMatch(evidenceCard, /Evidence confidence/);
for (const label of ["Source role", "Source residence", "Evidence modality", "Direct artefact review"]) {
  assert.match(evidenceCard, new RegExp(label), `missing source-level evidence metadata: ${label}`);
}

assert.match(caseLibrary, /taxonomy_classification_summary/);
assert.match(caseLibrary, /classification_status/);
assert.match(caseLibrary, /class_id/);
assert.match(caseLibrary, /return isTaxonomyClassified\(record\) \? "Classified" : "Unclassified"/);
assert.match(caseLibrary, /failureTypeCounts\(records\)/);
assert.match(caseLibrary, /canonicalComparisonKey\(failureTypeLabel\(record\)\)/);
assert.match(caseLibrary, /Failure type/);
assert.match(caseLibrary, /SortHeading label="Failure type"/);
assert.doesNotMatch(caseLibrary, /Taxonomy status/);
assert.doesNotMatch(caseLibrary, /record\.failure_family/);
assert.doesNotMatch(caseLibrary, /taxonomyFailureTypeLabel\(record\.raw\)/);

assert.match(caseFile, /loadTaxonomyReferenceTargets\(incident\.raw\)/);
assert.match(caseFile, /taxonomyReferences\.map/);
assert.match(caseFile, /VIGIL Failure Taxonomy/);
assert.match(caseFile, /reference\.id} — \{reference\.title/);
assert.match(taxonomyClassification, /dataset\.sourceRoot/);
assert.match(taxonomyClassification, /indexEntry\.file/);
assert.match(taxonomyClassification, /relationship: "primary" \| "secondary" \| "family-only"/);
assert.match(taxonomyClassification, /classification-disputed/);
assert.match(taxonomyClassification, /requires-human-review/);

// Dataset downloads use canonical VIGIL main only.
assert.match(datasets, /VIGIL\.Observatory\.FailureTaxonomy\.FullReference\.pdf/);
assert.match(datasets, /VIGIL-Observatory-AI-Governance-Failure-Taxonomy-Full-Reference\.pdf/);
assert.match(datasets, /Download PDF reference/);
assert.match(datasets, /status="Technical reference"/);
assert.match(datasets, /downloadRemoteFile/);
assert.match(datasets, /response\.blob\(\)/);
assert.match(datasets, /anchor\.download = filename/);
assert.match(datasets, /canonical machine-readable taxonomy remains maintained in VIGIL/);
assert.match(datasets, /CAM-Initiative\/Vigil\/main\/vigil\/taxonomy\/generated/);
assert.doesNotMatch(datasets, /agent\/bounded-incident-classification-provenance-repair/);
assert.doesNotMatch(datasets, /Download HTML reference/);
assert.doesNotMatch(datasets, /VIGIL\.FailureTaxonomy\.FullReference\.html/);

assert.match(printableReport, /loadTaxonomyReferenceTargets\(raw\)/);
assert.match(printableReport, /report-taxonomy-reference/);
assert.match(printableReport, /document\.title = `VIGIL Observatory Case File — \$\{compactIncidentId\(reportIncident\.id\)\} — \$\{reportIncident\.title\}`/);
assert.match(printableReport, /VIGIL Observatory Failure Taxonomy/);

assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-evidence-grid \{\s*display: block !important;/s);
assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-evidence-source-actions \{\s*display: none !important;/s);
assert.match(reportCss, /grid-template-columns: 1fr !important/);
assert.match(reportCss, /\.vigil-taxonomy-record-card \{[\s\S]*break-inside: auto !important/);
assert.match(reportCss, /References should not silently switch to a larger\/smaller type scale/);
assert.match(reportCss, /padding-inline: 0\.75cm !important/);

assert.match(reportCss, /main\.container > footer \{\s*display: none !important;/s);
assert.doesNotMatch(printableReport, /deterministic print projection of the corresponding VIGIL Case File/);

assert.match(polishCss, /Forced page-per-stage pagination created blank and nearly blank pages/);
assert.match(polishCss, /break-before: auto !important/);
assert.doesNotMatch(polishCss, /\.report-section \{[^}]*break-before: page;/s);

assert.match(printableReport, /Use and reliance notice/);
assert.match(printableReport, /does not constitute legal, regulatory, security, assurance, certification, risk, or other professional advice/);
assert.match(printableReport, /Third parties remain responsible for verifying the cited source material/);
assert.match(printableReport, /Copyright © 2026 Dr Michelle O'Rourke\./);
assert.doesNotMatch(printableReport, /All rights reserved/);
assert.doesNotMatch(printableReport, /requires permission/);
assert.doesNotMatch(printableReport, /VIGIL Observatory Licence and Reuse Terms/);
assert.doesNotMatch(printableReport, /CC BY-NC-SA 4\.0/);
assert.match(reportCss, /\.report-reliance-notice/);
assert.match(reportCss, /\.report-copyright/);

console.log("VIGIL Observatory Case File taxonomy, canonical-main sources, richer source metadata and deterministic report contract passed");
