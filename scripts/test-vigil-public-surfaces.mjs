import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), "utf8");

test("Explore AI governance rail keeps a readable typography floor", async () => {
  const railCss = await read("src/governance-rail-refinements.css");
  assert.match(railCss, /font-size: 0\.8rem;/);
  assert.match(railCss, /\.home-governance-card-title \{[\s\S]*font-size: 0\.95rem !important;/);
  assert.match(railCss, /\.home-governance-detail \{[\s\S]*font-size: 0\.875rem !important;/);
});

test("SEO publication signals keep one canonical Case Files URL and crawlable indexes", async () => {
  const [entrypoint, pages] = await Promise.all([
    read("src/index.html"),
    read("scripts/prepare-github-pages.js"),
  ]);
  assert.match(entrypoint, /property="og:site_name" content="CAM Initiative"/);
  assert.match(entrypoint, /"@type": "WebSite"/);
  assert.match(entrypoint, /"name": "CAM Initiative"/);
  assert.match(pages, /canonicalRoute = route === "\/observatory\/incidents" \? "\/observatory\/cases" : route/);
  assert.match(pages, /filter\(\(route\) => route !== "\/observatory\/incidents"\)/);
  assert.match(pages, /data-static-crawl-fallback="vigil-case-index"/);
  assert.match(pages, /data-static-crawl-fallback="vigil-taxonomy-index"/);
  assert.doesNotMatch(pages, /generatedDate|<lastmod>/);
});

test("Explore AI Governance identifies Case Files as the VIGIL AI incident database", async () => {
  const rail = await read("src/components/ExploreGovernanceRail.tsx");
  assert.match(rail, /title: "Case Files"/);
  assert.match(rail, /subtitle: "VIGIL AI incident database"/);
  assert.match(rail, /Canonical VIGIL Incident investigations/);
});

test("VIGIL Knowledge Base exposes VIGIL Case Files and a Datasets collection", async () => {
  const hub = await read("src/pages/vigil-knowledge-hub.tsx");
  assert.match(hub, /title="VIGIL Case Files"/);
  assert.match(hub, /href="\/datasets"[\s\S]*title="Datasets"/);
  assert.match(hub, /actionLabel="Open datasets"/);
  assert.match(hub, /downloadable datasets/);
});

test("homepage presents the VIGIL Failure Taxonomy as a first-class diagnosis surface", async () => {
  const home = await read("src/pages/home.tsx");
  assert.match(home, /VIGIL Observatory · Evidence/);
  assert.match(home, /VIGIL Failure Taxonomy · Diagnosis/);
  assert.match(home, /Evidence → Diagnosis → Runtime Governance/);
  assert.match(home, /Explore the Taxonomy/);
  assert.match(home, /Download the PDF/);
  assert.match(home, /VIGIL Observatory → VIGIL Failure Taxonomy → CAELESTIS/);
  assert.doesNotMatch(home, /VIGIL AI Governance Failure Taxonomy/);
});

test("public taxonomy naming uses VIGIL Failure Taxonomy", async () => {
  const [taxonomy, aboutVigil, shell, hub, datasets] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/pages/vigil-about.tsx"),
    read("src/components/layout/Shell.tsx"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/datasets.tsx"),
  ]);
  const publicSources = [taxonomy, aboutVigil, shell, hub, datasets].join("\n");
  assert.match(taxonomy, /<h1 id="taxonomy-heading">VIGIL Failure Taxonomy<\/h1>/);
  assert.match(shell, /label: "VIGIL Failure Taxonomy"/);
  assert.doesNotMatch(publicSources, /VIGIL AI Governance Failure Taxonomy/);
});

test("failure taxonomy hero uses the shared VIGIL Observatory kicker treatment", async () => {
  const [taxonomy, shellCss] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/vigil-page-shell.css"),
  ]);
  assert.match(taxonomy, /className="vigil-library-kicker">VIGIL Observatory/);
  assert.match(shellCss, /\.vigil-taxonomy-manual-page \.vigil-taxonomy-header \.vigil-library-kicker,/);
  assert.match(shellCss, /font-size: 0\.875rem !important;/);
});

test("public VIGIL routes expose Incidents, taxonomy, standards and policy only", async () => {
  const [app, shell, hub] = await Promise.all([read("src/App.tsx"), read("src/components/layout/Shell.tsx"), read("src/pages/vigil-knowledge-hub.tsx")]);
  for (const route of ["/observatory/cases", "/observatory/incidents", "/observatory/knowledge-base", "/observatory/knowledge-base/failure-taxonomy", "/observatory/knowledge-base/standards-sources", "/observatory/knowledge-base/policy"]) assert.match(app, new RegExp(route.replaceAll("/", "\\/")));
  for (const retired of ["failure-modes", "observatory/lessons", "observatory/repairs", "VigilKnowledgeBase"]) assert.doesNotMatch(`${app}\n${shell}\n${hub}`, new RegExp(retired, "i"));
});

