import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(repoRoot, "docs");
const indexPath = join(docsDir, "index.html");
const fallbackPath = join(docsDir, "404.html");
const nojekyllPath = join(docsDir, ".nojekyll");
const vigilFallbackPath = join(docsDir, "data", "vigil-registry-fallback.json");
const sitemapPath = join(docsDir, "sitemap.xml");
const siteOrigin = "https://www.cam-initiative.org";
const vigilTaxonomyRoot = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy";

if (!existsSync(indexPath)) {
  throw new Error("GitHub Pages build did not produce docs/index.html");
}

mkdirSync(docsDir, { recursive: true });
copyFileSync(indexPath, fallbackPath);
writeFileSync(nojekyllPath, "");

const baseHtml = readFileSync(indexPath, "utf8");
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function routeUrl(route) {
  if (route === "/") return `${siteOrigin}/`;
  const normalizedRoute = route.endsWith("/") ? route : `${route}/`;
  return `${siteOrigin}${normalizedRoute}`;
}

function canonicalizeInternalHrefAttributes(html) {
  return html.replace(/href="(\/(?!\/)[^"#?]*)"/g, (match, path) => {
    if (
      path === "/" ||
      path.endsWith("/") ||
      /\.(?:css|js|svg|png|jpe?g|webp|ico|json|pdf|xml|txt|woff2?)$/i.test(path)
    ) {
      return match;
    }
    return `href="${path}/"`;
  });
}

function pageHtml({ route, title, description, body = "", canonicalRoute = route, structuredData, persistentFallbackKind }) {
  const url = routeUrl(canonicalRoute);
  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);

  if (structuredData) {
    const encoded = JSON.stringify(structuredData).replaceAll("<", "\\u003c");
    html = html.replace("</head>", `    <script type="application/ld+json">${encoded}</script>\n  </head>`);
  }
  if (body) {
    html = persistentFallbackKind
      ? html.replace(
          '<div id="root"></div>',
          `<div data-static-publication-fallback="${escapeHtml(persistentFallbackKind)}">${body}</div>\n    <div id="root"></div>`,
        )
      : html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  }
  return canonicalizeInternalHrefAttributes(html);
}

