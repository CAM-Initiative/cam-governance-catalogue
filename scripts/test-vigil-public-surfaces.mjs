import { clauseAssessmentRows } from "../src/lib/vigilClauseRows.mjs";
import { assessmentParagraphs, assessmentBlocks, assessmentSections } from "../src/lib/vigilAssessmentParagraphs.mjs";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { VIGIL_DISPUTED_COPY } from "../src/lib/vigilDisputedCopy.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), "utf8");

test("Case File Section 02 keeps its assessment provenance renderer defined", async () => {
  const caseFile = await read("src/pages/vigil-case-file.tsx");
  assert.match(caseFile, /function Field\(\{ label, value, mono = false \}/);
  assert.ok(caseFile.indexOf("function Field(") < caseFile.indexOf("export default function VigilCaseFile("), "Section 02 Field must be declared before the Case File renderer");
  assert.match(caseFile, /if \(stageId === "diagnose"\)/);
  assert.match(caseFile, /<Field label="Assessed" value=\{diagnostic\?\.diagnosticDate\}/);
});


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

test("SEO publication signals expose canonical-only sitemap routes and crawlable indexes", async () => {
  const [entrypoint, pages, standards, caseFile, cases, fallbackHelper] = await Promise.all([
    read("src/index.html"),
    read("scripts/prepare-github-pages.js"),
    read("src/pages/vigil-standards-baseline.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/vigil-cases.tsx"),
    read("src/lib/staticPublicationFallback.ts"),
  ]);
  assert.match(entrypoint, /property="og:site_name" content="CAM Initiative"/);
  assert.match(entrypoint, /"@type": "WebSite"/);
  assert.match(entrypoint, /"name": "CAM Initiative"/);
  assert.doesNotMatch(pages, /const canonicalAliases/);
  assert.match(pages, /const retiredPublicRouteDirs = \[/);
  assert.match(pages, /const sitemapRoutes = \[\.\.\.new Set\(\[/);
  assert.match(pages, /\.\.\.staticRoutes\.map\(\(\[route\]\) => route\)/);
  assert.match(pages, /data-static-crawl-fallback="vigil-about"/);
  assert.match(pages, /data-static-crawl-fallback="knowledge-base"/);
  assert.match(pages, /data-static-crawl-fallback="vigil-harm-impact"/);
  assert.match(pages, /data-static-crawl-fallback="vigil-governance-standards"/);
  assert.match(pages, /data-static-crawl-fallback="vigil-case-index"/);
  assert.match(pages, /data-static-crawl-fallback="vigil-taxonomy-index"/);
  assert.match(pages, /Incident-centred public observatory and AI incident database/);
  const aboutFallback = pages.match(/const vigilAboutFallbackBody = `([\s\S]*?)`;/)?.[1] ?? "";
  assert.match(aboutFallback, /<h2>VIGIL Observatory<\/h2>/);
  assert.match(aboutFallback, /Open the CAM Initiative Knowledge Base/);
  assert.doesNotMatch(aboutFallback, /VIGIL Case File method|<h2>CAELESTIS Architecture Model<\/h2>/);
  assert.match(pages, /CAM Initiative Knowledge Base/);
  assert.doesNotMatch(pages, /VIGIL Observatory is distinct from CAELESTIS/);
  assert.match(pages, /const vigilAboutStructuredData = \{/);
  assert.match(pages, /"@type": "CreativeWork"/);
  assert.match(pages, /alternateName: "VIGIL"/);
  assert.match(pages, /https:\/\/github\.com\/CAM-Initiative\/Vigil/);
  assert.match(pages, /body: isAboutRoute \? vigilAboutFallbackBody : \(staticRouteBodies\.get\(route\) \?\? ""\)/);
  assert.match(pages, /structuredData: isAboutRoute \? vigilAboutStructuredData : undefined/);
  assert.match(pages, /function externalAssessmentsHtml\(record\)/);
  assert.match(pages, /External classification \/ rating/);
  assert.match(pages, /VIGIL relationship/);
  assert.match(pages, /"\/knowledge-base"/);
  assert.match(pages, /"\/observatory\/alignment-taxonomy"/);
  assert.match(pages, /"\/observatory\/harm-impact-assessment"/);
  assert.match(pages, /"\/observatory\/ai-governance-standards"/);
  assert.match(standards, /`\/observatory\/ai-governance-standards\/\$\{encodeURIComponent\(key\)\}\/`/);
  assert.doesNotMatch(standards, /\/observatory\/knowledge-base\/standards-sources/);
  assert.match(pages, /persistentFallbackKind: "vigil-case"/);
  assert.match(pages, /persistentFallbackKind: "vigil-case-index"/);
  assert.match(pages, /data-static-publication-fallback=/);
  assert.match(caseFile, /hasStaticPublicationFallback\("vigil-case"\)/);
  assert.match(caseFile, /retireStaticPublicationFallback\("vigil-case"\)/);
  assert.match(cases, /hasStaticPublicationFallback\("vigil-case-index"\)/);
  assert.match(cases, /retireStaticPublicationFallback\("vigil-case-index"\)/);
  assert.match(fallbackHelper, /querySelector\(fallbackSelector\(kind\)\)\?\.remove\(\)/);
  assert.match(pages, /record\.record_last_updated/);
  assert.match(pages, /<lastmod>\$\{lastmod\}<\/lastmod>/);
  assert.doesNotMatch(pages, /generatedDate/);
});

test("CAM Initiative Knowledge Base uses the Home-menu editorial masthead and exposes its core references", async () => {
  const hub = await read("src/pages/vigil-knowledge-hub.tsx");
  assert.match(hub, /className="public-reference-page vigil-knowledge-hub-page home-menu-page document-page"/);
  assert.match(hub, /<header id="overview" className="document-hero public-reference-hero">[\s\S]*public-reference-kicker">CAM Initiative<[\s\S]*<h1 id="knowledge-base-heading">Knowledge Base<\/h1>/);
  assert.match(hub, /Reference material across CAM Initiative/);
  assert.doesNotMatch(hub, /VigilObservatoryMasthead|VigilObservatoryNav|kicker="VIGIL Observatory"/);
  assert.match(hub, /DocumentRail title="Knowledge Base"/);
  assert.match(hub, /ariaLabel="CAM Initiative Knowledge Base sections"/);
  assert.match(hub, /href="\/observatory\/cases\/"/);
  assert.match(hub, /href="\/observatory\/ai-governance-standards\/"/);
  assert.match(hub, /href="\/observatory\/harm-impact-assessment\/"[\s\S]*Open Harm Impact Assessment/);
  assert.match(hub, /VIGIL-HIM 1\.1\.0/);
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

test("homepage refinement preserves the six-stage instrument, readable gear labels and live Observatory feed", async () => {
  const [home, styles, gearStyles, mobileStyles] = await Promise.all([
    read("src/pages/home.tsx"),
    read("src/home-premium-v2.css"),
    read("src/home-premium-v11-tactile.css"),
    read("src/mobile-responsive-polish.css"),
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
  assert.match(styles, /\.incident-ticker-label \{[\s\S]*font-size: 0\.76rem/);
  assert.match(styles, /\.incident-ticker a \{[\s\S]*font-size: 0\.88rem/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.incident-ticker-track \{ animation: none; \}/);
  assert.match(gearStyles, /\.diagnostic-orbit-v2 \.diagnostic-node-label \{[\s\S]*font-size: 0\.78rem/);
  assert.match(gearStyles, /\.diagnostic-orbit-v2 \.diagnostic-node\.is-active \.diagnostic-node-copy strong,[\s\S]*max-height: 5\.5rem[\s\S]*font-size: 1\.16rem/);
  assert.match(gearStyles, /\.diagnostic-orbit-v2 \.diagnostic-node\.is-expanded \{[\s\S]*width: min\(17rem, 44vw\)[\s\S]*min-height: 7\.2rem/);
  assert.match(mobileStyles, /\.diagnostic-orbit-v2 \.diagnostic-node\.is-active:not\(\.is-expanded\) \{[\s\S]*width: min\(46vw, 10\.8rem\) !important[\s\S]*min-height: 3\.1rem !important/);
  assert.match(mobileStyles, /\.diagnostic-orbit-v2 \.diagnostic-node\.is-expanded \.diagnostic-node-detail \{[\s\S]*max-height: 9rem[\s\S]*font-size: 0\.9rem/);
});


test("homepage mobile feed and taxonomy stickers keep their component-owned responsive styles", async () => {
  const [feedCss, stickerCss, mobileCss] = await Promise.all([
    read("src/home-premium-v2.css"),
    read("src/home-premium-v6.css"),
    read("src/mobile-responsive-polish.css"),
  ]);

  assert.match(feedCss, /@media \(max-width: 720px\)[\s\S]*\.incident-ticker-label \{[\s\S]*font-size: 0\.78rem/);
  assert.match(feedCss, /@media \(max-width: 720px\)[\s\S]*\.incident-ticker a \{[\s\S]*font-size: 0\.9rem[\s\S]*line-height: 1\.4/);

  assert.match(stickerCss, /@media \(max-width: 720px\)[\s\S]*\.taxonomy-sticker-board \{[\s\S]*overflow-x: auto;[\s\S]*overflow-y: hidden;[\s\S]*overscroll-behavior-x: contain/);
  assert.match(stickerCss, /@media \(max-width: 720px\)[\s\S]*\.taxonomy-sticker \{[\s\S]*width: max-content;[\s\S]*max-width: none/);
  assert.match(stickerCss, /@media \(max-width: 720px\)[\s\S]*\.taxonomy-sticker strong \{[\s\S]*white-space: nowrap;[\s\S]*overflow-wrap: normal/);
  assert.doesNotMatch(mobileCss, /\.taxonomy-sticker-board\s*\{/);
  assert.doesNotMatch(mobileCss, /\.taxonomy-sticker\s*\{/);
});

test("shared DocumentRail mobile navigation wraps without horizontal scrolling", async () => {
  const [indexCss, menuCss] = await Promise.all([
    read("src/index.css"),
    read("src/home-menu-pages.css"),
  ]);

  assert.match(indexCss, /@media \(max-width: 900px\)[\s\S]*\.document-rail-nav \{[\s\S]*display: grid;[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*overflow: visible/);
  assert.match(indexCss, /@media \(max-width: 620px\)[\s\S]*\.document-rail-nav \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(indexCss, /@media \(max-width: 900px\)[\s\S]*\.document-rail-nav \{[\s\S]*overflow-x: auto/);
  assert.doesNotMatch(menuCss, /\.vigil-datasets-page \.document-rail-nav/);
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
  const [cases, taxonomy, harm, policy, standards, datasets, masthead, mastheadCss, mastheadArtwork, main, indexHtml] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/pages/policy.tsx"),
    read("src/pages/vigil-standards-baseline.tsx"),
    read("src/pages/datasets.tsx"),
    read("src/components/vigil/VigilObservatoryMasthead.tsx"),
    read("src/vigil-observatory-masthead.css"),
    read("src/lib/vigilMastheadArtwork.ts"),
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
  assert.match(mastheadCss, /vigil-observatory-masthead-context-label[\s\S]*font-size: 0\.7rem/);
  assert.match(mastheadCss, /vigil-observatory-masthead-context dt[\s\S]*font-size: 0\.64rem/);
  assert.match(mastheadCss, /vigil-observatory-masthead-context dd[\s\S]*font-size: clamp\(0\.96rem, 1\.02vw, 1\.05rem\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead-context dd\.is-mono[\s\S]*font-size: 0\.84rem/);
  assert.match(mastheadCss, /vigil-observatory-masthead-instrument/);
  assert.match(mastheadCss, /vigil-observatory-masthead-calibration-accent/);
  assert.match(masthead, /artworkSrc/);
  assert.match(masthead, /vigil-observatory-masthead-artwork/);
  assert.match(masthead, /loading="eager"[\s\S]*decoding="async"[\s\S]*fetchPriority="high"/);
  assert.match(masthead, /onLoad=\{\(event\) => event\.currentTarget\.classList\.add\("is-loaded"\)\}/);
  assert.match(taxonomy, /artworkSrc=\{VIGIL_MASTHEAD_ARTWORK\.taxonomy\}/);
  assert.match(cases, /artworkSrc=\{VIGIL_MASTHEAD_ARTWORK\.cases\}/);
  assert.match(harm, /artworkSrc=\{VIGIL_MASTHEAD_ARTWORK\.harm\}/);
  assert.match(policy, /artworkSrc=\{VIGIL_MASTHEAD_ARTWORK\.policy\}/);
  assert.match(standards, /artworkSrc=\{VIGIL_MASTHEAD_ARTWORK\.standards\}/);
  assert.match(datasets, /artworkSrc=\{VIGIL_MASTHEAD_ARTWORK\.datasets\}/);
  assert.match(mastheadArtwork, /VIGIL_FASCIA_REGISTRY_REVISION = "[a-f0-9]{40}"/);
  assert.match(mastheadArtwork, /vigil-fascia-taxonomy\.png/);
  assert.match(mastheadArtwork, /VIGIL-fascia-case-files\.png/);
  assert.match(mastheadArtwork, /VIGIL-fascia-harm-impact\.png/);
  assert.match(mastheadArtwork, /_VIGIL-fascia-policy\.png/);
  assert.match(mastheadArtwork, /%20VIGIL-fascia-policy\.png/);
  assert.match(mastheadArtwork, /VIGIL_FASCIA_DARK_REGISTRY_REVISION = "[a-f0-9]{40}"/);
  assert.match(mastheadArtwork, /datasets: \`\$\{fasciaBase\}\/VIGIL-fascia-datasets\.png\`/);
  assert.match(masthead, /vigilDarkMastheadArtwork\(artworkSrc\)/);
  assert.match(masthead, /cam-theme-change/);
  assert.match(mastheadArtwork, /VIGIL-fascia-standards\.png/);
  assert.match(mastheadArtwork, /VIGIL-fascia-datasets\.png/);
  assert.match(mastheadArtwork, /VIGIL-fascia-incidentsV2\.png/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(15rem, 24%\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-artwork[\s\S]*position: absolute[\s\S]*object-fit: cover/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-artwork[\s\S]*inset: 0;[\s\S]*width: 100%;/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork[\s\S]*--masthead-artwork-opacity: 0\.76/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork \{[^}]*--masthead-accent: 38 78% 38%[^}]*--masthead-artwork-opacity: 1;[^}]*background: hsl\(var\(--background\)\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-artwork[\s\S]*opacity: 0;[\s\S]*transition: opacity 120ms/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork::before \{[^}]*display: none;/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-artwork \{[^}]*filter: none;/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork h1[\s\S]*color: hsl\(27 19% 13%\)/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-description[\s\S]*color: hsl\(28 12% 27%\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead-artwork\.is-loaded[\s\S]*opacity: var\(--masthead-artwork-opacity\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork\[data-mode="record"\][\s\S]*--masthead-artwork-opacity: 0\.62[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(19\.5rem, 30%\)[\s\S]*min-height: clamp\(15rem, 17\.5vw, 17rem\)/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork\[data-mode="record"\] \{[^}]*--masthead-artwork-opacity: 1;/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork\[data-mode="record"\] \.vigil-observatory-masthead-artwork \{[^}]*filter: none;/);
  assert.doesNotMatch(mastheadCss, /hsl\(30 4% 88%\)|hsl\(30 3% 80%\)/);
  assert.match(mastheadCss, /has-artwork\[data-mode="record"\] \.vigil-observatory-masthead-artwork[\s\S]*saturate\(0\.68\)[\s\S]*blur\(0\.45px\)/);
  assert.match(mastheadCss, /has-artwork\[data-mode="record"\] h1[\s\S]*font-size: clamp\(2\.7rem, 3\.55vw, 3\.65rem\)[\s\S]*line-height: 0\.99/);
  assert.match(mastheadCss, /has-artwork\[data-mode="record"\] \.vigil-observatory-masthead-context-label[\s\S]*font-size: 0\.72rem/);
  assert.match(mastheadCss, /has-artwork\[data-mode="record"\] \.vigil-observatory-masthead-context dt[\s\S]*font-size: 0\.66rem/);
  assert.match(mastheadCss, /has-artwork\[data-mode="record"\] \.vigil-observatory-masthead-context dd \{[\s\S]*font-size: clamp\(0\.98rem, 1\.05vw, 1\.08rem\)/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork\[data-mode="record"\] \.vigil-observatory-masthead-context \{[\s\S]*border-left: 1px solid[\s\S]*hsl\(35 24% 92% \/ 0\.76\)/);
  assert.match(indexHtml, /rel="preconnect" href="https:\/\/raw\.githubusercontent\.com" crossorigin/);
  assert.match(mastheadCss, /vigil-observatory-masthead\.has-artwork h1[\s\S]*color: hsl\(38 35% 95%\)/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-context \{[\s\S]*background: transparent/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-context dt[\s\S]*hsl\(28 10% 39%\)/);
  assert.match(mastheadCss, /html:not\(\[data-theme="dark"\]\) \.vigil-observatory-masthead\.has-artwork \.vigil-observatory-masthead-context dd[\s\S]*hsl\(27 18% 16%\)/);
  assert.doesNotMatch(mastheadCss, /mask-image: linear-gradient\(90deg, #000 0 79%/);
  assert.doesNotMatch(mastheadCss, /grid-template-areas: "art title context"/);
  assert.doesNotMatch(mastheadCss, /border-right: 1px solid hsl\(34 28% 73%/);
  assert.doesNotMatch(mastheadCss, /vigil-observatory-masthead\.has-artwork\[data-visual="taxonomy"\] \.vigil-observatory-masthead-title::before/);
  assert.match(mastheadCss, /padding:[\s\S]*clamp\(20rem, 31vw, 28rem\)/);
  assert.match(mastheadCss, /vigil-observatory-masthead-description[\s\S]*font-family: var\(--app-font-sans\)/);
  assert.match(taxonomy, /description="Governance boundaries for AI systems, organised into Fidelity Families and Fidelity Classes\."/);
  assert.match(cases, /description="Detailed analysis of real-world AI incidents using a consistent evidence-to-conclusion method for comparison and adjudication\."/);
  assert.match(harm, /description="Assessing supported materialised harm across twelve dimensions using the VIGIL Harm Impact Methodology\."/);
  assert.match(policy, /description="Public policy proposals and consultation submissions translating CAM governance architecture into institutional, legal and administrative design\."/);
  assert.match(standards, /description="A curated library of AI governance laws, standards, frameworks and technical guidance used to support VIGIL analysis\."/);
  assert.doesNotMatch(masthead, /Archive|LibraryBig|Landmark|ShieldCheck|<Visual/);
  assert.match(mastheadCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(mastheadCss, /html\[data-theme="dark"\] \.vigil-observatory-masthead/);
  assert.match(main, /vigil-observatory-masthead\.css/);
});

test("public VIGIL Observatory routes expose canonical Case Files, taxonomy, standards and harm surfaces only", async () => {
  const [app, shell, hub] = await Promise.all([read("src/App.tsx"), read("src/components/layout/Shell.tsx"), read("src/pages/vigil-knowledge-hub.tsx")]);
  for (const route of ["/observatory/cases", "/observatory/alignment-taxonomy", "/observatory/ai-governance-standards", "/observatory/harm-impact-assessment", "/knowledge-base", "/policy"]) assert.match(app, new RegExp(route.replaceAll("/", "\\/")));
  for (const retired of ["/observatory/incidents", "/observatory/about", "/observatory/severity-methodology", "/observatory/knowledge-base", "failure-modes", "observatory/lessons", "observatory/repairs", "VigilKnowledgeBase"]) assert.doesNotMatch(`${app}\n${shell}\n${hub}`, new RegExp(retired.replaceAll("/", "\\/"), "i"));
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
  for (const label of ["Incident", "Assessment", "Classification", "Compliance", "Conclusion", "References"]) assert.match(sections, new RegExp(`label: "${label}"`));
  assert.match(sections, /id: "conclusion",[\s\S]*number: "05"/);
  assert.match(sections, /id: "references",[\s\S]*number: "06"/);
  assert.doesNotMatch(sections, /label: "Learn"/);
  assert.match(report, /<CaseTaxonomyClassification raw=\{incident\.raw\}/);
  assert.match(report, /<CaseTaxonomyCompliance raw=\{incident\.raw\}/);
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
  assert.match(caseFile, /"case-compliance": "Standards adjudication summary"/);
  assert.match(css, /vigil-case-editorial-heading[\s\S]*border-top: 1px solid[\s\S]*font-family: var\(--app-font-serif\)/);
});

test("Section 02 Incident breakdown stays bounded and horizontally swipeable on mobile", async () => {
  const [assessment, css] = await Promise.all([
    read("src/components/vigil/CaseTaxonomyAssessment.tsx"),
    read("src/vigil-case-file-polish.css"),
  ]);
  assert.match(assessment, /className="vigil-external-assessment-table-wrap vigil-taxonomy-assessment-table-wrap"/);
  assert.match(assessment, /Swipe sideways to view all table columns/);
  assert.match(assessment, /aria-describedby="vigil-taxonomy-assessment-scroll-hint"/);
  assert.match(css, /\.vigil-taxonomy-assessment \{ min-width: 0; max-width: 100%; \}/);
  assert.match(css, /\.vigil-taxonomy-assessment-table-wrap \{[\s\S]*width: 100%;[\s\S]*max-width: 100%;[\s\S]*overflow-x: auto;[\s\S]*touch-action: pan-x pan-y;/);
  assert.match(css, /\.vigil-taxonomy-assessment-table \{[\s\S]*min-width: 72rem;/);
  assert.match(css, /@media \(max-width: 820px\) \{[\s\S]*\.vigil-taxonomy-assessment-scroll-hint \{[\s\S]*display: block;/);
});

test("Section 03 Classification stays a horizontally swipeable four-column table on mobile", async () => {
  const [classification, css] = await Promise.all([
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/vigil-classification-table.css"),
  ]);
  assert.match(classification, /className="vigil-classification-web-table vigil-primary-classification-table-wrap" role="region"[^>]*tabIndex=\{0\}/);
  assert.match(classification, /<table className="vigil-classification-table vigil-primary-classification-table">/);
  assert.match(css, /@media screen and \(max-width: 760px\) \{[\s\S]*?\.vigil-primary-classification-table-wrap \{[\s\S]*?overflow-x: auto;[\s\S]*?-webkit-overflow-scrolling: touch;[\s\S]*?touch-action: pan-x pan-y;/);
  assert.match(css, /\.vigil-primary-classification-table \{[\s\S]*?display: table;[\s\S]*?min-width: 72rem;/);
  assert.match(css, /\.vigil-primary-classification-table-wrap::before \{[\s\S]*?Swipe sideways to view all classification columns/);
  assert.doesNotMatch(css, /\.vigil-primary-classification-table tbody \{ display: block; \}/);
});

test("Section 04 Compliance displays only numbered inline citations with Section 06 as bibliography", async () => {
  const [compliance, wrapper, caseFile, report, css, staticSource] = await Promise.all([
    read("src/components/vigil/CaseRequirementAssessments.tsx"),
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
    read("src/vigil-classification-table.css"),
    read("scripts/prepare-github-pages.js"),
  ]);
  assert.match(compliance, /<p>\{row\.assessmentBasis\}\{row\.evidence\.length > 0/);
  assert.match(compliance, /className="vigil-compliance-inline-references"/);
  assert.match(compliance, /aria-label=\{.*Evidence reference/);
  assert.match(compliance, />\[\{source\.referenceNumber\}\]<\/a>/);
  assert.doesNotMatch(compliance, /Supporting evidence|Evidence:<\/strong>|No source-record references are linked|>\[\{source\.referenceNumber\}\] \{source\.title\}/);
  assert.match(compliance, /occurrenceRequirementRows\(raw, requirements, sourceReferenceNumbers\)/);
  assert.match(wrapper, /<CaseRequirementAssessments raw=\{raw\} sourceReferenceNumbers=\{sourceReferenceNumbers\}/);
  for (const source of [caseFile, report]) {
    assert.match(source, /<CaseTaxonomyCompliance raw=\{incident.raw\}[^>]*sourceReferenceNumbers=\{harmEvidenceReferenceNumbers\}/);
    assert.match(source, /externalSources\.flatMap\(\(source, index\) => source\.sourceRecordRefs\.map/);
    assert.match(source, /vigil-evidence-reference-/);
  }
  assert.match(staticSource, /escapeHtml\(row\.assessmentBasis\)\}\$\{row\.evidence\.map/);
  assert.doesNotMatch(css, /vigil-compliance-evidence-links/);
  assert.match(css, /\.vigil-case-file-page \.vigil-compliance-inline-references a/);
});

test("Classification presents Fidelity Classes and Compliance uses independent occurrence assessments", async () => {
  const [classification, css, taxonomyLoader] = await Promise.all([
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/vigil-classification-table.css"),
    read("src/lib/vigilFailureTaxonomy.ts"),
  ]);

  assert.match(classification, /<th scope="col">Alignment<\/th>[\s\S]*<th scope="col">Fidelity class<\/th>[\s\S]*<th scope="col">Evidence and classification basis<\/th>[\s\S]*<th scope="col">Recognition criteria<\/th>/);
  const primaryTable = classification.match(/<table className="vigil-classification-table vigil-primary-classification-table">[\s\S]*?<\/table>/)?.[0] ?? "";
  assert.doesNotMatch(primaryTable, /<th scope="col">Confidence<\/th>|<td data-label="Confidence"/);
  assert.match(primaryTable, /item.role !== "ambiguous-boundary" && <span/);
  const outcomeCell = primaryTable.match(/<td data-label="Alignment"[\s\S]*?<\/td>/)?.[0] ?? "";
  const basisCell = primaryTable.match(/<td data-label="Evidence and classification basis"[\s\S]*?<\/td>/)?.[0] ?? "";
  assert.doesNotMatch(outcomeCell, /vigil-classification-confidence-chip/);
  assert.match(basisCell, /item.role !== "ambiguous-boundary" && <span/);
  assert.ok(classification.includes('<Meta label="Confidence" value={item.role === "ambiguous-boundary" ? undefined : item.confidence} />'));
  assert.ok(classification.indexOf('className="vigil-classification-intro"') < classification.indexOf('className="vigil-classification-state-note"'));
  assert.match(css, /\.vigil-classification-state-note \{/);
  assert.match(classification, /className="vigil-classification-intro"[\s\S]*These classifications assess evidence from this occurrence against VIGIL/);
  assert.match(classification, /whole-system alignment, general model safety or regulatory compliance/);
  assert.match(classification, /"high confidence"[\s\S]*"medium confidence"[\s\S]*"low confidence"/);
  assert.match(classification, /className="vigil-classification-counts" aria-label="Mapped Fidelity Class outcomes"/);
  assert.match(classification, /const mappedClasses = tableRows\.filter\(\(\{ item \}\) => Boolean\(item\.classId\)\)/);
  assert.match(classification, /"failure-occurrence", label: "Failure occurred"/);
  assert.match(classification, /"successful-invariant", label: "Aligned"/);
  assert.match(classification, /"ambiguous-boundary", label: "Boundary unresolved"/);
  assert.match(classification, /mappedClasses\.filter\(\(\{ item \}\) => item\.role === role\)\.length/);
  assert.match(classification, /data-label="Evidence and classification basis"/);
  assert.match(classification, /\{item\.basis \?\? "The current Incident record does not contain an occurrence-specific classification basis/);
  assert.match(classification, /<th scope="col">Recognition criteria<\/th>/);
  assert.match(classification, /data-label="Recognition criteria"/);
  assert.doesNotMatch(classification, /Shared taxonomy criteria, not an assessment of this occurrence/);
  assert.match(classification, /className="vigil-classification-taxonomy-copy vigil-classification-recognition-tests"/);
  assert.doesNotMatch(classification, /<details className="vigil-classification-reference-criteria"/);
  assert.doesNotMatch(classification, /<MappingEvidence|Supporting source episodes \(/);
  assert.match(classification, /item\.role === "ambiguous-boundary"/);
  assert.match(classification, /Unresolved — see classification basis\./);
  assert.match(classification, /item\.role === "successful-invariant"/);
  assert.match(classification, /classificationClass\.success_recognition/);
  assert.match(classification, /classificationClass\.failure_recognition \?\? classificationClass\.recognition/);
  assert.doesNotMatch(classification, /<strong>Failure-side conditions<\/strong>|<strong>Success-side conditions<\/strong>/);
  assert.match(classification, /recordedTaxonomyVersion=\{parsed\.taxonomyVersion\}/);
  assert.match(classification, /currentTaxonomyVersion=\{taxonomy\.data\.index\.standard\.version\}/);
  assert.doesNotMatch(classification, /<th scope="col">Incident analysis<\/th>/);
  assert.match(classification, /Further adjudication required/);
  assert.match(classification, /This Case File has not yet been fully adjudicated\. The incident observations below still require a final taxonomy determination\./);
  assert.match(classification, /<th scope="col">Incident observation<\/th>[\s\S]*<th scope="col">Candidate boundary<\/th>[\s\S]*<th scope="col">What remains unresolved<\/th>/);
  assert.match(classification, /status !== "unresolved" && status !== "taxonomy-gap"/);
  assert.match(classification, /No current Fidelity Class/);
  assert.match(classification, /adjudication_note/);
  assert.doesNotMatch(classification, /<th scope="col">Technical definition<\/th>/);
  assert.doesNotMatch(classification, /<th scope="col">Fidelity family<\/th>/);
  assert.doesNotMatch(classification, /<th scope="col">Governing invariant<\/th>/);
  assert.doesNotMatch(classification, /<th scope="col">Exclusions<\/th>/);
  assert.doesNotMatch(classification, /<th scope="col">Recovered governance principle\(s\)<\/th>/);
  assert.match(classification, /vigil-classification-class-chip/);
  assert.match(classification, /vigil-classification-class-title/);
  assert.match(classification, /vigil-classification-class-explanation/);
  assert.match(classification, /classificationClass\?\.plain_english \?\? family\?\.plain_english/);
  assert.match(classification, /classificationClass\.success_recognition/);
  assert.doesNotMatch(classification, /const incidentAnalysis = evidence\.map\(\(entry\) => entry\.rationale\)/);

  assert.match(classification, /export function CaseTaxonomyCompliance/);
  assert.match(classification, /CaseRequirementAssessments/);
  assert.doesNotMatch(classification, /complianceContributions|rollupComplianceRequirements/);
  assert.doesNotMatch(classification, /<th scope="col">Classification basis<\/th>/);
  const complianceMarkup = classification.match(/<table className="vigil-classification-table vigil-compliance-table">[\s\S]*?<\/table>/)?.[0] ?? "";
  assert.doesNotMatch(complianceMarkup, /Incident observation/);
  assert.doesNotMatch(complianceMarkup, /Recognition criteria/);
  assert.doesNotMatch(classification, /vigil-compliance-clause/);
  assert.doesNotMatch(classification, /vigil-compliance-requirement-id/);
  assert.doesNotMatch(classification, /<span[^>]*>\{reference\.requirement_id\}<\/span>/);
  assert.doesNotMatch(classification, /recognitionCriteria:/);
  assert.doesNotMatch(classification, /vigil-compliance-reference-meta/);
  assert.doesNotMatch(classification, /\{reference\.publisher\}/);
  assert.doesNotMatch(classification, /\{reference\.date\}/);

  assert.match(taxonomyLoader, /requirement_id\?: string/);
  assert.match(taxonomyLoader, /clause_or_control\?: string/);
  assert.match(css, /\.vigil-compliance-table thead th:nth-child\(1\) \{ width: 16%; \}/);
  assert.match(css, /\.vigil-compliance-table thead th:nth-child\(2\) \{ width: 28%; \}/);
  assert.match(css, /\.vigil-compliance-table thead th:nth-child\(3\) \{ width: 16%; \}/);
  assert.match(css, /\.vigil-compliance-table thead th:nth-child\(4\) \{ width: 40%; \}/);
  assert.match(css, /\.vigil-compliance-table \{[\s\S]*min-width: 72rem;/);
  assert.match(css, /\.vigil-primary-classification-table \{[\s\S]*min-width: 80rem;[\s\S]*table-layout: fixed;/);
  assert.match(css, /\.vigil-primary-classification-table-wrap \{[\s\S]*overflow-x: auto;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.vigil-classification-web-table \{[\s\S]*overflow-x: auto;/);
  assert.match(css, /\.vigil-classification-class-chip/);
  assert.match(css, /\.vigil-classification-class-title/);
  assert.match(css, /\.vigil-classification-class-explanation/);
  assert.match(css, /\.vigil-classification-evidence-stack/);
  assert.match(css, /\.vigil-classification-taxonomy-list/);
  assert.match(css, /\.vigil-primary-classification-table thead th:nth-child\(4\) \{ width: 31%; \}/);
  assert.match(css, /\.vigil-classification-basis > \.vigil-classification-confidence-chip/);
  assert.match(css, /\.vigil-classification-intro \{/);
  assert.match(css, /\.vigil-classification-confidence-chip\.is-high/);
  assert.match(css, /\.vigil-classification-confidence-chip\.is-medium/);
  assert.match(css, /\.vigil-classification-confidence-chip\.is-low/);
  assert.match(css, /\.vigil-classification-confidence-chip\.is-high \{\s*color: hsl\(224 49% 33%\)/);
  assert.match(css, /html\[data-theme="dark"\] \.vigil-classification-confidence-chip\.is-high/);
  assert.match(css, /\.vigil-case-file-page \.vigil-classification-counts > span/);
  assert.doesNotMatch(css, /\.vigil-classification-confidence-chip\.is-high \{\s*color: hsl\(var\(--status-high\)\)/);
  assert.match(css, /scrollbar-gutter: stable;/);
  assert.match(css, /\.vigil-classification-recognition-tests/);
  assert.doesNotMatch(css, /\.vigil-classification-evidence summary|\.vigil-classification-episode-index/);
  assert.doesNotMatch(css, /\.vigil-classification-incident-analysis/);
  assert.match(css, /\.vigil-further-adjudication-table/);
  assert.match(css, /\.vigil-further-adjudication-table th:nth-child\(1\) \{ width: 38%; \}/);
  assert.match(classification, /External Alignment Classification/);
  assert.match(classification, /not VIGIL taxonomy mappings/);
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
  assert.match(taxonomy, /taxonomyAdjudicationCoverageStatus/);
  assert.match(taxonomy, /taxonomyAlignmentExemplarEligible/);
  assert.match(taxonomy, /coverage === "partial"\) return "Adjudication incomplete"/);
  assert.match(taxonomy, /hasAmbiguousBoundary\) return "Boundary unresolved"/);
  assert.doesNotMatch(taxonomy, /exemplarEligible === true\) return "Exemplar"/);
  assert.match(taxonomy, /hasFailure && !hasInvariantHeld\) return "Classified"/);
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
  assert.match(caseFile, /const isCombination = classification === "Combination"/);
  assert.match(caseFile, /<Info \/>/);
  assert.match(caseFile, /Different assessed boundaries have different outcomes/);
  assert.doesNotMatch(caseFile, /Compliance shows the external standards, regulations and guidance connected to the governance issues identified in this Case File/);
  assert.match(caseFile, /const isDisputed = classification === "Disputed"/);
  assert.match(caseFile, /VIGIL_DISPUTED_COPY/);
  assert.match(contract, /informational mixed-record affordance/);
});


test("Knowledge Base keeps the dedicated six-stage Case File method as plain document rows", async () => {
  const [hub, about, homeMenuCss, sections] = await Promise.all([
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/about.tsx"),
    read("src/home-menu-pages.css"),
    read("src/lib/vigilCaseSections.ts"),
  ]);
  assert.match(hub, /const CASE_FILE_STAGES = \[/);
  assert.match(hub, /One evidence-to-conclusion structure for every Incident/);
  assert.ok(hub.includes("Record what happened, the technology and operating conditions, participating and affected parties, geographic and governance context, and public evidence supporting the occurrence."));
  assert.match(hub, /interpret taxonomy-relevant source clauses, review external assessments where available, and separately assess real-world materialised harm through the Harm Impact Assessment using the VIGIL Harm Impact Methodology \(VIGIL-HIM\)/);
  assert.match(hub, /Map the evidence to the VIGIL Alignment Taxonomy and record whether each boundary failed, held or remains unresolved\./);
  assert.match(hub, /Assess relevant external requirements independently against the occurrence evidence/);
  assert.match(hub, /Integrate the evidence, harm assessment, taxonomy relationships and external requirement crosswalk into a bounded VIGIL interpretation\./);
  assert.match(hub, /Preserve the evidence sources, taxonomy records, methodology references and canonical Incident supporting the analysis\./);
  assert.match(hub, /CASE_FILE_STAGES\.map/);
  assert.match(hub, /<ol className="about-method-list"/);
  assert.match(hub, /about-method-number/);
  assert.doesNotMatch(about, /Case File method|ABOUT_CASE_FILE_STAGES|about-method-list/);
  assert.doesNotMatch(sections, /description:/);
  assert.match(homeMenuCss, /\.about-method-list \{/);
});

test("Knowledge Base withholds whole-Incident classification until adjudication is complete", async () => {
  const [hub, about, classification, css] = await Promise.all([
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/about.tsx"),
    read("src/components/vigil/CaseTaxonomyClassification.tsx"),
    read("src/home-menu-pages.css"),
  ]);
  assert.match(hub, /Mappings classify individual boundaries\. The Case File index summarises the Incident\./);
  assert.match(hub, /Mapping-level outcomes[\s\S]*<VigilAlignmentLegend detailed \/>/);
  assert.match(classification, /Failure occurred[\s\S]*Aligned[\s\S]*Boundary unresolved/);
  assert.match(hub, /Case File index classification/);
  assert.match(hub, /Failure evidenced[\s\S]*Invariant held[\s\S]*Adjudication incomplete[\s\S]*Mixed alignment[\s\S]*Disputed[\s\S]*Unclassified/);
  assert.match(hub, /only after adjudication coverage is complete[\s\S]*Adjudication incomplete/);
  assert.match(hub, /does not assign a whole-Incident alignment classification until adjudication coverage is complete/);
  assert.match(hub, /One or more material incident observations still require a final taxonomy determination/);
  assert.match(hub, /VIGIL_DISPUTED_COPY/);
  assert.match(hub, /CASE_FILE_INDEX_CLASSIFICATIONS\.map/);
  assert.match(css, /\.vigil-knowledge-index-classifications[\s\S]*\.vigil-knowledge-index-state \{[\s\S]*background: hsl\(var\(--primary\) \/ 0\.045\)/);
  assert.doesNotMatch(css, /\.vigil-knowledge-index-state\.is-(?:failure|exemplar|mixed|disputed|unclassified)/);
  assert.doesNotMatch(hub, /vigil-knowledge-index-state is-/);
  assert.doesNotMatch(about, /Mappings classify individual boundaries|Publication model|Traceable findings, visible judgment and clear boundaries/);
  assert.match(about, /VIGIL uses its own Incident model, VIGIL Harm Impact Methodology \(VIGIL-HIM\) and VIGIL Observatory Alignment Taxonomy/);
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
  assert.match(severity, /The highest band supported by the evidence within the selected assessment pathway/);
  assert.match(severity, /MIT AI Incident Tracker harm-severity scale/);
  assert.match(severity, /CSET AI Harm Framework/);
  assert.match(chip, /return \/\^S\[1-5\]\$\/\.test\(code\) \? code : undefined;/);
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

test("Alignment Taxonomy pages distinguish failure-linked cases from invariant-held examples", async () => {
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
  assert.match(taxonomyPage, /Invariant-held examples/);
  assert.match(taxonomyPage, /item\.invariant_exemplars/);
  assert.match(taxonomyPage, /\/observatory\/cases\/\$\{example\.incident_id\}/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-linked-cases/);
  assert.match(taxonomyCss, /\.vigil-taxonomy-invariant-exemplars/);
  assert.match(pages, /generated\/VIGIL\.FailureTaxonomy\.CaseFileExamples\.json/);
  assert.match(pages, /taxonomyCaseExamplesForClass/);
  assert.match(pages, /Invariant-held examples/);
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
  assert.match(taxonomyPage, /<SupportingEvidence item=\{item\} \/>/);
  assert.match(taxonomyPage, /Technical definition, relationships and sources/);
  assert.doesNotMatch(taxonomyPage, /showSupportingEvidence/);
  assert.ok(
    taxonomyPage.indexOf("<SupportingEvidence item={item} />") > taxonomyPage.indexOf("{item.relationships?.length ?"),
    "Supporting evidence should render after Relationships in the dedicated Class reference disclosure",
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
  assert.doesNotMatch(app, /path="\/observatory\/about"/);
  assert.match(app, /path="\/observatory\/harm-impact-assessment" component=\{VigilSeverityMethodology\}/);
  assert.doesNotMatch(app, /path="\/observatory\/severity-methodology"/);
  assert.match(pages, /join\(docsDir, "observatory", "about"\)/);
  assert.match(pages, /join\(docsDir, "observatory", "severity-methodology"\)/);
  assert.doesNotMatch(shell, /label: "About VIGIL"/);
  assert.match(shell, /Copyright & Licence/);
  assert.match(shell, /Harm Impact Assessment/);
  assert.doesNotMatch(about, /Publication model|Traceable findings, visible judgment and clear boundaries/);
  assert.doesNotMatch(about, /<p className="vigil-library-kicker">Purpose<\/p>|Severity measures supported consequence|Harm & severity/);
  assert.doesNotMatch(about, /Knowledge Base[\s\S]*How the public VIGIL surfaces fit together/);
  assert.match(licensing, /VIGIL Observatory Proprietary Licence/);
  assert.match(severity, /VIGIL-HIM \{harmMethodology.version\}/);
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
  const emphasis = await read("src/lib/vigilHarmEmphasis.mjs");
  assert.match(emphasis, /USD/);
  assert.match(emphasis, /multiple grave casualties/);
  assert.match(emphasis, /death by suicide/);
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



test("harm methodology separates Severity bands and SU from the evidence-state ledger", async () => {
  const [matrix, severity, css, menuCss] = await Promise.all([
    read("src/components/vigil/HarmImpactMatrix.tsx"),
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/vigil-incident-severity-refinement.css"),
    read("src/home-menu-pages.css"),
  ]);
  const canonical = await read("src/data/vigil-harm-methodology.json");
  assert.match(matrix, /Interpretive notes/);
  assert.match(matrix, /adaptation_note/);
  assert.match(canonical, /must be wiped and rebuilt or reconstructed from a known-clean state/);
  assert.match(canonical, /Routine precautionary reimaging, credential rotation or ordinary recovery work alone does not establish S5/);
  assert.match(canonical, /Distinguish unauthorised access or disclosure from evidenced downstream misuse/);
  assert.match(canonical, /Direct realised loss may include theft, compensation, incident-specific replacement or restoration/);
  assert.match(canonical, /Measure downtime until regular activity is restored to the pre-incident service level/);
  assert.match(canonical, /Distinguish public exposure from reputational or dignitary injury/);
  const methodSection = severity.match(/<section id="method"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(methodSection, /Evidence states[\s\S]*Assessed[\s\S]*Unreported[\s\S]*Insufficient evidence[\s\S]*Not applicable/);
  assert.doesNotMatch(methodSection, /<dt>SU — Unassessed<\/dt>/);
  // SU belongs alongside the public S1–S5 Severity key, not inside the
  // evidence-state table or the old Overall severity column.
  const severitySection = severity.match(/<section id="severity"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(severitySection, /<h2 id="harm-severity-heading">Severity<\/h2>/);
  assert.match(severitySection, /HARM_PUBLIC_SEVERITY_LEVELS\.map/);
  assert.match(severitySection, /<VigilStatusChip value="SU"/);
  assert.match(severitySection, /not a sixth severity band/);
  assert.match(severitySection, /not added or averaged/);
  assert.doesNotMatch(methodSection, /SU — Unassessed|<h3>Overall severity<\/h3>/);
  assert.doesNotMatch(methodSection, /Severity display|Individual Case Files do not repeat this entire reference matrix/);
  assert.doesNotMatch(methodSection, /vigil-severity-case-file-note/);
  assert.doesNotMatch(severity, /<section id="case-files"|The Incident view shows only the assessment that was actually made/);
  assert.match(css, /\.vigil-harm-interpretive-notes[\s\S]*border-top: 1px solid/);
  assert.match(menuCss, /\.vigil-severity-band-list \{[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(menuCss, /\.vigil-severity-unassessed \{/);
  assert.match(menuCss, /\.vigil-harm-pathway-comparison \{/);
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
  assert.match(hub, /const CASE_FILE_STAGES = \[[\s\S]*number: "01"[\s\S]*label: "Incident"[\s\S]*number: "02"[\s\S]*label: "Assessment"[\s\S]*number: "03"[\s\S]*label: "Classification"[\s\S]*number: "04"[\s\S]*label: "Compliance"[\s\S]*number: "05"[\s\S]*label: "Conclusion"[\s\S]*number: "06"[\s\S]*label: "References"/);
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

test("severity methodology exposes the registered source trail after the derivation method", async () => {
  const severity = await read("src/pages/vigil-severity-methodology.tsx");
  const references = await read("src/data/vigil-harm-references.json");
  assert.match(severity, /Methodology source trail/);
  assert.match(references, /VIGIL-REF-000001/);
  assert.match(references, /VIGIL-REF-000011/);
  assert.match(references, /AI Incident Tracker: Harm Taxonomy/);
  assert.match(references, /Prioritization of Risks from Artificial Intelligence/);
  assert.ok(severity.indexOf('id="severity-principles-heading"') < severity.indexOf('id="severity-references-heading"'));
  assert.doesNotMatch(severity, /href: "#case-files"/);
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
  assert.match(shell, /href: "\/knowledge-base\/", label: "Knowledge Base"/);
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
  assert.match(datasets, /VIGIL\.HarmImpactMatrix\.v1\.1\.0\.json/);
  assert.match(datasets, /12 harm dimensions/);
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


test("Case File search and classification share desktop row; donut alone controls severity", async () => {
  const [cases, dashboard, css, workspace] = await Promise.all([
    read("src/pages/vigil-cases.tsx"),
    read("src/components/vigil/VigilCasesDashboard.tsx"),
    read("src/vigil-ux-v4.css"),
    read("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  assert.match(cases, /<span>Classification<\/span>/);
  assert.doesNotMatch(cases, /<span>Severity<\/span>|All severities/);
  assert.match(cases, /severityCode\(record\) !== severity/);
  assert.match(cases, /setSeverity\(""\)/);
  assert.match(cases, /onSeverity=\{setSeverity\}/);
  assert.match(dashboard, /<SeverityDonut records=\{distributionRecords\} selected=\{severity\} onSelect=\{onSeverity\}/);
  assert.match(css, /\.vigil-case-table-search \{[\s\S]*grid-template-columns: minmax\(320px, 1fr\) minmax\(220px, 300px\) minmax\(190px, 260px\)/);
  assert.match(workspace, /\.vigil-dashboard-filter-hub \.vigil-case-table-search \{\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(workspace, /@media \(max-width: 820px\) \{\s*\.vigil-case-library-page \.vigil-dashboard-filter-hub \.vigil-case-table-search \{\s*grid-template-columns: minmax\(0, 1fr\)/);
});

test("Case File stage and subsection headings share one editorial scale", async () => {
  const [caseFile, instrumentCss, taxonomyAssessment] = await Promise.all([
    read("src/pages/vigil-case-file.tsx"),
    read("src/vigil-observatory-instrument-experiment.css"),
    read("src/components/vigil/CaseTaxonomyAssessment.tsx"),
  ]);
  assert.match(instrumentCss, /vigil-case-editorial-heading h2[\s\S]*font-size: clamp\(1\.7rem, 2\.8vw, 2\.45rem\)[\s\S]*font-weight: 540[\s\S]*line-height: 1\.08/);
  assert.match(instrumentCss, /vigil-case-editorial-subheading[\s\S]*font-size: clamp\(1\.7rem, 2\.8vw, 2\.45rem\)[\s\S]*font-weight: 540[\s\S]*line-height: 1\.08/);
  assert.match(taxonomyAssessment, />Incident breakdown<\/h3>/);
  assert.doesNotMatch(taxonomyAssessment, /VIGIL OBSERVATORY TAXONOMY ASSESSMENT/);
  assert.doesNotMatch(taxonomyAssessment, /<th scope="col">Fidelity class<\/th>/);
  assert.doesNotMatch(taxonomyAssessment, /<th scope="col">Relationship<\/th>/);
  assert.doesNotMatch(taxonomyAssessment, /<th scope="col">Mapping state<\/th>/);
  assert.match(taxonomyAssessment, /vigil-taxonomy-assessment-stack/);
  assert.match(caseFile, />Harm Impact Assessment<\/h3>/);
  assert.match(caseFile, />External assessments<\/h3>/);
  assert.doesNotMatch(caseFile, /VIGIL OBSERVATORY REAL-WORLD HARM ASSESSMENT/);
});

test("All Case File evidence links use compact Section 02 style [n] notation", async () => {
  const [component, style, rule, harm] = await Promise.all([
    read("src/components/vigil/IncidentContextSection.tsx"),
    read("src/vigil-case-file-dossier.css"),
    read("docs-internal/VIGIL-CASE-FILE-REFERENCE-FORMATTING.md"),
    read("src/components/vigil/HarmImpactMatrix.tsx"),
  ]);
  assert.match(component, /function SourceCitations\(/);
  assert.match(component, /#vigil-evidence-reference-/);
  assert.doesNotMatch(component, /Source \[|<span>Evidence<\/span>|function SourceLinks\(/);
  assert.match(style, /\.vigil-case-file-page \.vigil-context-citations \{/);
  assert.match(harm, /vigil-harm-inline-references/);
  assert.match(rule, /Place the citation immediately after/);
  assert.match(rule, /Deduplicate identical bibliography references/);
});

test("Case File Stage 01 groups Incident Context, preserves evidence and aligns printable report", async () => {
  const [narrativeCss, dossierCss, context, web, report] = await Promise.all([
    read("src/vigil-case-file-narrative-cards.css"),
    read("src/vigil-case-file-dossier.css"),
    read("src/components/vigil/IncidentContextSection.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
  ]);
  assert.ok(narrativeCss.includes(".vigil-observation-summary > p"));
  assert.ok(dossierCss.includes(".vigil-case-file-page .vigil-incident-context"));
  const headings = [
    "Systems & Technology",
    "Operational Environment",
    "Affected Parties & Institutions",
    "Geographic & Jurisdictional Context",
    "Regulatory Context",
  ];
  const positions = headings.map(title => context.indexOf(`title="${title}"`));
  assert.ok(positions.every(pos => pos >= 0), "all five approved subsections must render");
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), "subsections keep approved reading order");
  assert.ok(web.includes("<IncidentContextSection raw={incident.raw}"), "opened Case File uses shared component");
  assert.ok(report.includes("<IncidentContextSection raw={incident.raw}"), "print/PDF route uses same component");
  assert.ok(!web.includes('<section className="vigil-affected-systems"'));
  assert.ok(!report.includes('<section className="report-affected-systems"'));
  assert.ok(context.includes("source_records"), "citations are derived from canonical source records");
  assert.ok(context.includes("#vigil-evidence-reference-"), "source references link to bibliography");
  assert.ok(context.includes("hasStructuredGeography"), "legacy geography differs from reviewed geography");
  assert.ok(context.includes("Legacy jurisdiction descriptions must not be treated as verified occurrence locations."), "legacy caveat persists in Section 06 limitations");
  assert.ok(context.includes("export function IncidentContextLimitations"), "the limitation block has a separate renderer");
  assert.ok(web.includes("<IncidentContextLimitations raw={incident.raw}"), "interactive Section 06 receives the context limits");
  assert.ok(report.includes("<IncidentContextLimitations raw={incident.raw}"), "print Section 06 receives the same limits");
  assert.ok(!context.includes("vigil-context-group-number"), "subsections are unnumbered");
  assert.ok(!context.includes("Occurrence metadata"), "the metadata kicker has been removed");
  assert.ok(context.includes("A jurisdictional association does not establish"), "regulatory topics are not findings");
  assert.ok(context.includes("knownParties"), "parties are resolved by canonical identifiers");
  assert.ok(dossierCss.includes("@media (max-width: 700px)"), "mobile layout is explicit");
  assert.ok(dossierCss.includes("@media print"), "print layout retains the evidence groups");
});

test("Case File ticket keeps severity and classification in Incident context and restores Full report", async () => {
  const [caseFile, instrument] = await Promise.all([
    read("src/pages/vigil-case-file.tsx"),
    read("src/vigil-observatory-instrument-experiment.css"),
  ]);
  assert.match(caseFile, /<VigilObservatoryMasthead[\s\S]*contextLabel="Incident context"[\s\S]*artworkSrc=\{VIGIL_MASTHEAD_ARTWORK\.incidentRecord\}/);
  assert.match(caseFile, /label: "Jurisdiction"/);
  assert.match(caseFile, /label: "Deployment"[\s\S]*label: "Activity"[\s\S]*label: "External reach"/);
  assert.match(caseFile, /label: "Environment"/);
  assert.match(caseFile, /\.\.\.environmentMetadata[\s\S]*label: "Severity"[\s\S]*label: "Classification"/);
  assert.doesNotMatch(caseFile, /vigil-case-ticket-footer|vigil-case-ticket-footer-meta|vigil-case-ticket-report-button/);
  assert.match(caseFile, /vigil-case-report-tab[\s\S]*Full report \/ PDF/);
  assert.match(instrument, /\.vigil-case-file-page \.vigil-case-stage-tabs \{[\s\S]*grid-template-columns: 1fr !important/);
  assert.match(instrument, /\.vigil-case-file-page \.vigil-case-report-tab \{[\s\S]*font-family: var\(--app-font-mono\)/);
});

test("principal Observatory analytical surfaces use the shared masthead component", async () => {
  const [severity, standards, standardSource, policy, caseFile, datasets] = await Promise.all([
    read("src/pages/vigil-severity-methodology.tsx"),
    read("src/pages/vigil-standards-baseline.tsx"),
    read("src/pages/vigil-standard-source.tsx"),
    read("src/pages/policy.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/datasets.tsx"),
  ]);
  for (const page of [severity, standards, standardSource, policy, caseFile, datasets]) {
    assert.match(page, /VigilObservatoryMasthead/);
    assert.doesNotMatch(page, /vigil-taxonomy-ticket|vigil-case-file-hero-v4/);
  }
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


test("Knowledge Base owns VIGIL method, classification and CAELESTIS architecture explanations", async () => {
  const [hub, about, homeMenuCss] = await Promise.all([
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/about.tsx"),
    read("src/home-menu-pages.css"),
  ]);
  const methodStart = hub.indexOf("One evidence-to-conclusion structure for every Incident");
  const harmSeparation = hub.indexOf("The Harm Impact Assessment describes materialised consequence and severity");
  const stageList = hub.indexOf("about-method-list");
  const classificationStart = hub.indexOf("Mappings classify individual boundaries. The Case File index summarises the Incident.");
  const architectureStart = hub.indexOf("CAELESTIS Architecture Model (CAM) is a publicly inspectable governance corpus");
  assert.ok(methodStart >= 0 && harmSeparation > methodStart && stageList > harmSeparation);
  assert.ok(classificationStart > stageList && architectureStart > classificationStart);
  assert.match(hub, /VIGIL-HIM[\s\S]*VIGIL Alignment Taxonomy[\s\S]*Compliance[\s\S]*Conclusion[\s\S]*References/);
  assert.match(hub, /Failure evidenced[\s\S]*Invariant held[\s\S]*Mixed alignment[\s\S]*Disputed[\s\S]*Unclassified/);
  assert.match(hub, /CAELESTIS Architecture Model \(CAM\) is a publicly inspectable governance corpus/);
  assert.match(hub, /VIGIL Observatory Alignment Taxonomy uses the CAELESTIS Architecture Model as a source for taxonomy development and evaluation/);
  assert.match(hub, /does not create or amend CAELESTIS doctrine/);
  assert.doesNotMatch(hub, /caelestis-project\.eu/);
  assert.match(about, /CAELESTIS Architecture Model are not affiliated with the separate Caelestis project/);
  assert.match(about, /https:\/\/caelestis-project\.eu\//);
  assert.match(hub, /Open archived release[\s\S]*CAELESTIS repository/);
  assert.doesNotMatch(about, /One evidence-to-conclusion structure for every Incident|Mappings classify individual boundaries|CAELESTIS Architecture Model \(CAM\) is a publicly inspectable governance corpus|Publication model/);

  const aboutStart = about.indexOf("<h1>About CAM Initiative</h1>");
  const vigilStart = about.indexOf('id="vigil-observatory-heading"');
  const connectStart = about.indexOf('id="connect-heading"');
  assert.ok(aboutStart >= 0 && vigilStart > aboutStart && connectStart > vigilStart);
  assert.match(homeMenuCss, /\.about-method-list \{/);
  assert.match(homeMenuCss, /\.vigil-knowledge-index-classifications/);
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
  assert.match(about, /label: "Connect"/);
  assert.doesNotMatch(about, /label: "Case File method"|label: "Alignment Taxonomy"|label: "Publication model"|label: "CAELESTIS Architecture Model"/);
  assert.match(hub, /label: "Case File method"/);
  assert.match(hub, /label: "Classification"/);

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
  assert.match(menuCss, /vigil-severity-methodology-page \.vigil-severity-principles \{[\s\S]*display: block[\s\S]*border: 0/);
  assert.match(menuCss, /vigil-severity-methodology-page \.vigil-severity-principles > div[\s\S]*display: block[\s\S]*border: 0/);
  assert.doesNotMatch(severity, /<h3>Severity display<\/h3>|vigil-severity-chip-key|Individual Case Files do not repeat this entire reference matrix/);
  assert.match(menuCss, /vigil-severity-methodology-page \.vigil-severity-method-copy \{[\s\S]*display: grid[\s\S]*gap: 0\.72rem/);
  assert.match(menuCss, /vigil-severity-methodology-page \.vigil-severity-chip-key \{[\s\S]*display: flex[\s\S]*margin: 0;[\s\S]*padding: 0;/);
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
  assert.match(about, /CAELESTIS Architecture Model are not affiliated with the separate Caelestis project/);
  assert.match(about, /https:\/\/caelestis-project\.eu\//);
});

test("About citation uses a single Suggested general citation heading", async () => {
  const about = await read("src/pages/about.tsx");
  assert.match(about, /<h2 id="vigil-citation-heading">Suggested general citation<\/h2>/);
  assert.equal((about.match(/Suggested general citation/g) || []).length, 1);
  assert.doesNotMatch(about, /Cite the work while preserving the relevant record or version/);
});

test("About omits the retired Publication model mechanics", async () => {
  const about = await read("src/pages/about.tsx");
  assert.doesNotMatch(about, /Publication model|Published by <strong>CAM Initiative<\/strong>, a VIGIL Observatory Case File|Traceable findings, visible judgment and clear boundaries/);
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


test("Case File stage navigation has one workbench owner and preserves wrapped mobile tabs", async () => {
  const [instrument, dossier, evidence, mobile, polish, harm] = await Promise.all([
    read("src/vigil-observatory-instrument-experiment.css"),
    read("src/vigil-case-file-dossier.css"),
    read("src/vigil-evidence-reading-hierarchy.css"),
    read("src/mobile-responsive-polish.css"),
    read("src/vigil-case-file-polish.css"),
    read("src/vigil-harm-assessment-cleanup.css"),
  ]);

  assert.match(instrument, /\.vigil-case-file-page \.vigil-case-stage-tabs \{[\s\S]*grid-template-columns: 1fr !important/);
  assert.match(instrument, /@media \(max-width: 900px\)[\s\S]*\.vigil-case-stage-tabs \{[\s\S]*display: grid !important[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important[\s\S]*overflow: visible !important/);
  assert.match(instrument, /@media \(max-width: 640px\)[\s\S]*\.vigil-case-stage-tabs \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/);
  assert.match(instrument, /\.vigil-case-file-page \.vigil-case-report-tab \{[\s\S]*grid-column: 1 \/ -1;[\s\S]*border-radius: 0\.6rem !important/);
  assert.doesNotMatch(instrument, /@media \(max-width: 900px\)[\s\S]*\.vigil-case-stage-tabs \{[\s\S]*overflow-x: auto !important/);
  assert.doesNotMatch(dossier, /\.vigil-case-stage-tabs/);
  assert.doesNotMatch(dossier, /\.vigil-case-report-tab/);
  assert.doesNotMatch(dossier, /\.vigil-case-active-stage/);
  assert.doesNotMatch(evidence, /\.vigil-case-stage-tabs/);
  assert.doesNotMatch(evidence, /\.vigil-case-active-stage/);
  assert.doesNotMatch(mobile, /\.vigil-case-file-page/);

  assert.equal((polish.match(/\.vigil-case-file-page \.vigil-exemplar-callout-copy > p:not\([\s\S]*?\{/g) || []).length, 1);
  assert.match(polish, /vigil-exemplar-callout-copy > p:not[\s\S]*font-size: 1rem;[\s\S]*line-height: 1\.62;/);
  assert.match(polish, /\.vigil-case-file-page \.vigil-exemplar-callout-boundary \{[\s\S]*font-size: 1rem;[\s\S]*line-height: 1\.58;/);

  assert.match(harm, /@media \(max-width: 760px\)[\s\S]*\.vigil-harm-assessment-table,[\s\S]*display: block !important/);
  assert.match(harm, /\.vigil-case-file-page \.vigil-harm-assessment-table tbody tr \{[\s\S]*border-radius: 0\.68rem/);
});

test("Knowledge Base introduces Harm Impact Assessment plainly and distinguishes disputed facts from differing assessments", async () => {
  const [hub, caseFile, report] = await Promise.all([
    read("src/pages/vigil-knowledge-hub.tsx"),
    read("src/pages/vigil-case-file.tsx"),
    read("src/pages/evidence-chain-report-deterministic.tsx"),
  ]);
  assert.match(hub, /Assessment<\/strong> contains the incident breakdown, external assessments and the <strong>Harm Impact Assessment<\/strong>/);
  assert.match(hub, /VIGIL Harm Impact Methodology \(VIGIL-HIM\)/);
  assert.match(hub, /reviews twelve harm dimensions/);
  assert.match(hub, /Harm Impact Assessment describes materialised consequence and severity/);
  assert.match(hub, /VIGIL_DISPUTED_COPY/);
  assert.match(caseFile, /VIGIL_DISPUTED_COPY/);
  assert.match(report, /VIGIL_DISPUTED_COPY/);
  assert.doesNotMatch(hub, /classify materialised harm/);
});


test("Compliance surfaces alignment results, normative force and internal evidence references", async () => {
  const [component, rows, repairCss] = await Promise.all([
    read("src/components/vigil/CaseRequirementAssessments.tsx"),
    read("src/lib/vigilOccurrenceRequirements.mjs"),
    read("src/vigil-repair-invariant-icon.css"),
  ]);

  assert.match(component, /<th scope="col">Assessment result<\/th>[\s\S]*<th scope="col">External requirement<\/th>[\s\S]*<th scope="col">Evidence and assessment basis<\/th>/);
  assert.match(component, /<th scope="col">Normative force<\/th>/);
  assert.match(component, /row\.resultLabel/);
  assert.match(component, /row\.assessmentBasis/);
  assert.match(component, /row\.assessedOn/);
  assert.doesNotMatch(component, /applicabilityStatus|findingBasis|SecondaryAssessmentGroup/);
  assert.match(rows, /Boundary means a relevant requirement/);
  assert.match(rows, /\/observatory\/ai-governance-standards\//);
  assert.match(rows, /#vigil-evidence-reference-/);
  assert.doesNotMatch(rows, /authoritative_locator/);
  assert.doesNotMatch(repairCss, /content: "Assessment Result"/);
});


test("Case File challenge uses the existing Turnstile widget and previews fields without enabling unauthorised submissions", async () => {
  const [caseFile, component, worker] = await Promise.all([
    read("src/pages/vigil-case-file.tsx"),
    read("src/components/vigil/CaseFileChallenge.tsx"),
    read("infra/vigil-challenge-worker/index.mjs"),
  ]);
  assert.match(caseFile, /Full report \/ PDF<\/Link>\s*<CaseFileChallenge caseId=\{reportId\}/);
  assert.match(component, /"0x4AAAAAAFSNuGaY4lVBa0hY"/);
  assert.match(component, /action: "case_file_challenge"/);
  assert.match(component, /const ENABLED = [^\n]*ENDPOINT[^\n]*SITE_KEY/);
  assert.doesNotMatch(component, /Form preview — submissions disabled|Submission unavailable in preview/);
  assert.match(component, /\{sending \? "Recording challenge…" : "Submit for review"\}/);
  assert.match(component, /const CAN_SUBMIT = ENABLED && typeof window !== "undefined"/);
  assert.doesNotMatch(component, /aria-hidden="true">\*<\/span>/);
  assert.match(component, /<legend>What needs review\?<\/legend>/);
  assert.match(component, /disabled=\{!CAN_SUBMIT \|\| sending \|\| !token \|\| !consent\}/);
  assert.match(worker, /answer\.success === true && answer\.hostname === expectedHostname && answer\.action === "case_file_challenge"/);
  assert.match(worker, /\.private !== true/);
});

test("privacy source of truth feeds both React and crawlable HTML", async () => {
  const [privacyComponent, publicationScript, policyJson] = await Promise.all([
    read("src/pages/privacy.tsx"),
    read("scripts/prepare-github-pages.js"),
    read("src/lib/privacyPolicy.json"),
  ]);
  const policy = JSON.parse(policyJson);
  assert.match(policy.lastUpdated, /^[0-9]{1,2} [A-Z][a-z]+ 20[0-9]{2}$/);
  for (const id of ["case-file-form-data", "case-file-processing", "case-file-review-retention", "advertising-and-editorial-independence"]) {
    assert.ok(policy.sections.some(section => section.id === id));
  }
  assert.match(privacyComponent, /import privacyPolicy from "@\/lib\/privacyPolicy\.json"/);
  assert.match(publicationScript, /data-static-crawl-fallback="privacy"/);
  assert.match(publicationScript, /privacyPolicy\.sections\.map\(section =>/);
  assert.match(publicationScript, /privacyPolicy\.lastUpdated/);
});


test("taxonomy textbook distinguishes case-study examples from governing class text", async () => {
  const [taxonomy, css] = await Promise.all([
    read("src/pages/vigil-failure-taxonomy.tsx"),
    read("src/vigil-observatory-instrument-experiment.css"),
  ]);

  // Both kinds of case study have the same explicit editorial identity.
  assert.match(taxonomy, /vigil-taxonomy-case-study-kicker">Case study · Failure evidenced/);
  assert.match(taxonomy, /vigil-taxonomy-case-study-kicker">Case study · Invariant held/);
  assert.match(taxonomy, /Case studies show this invariant holding in an observed occurrence/);
  assert.match(taxonomy, /They illustrate the class; they do not add recognition conditions/);

  // The later workbench stylesheet must not flatten exemplar cards into
  // ordinary taxonomy prose; its specific rules restore the shared card.
  assert.match(css, /\.vigil-taxonomy-manual-page \.vigil-taxonomy-linked-cases li,\s*\.vigil-taxonomy-manual-page \.vigil-taxonomy-invariant-exemplars li \{[\s\S]*?border-radius: 0\.62rem/);
  assert.match(css, /\.vigil-taxonomy-manual-page \.vigil-taxonomy-invariant-exemplars li \{[\s\S]*?background: hsl\(var\(--status-success-surface\) \/ 0\.7\)/);
  assert.match(css, /\.vigil-taxonomy-manual-page \.vigil-taxonomy-invariant-exemplars \.vigil-taxonomy-case-study-kicker/);
});


test("shared disputed assessment copy distinguishes evidence conflicts, assessment differences and gaps", async () => {
  assert.match(VIGIL_DISPUTED_COPY.explanation, /conflicting accounts/);
  assert.match(VIGIL_DISPUTED_COPY.explanation, /differing assessments/);
  assert.match(VIGIL_DISPUTED_COPY.explanation, /does not require litigation/);
  assert.match(VIGIL_DISPUTED_COPY.boundary, /without disputing that the reported event occurred/);
  assert.match(VIGIL_DISPUTED_COPY.qualification, /Missing information alone does not make a record Disputed/);
  for (const path of ["src/pages/vigil-case-file.tsx", "src/pages/evidence-chain-report-deterministic.tsx"]) {
    const source = await read(path);
    for (const field of ["heading", "explanation", "boundary", "qualification"]) assert.ok(source.includes(`VIGIL_DISPUTED_COPY.${field}`), `${path}: ${field}`);
  }
  const pages = await read("scripts/prepare-github-pages.js");
  assert.match(pages, /publicAlignmentOutcome\(record\) === "Disputed" \? disputedAssessmentHtml/);
  assert.match(pages, /<h1>Knowledge Base<\/h1>[\s\S]*?disputedAssessmentHtml/);
});

test("static source clauses retain quotations, context, rationale order and escaping", async () => {
  const pages = await read("scripts/prepare-github-pages.js");
  const start = pages.indexOf("function assessmentProseHtml(value) {");
  const end = pages.indexOf("\nfor (const record of incidentRecords)", start);
  assert.ok(start >= 0 && end > start);
  const render = runInNewContext(pages.slice(start, end) + "\nclauseAssessmentsHtml", {
    assessmentParagraphs,
    assessmentBlocks,
    clauseAssessmentRows,
    escapeHtml: value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
  });
  const html = render({ vigil_assessment: { source_clause_analysis: { clauses: [
    { source_anchor: "Original <instruction>", source_paraphrase: "Task context & attribution", taxonomy_relationships: [{ rationale: "First analysis" }, { rationale: "Second analysis" }] },
    { source_paraphrase: "Later response", taxonomy_relationships: [] },
  ] } } });
  const texts = ["Original &lt;instruction&gt;", "Task context &amp; attribution", "First analysis", "Second analysis", "Later response"];
  for (const text of texts) assert.ok(html.includes(text), text);
  for (let i = 1; i < texts.length; i++) assert.ok(html.indexOf(texts[i - 1]) < html.indexOf(texts[i]));
  assert.doesNotMatch(html, /<instruction>/);
});


test("assessment reading paragraphs preserve sentences, source order and explicit paragraph breaks", () => {
  const text = 'Dr. Smith recorded 3.5 units. The source states “Keep the limit.” A later response followed. The outcome remains bounded.\n\nA separate paragraph remains separate.';
  const paragraphs = assessmentParagraphs(text);
  assert.ok(paragraphs.length >= 3);
  assert.equal(paragraphs.map(value => value.trim()).join(" ").replace(/\s+/g, " "), text.replace(/\s+/g, " "));
  assert.ok(paragraphs.some(value => value.includes("Dr. Smith recorded 3.5 units.")));
  assert.equal(paragraphs.at(-1), "A separate paragraph remains separate.");
  assert.deepEqual(assessmentParagraphs(undefined), []);
});


test("statement projection preserves event context and every distinct ordered analysis", () => {
  const relationships = [{canonical_taxonomy_mapping:true,rationale:"Identity analysis"},{canonical_taxonomy_mapping:true,rationale:"Choice analysis"}];
  const analysis = {pre_compaction_context:{source_paraphrase:"Unknown earlier frame",rationale:"Context limits"},clauses:[{episode_id:"E001",source_anchor:"Complete passage",source_paraphrase:"One handoff",taxonomy_relationships:relationships,statement_analysis:[{statement_id:"S001",title:"Identity",source_anchor:"Identity wording",taxonomy_relationship_indices:[0]},{statement_id:"S002",title:"Choice",source_anchor:"Choice wording",taxonomy_relationship_indices:[1]}]}]};
  const rows = clauseAssessmentRows(analysis);
  assert.equal(rows.length,4);
  assert.equal(rows[0].source_paraphrase,"Unknown earlier frame");
  assert.equal(rows[1].complete_source_anchor,"Complete passage");
  assert.equal(rows[2].taxonomy_relationships[0].rationale,"Identity analysis");
  assert.equal(rows[3].taxonomy_relationships[0].rationale,"Choice analysis");
  assert.equal(analysis.clauses.length,1);
  assert.equal(analysis.clauses[0].episode_id,"E001");
  const unresolved = structuredClone(analysis);
  unresolved.clauses[0].adjudication_status = "unresolved";
  unresolved.clauses[0].taxonomy_relationships[1] = {canonical_taxonomy_mapping:false,relationship:"candidate boundary",rationale:"Missing receiving-side evidence"};
  assert.equal(clauseAssessmentRows(unresolved)[3].adjudication_status,"unresolved","statement expansion retains the unresolved candidate disposition");
  const malformed = structuredClone(analysis);
  malformed.clauses[0].statement_analysis[1].taxonomy_relationship_indices=[0];
  assert.equal(clauseAssessmentRows(malformed)[1],malformed.clauses[0],"invalid bindings retain the whole source episode instead of hiding analysis");
});


test("integrated conclusion and significance use the same reading paragraphs in web, print and static output", async () => {
  for (const path of ["src/pages/vigil-case-file.tsx", "src/pages/evidence-chain-report-deterministic.tsx"]) {
    const source = await read(path);
    assert.match(source, /assessmentParagraphs\(governanceConclusion\)/);
    assert.match(source, /assessmentSections\(governanceSignificance \?\?/);
  }
  const pages = await read("scripts/prepare-github-pages.js");
  assert.match(pages, /assessmentProseHtml\(canonical\.vigil_assessment\?\.governance_interpretation/);
  assert.match(pages, /conclusionSignificanceHtml\(canonical\.vigil_assessment\?\.significance_to_cam/);
  assert.doesNotMatch(pages, /<p>\$\{escapeHtml\(canonical\.vigil_assessment\?\.governance_interpretation/);
});


test("occurrence summaries use reading paragraphs and boundary notices retain the shared callout structure", async () => {
  for (const path of ["src/pages/vigil-case-file.tsx", "src/pages/evidence-chain-report-deterministic.tsx"]) {
    const source = await read(path);
    assert.match(source, /assessmentParagraphs\(incident\?\.summary \?\? incident\?\.publicDisplay.finding\)/);
    assert.doesNotMatch(source, /<p>\{incident\?\.summary \?\? incident\?\.publicDisplay.finding\}<\/p>/);
  }
  const pages = await read("scripts/prepare-github-pages.js");
  assert.match(pages, /assessmentProseHtml\(summary\)/);
  const source = await read("src/pages/vigil-case-file.tsx");
  const boundary = source.match(/\{isBoundaryUnresolved && <section[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(boundary, /vigil-exemplar-callout-icon[\s\S]*?<Info \/>/);
  assert.match(boundary, /vigil-exemplar-callout-copy/);
  assert.match(boundary, /aria-labelledby="vigil-boundary-heading"/);
});


test("artefact media selection rejects text and Markdown, including misleading image MIME declarations", async () => {
  const { incidentArtefactMediaKind: kind } = await import("../src/lib/vigilArtefactMedia.mjs");
  assert.equal(kind("https://example.org/note.md", "text/markdown"), undefined);
  assert.equal(kind("https://example.org/note.md", "image/png"), undefined);
  assert.equal(kind("https://example.org/note.txt"), undefined);
  assert.equal(kind("https://example.org/source.png", "image/png"), "image");
  assert.equal(kind("https://example.org/source.PNG?raw=1#page"), "image");
  assert.equal(kind("https://example.org/source.png", "text/markdown"), undefined);
  assert.equal(kind("https://example.org/capture.pdf", "application/pdf"), "document");
  assert.equal(kind("https://example.org/capture.pdf", "image/png"), undefined);
  assert.equal(kind("https://example.org/recording.mp4", "video/mp4"), "video");
  assert.equal(kind("javascript:source.png"), undefined);
});

test("web, print and static publication use the same artefact media selection", async () => {
  for (const path of ["src/pages/vigil-case-file.tsx", "src/pages/evidence-chain-report-deterministic.tsx", "scripts/prepare-github-pages.js"]) {
    const source = await read(path);
    assert.match(source, /incidentArtefactMediaKind/);
    assert.match(source, /Open preserved document \(PDF\)/);
  }
  for (const path of ["src/pages/vigil-case-file.tsx", "src/pages/evidence-chain-report-deterministic.tsx"]) {
    assert.match(await read(path), /artefact.mediaKind === "image"/);
  }
});


test("INC-129-style Discussion is a sibling Section 05 subsection with source-preserving web, PDF and static output", async () => {
  const heading = "Discussion — AI-generated normative convergence (unverified hypothesis)";
  const prose = "Initial governance significance. The evidentiary limit remains.\n\n" + heading + "\n\nAn unverified hypothesis follows. A matched experiment would be required. This is not a demonstrated causal account.";
  const blocks = assessmentBlocks(prose);
  assert.equal(blocks.filter(block => block.kind === "heading").length, 1);
  const parts = assessmentSections(prose);
  assert.deepEqual(parts.map(part => part.kind), ["significance", "discussion"]);
  assert.deepEqual(parts.map(part => part.heading), ["Governance significance", heading]);
  assert.equal(parts.flatMap(part => part.paragraphs).join(" ").includes("not a demonstrated causal account"), true);
  assert.equal([parts[0].paragraphs.join(" "), parts[1].heading, parts[1].paragraphs.join(" ")].join(" ").replace(/\s+/g, " "), prose.replace(/\s+/g, " "));
  assert.deepEqual(assessmentSections("No separately headed Discussion." ).map(part => part.kind), ["significance"]);
  assert.deepEqual(assessmentSections("Discussion — Example: this is ordinary prose.").map(part => part.kind), ["significance"]);
  assert.deepEqual(assessmentSections("The source said: Discussion — Example.").map(part => part.kind), ["significance"]);
  assert.deepEqual(assessmentSections(undefined), []);
  const pages = await read("scripts/prepare-github-pages.js");
  const start = pages.indexOf("function assessmentProseHtml(value) {");
  const end = pages.indexOf("\nfunction clauseAssessmentsHtml", start);
  assert.ok(start >= 0 && end > start);
  const render = runInNewContext(pages.slice(start, end) + "\nconclusionSignificanceHtml", {
    assessmentBlocks, assessmentSections,
    escapeHtml: value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
  });
  const html = render(prose);
  assert.ok(html.includes('<section class="vigil-conclusion-subsection is-significance">'));
  assert.ok(html.includes(`<section class="vigil-conclusion-subsection is-discussion"><h3 class="vigil-discussion-heading">${heading}</h3>`));
  assert.ok(html.indexOf("Initial governance significance.") < html.indexOf(heading));
  assert.ok(html.indexOf(heading) < html.indexOf("An unverified hypothesis follows."));
  assert.ok(render("Discussion — <script>\n\nBody.").includes("&lt;script&gt;"));
  for (const path of ["src/pages/vigil-case-file.tsx", "src/pages/evidence-chain-report-deterministic.tsx"]) {
    const renderer = await read(path);
    assert.match(renderer, /assessmentSections\(governanceSignificance \?\?/);
    assert.match(renderer, /<section className=\{\`vigil-conclusion-subsection is-\$\{part.kind\}\`\}/);
    assert.match(renderer, /<h3 className=[\s\S]*\{part.heading\}<\/h3>/);
    assert.doesNotMatch(renderer, /block.kind === "heading" \? <h4 className="vigil-discussion-heading"/);
  }
  const [webCss, reportCss] = await Promise.all([
    read("src/vigil-case-file-polish.css"), read("src/vigil-deterministic-report.css"),
  ]);
  assert.match(webCss, /\.vigil-case-file-page \.vigil-conclusion-subsection\.is-discussion/);
  assert.match(reportCss, /\.vigil-deterministic-report-host \.vigil-conclusion-subsection\.is-discussion/);
});
