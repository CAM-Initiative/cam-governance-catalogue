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
  assert.match(pages, /\["\/observatory\/incidents", "\/observatory\/cases"\]/);
  assert.match(pages, /\["\/observatory\/about", "\/about"\]/);
  assert.match(pages, /filter\(\(route\) => !canonicalAliases\.has\(route\)\)/);
  assert.match(pages, /data-static-crawl-fallback="vigil-case-index"/);
  assert.match(pages, /data-static-crawl-fallback="vigil-taxonomy-index"/);
  assert.match(pages, /function externalAssessmentsHtml\(record\)/);
  assert.match(pages, /External classification \/ rating/);
  assert.match(pages, /VIGIL relationship/);
  assert.doesNotMatch(pages, /generatedDate|<lastmod>/);
});

test("Explore AI Governance identifies Case Files as the VIGIL Observatory AI incident database", async () => {
  const rail = await read("src/components/ExploreGovernanceRail.tsx");
  assert.match(rail, /title: "Case Files"/);
  assert.match(rail, /subtitle: "VIGIL Observatory AI incident database"/);
  assert.match(rail, /Canonical VIGIL Observatory Incident investigations/);
});

test("VIGIL Observatory Knowledge Base exposes Case Files, Harm & Severity Methodology and Datasets", async () => {
  const hub = await read("src/pages/vigil-knowledge-hub.tsx");
  assert.match(hub, /title="VIGIL Observatory Case Files"/);
  assert.match(hub, /href="\/observatory\/severity-methodology"[\s\S]*title="Harm & Severity Methodology"/);
  assert.match(hub, /VIGIL-HIM 1\.0\.0/);
  assert.match(hub, /href="\/datasets"[\s\S]*title="Datasets"/);
  assert.match(hub, /actionLabel="Open datasets"/);
  assert.match(hub, /downloadable datasets/);
});

test("homepage presents the VIGIL Observatory Failure Taxonomy as a first-class classification surface", async () => {
  const home = await read("src/pages/home.tsx");
  assert.match(home, /VIGIL Observatory · Evidence/);
  assert.match(home, /VIGIL Observatory Failure Taxonomy · Classification/);
  assert.match(home, /Evidence → Assessment → Runtime Governance/);
  assert.match(home, /Explore the Taxonomy/);
  assert.match(home, /Download the PDF/);
  assert.match(home, /VIGIL Observatory → VIGIL Observatory Failure Taxonomy → CAELESTIS/);
  assert.doesNotMatch(home, /VIGIL AI Governance Failure Taxonomy/);
});

test("public taxonomy naming uses VIGIL Observatory Failure Taxonomy", async () => {
  const [taxonomy, aboutVigil, shell, hub, datasets] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/pages/about.tsx"),
    read("src/components/layout/Shell.tsx"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/datasets.tsx"),
  ]);
  const publicSources = [taxonomy, aboutVigil, shell, hub, datasets].join("\n");
  assert.match(taxonomy, /<h1 id="taxonomy-heading">VIGIL Observatory Failure Taxonomy<\/h1>/);
  assert.match(shell, /label: "VIGIL Observatory Failure Taxonomy"/);
  assert.doesNotMatch(publicSources, /VIGIL AI Governance Failure Taxonomy/);
});