test("retired standalone record pages and components are absent", async () => {
  const retiredFiles = [
    "src/pages/vigil.tsx",
    "src/pages/vigil-projection.tsx",
    "src/pages/vigil-failure-modes.tsx",
    "src/pages/vigil-knowledge-base.tsx",
    "src/pages/vigil-reference-knowledge.tsx",
    "src/pages/evidence-chain-report.tsx",
    "src/components/vigil/FailureModeCard.tsx",
    "src/components/vigil/FailureModeDetail.tsx",
    "src/drafts/vigil-ledger.tsx",
  ];
  for (const file of retiredFiles) await assert.rejects(() => access(resolve(root, file)), undefined, `${file} should remain retired`);
});

test("Case Files use one canonical Incident and retain the five substantive stages", async () => {
  const [caseFile, sections, report] = await Promise.all([read("src/pages/vigil-case-file.tsx"), read("src/lib/vigilCaseSections.ts"), read("src/pages/evidence-chain-report-deterministic.tsx")]);
  assert.match(caseFile, /loadVigilIncidentRecords/);
  assert.match(caseFile, /records: \[incident\]/);
  assert.doesNotMatch(caseFile, /const observations|deriveFailureModePublicDetail|failureId=/);
  for (const label of ["Observation", "Diagnosis", "Classification", "Repair", "References"]) assert.match(sections, new RegExp(`label: "${label}"`));
  assert.doesNotMatch(sections, /label: "Learn"/);
  assert.match(report, /<CaseTaxonomyClassification raw=\{incident\.raw\}/);
  assert.match(report, /<CaseTaxonomyRepair raw=\{incident\.raw\}/);
  assert.doesNotMatch(report, /adjacent Failure Mode|deriveFailureModePublicDetail|const observations/);
});

test("Case Files keep Exemplar semantics inside the opened Case File, not the landing table", async () => {
  const [cases, caseFile, classification, taxonomyHelpers, report, pages] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/lib/vigilTaxonomyClassification.ts"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
    read("scripts/prepare-github-pages.js"),
  ]);
  assert.doesNotMatch(cases, /Classification status|classificationStatusLabel|taxonomyFailureTypeLabel|VigilStatusChip/);
  assert.match(caseFile, /const isExemplar =/);
  assert.match(caseFile, /vigil-exemplar-badge/);
  assert.match(caseFile, />Exemplar<\/div>/);
  assert.match(caseFile, /<Field label="Failure type" value=\{classification\} \/>/);
  assert.match(taxonomyHelpers, /successful-invariant/);
  assert.match(taxonomyHelpers, /return "Exemplar"/);
  assert.match(classification, /successful invariant exemplar/i);
  assert.match(classification, /not failure evidence/i);
  assert.match(report, /successful-invariant exemplars remain attached to their Failure Class without being presented as failure evidence/i);
  assert.match(pages, /classification_role === "successful-invariant" \? "Exemplar"/);
});

test("Case File severity presentation supports S5 no-materialised-harm records", async () => {
  const [cases, caseFile, report] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
  ]);
  assert.match(cases, /S5: 5/);
  assert.match(caseFile, /S5: "No materialised harm"/);
  assert.match(report, /S5: "No materialised harm"/);
});

test("historical identifiers do not become live retired-record links", async () => {
  const [caseFile, registry, presentation] = await Promise.all([read("src/pages/vigil-case-file.tsx"), read("src/lib/vigilRegistry.ts"), read("src/lib/vigilPresentation.ts")]);
  const combined = `${caseFile}\n${registry}\n${presentation}`;
  assert.doesNotMatch(combined, /failure-modes\/:recordId|observations\/:recordId|research\/:recordId/);
  assert.doesNotMatch(combined, /VIGIL-(?:\d{4}-)?(?:FM|OBS|RESEARCH)-/);
});

test("taxonomy and external-governance public systems remain intact", async () => {
  const [taxonomyPage, taxonomyLoader, datasets, standards, externalKnowledge] = await Promise.all([read("src/pages/vigil-failure-taxonomy.tsx"), read("src/lib/vigilFailureTaxonomy.ts"), read("src/pages/datasets.tsx"), read("src/pages/vigil-standards-baseline.tsx"), read("src/lib/vigilExternalKnowledge.ts")]);
  assert.match(taxonomyLoader, /VIGIL\.FailureTaxonomy\.Index\.json/);
  assert.match(taxonomyPage, /failure famil/i);
  assert.match(taxonomyPage, /failure class/i);
  assert.match(datasets, /VIGIL\.Observatory\.FailureTaxonomy\.FullReference\.pdf/);
  assert.match(standards, /AI Governance Standards/);
  assert.match(externalKnowledge, /external-governance/);
});

test("public enhancement script does not recreate retired record surfaces", async () => {
  const enhancements = await read("src/public/vigil-ux-enhancements.js");
  for (const token of ["VIGIL.Learn.Index", "failure_mode", "related_observations", "patch_notes", "proposals"]) assert.doesNotMatch(enhancements, new RegExp(token, "i"));
});