function writeRoute(route, html) {
  const routeDir = join(docsDir, route.replace(/^\//, ""));
  mkdirSync(routeDir, { recursive: true });
  writeFileSync(join(routeDir, "index.html"), html.replace(/[ \t]+$/gm, ""));
}

function conciseDescription(value, fallback) {
  const text = String(value || fallback || "").replace(/\s+/g, " ").trim();
  return text.length <= 190 ? text : `${text.slice(0, 187).trimEnd()}…`;
}

function listHtml(values) {
  if (!Array.isArray(values) || !values.length) return "<p>None stated.</p>";
  return `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
      "User-Agent": "cam-governance-catalogue-pages-build",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return response.json();
}

const aboutDescription = "CAM Initiative develops public-interest AI governance infrastructure through VIGIL Observatory and the CAELESTIS Architecture Model.";

// Keep the static About fallback aligned with the React About hierarchy.
const vigilAboutFallbackBody = `<main data-static-crawl-fallback="vigil-about" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
  <p>CAM Initiative · Public-interest AI governance</p>
  <h1>About CAM Initiative</h1>
  <p>CAM Initiative develops publicly accessible AI governance infrastructure for understanding systems, supporting compliance, diagnosing failures and navigating change.</p>

  <h2>VIGIL Observatory</h2>
  <h3>Public Incident evidence, classification and repair analysis</h3>
  <p>VIGIL Observatory is CAM Initiative's Incident-centred public observatory and AI incident database for evidence-to-repair governance analysis. It preserves public Incident evidence, assesses materialised consequence and governance significance, classifies evidence against recurring governance boundaries through the VIGIL Observatory Alignment Taxonomy, and records exemplars when the relevant invariant holds under pressure.</p>
  <p>VIGIL uses its own Incident model, VIGIL Harm Impact Methodology (VIGIL-HIM) and VIGIL Observatory Alignment Taxonomy. The Alignment Taxonomy uses the CAELESTIS Architecture Model as a source for taxonomy development and evaluation, while VIGIL remains an independent Incident-analysis system; VIGIL assessments and taxonomy relationships do not create or amend CAELESTIS doctrine.</p>
  <p>VIGIL Observatory is not affiliated with Vigil at vigil.agency or Vigil SOC. CAM Initiative and the CAELESTIS Architecture Model are also not affiliated with the separate Caelestis project at caelestis-project.eu.</p>

  <nav aria-label="CAM Initiative resources">
    <ul>
      <li><a href="/knowledge-base/">Open the CAM Initiative Knowledge Base</a></li>
      <li><a href="/observatory/cases/">Browse VIGIL Observatory Case Files</a></li>
      <li><a href="https://github.com/CAM-Initiative/Vigil" rel="noreferrer">VIGIL Observatory repository</a></li>
      <li><a href="https://github.com/CAM-Initiative/Caelestis" rel="noreferrer">CAELESTIS repository</a></li>
    </ul>
  </nav>
</main>`

const vigilAboutStructuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About CAM Initiative",
  url: "https://www.cam-initiative.org/about/",
  description: aboutDescription,
  publisher: {
    "@type": "Organization",
    name: "CAM Initiative",
    url: "https://www.cam-initiative.org/",
  },
  about: [
    { "@type": "Organization", name: "CAM Initiative", url: "https://www.cam-initiative.org/" },
    { "@type": "CreativeWork", name: "VIGIL Observatory", alternateName: "VIGIL", url: "https://www.cam-initiative.org/observatory/cases/", sameAs: "https://github.com/CAM-Initiative/Vigil" },
    { "@type": "CreativeWork", name: "CAELESTIS Architecture Model", sameAs: "https://github.com/CAM-Initiative/Caelestis" },
  ],
  isPartOf: {
    "@type": "WebSite",
    name: "CAM Initiative",
    url: "https://www.cam-initiative.org/",
  },
};

const retiredPublicRouteDirs = [
  join(docsDir, "observatory", "about"),
  join(docsDir, "observatory", "incidents"),
  join(docsDir, "observatory", "severity-methodology"),
  join(docsDir, "observatory", "knowledge-base"),
];
for (const retiredRouteDir of retiredPublicRouteDirs) {
  rmSync(retiredRouteDir, { recursive: true, force: true });
}

const staticRoutes = [
  ["/about", "About CAM Initiative", aboutDescription],
  ["/licensing", "Copyright & Licence | CAM Initiative", "Copyright, citation, reuse and licence information for VIGIL Observatory and CAM Initiative materials."],
  ["/datasets", "CAM Governance Datasets", "Machine-readable CAM and VIGIL Observatory governance datasets and registries."],
  ["/policy", "CAM Initiative Policy", "Policy, governance and publication information for CAM Initiative."],
  ["/privacy", "CAM Initiative Privacy", "Privacy information for the CAM Initiative website."],
  ["/knowledge-base", "CAM Initiative Knowledge Base", "Reference material across CAM Initiative, including VIGIL Observatory Case File methods and classification, AI governance standards, datasets, policy and the CAELESTIS Architecture Model."],
  ["/observatory", "VIGIL Observatory", "VIGIL Observatory is the CAM Initiative's evidence-to-repair AI governance observatory, providing a public AI incident database through its canonical Case File registry."],
  ["/observatory/harm-impact-assessment", "VIGIL Observatory Harm Impact Assessment", "The current VIGIL-HIM harm dimensions, evidence states and S1-S5 severity thresholds used in VIGIL Observatory Case Files."],
  ["/observatory/cases", "VIGIL Observatory Case Files — AI Incident Database", "Browse the VIGIL Observatory AI incident database: documented Case Files with evidence, assessment, alignment classification, compliance and references."],
  ["/observatory/alignment-taxonomy", "VIGIL Observatory Alignment Taxonomy", "The maintained VIGIL Observatory Alignment Taxonomy for evidence-based classification against AI governance invariants, retaining stable Fidelity Families and Fidelity Classes with recognition criteria, exclusions and governing invariants."],
  ["/observatory/ai-governance-standards", "VIGIL Observatory AI Governance Standards", "External governance standards and source material used by VIGIL Observatory."],
];

const staticRouteBodies = new Map([
  ["/knowledge-base", `<main data-static-crawl-fallback="knowledge-base" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>CAM Initiative</p>
    <h1>Knowledge Base</h1>
    <p>Reference material for the VIGIL Observatory, including Case Files, the Alignment Taxonomy, the Harm Impact Assessment methodology, AI governance standards and CAM Initiative datasets.</p>
    <nav aria-label="Knowledge Base resources"><ul>
      <li><a href="/observatory/cases/">VIGIL Observatory Case Files</a></li>
      <li><a href="/observatory/alignment-taxonomy/">VIGIL Observatory Alignment Taxonomy</a></li>
      <li><a href="/observatory/harm-impact-assessment/">VIGIL Harm Impact Assessment</a></li>
      <li><a href="/observatory/ai-governance-standards/">AI Governance Standards</a></li>
      <li><a href="/datasets/">Datasets</a></li>
      <li><a href="/policy/">Policy</a></li>
    </ul></nav>
  </main>`],
  ["/observatory", `<main data-static-crawl-fallback="vigil-observatory" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>CAM Initiative</p>
    <h1>VIGIL Observatory</h1>
    <p>A public AI incident observatory connecting documented evidence, materialised harm, alignment classification and external governance requirements.</p>
    <nav aria-label="VIGIL Observatory resources"><ul>
      <li><a href="/observatory/cases/">Browse Case Files</a></li>
      <li><a href="/observatory/alignment-taxonomy/">Explore the Alignment Taxonomy</a></li>
      <li><a href="/observatory/harm-impact-assessment/">Read the Harm Impact Assessment methodology</a></li>
      <li><a href="/observatory/ai-governance-standards/">Browse AI Governance Standards</a></li>
    </ul></nav>
  </main>`],
  ["/observatory/harm-impact-assessment", `<main data-static-crawl-fallback="vigil-harm-impact" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory</p>
    <h1>Harm Impact Assessment</h1>
    <p>VIGIL-HIM reviews eleven harm dimensions using five severity bands, S1 to S5. The highest defensible materialised-harm threshold determines the overall severity reported in a Case File.</p>
    <p><a href="/observatory/cases/">Browse Case Files using the methodology</a> · <a href="/knowledge-base/">Return to the Knowledge Base</a></p>
  </main>`],
  ["/observatory/ai-governance-standards", `<main data-static-crawl-fallback="vigil-governance-standards" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory</p>
    <h1>AI Governance Standards</h1>
    <p>A curated library of laws, standards, frameworks and technical guidance used to support VIGIL governance analysis and external requirement cross-references.</p>
    <p><a href="/observatory/alignment-taxonomy/">Explore the Alignment Taxonomy</a> · <a href="/observatory/cases/">Browse Case Files</a> · <a href="/knowledge-base/">Return to the Knowledge Base</a></p>
  </main>`],
]);

for (const [route, title, description] of staticRoutes) {
  const isAboutRoute = route === "/about";
  writeRoute(route, pageHtml({
    route,
    title,
    description,
    body: isAboutRoute ? vigilAboutFallbackBody : (staticRouteBodies.get(route) ?? ""),
    structuredData: isAboutRoute ? vigilAboutStructuredData : undefined,
  }));
}

let taxonomyFamilies = [];
let taxonomyCaseFileExamples = { classes: {} };
try {
  const [index, caseFileExamples] = await Promise.all([
    fetchJson(`${vigilTaxonomyRoot}/VIGIL.FailureTaxonomy.Index.json`),
    fetchJson(`${vigilTaxonomyRoot}/generated/VIGIL.FailureTaxonomy.CaseFileExamples.json`),
  ]);
  taxonomyCaseFileExamples = caseFileExamples && typeof caseFileExamples === "object" ? caseFileExamples : { classes: {} };
  taxonomyFamilies = await Promise.all((index.families || []).map(async (entry) => ({
    entry,
    document: await fetchJson(`${vigilTaxonomyRoot}/${entry.file}`),
  })));
} catch (error) {
  console.warn(`Unable to load the VIGIL Observatory Alignment Taxonomy for static crawl routes: ${error instanceof Error ? error.message : error}`);
}

const taxonomyRootDirs = [
  join(docsDir, "observatory", "alignment-taxonomy"),
];
for (const taxonomyRootDir of taxonomyRootDirs) {
  if (!existsSync(taxonomyRootDir)) continue;
  for (const entry of readdirSync(taxonomyRootDir, { withFileTypes: true })) {
    if (entry.isDirectory() && /^VIGIL-(?:FF|FC)-\d+$/.test(entry.name)) {
      rmSync(join(taxonomyRootDir, entry.name), { recursive: true, force: true });
    }
  }
}

const taxonomyClassById = new Map();
const taxonomyFamilyById = new Map();
for (const { document } of taxonomyFamilies) {
  const family = document?.family;
  if (family?.family_id) taxonomyFamilyById.set(family.family_id, family);
  for (const item of Array.isArray(document?.classes) ? document.classes : []) {
    if (item?.class_id) taxonomyClassById.set(item.class_id, item);
  }
}

if (taxonomyFamilies.length) {
  const taxonomyIndexBody = `<main data-static-crawl-fallback="vigil-taxonomy-index" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory</p>
    <h1>VIGIL Observatory Alignment Taxonomy</h1>
    <p>A structured alignment taxonomy for recurring AI governance boundaries, organised through stable Fidelity Families and selectable Fidelity Classes.</p>
    <section aria-labelledby="taxonomy-reading-heading">
      <h2 id="taxonomy-reading-heading">How to read a Fidelity Class</h2>
      <p>A Fidelity Class defines a governed property rather than a failure outcome. Occurrence evidence may establish that the invariant held, that the failure condition occurred, or that the evidence materially engages the boundary without establishing either polarity.</p>
      <p>Both success and failure require affirmative evidence; absence of evidence for one state does not establish the other.</p>
    </section>
    <h2>Fidelity families</h2>
    <ul>${taxonomyFamilies.map(({ document }) => {
      const family = document?.family;
      if (!family?.family_id) return "";
      return `<li><a href="/observatory/alignment-taxonomy/${encodeURIComponent(family.family_id)}">${escapeHtml(family.name || family.family_id)}</a> <code>${escapeHtml(family.family_id)}</code></li>`;
    }).filter(Boolean).join("")}</ul>
  </main>`;
  writeRoute(
    "/observatory/alignment-taxonomy",
    pageHtml({
      route: "/observatory/alignment-taxonomy",
      title: "VIGIL Observatory Alignment Taxonomy",
      description: "The maintained VIGIL Observatory Alignment Taxonomy for classifying evidence against recurring AI governance boundaries, with stable Fidelity Families and neutral Fidelity Classes, governed invariants and explicit occurrence conditions.",
      body: taxonomyIndexBody,
    }),
  );
}

function classificationDisplay(classId, familyId) {
  if (!classId) return "not stated";
  const item = taxonomyClassById.get(classId);
  const resolvedFamilyId = item?.family_id || familyId;
  const family = resolvedFamilyId ? taxonomyFamilyById.get(resolvedFamilyId) : undefined;
  const classText = item?.name ? `${item.name} (${classId})` : classId;
  return family ? `${classText} — ${family.name} (${resolvedFamilyId})` : classText;
}

function secondaryClassificationHtml(record) {
  const ids = Array.isArray(record.secondary_class_ids) ? record.secondary_class_ids : [];
  if (!ids.length) return "<dd>None recorded</dd>";
  return `<dd><ul>${ids.map((classId) => `<li>${escapeHtml(classificationDisplay(classId))}</li>`).join("")}</ul></dd>`;
}

function externalAssessmentsHtml(record) {
  const assessments = Array.isArray(record.external_assessments) ? record.external_assessments : [];
  if (!assessments.length) return "";
  return `<section aria-labelledby="external-assessments-heading">
    <h2 id="external-assessments-heading">External assessments</h2>
    <p>Attributable third-party analyses of this occurrence. Inclusion does not imply endorsement by VIGIL.</p>
    ${assessments.map((assessment) => {
      const rating = assessment?.classification_or_rating;
      return `<article>
        <p><strong>External assessment</strong></p>
        <h3>${assessment?.assessment_url ? `<a href="${escapeHtml(assessment.assessment_url)}" rel="noreferrer">${escapeHtml(assessment.assessment_title || "External assessment")}</a>` : escapeHtml(assessment?.assessment_title || "External assessment")}</h3>
        <p><strong>${escapeHtml(assessment?.assessor || "External assessor")}</strong>${assessment?.assessment_date ? ` · ${escapeHtml(assessment.assessment_date)}` : ""}</p>
        <p>${escapeHtml(assessment?.assessment_summary || "")}</p>
        ${rating?.value ? `<p><strong>External classification / rating:</strong> ${escapeHtml(rating.verbatim_label || rating.value)}${rating.scheme ? ` · ${escapeHtml(rating.scheme)}` : ""}</p>` : ""}
        ${assessment?.scope_note ? `<p><strong>Scope:</strong> ${escapeHtml(assessment.scope_note)}</p>` : ""}
        ${assessment?.vigil_comparison_note ? `<p><strong>VIGIL relationship:</strong> ${escapeHtml(assessment.vigil_comparison_note)}</p>` : ""}
        ${assessment?.assessment_url ? `<p><a href="${escapeHtml(assessment.assessment_url)}" rel="noreferrer">View assessment</a></p>` : ""}
      </article>`;
    }).join("")}
  </section>`;
}

function taxonomyCaseExamplesForClass(classId) {
  const classes = taxonomyCaseFileExamples?.classes;
  if (!classes || typeof classes !== "object") return [];
  return Array.isArray(classes[classId]) ? classes[classId] : [];
}

function publicMappingRoleLabel(role) {
  if (role === "failure-occurrence") return "Failure occurred";
  if (role === "successful-invariant") return "Invariant held";
  if (role === "ambiguous-boundary") return "Boundary unresolved";
  return role ? String(role).replaceAll("-", " ") : "";
}

function publicAlignmentOutcome(record) {
  if (record.adjudication_coverage?.status === "partial") return "Adjudication incomplete";
  if (record.classification_role === "failure-occurrence") return "Failure evidenced";
  if (record.classification_role === "successful-invariant") return "Invariant held";
  if (record.classification_role === "ambiguous-boundary") return "Boundary unresolved";
  if (record.classification_status === "classified" || record.classification_status === "provisionally-classified") return "Failure evidenced";
  if (record.classification_status === "classification-disputed") return "Disputed";
  if (record.classification_status === "requires-human-review") return "Under review";
  if (record.classification_status === "unclassified") return "Unclassified";
  return record.classification_status || "not stated";
}

function taxonomyCaseLinkHtml(example) {
  const meta = [publicMappingRoleLabel(example.classification_role), example.classification_confidence ? `${example.classification_confidence} confidence` : ""]
    .filter(Boolean)
    .join(" · ");
  return `<li><a href="/observatory/cases/${encodeURIComponent(example.incident_id)}"><code>${escapeHtml(example.incident_id)}</code> — ${escapeHtml(example.incident_title || example.incident_id)}</a>${meta ? ` <span>${escapeHtml(meta)}</span>` : ""}</li>`;
}

function taxonomyInvariantExemplarHtml(exemplar, classId) {
  return `<li><a href="/observatory/cases/${encodeURIComponent(exemplar.linked_incident_id)}"><code>${escapeHtml(exemplar.linked_incident_id)}</code> — ${escapeHtml(exemplar.title || exemplar.linked_incident_id)}</a> <span>Invariant held · <a href="/observatory/alignment-taxonomy/${encodeURIComponent(classId)}"><code>${escapeHtml(classId)}</code></a></span></li>`;
}

function taxonomyExternalReferenceHtml(reference) {
  const meta = [reference.publisher, reference.date, reference.reference_role ? String(reference.reference_role).replaceAll("-", " ") : ""]
    .filter(Boolean)
    .join(" · ");
  const title = escapeHtml(reference.title || "External source");
  const titleHtml = reference.url
    ? `<a href="${escapeHtml(reference.url)}" rel="noreferrer">${title}</a>`
    : title;
  const note = reference.evidence_note
    ? `<p><strong>Evidence note.</strong> ${escapeHtml(reference.evidence_note)}</p>`
    : "";
  return `<li>${meta ? `<p>${escapeHtml(meta)}</p>` : ""}<p><strong>${titleHtml}</strong></p>${note}</li>`;
}

const taxonomyRoutes = [];
for (const { document } of taxonomyFamilies) {
  const family = document?.family;
  if (!family?.family_id) continue;

  const familyRoute = `/observatory/alignment-taxonomy/${encodeURIComponent(family.family_id)}`;
  taxonomyRoutes.push(familyRoute);
  const familyDescription = conciseDescription(
    `VIGIL Observatory fidelity family ${family.family_id}: ${family.plain_english || family.definition || family.name}`,
    "VIGIL Observatory AI governance fidelity family.",
  );
  const familyClasses = Array.isArray(document.classes) ? document.classes : [];
  const familyBody = `<main data-static-crawl-fallback="vigil-taxonomy-family" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory Alignment Taxonomy</p>
    <h1>${escapeHtml(family.name || family.family_id)}</h1>
    <p>${escapeHtml(family.plain_english || "")}</p>
    <dl>
      <dt>Immutable family ID</dt><dd>${escapeHtml(family.family_id)}</dd>
      <dt>Semantic code</dt><dd>${escapeHtml(family.family_code || "not stated")}</dd>
      <dt>Version</dt><dd>${escapeHtml(family.version || "not stated")}</dd>
      <dt>Status</dt><dd>${escapeHtml(family.status || "not stated")}</dd>
    </dl>
    <h2>Technical definition</h2>
    <p>${escapeHtml(family.definition || "Not stated.")}</p>
    <h2>Classification boundary</h2>
    <p><strong>Include when:</strong> ${escapeHtml(family.inclusion_rule || "Not stated.")}</p>
    <p><strong>Exclude when:</strong> ${escapeHtml(family.exclusion_rule || "Not stated.")}</p>
    <h2>Fidelity classes</h2>
    <ul>${familyClasses.map((item) => `<li><a href="/observatory/alignment-taxonomy/${encodeURIComponent(item.class_id)}">${escapeHtml(item.name || item.class_id)}</a> <code>${escapeHtml(item.class_id)}</code></li>`).join("")}</ul>
  </main>`;
  writeRoute(
    familyRoute,
    pageHtml({
      route: familyRoute,
      title: `${family.name || family.family_id} | VIGIL Observatory Alignment Taxonomy | CAM Initiative`,
      description: familyDescription,
      body: familyBody,
    }),
  );

  for (const item of familyClasses) {
    if (!item?.class_id) continue;
    const classRoute = `/observatory/alignment-taxonomy/${encodeURIComponent(item.class_id)}`;
    taxonomyRoutes.push(classRoute);
    const classDescription = conciseDescription(
      `VIGIL Observatory fidelity class ${item.class_id}: ${item.plain_english || item.definition || item.name}`,
      "VIGIL Observatory AI governance fidelity class.",
    );
    const classCaseExamples = taxonomyCaseExamplesForClass(item.class_id);
    const classInvariantExemplars = Array.isArray(item.invariant_exemplars) ? item.invariant_exemplars : [];
    const classSuccessfulExemplars = classInvariantExemplars.filter((exemplar) => exemplar?.exemplar_type === "successful-invariant");
    const classAmbiguousExemplars = classInvariantExemplars.filter((exemplar) => exemplar?.exemplar_type === "ambiguous-boundary");
    const classSuccessRecognition = Array.isArray(item.success_recognition?.required_conditions) ? item.success_recognition.required_conditions : [];
    const classFailureRecognition = Array.isArray(item.failure_recognition?.required_conditions)
      ? item.failure_recognition.required_conditions
      : Array.isArray(item.recognition?.required_conditions) ? item.recognition.required_conditions : [];
    const classExternalReferences = Array.isArray(item.external_references) ? item.external_references : [];
    const classBody = `<main data-static-crawl-fallback="vigil-taxonomy-class" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
      <p>VIGIL Observatory Alignment Taxonomy</p>
      <h1>${escapeHtml(item.name || item.class_id)}</h1>
      <p>${escapeHtml(item.plain_english || "")}</p>
      <dl>
        <dt>Immutable class ID</dt><dd>${escapeHtml(item.class_id)}</dd>
        <dt>Semantic code</dt><dd>${escapeHtml(item.class_code || "not stated")}</dd>
        <dt>Fidelity family</dt><dd><a href="/observatory/alignment-taxonomy/${encodeURIComponent(family.family_id)}">${escapeHtml(family.name || family.family_id)}</a> <code>${escapeHtml(family.family_id)}</code></dd>
        <dt>Status</dt><dd>${escapeHtml(item.status || "not stated")}</dd>
      </dl>
      <h2>Technical definition</h2>
      <p>${escapeHtml(item.definition || "Not stated.")}</p>
      ${item.invariant ? `<h2>Governing invariant</h2><blockquote>${escapeHtml(item.invariant)}</blockquote>` : ""}
      ${item.success_condition || item.success_plain_english || classSuccessRecognition.length ? `<h2>Invariant held</h2><h3>Success condition</h3>${item.success_plain_english ? `<p><strong>${escapeHtml(item.success_plain_english)}</strong></p>` : ""}${item.success_condition ? `<p>${escapeHtml(item.success_condition)}</p>` : ""}${classSuccessRecognition.length ? `<h3>Positive recognition</h3>${listHtml(classSuccessRecognition)}` : ""}` : ""}
      ${item.failure_condition || item.failure_plain_english || classFailureRecognition.length ? `<h2>Failure established</h2><h3>Failure condition</h3>${item.failure_plain_english ? `<p><strong>${escapeHtml(item.failure_plain_english)}</strong></p>` : ""}${item.failure_condition ? `<p>${escapeHtml(item.failure_condition)}</p>` : ""}${classFailureRecognition.length ? `<h3>Failure recognition</h3>${listHtml(classFailureRecognition)}` : ""}` : ""}
      ${Array.isArray(item.exclusions) && item.exclusions.length ? `<h2>Exclusions from failure recognition</h2>${listHtml(item.exclusions)}` : ""}
      <h2>Failure occurrences</h2>
      ${classCaseExamples.length ? `<ul>${classCaseExamples.map(taxonomyCaseLinkHtml).join("")}</ul>` : "<p>No Case Files currently evidence failure for this class.</p>"}
      ${classSuccessfulExemplars.length ? `<h2>Invariant-held examples</h2><ul>${classSuccessfulExemplars.map((exemplar) => taxonomyInvariantExemplarHtml(exemplar, item.class_id)).join("")}</ul>` : ""}
      ${classAmbiguousExemplars.length ? `<h2>Ambiguous-boundary examples</h2><ul>${classAmbiguousExemplars.map((exemplar) => taxonomyInvariantExemplarHtml(exemplar, item.class_id)).join("")}</ul>` : ""}
      ${classExternalReferences.length ? `<h2>Supporting evidence</h2><p>External sources supporting this governed property, its evidentiary boundaries or its recognition criteria.</p><ul>${classExternalReferences.map(taxonomyExternalReferenceHtml).join("")}</ul>` : ""}
    </main>`;
    writeRoute(
      classRoute,
      pageHtml({
        route: classRoute,
        title: `${item.name || item.class_id} | VIGIL Observatory Fidelity Class | CAM Initiative`,
        description: classDescription,
        body: classBody,
      }),
    );
  }
}

let incidentRecords = [];
if (existsSync(vigilFallbackPath)) {
  const registry = JSON.parse(readFileSync(vigilFallbackPath, "utf8"));
  incidentRecords = Array.isArray(registry.records)
    ? registry.records.filter((record) => record?.record_type === "incident" && record?.id)
    : [];
}

const caseRoot = join(docsDir, "observatory", "cases");
if (existsSync(caseRoot)) {
  for (const entry of readdirSync(caseRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && /^VIGIL-INC-\d+$/.test(entry.name)) {
      rmSync(join(caseRoot, entry.name), { recursive: true, force: true });
    }
  }
}

for (const record of incidentRecords) {
  const route = `/observatory/cases/${encodeURIComponent(record.id)}`;
  const title = `${record.id}: ${record.title || "VIGIL Observatory Incident"} | VIGIL Observatory`;
  const summary = record.summary || record.title || "VIGIL Observatory AI incident case file.";
  const description = conciseDescription(summary, "VIGIL Observatory AI incident case file.");
  const body = `<main data-static-crawl-fallback="vigil-case" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory · ${escapeHtml(record.id)}</p>
    <h1>${escapeHtml(record.title || record.id)}</h1>
    <p>${escapeHtml(summary)}</p>
    <nav aria-label="VIGIL Observatory resources"><p><a href="/observatory/cases/">All Case Files</a> · <a href="/observatory/alignment-taxonomy/">Alignment Taxonomy</a> · <a href="/observatory/ai-governance-standards/">AI Governance Standards</a></p></nav>
    <dl>
      <dt>VIGIL Observatory alignment outcome</dt><dd>${escapeHtml(publicAlignmentOutcome(record))}</dd>
      <dt>VIGIL Observatory primary classification</dt><dd>${escapeHtml(classificationDisplay(record.primary_class_id, record.primary_family_id))}</dd>
      <dt>VIGIL Observatory secondary classifications</dt>${secondaryClassificationHtml(record)}
      <dt>Severity</dt><dd>${escapeHtml(record.severity || "not stated")}</dd>
      <dt>Vendor / platform</dt><dd>${escapeHtml(record.platform_or_vendor || "not stated")}</dd>
    </dl>
    ${externalAssessmentsHtml(record)}
  </main>`;
  writeRoute(route, pageHtml({ route, title, description, body, persistentFallbackKind: "vigil-case" }));
}

if (incidentRecords.length) {
  const caseIndexBody = `<main data-static-crawl-fallback="vigil-case-index" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory</p>
    <h1>VIGIL Observatory Case Files</h1>
    <p>AI incident database of documented VIGIL Observatory Incident investigations with evidence, assessment, classification and repair analysis.</p>
    <ul>${incidentRecords.map((record) => `<li><a href="/observatory/cases/${encodeURIComponent(record.id)}">${escapeHtml(record.title || record.id)}</a> <code>${escapeHtml(record.id)}</code></li>`).join("")}</ul>
  </main>`;
  writeRoute(
    "/observatory/cases",
    pageHtml({
      route: "/observatory/cases",
      title: "VIGIL Observatory Case Files — AI Incident Database | CAM Initiative",
      description: "Browse the VIGIL Observatory AI incident database: documented Case Files with source evidence, assessment, alignment classification, repair analysis and references.",
      body: caseIndexBody,
      persistentFallbackKind: "vigil-case-index",
    }),
  );
}

// Only publish change dates when VIGIL supplies a trustworthy page-level modification date.
// Build/deploy timestamps are deliberately not used as content modification dates.
function sitemapLastmod(value) {
  const candidate = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : undefined;
}

const sitemapLastmodByRoute = new Map();
for (const record of incidentRecords) {
  const route = `/observatory/cases/${encodeURIComponent(record.id)}`;
  const lastmod = sitemapLastmod(record.record_last_updated);
  if (lastmod) sitemapLastmodByRoute.set(route, lastmod);
}
const latestCaseLastmod = [...sitemapLastmodByRoute.values()].sort().at(-1);
if (latestCaseLastmod) sitemapLastmodByRoute.set("/observatory/cases", latestCaseLastmod);

const sitemapRoutes = [...new Set([
  "/",
  ...staticRoutes.map(([route]) => route),
  ...taxonomyRoutes,
  ...incidentRecords.map((record) => `/observatory/cases/${encodeURIComponent(record.id)}`),
])];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((route) => {
  const lastmod = sitemapLastmodByRoute.get(route);
  return `  <url>
    <loc>${routeUrl(route)}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ""}
  </url>`;
}).join("\n")}
</urlset>
`;
writeFileSync(sitemapPath, sitemap);

console.log(`Prepared GitHub Pages SPA fallback: docs/404.html`);
console.log(`Generated ${staticRoutes.length} crawlable static route entrypoints`);
console.log(`Generated ${taxonomyRoutes.length} crawlable VIGIL Observatory taxonomy entrypoints`);
console.log(`Generated ${incidentRecords.length} crawlable VIGIL Observatory case entrypoints`);
console.log(`Generated sitemap with ${sitemapRoutes.length} URLs`);
console.log("Ensured GitHub Pages bypasses Jekyll: docs/.nojekyll");