test("Failure Taxonomy remains available if the linked Case File projection cannot be fetched", async () => {
  const [loader, taxonomy] = await Promise.all([
    read("src/lib/vigilFailureTaxonomy.ts"),
    read("src/pages/vigil-failure-taxonomy.tsx"),
  ]);
  assert.match(loader, /caseFileExamplesAvailable: boolean/);
  assert.match(loader, /\.catch\(\(\) => \(\{ data: \{ classes: \{\} \}, available: false \}\)\)/);
  assert.match(loader, /caseFileExamplesAvailable: caseFileProjection\.available/);
  assert.match(taxonomy, /Case File links are temporarily unavailable\. The Failure Class definition remains current\./);
  assert.match(taxonomy, /caseFileExamplesAvailable=\{state\.data\.caseFileExamplesAvailable\}/);
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

test("public VIGIL Observatory routes expose Incidents, taxonomy, standards and policy only", async () => {
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
  for (const label of ["Incident", "Assessment", "Classification", "Repair", "References"]) assert.match(sections, new RegExp(`label: "${label}"`));
  assert.doesNotMatch(sections, /label: "Learn"/);
  assert.match(report, /<CaseTaxonomyClassification raw=\{incident\.raw\}/);
  assert.match(report, /<CaseTaxonomyRepair raw=\{incident\.raw\}/);
  assert.doesNotMatch(report, /adjacent Failure Mode|deriveFailureModePublicDetail|const observations/);
});

test("Case File tabs do not repeat editorial stage descriptions inside the active panel", async () => {
  const [sections, caseFile] = await Promise.all([
    read("src/lib/vigilCaseSections.ts"),
    read("src/pages/vigil-case-file.tsx"),
  ]);
  assert.doesNotMatch(sections, /description:/);
  assert.doesNotMatch(caseFile, /<p>\{description\}<\/p>/);
  assert.match(caseFile, /className="sr-only">\{title\}<\/h2>/);
});

test("Repair uses the same public table grammar as Classification", async () => {
  const [classification, css] = await Promise.all([
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/vigil-classification-table.css"),
  ]);
  assert.match(classification, /vigil-classification-web-table vigil-repair-web-table/);
  assert.match(classification, /vigil-classification-table vigil-repair-table/);
  assert.doesNotMatch(classification, /<th scope="col">Relationship<\/th>/);
  assert.match(classification, /<th scope="col">Outcome<\/th>/);
  assert.match(classification, /Invariant held/);
  assert.match(classification, /Failure occurred/);
  assert.match(classification, /Boundary unresolved/);
  assert.match(classification, /<th scope="col">Failure class<\/th>/);
  assert.match(classification, /<th scope="col">Governing invariant<\/th>/);
  assert.doesNotMatch(classification, /className="vigil-repair-invariant-card"/);
  assert.match(css, /\.vigil-repair-table thead th:nth-child\(2\) \{ width: 69%; \}/);
});

test("Case Files expose scalable numbered pagination with first and last navigation", async () => {
  const [cases, caseLibraryCss] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/vigil-case-library-simplify.css"),
  ]);
  assert.match(cases, /function paginationTokens\(currentPage: number, pageCount: number\)/);
  assert.match(cases, /pageCount <= 7/);
  assert.match(cases, /ChevronsLeft/);
  assert.match(cases, /ChevronsRight/);
  assert.match(cases, /aria-current=\{token === currentPage \? "page" : undefined\}/);
  assert.match(cases, /aria-label="First page"/);
  assert.match(cases, /aria-label="Last page"/);
  assert.match(cases, /className="vigil-pagination-ellipsis"/);
  assert.match(caseLibraryCss, /\.vigil-pagination-page\.is-current/);
  assert.match(caseLibraryCss, /\.vigil-pagination-arrow\.is-boundary/);
});

test("Case File classification labels derive public state from mapping-local roles", async () => {
  const taxonomy = await read("src/lib/vigilTaxonomyClassification.ts");
  assert.match(taxonomy, /hasDirectPrimary \|\| hasDirectSecondary/);
  assert.match(taxonomy, /return mappingRoles\(record, directFallback \?\? "failure-occurrence"\)/);
  assert.match(taxonomy, /return mappingRoles\(classification, fallback \?\? "failure-occurrence"\)/);
  assert.match(taxonomy, /hasAmbiguousBoundary \|\| \(hasFailure && hasExemplar\)\) return "Combination"/);
  assert.match(taxonomy, /hasExemplar && !hasFailure\) return "Exemplar"/);
  assert.match(taxonomy, /hasFailure && !hasExemplar\) return "Classified"/);
  assert.match(taxonomy, /status === "classification-disputed"\) return "Disputed"/);
  assert.match(taxonomy, /status === "requires-human-review"\) return "Under review"/);
  assert.doesNotMatch(taxonomy, /Mixed · failure \+ exemplar/);
});

test("mixed Case Files explain alignment outcomes with the blended-state affordance", async () => {
  const [taxonomy, classification, caseFile, contract] = await Promise.all([
    read("src/lib/vigilTaxonomyClassification.ts"),
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("VIGIL-PUBLIC-DISPLAY-CONTRACT.md"),
  ]);
  assert.match(taxonomy, /"ambiguous-boundary"/);
  assert.match(taxonomy, /hasAmbiguousBoundary/);
  assert.match(classification, /Secondary ambiguous boundary/);
  assert.match(classification, /item\.role !== "failure-occurrence"/);
  assert.match(caseFile, /const isCombination = classification === "Combination"/);
  assert.match(caseFile, /<Blend \/>/);
  assert.match(caseFile, /The system is neither aligned nor misaligned/);
  assert.match(caseFile, /Only failure-occurrence mappings contribute to Repair/);
  assert.match(contract, /blended-state mixed-record affordance/);
});

