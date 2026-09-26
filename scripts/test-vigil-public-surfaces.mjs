import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), "utf8");

test("Observatory instrument experiment keeps tickets and opens the workbench", async () => {
  const [main, css] = await Promise.all([
    read("src/main.tsx"),
    read("src/vigil-observatory-instrument-experiment.css"),
  ]);
  assert.match(main, /vigil-observatory-instrument-experiment\.css/);
  assert.match(css, /Taxonomy — field manual/);
  assert.match(css, /Case Files \+ Standards — investigation\/reference ledgers/);
  assert.match(css, /Harm — assessment ledger/);
  assert.match(css, /Case File — dossier on the same workbench/);
  assert.match(css, /Knowledge Base — open Observatory index/);
  assert.match(css, /\.vigil-taxonomy-manual-page \.vigil-taxonomy-manual-class \{[\s\S]*border: 0;[\s\S]*background: transparent/);
  assert.match(css, /\.vigil-case-library-page \.vigil-case-table-row,[\s\S]*border-bottom: 1px solid/);
  assert.match(css, /\.vigil-case-file-page \.vigil-case-active-stage \.vigil-case-section \{[\s\S]*border: 0;[\s\S]*box-shadow: none/);
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
  assert.match(pages, /data-static-crawl-fallback="vigil-about"/);
  assert.match(pages, /data-static-crawl-fallback="vigil-case-index"/);
  assert.match(pages, /data-static-crawl-fallback="vigil-taxonomy-index"/);
  assert.match(pages, /Incident-centred public observatory and AI incident database/);
  const fallbackCaelestis = pages.indexOf("<h2>CAELESTIS Architecture Model</h2>");
  const fallbackVigil = pages.indexOf("<h2>VIGIL Observatory</h2>");
  assert.ok(fallbackCaelestis >= 0 && fallbackVigil > fallbackCaelestis);
  assert.match(pages, /Every Incident moves through the same six-stage evidence-to-conclusion structure/);
  assert.match(pages, /Real-world harm assessment and alignment classification are deliberately independent/);
  assert.match(pages, /mixed alignment outcome/);
  assert.doesNotMatch(pages, /VIGIL Observatory is distinct from CAELESTIS/);
  assert.match(pages, /const vigilAboutStructuredData = \{/);
  assert.match(pages, /"@type": "CreativeWork"/);
  assert.match(pages, /alternateName: "VIGIL"/);
  assert.match(pages, /https:\/\/github\.com\/CAM-Initiative\/Vigil/);
  assert.match(pages, /body: isAboutRoute \? vigilAboutFallbackBody : ""/);
  assert.match(pages, /structuredData: isAboutRoute \? vigilAboutStructuredData : undefined/);
  assert.match(pages, /function externalAssessmentsHtml\(record\)/);
  assert.match(pages, /External classification \/ rating/);
  assert.match(pages, /VIGIL relationship/);
  assert.doesNotMatch(pages, /generatedDate|<lastmod>/);
});

test("VIGIL Observatory Knowledge Base exposes document navigation for its core references", async () => {
  const hub = await read("src/pages/vigil-knowledge-hub.tsx");
  assert.match(hub, /DocumentRail title="Knowledge Base"/);
  assert.match(hub, /href="\/observatory\/cases\/"/);
  assert.match(hub, /href="\/observatory\/knowledge-base\/standards-sources\/"/);
  assert.match(hub, /href="\/observatory\/severity-methodology\/"[\s\S]*Open Harm Impact Assessment/);
  assert.match(hub, /VIGIL-HIM 1\.0\.0/);
  assert.match(hub, /href="\/datasets\/"/);
  assert.doesNotMatch(hub, /CollectionCard/);
});

test("homepage exposes the current evidence and Alignment Taxonomy surfaces without validator-only copy", async () => {
  const home = await read("src/pages/home.tsx");
  assert.match(home, /Explore the evidence/);
  assert.match(home, /See the taxonomy/);
  assert.match(home, /aria-label="VIGIL Fidelity Classes accumulating into the Alignment Taxonomy"/);
  assert.match(home, /Explore the alignment taxonomy/);
  assert.match(home, /Adjudication, not assumption/);
  assert.doesNotMatch(home, /Public-surface validator markers/);
  assert.doesNotMatch(home, /VIGIL AI Governance Failure Taxonomy/);
});

test("homepage refinement preserves the six-stage instrument and live Observatory feed", async () => {
  const [home, styles] = await Promise.all([
    read("src/pages/home.tsx"),
    read("src/home-premium-v2.css"),
  ]);
  const evidence = home.indexOf('{ label: "Evidence"');
  const environment = home.indexOf('{ label: "Environment"');
  const harm = home.indexOf('{ label: "Harm"');
  const governance = home.indexOf('{ label: "Governance"');
  const classification = home.indexOf('{ label: "Classification"');
  const compare = home.indexOf('{ label: "Compare"');
  assert.ok(evidence < environment && environment < harm && harm < governance && governance < classification && classification < compare);
  assert.doesNotMatch(home, /<p className="premium-eyebrow">CAM Initiative · VIGIL Observatory<\/p>/);
  assert.match(home, /loadVigilIncidentRecords/);
  assert.match(home, /aria-label="Recent VIGIL Case Files"/);
  assert.doesNotMatch(home, /A connected governance architecture/);
  assert.doesNotMatch(home, /VIGIL diagnoses the failure/);
  assert.match(styles, /diagnostic-counter-rotation/);
  assert.match(styles, /incident-ticker-travel 112s linear infinite/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.incident-ticker-track \{ animation: none; \}/);
});

test("public taxonomy naming uses VIGIL Observatory Alignment Taxonomy", async () => {
  const [taxonomy, masthead, aboutVigil, shell, hub, datasets] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/components/vigil/VigilObservatoryMasthead.tsx"),
    read("src/pages/about.tsx"),
    read("src/components/layout/Shell.tsx"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/datasets.tsx"),
  ]);
  const publicSources = [taxonomy, masthead, aboutVigil, shell, hub, datasets].join("\n");
  assert.match(taxonomy, /<VigilObservatoryMasthead[\s\S]*kicker="VIGIL Observatory"[\s\S]*title="Alignment Taxonomy"/);
  assert.match(masthead, /vigil-library-kicker vigil-observatory-masthead-kicker/);
  assert.match(shell, /label: "VIGIL Observatory Alignment Taxonomy"/);
  assert.doesNotMatch(publicSources, /VIGIL AI Governance Failure Taxonomy/);
});

test("Alignment Taxonomy remains available if the linked Case File projection cannot be fetched", async () => {
  const [loader, taxonomy] = await Promise.all([
    read("src/lib/vigilFailureTaxonomy.ts"),
    read("src/pages/vigil-failure-taxonomy.tsx"),
  ]);
  assert.match(loader, /caseFileExamplesAvailable: boolean/);
  assert.match(loader, /\.catch\(\(\) => \(\{ data: \{ classes: \{\} \}, available: false \}\)\)/);
  assert.match(loader, /caseFileExamplesAvailable: caseFileProjection\.available/);
  assert.match(taxonomy, /Case File links are temporarily unavailable\. The Fidelity Class definition remains current\./);
  assert.match(taxonomy, /caseFileExamplesAvailable=\{state\.data\.caseFileExamplesAvailable\}/);
});

test("Observatory index pages share the canonical illustrated masthead", async () => {
  const [cases, taxonomy, harm, policy, standards, datasets, masthead, mastheadCss, main, indexHtml] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/pages/policy.tsx"),
    read("src/pages/vigil-standards-baseline.tsx"),
    read("src/pages/datasets.tsx"),
    read("src/components/vigil/VigilObservatoryMasthead.tsx"),
    read("src/vigil-observatory-masthead.css"),
    read("src/main.tsx"),
    read("src/index.html"),
  ]);
  assert.match(cases, /<VigilObservatoryMasthead[\s\S]*title="Case Files"/);
  assert.match(taxonomy, /<VigilObservatoryMasthead[\s\S]*title="Alignment Taxonomy"/);
  assert.doesNotMatch(cases, /vigil-case-library-ticket/);
  assert.doesNotMatch(taxonomy, /<header className="vigil-taxonomy-header vigil-taxonomy-ticket"/);
  assert.match(masthead, /data-mode=\{mode\}/);
  assert.match(masthead, /data-visual=\{visual\}/);
  assert.match(mastheadCss, /grid-template-columns: minmax\(0, 1fr\) minmax\(16rem, 26%\)/);
  assert.match(mastheadCss, /min-height: clamp\(15rem, 19vw, 17\.5rem\)/);
  assert.match(mastheadCss, /font-size: clamp\(3\.2rem, 4\.25vw, 4\.15rem\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead-instrument/);
  assert.match(mastheadCss, /vigil-observatory-masthead-calibration-accent/);
  assert.match(masthead, /artworkSrc/);
  assert.match(masthead, /vigil-observatory-masthead-artwork/);
  assert.match(masthead, /loading="eager"[\s\S]*decoding="async"[\s\S]*fetchPriority="high"/);
  assert.match(masthead, /onLoad=\{\(event\) => event\.currentTarget\.classList\.add\("is-loaded"\)\}/);
  assert.match(taxonomy, /artworkSrc="https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Registry\/main\/Images\/Website\/vigil-fascia-taxonomyV2\.png"/);
  assert.match(cases, /artworkSrc="https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Registry\/main\/Images\/Website\/VIGIL-fascia-case-files\.png"/);
  assert.match(harm, /artworkSrc="https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Registry\/main\/Images\/Website\/VIGIL-fascia-harm-impact\.png"/);
  assert.match(policy, /artworkSrc="https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Registry\/main\/Images\/Website\/VIGIL-fascia-policy\.png"/);
  assert.match(standards, /artworkSrc="https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Registry\/main\/Images\/Website\/VIGIL-fascia-standards\.png"/);
  assert.match(datasets, /artworkSrc="https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Registry\/main\/Images\/Website\/VIGIL-fascia-datasets\.png"/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(15rem, 24%\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-artwork[\s\S]*position: absolute[\s\S]*object-fit: cover/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-artwork[\s\S]*inset: 0;[\s\S]*width: 100%;/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork[\s\S]*--masthead-accent: 39 73% 56%[\s\S]*hsl\(28 16% 12%\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork[\s\S]*--masthead-artwork-opacity: 0\.84[\s\S]*hsl\(31 20% 20%\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-artwork[\s\S]*opacity: 0;[\s\S]*brightness\(0\.54\)[\s\S]*transition: opacity 120ms/);
  assert.match(mastheadCss, /vigil-observatory-masthead-artwork\.is-loaded[\s\S]*opacity: var\(--masthead-artwork-opacity\)/);
  assert.match(indexHtml, /rel="preconnect" href="https:\/\/raw\.githubusercontent\.com" crossorigin/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork h1[\s\S]*color: hsl\(38 35% 95%\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-context[\s\S]*margin-left: -2\.4rem[\s\S]*hsl\(28 14% 13% \/ 0\)[\s\S]*hsl\(27 14% 11% \/ 0\.94\)/);
  assert.doesNotMatch(mastheadCss, /mask-image: linear-gradient\(90deg, #000 0 79%/);
  assert.doesNotMatch(mastheadCss, /grid-template-areas: "art title context"/);
  assert.doesNotMatch(mastheadCss, /border-right: 1px solid hsl\(34 28% 73%/);
  assert.doesNotMatch(mastheadCss, /vigil-observatory-masthead\.has-artwork\[data-visual="taxonomy"\] \.vigil-observatory-masthead-title::before/);
  assert.match(mastheadCss, /padding:[\s\S]*clamp\(20rem, 31vw, 28rem\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead-description[\s\S]*font-family: var\(--app-font-sans\)/);
  assert.match(taxonomy, /description="Governance boundaries for AI systems, organised into Fidelity Families and Fidelity Classes\."/);
  assert.match(cases, /description="Detailed analysis of real-world AI incidents using a consistent evidence-to-conclusion method for comparison and re-adjudication\."/);
  assert.match(harm, /description="Assessing supported materialised harm across eleven dimensions using the VIGIL Harm Impact Methodology\."/);
  assert.match(policy, /description="Public policy proposals and consultation submissions translating CAM governance architecture into institutional, legal and administrative design\."/);
  assert.match(standards, /description="A curated library of AI governance laws, standards, frameworks and technical guidance used to support VIGIL analysis\."/);
  assert.doesNotMatch(masthead, /Archive|LibraryBig|Landmark|ShieldCheck|<Visual/);
  assert.match(mastheadCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(mastheadCss, /html\[data-theme="dark"\] \.vigil-observatory-masthead/);
  assert.match(main, /vigil-observatory-masthead\.css/);
});

test("public VIGIL Observatory routes expose Incidents, taxonomy, standards and policy only", async () => {
  const [app, shell, hub] = await Promise.all([read("src/App.tsx"), read("src/components/layout/Shell.tsx"), read("src/pages/vigil-knowledge-hub.tsx")]);
  for (const route of ["/observatory/cases", "/observatory/incidents", "/observatory/knowledge-base", "/observatory/knowledge-base/failure-taxonomy", "/observatory/knowledge-base/standards-sources", "/observatory/knowledge-base/policy"]) assert.match(app, new RegExp(route.replaceAll("/", "\\/")));
  for (const retired of ["failure-modes", "observatory/lessons", "observatory/repairs", "VigilKnowledgeBase"]) assert.doesNotMatch(`${app}\n${shell}\n${hub}`, new RegExp(retired, "i"));
});

test("retired standalone record surfaces and the unpublished draft tree are absent", async () => {
  const retiredFiles = [
    "src/pages/vigil.tsx",
    "src/pages/vigil-projection.tsx",
    "src/pages/vigil-failure-modes.tsx",
    "src/pages/vigil-knowledge-base.tsx",
    "src/pages/vigil-reference-knowledge.tsx",
    "src/pages/evidence-chain-report.tsx",
    "src/pages/transition-authority.tsx",
    "src/pages/transition.tsx",
    "src/components/vigil/FailureModeCard.tsx",
    "src/components/vigil/FailureModeDetail.tsx",
  ];
  for (const file of retiredFiles) await assert.rejects(() => access(resolve(root, file)), undefined, `${file} should remain retired`);
  await assert.rejects(() => access(resolve(root, "src/drafts")), undefined, "src/drafts should remain retired rather than becoming a stale holding area");
});

test("Case Files use one canonical Incident and retain the six substantive stages", async () => {
  const [caseFile, sections, report] = await Promise.all([read("src/pages/vigil-case-file.tsx"), read("src/lib/vigilCaseSections.ts"), read("src/pages/evidence-chain-report-deterministic.tsx")]);
  assert.match(caseFile, /loadVigilIncidentRecords/);
  assert.match(caseFile, /records: \[incident\]/);
  assert.doesNotMatch(caseFile, /const observations|deriveFailureModePublicDetail|failureId=/);
  for (const label of ["Incident", "Assessment", "Classification", "Repair", "Conclusion", "References"]) assert.match(sections, new RegExp(`label: "${label}"`));
  assert.match(sections, /id: "conclusion",[\s\S]*number: "05"/);
  assert.match(sections, /id: "references",[\s\S]*number: "06"/);
  assert.doesNotMatch(sections, /label: "Learn"/);
  assert.match(report, /<CaseTaxonomyClassification raw=\{incident\.raw\}/);
  assert.match(report, /<CaseTaxonomyRepair raw=\{incident\.raw\}/);
  assert.doesNotMatch(report, /adjacent Failure Mode|deriveFailureModePublicDetail|const observations/);
});

test("Case File stages use visible editorial headings without duplicate descriptions", async () => {
  const [sections, caseFile, css] = await Promise.all([
    read("src/lib/vigilCaseSections.ts"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/vigil-observatory-instrument-experiment.css"),
  ]);
  assert.doesNotMatch(sections, /description:/);
  assert.doesNotMatch(caseFile, /<p>\{description\}<\/p>/);
  assert.match(caseFile, /className="vigil-case-editorial-heading"/);
  assert.match(caseFile, /"case-classify": "Alignment classification"/);
  assert.match(caseFile, /"case-repair": "Governing invariants and repair"/);
  assert.match(css, /vigil-case-editorial-heading[\s\S]*border-top: 1px solid[\s\S]*font-family: var\(--app-font-serif\)/);
});

test("Repair uses the same public table grammar as Classification", async () => {
  const [classification, css] = await Promise.all([
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/vigil-classification-table.css"),
  ]);
  assert.match(classification, /vigil-classification-web-table vigil-repair-web-table/);
  assert.match(classification, /vigil-classification-table vigil-repair-table/);
  assert.doesNotMatch(classification, /<th scope="col">Relationship<\/th>/);
  assert.match(classification, /<th scope="col">Alignment<\/th>/);
  assert.match(classification, /Invariant held/);
  assert.match(classification, /Failure occurred/);
  assert.match(classification, /Boundary unresolved/);
  assert.match(classification, /<th scope="col">Fidelity class<\/th>/);
  assert.match(classification, /<th scope="col">Governing invariant<\/th>/);
  assert.match(classification, /vigil-classification-family-row/);
  assert.match(classification, /colSpan=\{3\} scope="rowgroup"/);
  assert.match(classification, /item\.role !== "failure-occurrence" && item\.role !== "ambiguous-boundary"/);
  assert.doesNotMatch(classification, /className="vigil-repair-invariant-card"/);
  assert.match(css, /\.vigil-repair-table thead th:nth-child\(1\) \{ width: 16%; \}/);
  assert.match(css, /\.vigil-repair-table thead th:nth-child\(3\) \{ width: 56%; \}/);
  assert.doesNotMatch(classification, /vigil-repair-role-key/);
  assert.match(classification, /VigilAlignmentLegend/);
  assert.match(css, /\.vigil-alignment-legend/);
  assert.match(classification, /CaseTaxonomyRepair[\s\S]*<VigilAlignmentLegend \/>/);
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

test("mixed Case Files explain alignment outcomes with the informational affordance", async () => {
  const [taxonomy, classification, caseFile, contract] = await Promise.all([
    read("src/lib/vigilTaxonomyClassification.ts"),
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("VIGIL-PUBLIC-DISPLAY-CONTRACT.md"),
  ]);
  assert.match(taxonomy, /"ambiguous-boundary"/);
  assert.match(taxonomy, /hasAmbiguousBoundary/);
  assert.match(classification, /Secondary unresolved boundary/);
  assert.match(classification, /item\.role !== "failure-occurrence" && item\.role !== "ambiguous-boundary"/);
  assert.match(caseFile, /const isCombination = classification === "Combination"/);
  assert.match(caseFile, /<Info \/>/);
  assert.match(caseFile, /The system is neither aligned nor misaligned/);
  assert.match(caseFile, /Mappings where failure is evidenced or the boundary remains unresolved contribute their governing invariants to Repair/);
  assert.match(caseFile, /const isDisputed = classification === "Disputed"/);
  assert.match(caseFile, /The evidence is disputed\./);
  assert.match(caseFile, /does not convert disputed claims into established fact/);
  assert.match(contract, /informational mixed-record affordance/);
});

test("Case Files make invariant-held alignment outcomes unmistakable across public surfaces", async () => {
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
  assert.match(caseFile, /const isFailure = classification === "Classified"/);
  assert.match(caseFile, /Alignment outcome · Failure evidenced/);
  assert.match(caseFile, /The governing invariants assessed did not demonstrate alignment\./);
  assert.match(caseFile, /VIGIL Harm Impact Assessment/);
  assert.match(caseFile, /vigil-exemplar-callout-boundary/);
  assert.match(caseFile, /taxonomyAlignmentOutcomeLabel/);
  assert.match(classification, /alignment exemplar · invariant held/i);
  assert.match(classification, /not failure evidence/i);
  assert.match(classification, /Primary alignment exemplar · invariant held/);
  assert.match(classification, /Secondary alignment exemplar · invariant held/);
  assert.match(classification, /item\.role !== "failure-occurrence" && item\.role !== "ambiguous-boundary"/);
  assert.match(classification, /No repair invariant is available for this Case File\./);
  assert.doesNotMatch(classification, /Successful-invariant exemplar mappings remain in Classification/);
  assert.match(report, /Invariant-held exemplar mappings remain attached to their Fidelity Class without being presented as failure evidence/i);
  assert.match(pages, /classification_role === "successful-invariant"\) return "Invariant held"/);
  assert.match(sync, /classification_role: record\.classification_role/);
  assert.match(caseGridCss, /grid-template-columns: minmax\(520px, 1fr\) minmax\(130px, 170px\) minmax\(72px, 96px\) 28px/);
  assert.match(casePolishCss, /\.vigil-case-file-page \.vigil-exemplar-callout/);
  assert.match(casePolishCss, /display: grid !important/);
  assert.doesNotMatch(historicalV5Css, /\.vigil-exemplar-callout/);
});

test("About keeps dedicated six-stage explanatory copy as plain document rows", async () => {
  const [about, homeMenuCss, sections] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/home-menu-pages.css"),
    read("src/lib/vigilCaseSections.ts"),
  ]);
  assert.match(about, /const ABOUT_CASE_FILE_STAGES = \[/);
  assert.match(about, /Record what happened, the affected systems and the public evidence supporting the occurrence\./);
  assert.match(about, /interpret taxonomy-relevant source clauses, review external assessments where available, and separately assess real-world materialised harm and severity under VIGIL-HIM/);
  assert.match(about, /Map the evidence to the VIGIL Alignment Taxonomy and record whether each boundary failed, held or remains unresolved\./);
  assert.match(about, /governing class invariants for mappings where failure is evidenced or the boundary remains unresolved/);
  assert.match(about, /Integrate the evidence, harm assessment, taxonomy relationships and repair implications into a bounded VIGIL interpretation\./);
  assert.match(about, /Preserve the evidence sources, taxonomy records, methodology references and canonical Incident supporting the analysis\./);
  assert.match(about, /ABOUT_CASE_FILE_STAGES\.map/);
  assert.match(about, /<ol className="about-method-list"/);
  assert.match(about, /about-method-number/);
  assert.doesNotMatch(about, /vigil-about-stage-disclosure|<details|vigil-about-stage-toggle/);
  assert.doesNotMatch(about, /VIGIL_INCIDENT_CASE_SECTIONS\.map/);
  assert.doesNotMatch(sections, /description:/);
  assert.match(homeMenuCss, /\.about-method-list \{/);
  assert.match(homeMenuCss, /\.about-method-list li \{[\s\S]*border-bottom: 1px solid/);
});

test("About explains alignment exemplars without duplicating the Case File legend", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /Invariant held · exemplar/i);
  assert.doesNotMatch(about, /VigilAlignmentLegend detailed/);
  assert.match(about, /Failure occurred[\s\S]*Invariant held[\s\S]*Boundary unresolved/);
  assert.match(about, /do not create a Repair requirement/i);
  assert.match(about, /Mixed alignment outcome/);
  assert.match(about, /Traceable findings, visible judgment and clear boundaries/);
  assert.match(about, /Keep evidence and judgment separate/);
  assert.match(about, /Open to scrutiny, not openly licensed/);
  assert.match(about, /It is separate from CAELESTIS and does not create or amend CAELESTIS doctrine/);
  assert.match(about, /VIGIL uses its own Incident model, VIGIL Harm Impact Methodology \(VIGIL-HIM\) and VIGIL Observatory Alignment Taxonomy/);
  assert.match(about, /Any CAM or CAELESTIS applicability is assessed separately/);
  assert.match(about, /href="\/observatory\/severity-methodology\/"[\s\S]*Harm Impact Assessment/);
  assert.doesNotMatch(about, /CAELESTIS governance instruments are a separate authority layer/);
});

test("Long-form public pages share the document rail and editorial hero grammar", async () => {
  const [about, policy, licensing, privacy, rail, indexCss, homeMenuCss, main] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/pages/policy.tsx"),
    read("src/pages/licensing.tsx"),
    read("src/pages/privacy.tsx"),
    read("src/components/DocumentRail.tsx"),
    read("src/index.css"),
    read("src/home-menu-pages.css"),
    read("src/main.tsx"),
  ]);
  for (const page of [about, policy, licensing, privacy]) {
    assert.match(page, /DocumentRail/);
    assert.match(page, /document-content/);
  }
  for (const page of [about, licensing, privacy]) {
    assert.match(page, /document-hero/);
  }
  assert.match(policy, /<VigilObservatoryMasthead[\s\S]*title="Policy Papers & Submissions"/);
  assert.ok(policy.indexOf('<VigilObservatoryMasthead') < policy.indexOf('<DocumentRail'));
  assert.match(policy, /document-layout document-layout--wide document-layout-below-header/);
  assert.match(about, /const founderPhotoHref = "https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Registry\/main\/Images\/Website\/founder-photo\.jpg"/);
  assert.match(about, /about-founder-portrait[\s\S]*<img src=\{founderPhotoHref\}/);
  assert.match(about, /cam-action cam-action-primary[\s\S]*>Contact<\/a>/);
  assert.match(rail, /className="document-rail/);
  assert.match(indexCss, /\.document-layout \{[\s\S]*grid-template-columns/);
  assert.match(indexCss, /\.document-rail \{[\s\S]*position: sticky/);
  assert.match(homeMenuCss, /\.about-founder-portrait img[\s\S]*aspect-ratio: 404 \/ 529/);
  assert.match(main, /import "\.\/home-menu-pages\.css";/);
  assert.doesNotMatch(privacy, /String\(index \+ 1\)\.padStart|<p>\{String\(index \+ 1\)/);
  assert.match(homeMenuCss, /\.document-content \.vigil-about-section:first-of-type[\s\S]*border-top: 0 !important/);
});

test("Case File harm assessment moves all non-assessed dimensions to assessment limits", async () => {
  const him = await read("src/components/vigil/HarmImpactMatrix.tsx");
  assert.match(him, /nonAssessedHarmDimensionLimitItems/);
  assert.match(him, /assessment_status !== "assessed"/);
  assert.match(him, /rollupLabel\(status\)/);
});

test("Case File severity presentation uses ascending S1-to-S5 semantics", async () => {
  const [cases, caseFile, report, about, severity, chip, chipCss, harm] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
    read("src/pages/about.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/components/vigil/VigilStatusChip.tsx"),
    read("src/vigil-severity-chip.css"),
    read("src/components/vigil/HarmImpactMatrix.tsx"),
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
  assert.match(chip, /\\^S\[1-5\]\$\/\.test\(code\)/);
  assert.match(chip, /data-severity=\{severity\}/);
  assert.match(chipCss, /\.vigil-status-chip\[data-severity\][\s\S]*background: hsl\(40 92% 61%\)[\s\S]*color: hsl\(28 28% 13%\)/);
  assert.doesNotMatch(chipCss, /data-severity="S1"|data-severity="S2"|data-severity="S3"|data-severity="S4"|data-severity="S5"/);
  assert.match(caseFile, /label: "Severity", value: <VigilStatusChip value=\{incident\?\.severity\} \/>/);
  assert.match(report, /<Field label="Severity" value=\{incident \? <VigilStatusChip value=\{incident\.severity\} \/> : undefined\} \/>/);
  assert.match(harm, /vigil-harm-result-chip[\s\S]*<VigilStatusChip value=\{row\.severity\}/);
});

test("historical identifiers do not become live retired-record links", async () => {
  const [caseFile, registry, presentation] = await Promise.all([read("src/pages/vigil-case-file.tsx"), read("src/lib/vigilRegistry.ts"), read("src/lib/vigilPresentation.ts")]);
  const combined = `${caseFile}\n${registry}\n${presentation}`;
  assert.doesNotMatch(combined, /failure-modes\/:recordId|observations\/:recordId|research\/:recordId/);
  assert.doesNotMatch(combined, /VIGIL-(?:\d{4}-)?(?:FM|OBS|RESEARCH)-/);
});

test("Alignment Taxonomy pages project canonical linked Case Files without conflating successful exemplars", async () => {
  const [taxonomyPage, taxonomyLoader, taxonomyCss, pages] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/lib/vigilFailureTaxonomy.ts"),
    read("src/vigil-failure-taxonomy-refinements.css"),
    read("scripts/prepare-github-pages.js"),
  ]);
  assert.match(taxonomyLoader, /VIGIL\.FailureTaxonomy\.CaseFileExamples\.json/);
  assert.match(taxonomyLoader, /caseFileExamples: FailureTaxonomyCaseFileExamples/);
  assert.match(taxonomyPage, /Linked Case Files/);
  assert.match(taxonomyPage, /No Case Files currently evidence failure for this class/);
  assert.match(taxonomyPage, /Alignment exemplars/);
  assert.match(taxonomyPage, /item\.invariant_exemplars/);
  assert.match(taxonomyPage, /\/observatory\/cases\/\$\{example\.incident_id\}/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-linked-cases/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-invariant-exemplars/);
  assert.match(pages, /generated\/VIGIL\.FailureTaxonomy\.CaseFileExamples\.json/);
  assert.match(pages, /taxonomyCaseExamplesForClass/);
  assert.match(pages, /Alignment exemplars/);
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

test("Alignment Taxonomy substantive web copy keeps a readable typography floor", async () => {
  const css = await read("src/vigil-failure-taxonomy-refinements.css");
  assert.match(css, /\.vigil-taxonomy-header \.vigil-library-description \{[\s\S]*font-size: 1\.02rem/);
  assert.match(css, /\.vigil-taxonomy-manual-plain \{[\s\S]*font-size: 1\.08rem/);
  assert.match(css, /\.vigil-taxonomy-manual-class > p:not\(\.vigil-taxonomy-manual-plain\)[\s\S]*font-size: 1\.02rem/);
  assert.match(css, /\.vigil-taxonomy-supporting-evidence-note \{[\s\S]*font-size: 0\.98rem !important/);
  assert.match(css, /\.vigil-taxonomy-linked-cases li > p,[\s\S]*font-size: 0\.86rem/);
});

test("Standards search geometry matches Case Files", async () => {
  const [standards, standardsCss, casesCss] = await Promise.all([
    read("src/pages/vigil-standards-baseline.tsx"),
    read("src/vigil-standards-dossier-refinements.css"),
    read("src/vigil-ux-v4.css"),
  ]);
  assert.match(standards, /matching \{visibleSources\.length === 1 \? "source" : "sources"\} · \{clauseCount\.toLocaleString\(\)\} clauses represented/);
  assert.match(standardsCss, /\.vigil-standards-page \.vigil-standards-toolbar \{[\s\S]*display: block/);
  assert.match(standardsCss, /\.vigil-standards-search-row \{[\s\S]*grid-template-columns: minmax\(320px, 1fr\) minmax\(220px, 300px\) minmax\(190px, 260px\)/);
  assert.match(casesCss, /\.vigil-case-table-search \{[\s\S]*grid-template-columns: minmax\(320px, 1fr\) minmax\(220px, 300px\) minmax\(190px, 260px\)/);
});

test("taxonomy and external-governance public systems remain intact", async () => {
  const [taxonomyPage, taxonomyLoader, datasets, standards, externalKnowledge] = await Promise.all([read("src/pages/vigil-failure-taxonomy.tsx"), read("src/lib/vigilFailureTaxonomy.ts"), read("src/pages/datasets.tsx"), read("src/pages/vigil-standards-baseline.tsx"), read("src/lib/vigilExternalKnowledge.ts")]);
  assert.match(taxonomyLoader, /VIGIL\.FailureTaxonomy\.Index\.json/);
  assert.match(taxonomyPage, /fidelity famil/i);
  assert.match(taxonomyPage, /fidelity class/i);
  assert.match(datasets, /VIGIL\.Observatory\.AlignmentTaxonomy\.FullReference\.pdf/);
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
  assert.match(shell, /Harm Impact Assessment/);
  assert.match(about, /Publication model/);
  assert.doesNotMatch(about, /<p className="vigil-library-kicker">Purpose<\/p>|Severity measures supported consequence|Harm & severity/);
  assert.doesNotMatch(about, /Knowledge Base[\s\S]*How the public VIGIL surfaces fit together/);
  assert.match(licensing, /VIGIL Observatory Proprietary Licence/);
  assert.match(severity, /VIGIL-HIM 1\.0\.0/);
  assert.match(severity, /vigil-severity-methodology-document/);
  assert.doesNotMatch(severity, /severity-alignment-heading/);
  assert.doesNotMatch(home, /Open AI Governance|Open AI governance infrastructure/);
});

test("harm methodology emphasizes scan targets and rejects legacy microtype outside the intentional footnote", async () => {
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
  const withoutIntentionalCompactText = css
    .replace(/\.vigil-case-file-page \.vigil-harm-matrix\.is-assessment \.vigil-harm-derivation-note \{[\s\S]*?\}/, "")
    .replace(/\.vigil-harm-assessment-table thead th \{[\s\S]*?\}/, "");
  assert.doesNotMatch(withoutIntentionalCompactText, /font-size: 0\.(?:6[0-9]|7[0-9])rem/);
  assert.match(css, /\.vigil-harm-derivation-note \{[\s\S]*font-size: 0\.76rem/);
  assert.match(css, /\.vigil-harm-assessment-table thead th \{[\s\S]*font-size: 0\.76rem[\s\S]*text-transform: uppercase/);
});



test("harm methodology keeps interpretive notes under the matrix and evidence definitions under Case Files", async () => {
  const [matrix, severity, css] = await Promise.all([
    read("src/components/vigil/HarmImpactMatrix.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/vigil-incident-severity-refinement.css"),
  ]);
  assert.match(matrix, /Interpretive notes/);
  assert.match(matrix, /adaptation_note/);
  assert.match(matrix, /must be wiped and rebuilt or reconstructed from a known-clean state/);
  assert.match(matrix, /Routine precautionary reimaging, credential rotation or ordinary recovery work alone does not establish S5/);
  assert.match(matrix, /export function HarmEvidenceStateDefinitions/);
  assert.match(matrix, /<h3 id="vigil-harm-definitions-heading">Definitions<\/h3>/);
  assert.match(matrix, /Assessed[\s\S]*Unreported[\s\S]*Insufficient evidence[\s\S]*Not applicable[\s\S]*SU — Unassessed/);
  const matrixSection = severity.match(/<section id="matrix"[\s\S]*?<\/section>/)?.[0] ?? "";
  const caseFilesSection = severity.match(/<section id="case-files"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(caseFilesSection, /<HarmEvidenceStateDefinitions \/>/);
  assert.doesNotMatch(matrixSection, /<HarmEvidenceStateDefinitions \/>/);
  assert.match(css, /\.vigil-harm-interpretive-notes[\s\S]*border-top: 1px solid/);
  assert.match(css, /\.vigil-harm-definitions[\s\S]*\.vigil-harm-definitions h3/);
});

test("Stage 02 is presented publicly as Assessment", async () => {
  const [sections, cases, hub, report, printable, pages, readme, contract] = await Promise.all([
    read("src/lib/vigilCaseSections.ts"),
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
    read("src/pages/evidence-chain-report-printable.tsx"),
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
  assert.match(hub, /Incident, Assessment, Classification, Repair, Conclusion and References/);
  assert.match(pages, /evidence, assessment, alignment classification/);
  assert.match(readme, /\*\*Assessment:\*\*/);
  assert.match(contract, /severity as substantive assessment/);
  for (const publicText of [sections, cases, hub, report, printable]) {
    assert.doesNotMatch(publicText, /label[:=] "?Diagnosis"?|Observation, Diagnosis, Classification|<Stage number="02" label="Diagnosis">/);
  }
});


test("About, Privacy and licensing use open rail documents while methodology keeps its specialist document", async () => {
  const [about, privacy, licensing, severity, homeMenuCss] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/pages/privacy.tsx"),
    read("src/pages/licensing.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/home-menu-pages.css"),
  ]);
  for (const page of [about, privacy, licensing]) {
    assert.match(page, /DocumentRail/);
    assert.match(page, /document-content/);
  }
  assert.match(severity, /vigil-severity-methodology-document/);
  assert.match(homeMenuCss, /\.document-content\.vigil-about-document,[\s\S]*border: 0 !important/);
  assert.match(homeMenuCss, /\.document-content\.public-reference-document/);
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
  const [shell, hub, taxonomy, cases, datasets, home] = await Promise.all([
    read("src/components/layout/Shell.tsx"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/datasets.tsx"),
    read("src/pages/home.tsx"),
  ]);
  assert.match(shell, />\s*VIGIL Observatory\s*<\/Link>/);
  assert.match(shell, /href: "\/observatory\/knowledge-base\/", label: "Knowledge Base"/);
  assert.match(hub, /VIGIL Observatory Case Files/);
  assert.match(taxonomy, /VIGIL Observatory Alignment Taxonomy/);
  assert.match(cases, /VIGIL Observatory · Incident investigations/);
  assert.match(datasets, /title="Alignment Taxonomy"/);
  assert.match(home, /aria-label="VIGIL Fidelity Classes accumulating into the Alignment Taxonomy"/);
  assert.match(home, /Explore the alignment taxonomy/);
});


test("Alignment Taxonomy PDF uses the canonical public naming", async () => {
  const datasets = await read("src/pages/datasets.tsx");
  assert.match(datasets, /VIGIL-Alignment-Taxonomy-Full-Reference\.pdf/);
  assert.match(datasets, /VIGIL\.Observatory\.AlignmentTaxonomy\.FullReference\.pdf/);
});

test("Datasets prioritise the public Harm Impact Matrix over the internal reference registry", async () => {
  const datasets = await read("src/pages/datasets.tsx");
  assert.match(datasets, /title="Harm Impact Matrix"/);
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


test("Case File search, classification and severity filters share one desktop row", async () => {
  const [cases, css] = await Promise.all([read("src/pages/vigil-cases.tsx"), read("src/vigil-ux-v4.css")]);
  assert.match(cases, /<span>Classification<\/span>[\s\S]*<span>Severity<\/span>/);
  assert.match(cases, /All severities/);
  assert.match(cases, /severityCode\(record\) !== severity/);
  assert.match(cases, /setSeverity\(""\)/);
  assert.match(css, /\.vigil-case-table-search \{[\s\S]*grid-template-columns: minmax\(320px, 1fr\) minmax\(220px, 300px\) minmax\(190px, 260px\)/);
  assert.match(css, /@media \(max-width: 820px\) \{[\s\S]*\.vigil-case-table-search,[\s\S]*grid-template-columns: 1fr/);
});

test("Case File ticket keeps severity and classification in Incident context and restores Full report", async () => {
  const [caseFile, dossier] = await Promise.all([
    read("src/pages/vigil-case-file.tsx"),
    read("src/vigil-case-file-dossier.css"),
  ]);
  assert.match(caseFile, /<VigilObservatoryMasthead[\s\S]*contextLabel="Incident context"[\s\S]*artworkSrc="https:\/\/raw\.githubusercontent\.com\/CAM-Initiative\/Registry\/main\/Images\/Website\/VIGIL-fascia-incidents\.png"[\s\S]*label: "Jurisdiction"[\s\S]*label: "Environment"[\s\S]*label: "Severity"[\s\S]*label: "Classification"/);
  assert.doesNotMatch(caseFile, /vigil-case-ticket-footer|vigil-case-ticket-footer-meta|vigil-case-ticket-report-button/);
  assert.match(caseFile, /vigil-case-report-tab[\s\S]*Full report \/ PDF/);
  assert.match(dossier, /\.vigil-case-file-page \.vigil-case-stage-tabs \{[\s\S]*repeat\(6, minmax\(0, 0\.92fr\)\)[\s\S]*minmax\(8\.4rem, 1\.18fr\)/);
});

test("principal Observatory surfaces use the shared masthead component", async () => {
  const [severity, standards, standardSource, policy, hub, caseFile, datasets] = await Promise.all([
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/pages/vigil-standards-baseline.tsx"),
    read("src/pages/vigil-standard-source.tsx"),
    read("src/pages/policy.tsx"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/datasets.tsx"),
  ]);
  for (const page of [severity, standards, standardSource, policy, hub, caseFile, datasets]) {
    assert.match(page, /VigilObservatoryMasthead/);
  }
  for (const page of [severity, standards, standardSource, policy, caseFile, datasets]) {
    assert.doesNotMatch(page, /vigil-taxonomy-ticket|vigil-case-file-hero-v4/);
  }
  assert.ok(hub.indexOf("<VigilObservatoryMasthead") < hub.indexOf("<DocumentRail"));
  assert.match(standardSource, /mode="record"/);
  assert.match(caseFile, /mode="record"/);
});

test("Case Files landing page uses the shared Observatory masthead and stays concise", async () => {
  const cases = await read("src/pages/vigil-cases.tsx");
  assert.match(cases, /<VigilObservatoryMasthead/);
  assert.match(cases, /titleId="case-files-heading"/);
  assert.match(cases, /title="Case Files"/);
  assert.match(cases, /contextLabel="Collection context"/);
  assert.doesNotMatch(cases, /vigil-taxonomy-ticket vigil-case-library-ticket/);
  assert.doesNotMatch(cases, /Active corpus refactor|Records actively under construction|currently being re-adjudicated and rebuilt/);
  assert.doesNotMatch(cases, /Observation, Assessment, Classification, Repair and References model/);
});


test("About explains the VIGIL evidence-to-conclusion method and classification outcomes without card grids", async () => {
  const [about, homeMenuCss] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/home-menu-pages.css"),
  ]);
  const methodStart = about.indexOf("One evidence-to-conclusion structure for every Incident");
  const harmSeparation = about.indexOf("Real-world harm assessment and alignment classification are deliberately independent");
  const stageList = about.indexOf("about-method-list");
  assert.ok(methodStart >= 0 && harmSeparation > methodStart && stageList > harmSeparation);
  assert.match(about, /VIGIL-HIM[\s\S]*VIGIL Alignment Taxonomy[\s\S]*Repair[\s\S]*Conclusion[\s\S]*References/);
  assert.match(about, /Failure occurred[\s\S]*Invariant held[\s\S]*Boundary unresolved/);
  assert.match(about, /Failure evidenced[\s\S]*Invariant held · exemplar[\s\S]*Mixed alignment outcome/);
  assert.match(about, /about-outcome-list/);
  assert.doesNotMatch(about, /vigil-about-case-outcome-grid|vigil-about-outcome-visual|CircleX|CircleCheckBig/);
  assert.match(about, /Mixed alignment outcome[\s\S]*Browse the taxonomy/);

  const aboutStart = about.indexOf("<h1>About CAM Initiative</h1>");
  const vigilStart = about.indexOf('id="vigil-observatory-heading"');
  const caelestisStart = about.indexOf('id="caelestis-architecture-heading"');
  const connectStart = about.indexOf('id="connect-heading"');
  assert.ok(aboutStart >= 0 && vigilStart > aboutStart && caelestisStart > vigilStart && connectStart > caelestisStart);

  const vigilIntro = about.indexOf("VIGIL Observatory is the CAM Initiative");
  const vigilBoundary = about.indexOf("VIGIL uses its own Incident model");
  const vigilActions = about.indexOf('href="/observatory/cases/"');
  assert.ok(vigilIntro >= 0 && vigilBoundary > vigilIntro && vigilActions > vigilBoundary);

  assert.match(about, /CAELESTIS Architecture Model \(CAM\) is a publicly inspectable governance corpus/);
  assert.match(about, /It does not create or amend CAM or CAELESTIS doctrine/);
  assert.match(about, /Any CAM or CAELESTIS applicability is assessed separately/);
  assert.match(about, /Copyright &amp; Licence[\s\S]*Privacy[\s\S]*VIGIL Observatory repository/);
  assert.match(homeMenuCss, /\.about-method-list \{/);
  assert.match(homeMenuCss, /\.about-outcome-list \{/);
});


test("homepage omits the retired external governance explorer", async () => {
  const [home, main] = await Promise.all([
    read("src/pages/home.tsx"),
    read("src/main.tsx"),
  ]);
  assert.doesNotMatch(home, /ExploreGovernanceRail|GovernanceExplorerSection|AI Governance Explorer|rotary reference index/);
  assert.doesNotMatch(main, /governance-rail-refinements\.css/);
});

test("About, VIGIL navigation, methodology and datasets share the aligned navigation grammar", async () => {
  const [about, shell, severity, datasets, menuCss, gearCss, hub, home] = await Promise.all([
    read("src/pages/about.tsx"),
    read("src/components/layout/Shell.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/pages/datasets.tsx"),
    read("src/home-menu-pages.css"),
    read("src/home-premium-v11-tactile.css"),
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/home.tsx"),
  ]);

  assert.doesNotMatch(about, /01 · VIGIL Observatory|02 · Case File method|03 · VIGIL Observatory Alignment Taxonomy|04 · Publication model|05 · CAELESTIS Architecture Model|06 · Connect/);
  assert.match(about, /label: "VIGIL Observatory"/);
  assert.match(about, /label: "Case File method"/);
  assert.match(about, /label: "Alignment Taxonomy"/);

  const homeStart = shell.indexOf("const homeLinks");
  const homeEnd = shell.indexOf("];", homeStart);
  const homeKnowledge = shell.indexOf('label: "Knowledge Base"', homeStart);
  assert.ok(homeKnowledge > homeStart && homeKnowledge < homeEnd);

  const vigilStart = shell.indexOf("const vigilLinks");
  const vigilMenuEnd = shell.indexOf("];", vigilStart);
  const caseFiles = shell.indexOf('navLabel: "Case Files"', vigilStart);
  const policy = shell.indexOf('navLabel: "Policy"', vigilStart);
  const standards = shell.indexOf('navLabel: "AI Governance Standards"', vigilStart);
  assert.ok(caseFiles >= vigilStart && policy > caseFiles && standards > policy && standards < vigilMenuEnd);
  assert.ok(shell.indexOf('navLabel: "Knowledge Base"', vigilStart) === -1 || shell.indexOf('navLabel: "Knowledge Base"', vigilStart) > vigilMenuEnd);
  assert.doesNotMatch(shell, /const homeLinks = \[[\s\S]*?label: "Policy"/);
  assert.match(shell, /href="\/observatory\/cases\/"[\s\S]*VIGIL Observatory/);

  assert.match(severity, /<VigilObservatoryMasthead[\s\S]*title="Harm Impact Assessment"[\s\S]*contextLabel="Methodology context"/);
  assert.ok(severity.indexOf('<VigilObservatoryMasthead') < severity.indexOf('DocumentRail title="Harm Impact Assessment"'));
  assert.doesNotMatch(severity, /href: "#overview", label: "Overview"/);
  assert.match(menuCss, /vigil-severity-methodology-document \{[\s\S]*border: 0 !important[\s\S]*background: transparent !important/);
  assert.match(menuCss, /vigil-severity-methodology-document \.vigil-about-section[\s\S]*background: transparent !important/);
  assert.match(menuCss, /vigil-severity-methodology-document \.vigil-about-section \+ \.vigil-about-section[\s\S]*border-top: 1px solid/);
  assert.match(menuCss, /\.policy-page,[\s\S]*\.vigil-severity-methodology-page[\s\S]*width: min\(100%, 1500px\)[\s\S]*padding-top: 1\.5rem/);
  assert.match(menuCss, /vigil-severity-methodology-page \.vigil-severity-principles \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)[\s\S]*border: 0/);
  assert.match(menuCss, /vigil-severity-methodology-page \.vigil-severity-principles > div[\s\S]*display: block[\s\S]*border: 0/);
  assert.match(menuCss, /vigil-severity-methodology-page \.vigil-harm-methodology-table[\s\S]*border-collapse: separate/);
  assert.match(menuCss, /vigil-severity-methodology-page \.vigil-harm-methodology-table th,[\s\S]*border: 0 !important/);
  assert.match(datasets, /DocumentRail title="Datasets"/);
  assert.match(datasets, /<VigilObservatoryMasthead[\s\S]*title="Datasets"[\s\S]*contextLabel="Collection context"/);
  assert.ok(datasets.indexOf('<VigilObservatoryMasthead') < datasets.indexOf('DocumentRail title="Datasets"'));
  assert.doesNotMatch(datasets, /label: "0[1-5] |<p>0[1-5] ·/);
  assert.doesNotMatch(datasets, /vigil-knowledge-grid vigil-dataset-grid/);
  assert.match(menuCss, /cam-action:not\(\.cam-action-compact\)[\s\S]*border-radius: 999px/);
  assert.doesNotMatch(gearCss, /Outer-wheel inner-edge correction|Outer-wheel surface correction/);
  assert.match(gearCss, /diagnostic-light-edge-outer[\s\S]*z-index: 2\.75/);
  assert.match(gearCss, /diagnostic-light-edge-outer[\s\S]*hsl\(0 0% 100% \/ 0\.98\) 60\.5% 64%/);
  assert.match(gearCss, /diagnostic-light-edge-inner[\s\S]*hsl\(0 0% 100% \/ 0\.98\) 60\.5% 64%/);
  assert.match(gearCss, /\.diagnostic-instrument-web \{[\s\S]*z-index: 0;/);
  assert.match(gearCss, /diagnostic-gear-outer \.diagnostic-gear-tooth::before[\s\S]*hsl\(38 5% 47% \/ 0\.96\)[\s\S]*hsl\(43 7% 68% \/ 0\.99\)/);
  assert.match(home, /diagnostic-outer-spokes-surface/);
  assert.match(gearCss, /Foreground outer spokes/);
  assert.match(gearCss, /\.diagnostic-gear-outer \.diagnostic-gear-spokes \{[\s\S]*opacity: 0/);
  assert.match(gearCss, /\.diagnostic-outer-spokes-surface \{[\s\S]*z-index: 2\.9[\s\S]*inset: 8%/);
  assert.match(gearCss, /diagnostic-outer-spokes-surface > i \{[\s\S]*linear-gradient\(180deg, #000 0 30%, rgba\(0, 0, 0, 0\.82\) 31%, transparent 34% 100%\)/);
  assert.match(gearCss, /diagnostic-outer-spokes-surface > i \{[\s\S]*width: 1\.9rem[\s\S]*hsl\(42 20% 96% \/ 0\.98\)/);
  assert.match(gearCss, /diagnostic-outer-spokes-surface > i::before[\s\S]*hsl\(0 0% 100% \/ 0\.72\)/);
  assert.match(gearCss, /html:not\(\[data-theme="dark"\]\) \.diagnostic-outer-spokes-surface > i::before[\s\S]*hsl\(0 0% 100% \/ 0\.96\)/);
  assert.match(home, /diagnostic-outer-machined-ring/);
  assert.match(gearCss, /\.diagnostic-outer-machined-ring \{[\s\S]*z-index: 2\.8[\s\S]*inset: 15\.5%/);

  const hubCaseFiles = hub.indexOf('id="cases"');
  const hubStandards = hub.indexOf('id="standards"');
  assert.ok(hubCaseFiles >= 0 && hubStandards > hubCaseFiles);
  assert.doesNotMatch(hub, /undergoing a substantive refactor/);
});

test("dark appearance keeps native Case File classification menus legible", async () => {
  const dark = await read("src/dark-appearance.css");
  assert.match(dark, /html\[data-theme="dark"\] \.vigil-family-select select \{/);
  assert.match(dark, /color-scheme: dark/);
  assert.match(dark, /\.vigil-family-select select option,[\s\S]*background-color: hsl\(var\(--popover\)\)/);
  assert.match(dark, /color: hsl\(var\(--popover-foreground\)\)/);
});


test("About uses open sections and line hierarchy rather than nested bordered cards", async () => {
  const [main, css, about] = await Promise.all([
    read("src/main.tsx"),
    read("src/home-menu-pages.css"),
    read("src/pages/about.tsx"),
  ]);
  assert.doesNotMatch(main, /about-page-polish\.css/);
  assert.match(css, /\.document-content \.vigil-about-section \{[\s\S]*border-top: 1px solid/);
  assert.match(css, /\.document-content\.vigil-about-document,[\s\S]*border: 0 !important/);
  assert.match(css, /\.about-principle-list \{[\s\S]*border-top: 1px solid/);
  assert.doesNotMatch(about, /vigil-about-stage-disclosure|vigil-about-case-outcome-grid/);
});


test("About disambiguates VIGIL Observatory from unrelated VIGIL projects", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /VIGIL Observatory is also not affiliated with/);
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

test("Case File Incident stage renders optional source artefact images inside What happened", async () => {
  const [caseFile, css] = await Promise.all([
    read("src/pages/vigil-case-file.tsx"),
    read("src/vigil-case-file-polish.css"),
  ]);
  assert.match(caseFile, /incident_artefacts/);
  assert.match(caseFile, /vigil-incident-artefacts/);
  assert.match(caseFile, /<img src=\{artefact\.renderUrl\}/);
  assert.match(caseFile, /isVideoArtefact\(artefact\)/);
  assert.match(caseFile, /<video[\s\S]*controls[\s\S]*preload="metadata"[\s\S]*playsInline/);
  assert.match(caseFile, /<source src=\{artefact\.renderUrl\} type=\{artefact\.mediaType\}/);
  assert.match(caseFile, /vigil-incident-artefact-reference/);
  assert.match(caseFile, /#vigil-evidence-reference-/);
  assert.doesNotMatch(caseFile, /View originating source/);
  assert.match(css, /\.vigil-case-file-page \.vigil-incident-artefact \{[\s\S]*text-align: center/);
  assert.match(css, /\.vigil-case-file-page \.vigil-incident-artefact-link \{[\s\S]*max-width: min\(100%, 54rem\)/);
  assert.match(css, /\.vigil-case-file-page \.vigil-incident-artefact img \{[\s\S]*margin: 0 auto/);
  assert.match(css, /\.vigil-case-file-page \.vigil-incident-artefact-video \{[\s\S]*width: min\(100%, 54rem\)[\s\S]*margin: 0 auto/);
});


test("Case File stage tabs keep six stages on one desktop row while mobile may wrap", async () => {
  const css = await read("src/vigil-case-file-dossier.css");
  const desktopTabs = css.match(/\.vigil-case-file-page \.vigil-case-stage-tabs \{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(desktopTabs, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.vigil-case-file-page \.vigil-case-stage-tabs button \{[\s\S]*min-width: 0;[\s\S]*white-space: nowrap;/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.vigil-case-stage-tabs \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.vigil-case-stage-tabs \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("Assessment wording keeps harm assessment distinct from alignment classification", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /Assessment<\/strong> contains distinct governance, external and real-world harm assessments/);
  assert.match(about, /VIGIL-HIM assesses materialised consequence and derives severity/);
  assert.match(about, /Real-world harm assessment and alignment classification are deliberately independent/);
  assert.doesNotMatch(about, /classify materialised harm/);
});
