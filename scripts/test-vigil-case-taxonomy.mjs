import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const caseFile = await readFile(resolve(repoRoot, "src/pages/vigil-case-file.tsx"), "utf8");
const caseLibrary = await readFile(resolve(repoRoot, "src/pages/vigil-cases.tsx"), "utf8");
const taxonomyPanel = await readFile(resolve(repoRoot, "src/components/vigil/CaseTaxonomyClassification.tsx"), "utf8");
const taxonomyLoader = await readFile(resolve(repoRoot, "src/lib/vigilFailureTaxonomy.ts"), "utf8");
const taxonomyClassification = await readFile(resolve(repoRoot, "src/lib/vigilTaxonomyClassification.ts"), "utf8");

assert.match(caseFile, /import \{ CaseTaxonomyClassification \} from "@\/components\/vigil\/CaseTaxonomyClassification"/);
assert.match(caseFile, /stageId === "classify"[\s\S]*<CaseTaxonomyClassification failureId=\{failure\.id\} raw=\{failure\.raw\}/);

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
]) {
  assert.match(taxonomyPanel, new RegExp(detail), `missing canonical taxonomy detail: ${detail}`);
}

for (const state of ["classified", "family-only", "candidate-new-class", "unmapped", "deferred"]) {
  assert.match(taxonomyPanel, new RegExp(`\\"${state}\\"`), `missing explicit taxonomy state ${state}`);
}

assert.match(taxonomyPanel, /No legacy taxonomy fallback has been applied/);
assert.doesNotMatch(taxonomyPanel, /OPS\.FF/);
assert.doesNotMatch(taxonomyPanel, /canonical_failure_group/);
assert.doesNotMatch(taxonomyPanel, /taxonomy_reference/);
assert.doesNotMatch(taxonomyPanel, /failure_subtype/);

assert.match(taxonomyLoader, /VIGIL\.FailureTaxonomy\.Index\.json/);
assert.match(taxonomyLoader, /index\.families\.map/);
assert.match(taxonomyLoader, /entry\.file/);

// The Case Files landing page deliberately exposes only a binary classification
// state. It must read the lean registry's taxonomy_classification_summary rather
// than legacy failure-family fields or requiring full FM detail.
assert.match(caseLibrary, /taxonomy_classification_summary/);
assert.match(caseLibrary, /classification_status/);
assert.match(caseLibrary, /class_id/);
assert.match(caseLibrary, /return isTaxonomyClassified\(record\) \? "Classified" : "Not Classified"/);
assert.match(caseLibrary, /failureTypeCounts\(records\)/);
assert.match(caseLibrary, /canonicalComparisonKey\(failureTypeLabel\(record\)\)/);
assert.match(caseLibrary, /Classification status/);
assert.match(caseLibrary, /SortHeading label="Classification"/);
assert.doesNotMatch(caseLibrary, /record\.failure_family/);
assert.doesNotMatch(caseLibrary, /taxonomyFailureTypeLabel\(record\.raw\)/);

// Section 06 must include the canonical taxonomy records that Section 03 resolves.
assert.match(caseFile, /loadTaxonomyReferenceTargets\(failure\.raw\)/);
assert.match(caseFile, /taxonomyReferences\.map/);
assert.match(caseFile, /VIGIL Failure Taxonomy/);
assert.match(caseFile, /reference\.id} — \{reference\.title/);
assert.match(taxonomyClassification, /dataset\.sourceRoot/);
assert.match(taxonomyClassification, /indexEntry\.file/);
assert.match(taxonomyClassification, /relationship: "primary" \| "secondary" \| "family-only"/);

console.log("VIGIL Case File taxonomy wiring, binary landing status, technical detail and reference contract passed");