test("Case Files make successful-invariant Exemplars unmistakable across public surfaces", async () => {
  const [cases, caseFile, classification, report, pages, sync, caseGridCss, casePolishCss, historicalV5Css] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
    read("scripts/prepare-github-pages.js"),
    read("scripts/sync-vigil-records.mjs"),
    read("src/vigil-ux-v4.css"),
    read("src/vigil-case-file-polish.css"),
    read("src/vigil-ux-v5.css"),
  ]);
  assert.match(cases, /is-exemplar/);
  assert.match(cases, /vigil-case-table-text/);
  assert.doesNotMatch(cases, /vigil-case-exemplar-marker/);
  assert.doesNotMatch(cases, /VigilStatusChip value="Exemplar"/);
  assert.match(caseFile, /const isExemplar = classification === "Exemplar"/);
  assert.match(caseFile, /The system worked as intended\./);
  assert.match(caseFile, /vigil-exemplar-callout-boundary/);
  assert.match(caseFile, /Exemplar · successful invariant/);
  assert.match(classification, /successful invariant exemplar/i);
  assert.match(classification, /not failure evidence/i);
  assert.match(classification, /Primary exemplar/);
  assert.match(classification, /Secondary exemplar/);
  assert.match(classification, /if \(item\.role !== "failure-occurrence"\) return;/);
  assert.match(classification, /No repair invariant is available for this Case File\./);
  assert.doesNotMatch(classification, /Successful-invariant exemplar mappings remain in Classification/);
  assert.match(report, /successful-invariant exemplars remain attached to their Failure Class without being presented as failure evidence/i);
  assert.match(pages, /classification_role === "successful-invariant" \? "Exemplar"/);
  assert.match(sync, /classification_role: record\.classification_role/);
  assert.match(caseGridCss, /grid-template-columns: minmax\(520px, 1fr\) minmax\(130px, 170px\) minmax\(72px, 96px\) 28px/);
  assert.match(casePolishCss, /\.vigil-case-file-page \.vigil-exemplar-callout/);
  assert.match(casePolishCss, /display: grid !important/);
  assert.doesNotMatch(historicalV5Css, /\.vigil-exemplar-callout/);
});

test("About explains successful-invariant exemplars and the publication model", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /successful-invariant exemplar/i);
  assert.match(about, /not counted as failure evidence/i);
  assert.match(about, /do not create a Repair requirement/i);
  assert.match(about, /Traceable findings, visible judgment and clear boundaries/);
  assert.match(about, /Keep evidence and judgment separate/);
  assert.match(about, /Open to scrutiny, not openly licensed/);
  assert.match(about, /CAELESTIS governance instruments are a separate authority layer/);
});

test("canonical About, licensing and Privacy keep readable public-page grammar", async () => {
  const [about, licensing, privacy, referenceCss] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/pages/licensing.tsx"),
    read("src/pages/privacy.tsx"),
    read("src/public-reference-pages.css"),
  ]);
  assert.match(about, /About VIGIL Observatory/);
  assert.doesNotMatch(about, /Public access without pretending everything is finished|How the public VIGIL surfaces fit together/);
  assert.match(licensing, /Copyright & Licence/);
  assert.match(licensing, /Phoenix Covenant Pty Ltd trading as CAM Initiative/);
  assert.match(licensing, /Citation, reference and linking are permitted and encouraged/);
  assert.doesNotMatch(privacy, /ExploreGovernanceRail|public-reference-governance-rail/);
  assert.match(referenceCss, /max-width: 1220px/);
  assert.match(referenceCss, /\.public-reference-hero[\s\S]*border: 1px solid hsl\(var\(--border\)\)[\s\S]*border-radius: 0\.75rem/);
  assert.match(referenceCss, /\.public-reference-hero > p:not\([\s\S]*font-size: 1\.125rem/);
  assert.match(referenceCss, /\.public-reference-reading p[\s\S]*font-size: 1\.0625rem/);
  assert.match(referenceCss, /\.public-reference-policy-section > p[\s\S]*font-size: 1\.0625rem/);
  assert.match(referenceCss, /\.public-reference-section-heading h2[\s\S]*font-size: 1\.75rem/);
});

test("Case File severity presentation uses ascending S1-to-S5 semantics", async () => {
  const [cases, caseFile, report, about, severity, chip] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
    read("src/pages/about.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/components/vigil/VigilStatusChip.tsx"),
  ]);
  assert.match(cases, /S1: 1[\s\S]*S5: 5[\s\S]*SU: 6/);
  assert.match(caseFile, /S1: "Minimal \/ no downstream harm"/);
  assert.match(caseFile, /S5: "Catastrophic \/ critical"/);
  assert.match(report, /S1: "Minimal \/ no downstream harm"/);
  assert.match(report, /S5: "Catastrophic \/ critical"/);
  assert.doesNotMatch(about, /Severity measures supported consequence|Harm & severity/);
  assert.match(severity, /highest defensible materialised-harm threshold/);
  assert.match(severity, /MIT AI Incident Tracker harm-severity scale/);
  assert.match(severity, /CSET AI Harm Framework/);
  assert.match(chip, /\\bs5\\b\|critical\|catastrophic/);
});

test("historical identifiers do not become live retired-record links", async () => {
  const [caseFile, registry, presentation] = await Promise.all([read("src/pages/vigil-case-file.tsx"), read("src/lib/vigilRegistry.ts"), read("src/lib/vigilPresentation.ts")]);
  const combined = `${caseFile}\n${registry}\n${presentation}`;
  assert.doesNotMatch(combined, /failure-modes\/:recordId|observations\/:recordId|research\/:recordId/);
  assert.doesNotMatch(combined, /VIGIL-(?:\d{4}-)?(?:FM|OBS|RESEARCH)-/);
});

test("Failure Taxonomy pages project canonical linked Case Files without conflating successful exemplars", async () => {
  const [taxonomyPage, taxonomyLoader, taxonomyCss, pages] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/lib/vigilFailureTaxonomy.ts"),
    read("src/vigil-failure-taxonomy-refinements.css"),
    read("scripts/prepare-github-pages.js"),
  ]);
  assert.match(taxonomyLoader, /VIGIL\.FailureTaxonomy\.CaseFileExamples\.json/);
  assert.match(taxonomyLoader, /caseFileExamples: FailureTaxonomyCaseFileExamples/);
  assert.match(taxonomyPage, /Linked Case Files/);
  assert.match(taxonomyPage, /No classified failure Case Files are currently linked to this class/);
  assert.match(taxonomyPage, /Successful invariant exemplars/);
  assert.match(taxonomyPage, /item\.invariant_exemplars/);
  assert.match(taxonomyPage, /\/observatory\/cases\/\$\{example\.incident_id\}/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-linked-cases/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-invariant-exemplars/);
  assert.match(pages, /generated\/VIGIL\.FailureTaxonomy\.CaseFileExamples\.json/);
  assert.match(pages, /taxonomyCaseExamplesForClass/);
  assert.match(pages, /Successful invariant exemplars/);
  assert.doesNotMatch(taxonomyPage, /No classified failure Case Files are currently linked to this family/);
  assert.doesNotMatch(pages, /No classified failure Case Files are currently linked to this family/);
  assert.doesNotMatch(taxonomyCss, /vigil-taxonomy-family-case-list|vigil-taxonomy-family-exemplars/);
  assert.match(taxonomyPage, /const selectedClass = useMemo/);
  assert.match(taxonomyPage, /selectedClass \? <ClassManualSection/);
  assert.match(taxonomyPage, /: <FamilyManualSection/);
  assert.match(taxonomyPage, /View whole family/);
  assert.match(taxonomyPage, /activeClassId=\{selectedClass\?\.class_id\}/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-manual-contents ul li\.is-active-class > a/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-single-class-view/);
  assert.doesNotMatch(taxonomyPage, /Prior codes and aliases|Prior codes \/ aliases/);
  assert.match(taxonomyLoader, /aliases\?: string\[\]/);
});

test("Failure Class views surface external supporting evidence without bloating family chapters", async () => {
  const [taxonomyPage, taxonomyLoader, taxonomyCss, pages] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/lib/vigilFailureTaxonomy.ts"),
    read("src/vigil-failure-taxonomy-refinements.css"),
    read("scripts/prepare-github-pages.js"),
  ]);

  assert.match(taxonomyLoader, /external_references\?: FailureTaxonomyExternalReference\[\]/);
  assert.match(taxonomyPage, /function SupportingEvidence/);
  assert.match(taxonomyPage, /Supporting evidence/);
  assert.match(taxonomyPage, /Evidence note\./);
  assert.match(taxonomyPage, /reference\.evidence_note/);
  assert.match(taxonomyPage, /reference\.reference_role/);
  assert.match(taxonomyPage, /showSupportingEvidence/);
  assert.match(taxonomyPage, /Supporting evidence · \{item\.external_references\.length\}/);
  assert.match(taxonomyPage, /showSupportingEvidence \/>/);
  assert.ok(
    taxonomyPage.indexOf("{showSupportingEvidence") > taxonomyPage.indexOf("{item.relationships?.length ?"),
    "Supporting evidence should render after Relationships at the end of a Failure Class record",
  );
  assert.match(taxonomyCss, /\.vigil-taxonomy-supporting-evidence/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-supporting-evidence-note/);
  assert.match(pages, /function taxonomyExternalReferenceHtml/);
  assert.match(pages, /<h2>Supporting evidence<\/h2>/);
  assert.ok(
    pages.indexOf("<h2>Supporting evidence</h2>") > pages.indexOf("<h2>Linked Case Files</h2>"),
    "Static Failure Class crawl output should keep supporting evidence last",
  );
  assert.match(pages, /reference\.evidence_note/);
});

test("Failure Taxonomy substantive web copy keeps a readable typography floor", async () => {
  const css = await read("src/vigil-failure-taxonomy-refinements.css");
  assert.match(css, /\.vigil-taxonomy-header \.vigil-library-description \{[\s\S]*font-size: 1\.02rem/);
  assert.match(css, /\.vigil-taxonomy-manual-plain \{[\s\S]*font-size: 1\.08rem/);
  assert.match(css, /\.vigil-taxonomy-manual-class > p:not\(\.vigil-taxonomy-manual-plain\)[\s\S]*font-size: 1\.02rem/);
  assert.match(css, /\.vigil-taxonomy-supporting-evidence-note \{[\s\S]*font-size: 0\.98rem !important/);
  assert.match(css, /\.vigil-taxonomy-linked-cases li > p,[\s\S]*font-size: 0\.86rem/);
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


test("site has one canonical About surface plus visible licensing and severity methodology", async () => {
  const [app, shell, about, licensing, severity, home, pages] = await Promise.all([
    read("src/App.tsx"),
    read("src/components/layout/Shell.tsx"),
    read("src/pages/about.tsx"),
    read("src/pages/licensing.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/pages/home.tsx"),
    read("scripts/prepare-github-pages.js"),
  ]);
  assert.match(app, /path="\/about" component=\{About\}/);
  assert.match(app, /path="\/observatory\/about" component=\{About\}/);
  assert.match(app, /path="\/observatory\/severity-methodology" component=\{VigilSeverityMethodology\}/);
  assert.match(pages, /\["\/observatory\/about", "\/about"\]/);
  assert.doesNotMatch(shell, /label: "About VIGIL"/);
  assert.match(shell, /Copyright & Licence/);
  assert.match(shell, /Harm & Severity Methodology/);
  assert.match(about, /Publication model/);
  assert.doesNotMatch(about, /<p className="vigil-library-kicker">Purpose<\/p>|Severity measures supported consequence|Harm & severity/);
  assert.doesNotMatch(about, /Knowledge Base[\s\S]*How the public VIGIL surfaces fit together/);
  assert.match(licensing, /VIGIL Observatory Proprietary Licence/);
  assert.match(severity, /VIGIL-HIM 1\.0\.0/);
  assert.match(severity, /vigil-severity-methodology-document/);
  assert.doesNotMatch(severity, /severity-alignment-heading/);
  assert.doesNotMatch(home, /Open AI Governance|Open AI governance infrastructure/);
});

test("harm methodology emphasizes scan targets and rejects legacy microtype", async () => {
  const [matrix, css] = await Promise.all([
    read("src/components/vigil/HarmImpactMatrix.tsx"),
    read("src/vigil-incident-severity-refinement.css"),
  ]);
  assert.match(matrix, /vigil-harm-threshold-emphasis/);
  assert.match(matrix, /USD 100 billion/);
  assert.match(matrix, /multiple grave casualties/);
  assert.match(matrix, /Materialised suicide/);
  assert.match(css, /vigil-harm-threshold-emphasis/);
  assert.match(css, /font-size: 9\.5pt/);
  assert.doesNotMatch(css, /font-size: (?:6\.6|7|7\.2|8)pt/);
  assert.doesNotMatch(css, /font-size: 0\.(?:6[0-9]|7[0-9])rem/);
});


test("Stage 02 is presented publicly as Assessment", async () => {
  const [sections, cases, hub, report, printable, home, rail, pages, readme, contract] = await Promise.all([
    read("src/lib/vigilCaseSections.ts"),
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
    read("src/pages/evidence-chain-report-printable.tsx"),
    read("src/pages/home.tsx"),
    read("src/components/ExploreGovernanceRail.tsx"),
    read("scripts/prepare-github-pages.js"),
    read("README.md"),
    read("VIGIL-PUBLIC-DISPLAY-CONTRACT.md"),
  ]);
  assert.match(sections, /number: "01"[\s\S]*label: "Incident"/);
  assert.match(sections, /number: "02"[\s\S]*label: "Assessment"/);
  assert.match(report, /<Stage number="01" label="Incident">/);
  assert.match(report, /<Stage number="02" label="Assessment">/);
  assert.match(printable, /number: "01", label: "Incident"/);
  assert.match(printable, /number: "02", label: "Assessment"/);
  assert.doesNotMatch(cases, /Observation, Assessment, Classification, Repair and References model/);
  assert.match(hub, /Incident, Assessment, Classification, Repair and References/);
  assert.match(home, /Evidence → Assessment → Runtime Governance/);
  assert.match(rail, /evidence, assessment, failure classification/);
  assert.match(pages, /evidence, assessment, failure classification/);
  assert.match(readme, /\*\*Assessment:\*\*/);
  assert.match(contract, /severity as substantive assessment/);
  for (const publicText of [sections, cases, hub, report, printable]) {
    assert.doesNotMatch(publicText, /label[:=] "?Diagnosis"?|Observation, Diagnosis, Classification|<Stage number="02" label="Diagnosis">/);
  }
});


test("About, licensing and severity methodology use continuous document containers", async () => {
  const [about, licensing, severity, uxCss, referenceCss] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/pages/licensing.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/vigil-ux-v5.css"),
    read("src/public-reference-pages.css"),
  ]);
  assert.match(about, /vigil-about-document/);
  assert.match(licensing, /public-reference-document--single/);
  assert.match(severity, /vigil-severity-methodology-document/);
  assert.match(uxCss, /\.vigil-about-document[\s\S]*border: 1px solid hsl\(var\(--border\)\)/);
  assert.match(referenceCss, /\.public-reference-document--single[\s\S]*border: 1px solid hsl\(var\(--border\)\)/);
});

test("severity methodology exposes the registered source trail after Case Files", async () => {
  const severity = await read("src/pages/vigil-severity-methodology.tsx");
  assert.match(severity, /Methodology source trail/);
  assert.match(severity, /VIGIL-REF-000001/);
  assert.match(severity, /VIGIL-REF-000011/);
  assert.match(severity, /AI Incident Tracker: Harm Taxonomy/);
  assert.match(severity, /Prioritization of Risks from Artificial Intelligence/);
  assert.ok(severity.indexOf('id="severity-case-files-heading"') < severity.indexOf('id="severity-references-heading"'));
  assert.match(severity, /vigil-methodology-reference-list/);
});

test("public brand names prefer VIGIL Observatory over standalone VIGIL labels", async () => {
  const [shell, hub, taxonomy, cases, datasets, home, rail] = await Promise.all([
    read("src/components/layout/Shell.tsx"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/datasets.tsx"),
    read("src/pages/home.tsx"),
    read("src/components/ExploreGovernanceRail.tsx"),
  ]);
  assert.match(shell, />\s*VIGIL Observatory\s*<\/Link>/);
  assert.match(shell, /VIGIL Observatory Knowledge Base/);
  assert.match(hub, /VIGIL Observatory Case Files/);
  assert.match(taxonomy, /VIGIL Observatory Failure Taxonomy/);
  assert.match(cases, /VIGIL Observatory Incident investigations/);
  assert.match(datasets, /title="VIGIL Observatory Failure Taxonomy"/);
  assert.match(home, /VIGIL Observatory Failure Taxonomy · Classification/);
  assert.match(rail, /VIGIL Observatory AI incident database/);
});


test("Datasets prioritise the public Harm & Severity Matrix over the internal reference registry", async () => {
  const datasets = await read("src/pages/datasets.tsx");
  assert.match(datasets, /title="Harm & Severity Matrix"/);
  assert.match(datasets, /VIGIL\.HarmImpactMatrix\.v1\.0\.0\.json/);
  assert.match(datasets, /11 harm dimensions/);
  assert.match(datasets, /Open JSON matrix/);
  assert.doesNotMatch(datasets, /title="Observatory Reference Registry"/);
  assert.doesNotMatch(datasets, /VIGIL\.ObservatoryReferenceRegistry\.(?:json|csv)/);
});

test("About uses the CAM Initiative root as the general VIGIL Observatory citation URL", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /O’Rourke, M\. V\. \(2026\)\. VIGIL Observatory\. CAM Initiative\. https:\/\/cam-initiative\.org/);
  assert.doesNotMatch(about, /cam-initiative\.org\/(?:about|vigil)/);
});


test("public-facing institutional copy treats the repository name as implementation detail", async () => {
  const [about, licensing] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/pages/licensing.tsx"),
  ]);
  assert.doesNotMatch(about, /CAM Governance Catalogue|cam-governance-catalogue/i);
  assert.match(licensing, /other CAM Initiative materials/);
  assert.match(licensing, /other CAM Initiative materials/);
  assert.match(licensing, /VIGIL Observatory Proprietary Licence/);
  assert.match(licensing, /does not maintain a separate website or interface licence/);
  assert.doesNotMatch(licensing, /CAM Governance Interface Licence/);
});


test("website repository LICENSE is a pointer, not a second licence instrument", async () => {
  const [license, citation, readme, licensing] = await Promise.all([
    read("LICENSE.md"),
    read("CITATION.cff"),
    read("README.md"),
    read("src/pages/licensing.tsx"),
  ]);
  assert.match(license, /^# Licence pointer/m);
  assert.match(license, /does \*\*not\*\* publish a separate CAM Initiative website or interface licence/);
  assert.match(license, /CAM-Initiative\/Vigil\/blob\/main\/LICENSE\.md/);
  assert.match(license, /pointer only/);
  assert.doesNotMatch(license, /Grant of Permission|Non-Commercial Restriction|CAM Governance Interface Licence/);
  assert.doesNotMatch(citation, /LicenseRef-CAM-Governance-Interface|license:/);
  assert.match(citation, /title: "CAM Initiative Website"/);
  assert.match(readme, /does not publish a separate website or interface licence/);
  assert.match(licensing, /controlling licence instrument for VIGIL Observatory Materials/);
});


test("About identifies CAM Initiative and founder without repeating the legal entity name", async () => {
  const [about, shell, licensing, printable] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/components/layout/Shell.tsx"),
    read("src/pages/licensing.tsx"),
    read("src/pages/evidence-chain-report-printable.tsx"),
  ]);
  const legalName = "Phoenix Covenant Pty Ltd trading as CAM Initiative";
  assert.equal((about.match(new RegExp(legalName, "g")) || []).length, 1);
  assert.match(about, /ABN 14 692 195 529/);
  assert.match(about, /27 October 2025/);
  assert.match(about, /Western Australia/);
  assert.match(about, /Dr Michelle Vivian O&apos;Rourke/);
  assert.match(about, /PhD in analytical chemistry at La Trobe University in Melbourne, Victoria/);
  assert.match(about, /mother of two/);
  assert.match(about, /environmental health and contaminated-land practice/);
  assert.match(shell, /© 2026 CAM Initiative\. All rights reserved\./);
  assert.doesNotMatch(shell, /Phoenix Covenant Pty Ltd trading as CAM Initiative/);
  assert.match(printable, /© 2026 CAM Initiative\. All rights reserved\./);
  assert.doesNotMatch(printable, /Phoenix Covenant Pty Ltd trading as CAM Initiative/);
  assert.equal((licensing.match(new RegExp(legalName, "g")) || []).length, 1);
});


test("footer avoids repeating the header brand lockup", async () => {
  const shell = await read("src/components/layout/Shell.tsx");
  const footerStart = shell.indexOf("<footer");
  assert.notEqual(footerStart, -1);
  const footer = shell.slice(footerStart);
  assert.match(footer, /© 2026 CAM Initiative\. All rights reserved\./);
  assert.doesNotMatch(footer, /cam-triskelion\.svg/);
  assert.doesNotMatch(footer, />CAM Initiative<\/span>/);
});


test("Case File search and classification filter share one desktop row", async () => {
  const css = await read("src/vigil-ux-v4.css");
  assert.match(css, /\.vigil-case-table-search \{[\s\S]*grid-template-columns: minmax\(320px, 1fr\) minmax\(250px, 340px\)/);
  assert.match(css, /@media \(max-width: 820px\) \{[\s\S]*\.vigil-case-table-search,[\s\S]*grid-template-columns: 1fr/);
});

test("Case Files landing page stays deliberately terse", async () => {
  const cases = await read("src/pages/vigil-cases.tsx");
  assert.match(cases, /<h1 id="case-files-heading">Case Files<\/h1>/);
  assert.doesNotMatch(cases, /VIGIL Observatory provides a public AI incident database through its Case File registry/);
  assert.doesNotMatch(cases, /Observation, Assessment, Classification, Repair and References model/);
});


test("About final polish keeps content continuous and places actions inside open grid space", async () => {
  const [about, css] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/vigil-ux-v5.css"),
  ]);
  const firstMethodSentence = about.indexOf("The Case File structure keeps what happened separate");
  const incidentBoundarySentence = about.indexOf("A reported Incident is not automatically evidence of a failure");
  const flow = about.indexOf("vigil-about-flow-scroll");
  assert.ok(firstMethodSentence >= 0 && incidentBoundarySentence > firstMethodSentence && incidentBoundarySentence < flow);
  assert.doesNotMatch(about, /Classification boundary:/);
  assert.match(about, /Failure-classified Incident[\s\S]*Successful-invariant exemplar[\s\S]*vigil-about-action[\s\S]*Browse the taxonomy/);
  assert.match(about, /CAELESTIS governance instruments are a separate authority layer[\s\S]*vigil-about-link-row[\s\S]*Copyright & Licence[\s\S]*Privacy[\s\S]*VIGIL Observatory repository/);
  const organisationStart = about.indexOf('id="vigil-organisation-heading"');
  const affiliation = about.indexOf("The CAM Initiative and the CAELESTIS Architecture Model are not affiliated");
  const citationStart = about.indexOf('id="vigil-citation-heading"');
  assert.ok(organisationStart >= 0 && affiliation > organisationStart && affiliation < citationStart);
  assert.match(about, /vigil-about-link-row/);
  assert.match(css, /About final polish: one calm document/);
  assert.match(css, /About final polish: one calm document/);
  assert.match(css, /\.vigil-about-document \.vigil-about-section-heading \{[\s\S]*border: 0/);
  assert.match(css, /\.vigil-about-document \.vigil-about-boundary-grid article,[\s\S]*border: 0/);
});


test("Explore AI governance prioritises Case Files, Knowledge Base and Datasets with icon affordances", async () => {
  const [rail, css] = await Promise.all([
    read("src/components/ExploreGovernanceRail.tsx"),
    read("src/governance-rail-refinements.css"),
  ]);
  const caseFiles = rail.indexOf('title: "Case Files"');
  const knowledgeBase = rail.indexOf('title: "Knowledge Base"');
  const datasets = rail.indexOf('title: "Datasets"');
  assert.ok(caseFiles >= 0 && knowledgeBase > caseFiles && datasets > knowledgeBase);
  assert.match(rail, /icon: FileText/);
  assert.match(rail, /icon: Library/);
  assert.match(rail, /icon: Database/);
  assert.doesNotMatch(rail, /title: "VIGIL Observatory"/);
  assert.match(rail, /home-governance-heading-rule/);
  assert.doesNotMatch(rail, /home-governance-heading-panel/);
  assert.match(css, /home-governance-heading-rule[\s\S]*background: transparent/);
  assert.match(css, /home-governance-heading-rule::after[\s\S]*background: hsl\(var\(--primary\) \/ 0\.26\)/);
  assert.doesNotMatch(css, /home-governance-heading-panel[\s\S]*status-success-surface/);
  assert.match(css, /home-governance-card-title[\s\S]*font-weight: 540[\s\S]*text-transform: none/);
  assert.match(css, /home-governance-card-label[\s\S]*display: inline-flex/);
});

test("dark appearance keeps native Case File classification menus legible", async () => {
  const dark = await read("src/dark-appearance.css");
  assert.match(dark, /html\[data-theme="dark"\] \.vigil-family-select select \{/);
  assert.match(dark, /color-scheme: dark/);
  assert.match(dark, /\.vigil-family-select select option,[\s\S]*background-color: hsl\(var\(--popover\)\)/);
  assert.match(dark, /color: hsl\(var\(--popover-foreground\)\)/);
});


test("About section rules are attached only to section boundaries", async () => {
  const [main, css] = await Promise.all([
    read("src/main.tsx"),
    read("src/about-page-polish.css"),
  ]);
  assert.match(main, /import "\.\/about-page-polish\.css";/);
  assert.match(css, /\.vigil-about-document \.vigil-about-section \+ \.vigil-about-section \{[\s\S]*border-top: 1px solid hsl\(var\(--border\)\) !important/);
  assert.match(css, /\.vigil-about-document \.vigil-about-record-intro,[\s\S]*border: 0 !important/);
  assert.match(css, /\.vigil-about-document \.vigil-about-section-heading \{[\s\S]*border: 0 !important/);
  assert.match(css, /\.vigil-about-document \.vigil-about-boundary-grid > article,[\s\S]*border: 0 !important/);
  assert.match(css, /\.vigil-about-document \.vigil-about-citation-card \{[\s\S]*border: 0 !important/);
});


test("About disambiguates VIGIL Observatory from unrelated VIGIL projects", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /VIGIL Observatory is also a distinct project/);
  assert.match(about, /https:\/\/vigil\.agency\//);
  assert.match(about, /https:\/\/vigilsoc\.org\//);
  assert.match(about, /open-source AI-powered security operations platform/);
  assert.match(about, /open-source AI security operations project/);
});

test("About citation uses a single Suggested general citation heading", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /<h2 id="vigil-citation-heading">Suggested general citation<\/h2>/);
  assert.equal((about.match(/Suggested general citation/g) || []).length, 1);
  assert.doesNotMatch(about, /Cite the work while preserving the relevant record or version/);
});

test("Publication copy names CAM Initiative without repeating the maintainer", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /Published by <strong>CAM Initiative<\/strong>, a VIGIL Observatory Case File/);
  assert.doesNotMatch(about, /published by <strong>CAM Initiative<\/strong> and maintained by/);
});

test("External governance tools use subtle source-type icons", async () => {
  const rail = await read("src/components/ExploreGovernanceRail.tsx");
  assert.match(rail, /label: "AI Regulations Tracker"[\s\S]*icon: Scale/);
  assert.match(rail, /label: "AI Incident Database"[\s\S]*icon: Database/);
  assert.match(rail, /label: "OECD AI Incidents Monitor"[\s\S]*icon: Database/);
  assert.match(rail, /label: "NIST AI Resource Center"[\s\S]*icon: BookOpen/);
});
