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

function pageHtml({ route, title, description, body = "", canonicalRoute = route, structuredData }) {
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
  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
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

  <h2>CAELESTIS Architecture Model</h2>
  <h3>Governance architecture for advanced AI systems</h3>
  <p>The CAELESTIS Architecture Model is a publicly inspectable governance corpus for advanced AI systems, synthetic agents, relational AI environments and digital ecosystem accountability. Its public architecture reference is undergoing a substantive refactor.</p>
  <p>CAELESTIS provides a governance architecture. VIGIL Observatory documents and analyses Incidents independently; a VIGIL assessment or taxonomy relationship does not create or amend CAELESTIS doctrine.</p>
  <nav aria-label="CAELESTIS Architecture Model resources">
    <ul>
      <li><a href="https://doi.org/10.5281/zenodo.20686316" rel="noreferrer">Open archived version 1.1.0</a></li>
      <li><a href="https://github.com/CAM-Initiative/Caelestis" rel="noreferrer">CAELESTIS repository</a></li>
    </ul>
  </nav>

  <h2>VIGIL Observatory</h2>
  <h3>Public Incident evidence, classification and repair analysis</h3>
  <p>VIGIL Observatory is CAM Initiative's Incident-centred public observatory and AI incident database for evidence-to-repair governance analysis. It preserves public Incident evidence, assesses materialised consequence and governance significance, classifies recurring failure mechanisms through a maintained taxonomy, and records successful-invariant exemplars when the relevant governance boundary holds under pressure.</p>
  <p>VIGIL uses its own Incident model, VIGIL Harm Impact Methodology (VIGIL-HIM) and VIGIL Observatory Alignment Taxonomy. It is separate from CAELESTIS and does not create or amend CAELESTIS doctrine; CAM or CAELESTIS applicability is assessed separately.</p>

  <h2>VIGIL Case File method</h2>
  <p>Every Incident moves through the same six-stage evidence-to-conclusion structure: Incident, Assessment, Classification, Repair, Conclusion and References. Real-world harm assessment and taxonomy classification are deliberately independent: harm assessment describes materialised consequence and derives severity, while taxonomy classification describes governance mechanism and boundary behaviour.</p>
  <p>Taxonomy mappings record whether a boundary failed, held successfully or remains unresolved. Case File outcomes may therefore be failure-classified, successful-invariant exemplars, or combination / mixed-alignment records where different boundaries produced different evidentiary roles.</p>
  <nav aria-label="Explore VIGIL Observatory">
    <ul>
      <li><a href="/observatory/cases/">Browse VIGIL Observatory Case Files</a></li>
      <li><a href="/observatory/knowledge-base/failure-taxonomy/">Explore the VIGIL Observatory Alignment Taxonomy</a></li>
      <li><a href="/observatory/severity-methodology/">Read the VIGIL Harm &amp; Severity Methodology</a></li>
      <li><a href="https://github.com/CAM-Initiative/Vigil" rel="noreferrer">VIGIL Observatory repository</a></li>
    </ul>
  </nav>
</main>`;

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

const staticRoutes = [
  ["/about", "About CAM Initiative", aboutDescription],
  ["/licensing", "Copyright & Licence | CAM Initiative", "Copyright, citation, reuse and licence information for VIGIL Observatory and CAM Initiative materials."],
  ["/datasets", "CAM Governance Datasets", "Machine-readable CAM and VIGIL Observatory governance datasets and registries."],
  ["/policy", "CAM Initiative Policy", "Policy, governance and publication information for CAM Initiative."],
  ["/privacy", "CAM Initiative Privacy", "Privacy information for the CAM Initiative website."],
  ["/observatory", "VIGIL Observatory", "VIGIL Observatory is the CAM Initiative's evidence-to-repair AI governance observatory, providing a public AI incident database through its canonical Case File registry."],
  ["/observatory/about", "About CAM Initiative", aboutDescription],
  ["/observatory/severity-methodology", "VIGIL Observatory Harm & Severity Methodology", "VIGIL-HIM 1.0.0 harm dimensions, evidence states and S1-S5 severity thresholds used in VIGIL Observatory Case Files."],
  ["/observatory/cases", "VIGIL Observatory Case Files — AI Incident Database", "Browse the VIGIL Observatory AI incident database: documented Case Files with evidence, assessment, failure classification, repair and references."],
  ["/observatory/incidents", "VIGIL Observatory Incidents", "Browse canonical VIGIL Observatory AI Incident records."],
  ["/observatory/knowledge-base", "VIGIL Observatory Knowledge Base", "VIGIL Observatory governance taxonomy, standards sources, policy and public knowledge resources."],
  ["/observatory/knowledge-base/failure-taxonomy", "VIGIL Observatory Alignment Taxonomy", "The maintained VIGIL Observatory Alignment Taxonomy for evidence-based classification against AI governance invariants, retaining stable Failure Families and Failure Classes with recognition criteria, exclusions and governing invariants."],
  ["/observatory/knowledge-base/standards-sources", "VIGIL Observatory Standards Sources", "External governance standards and source material used by VIGIL Observatory."],
  ["/observatory/knowledge-base/external-requirements", "VIGIL Observatory External Requirements", "External governance requirements referenced by VIGIL Observatory."],
  ["/observatory/knowledge-base/policy", "VIGIL Observatory Policy", "Policy information for VIGIL Observatory."],
];

const canonicalAliases = new Map([
  ["/observatory/incidents", "/observatory/cases"],
  ["/observatory/about", "/about"],
]);

for (const [route, title, description] of staticRoutes) {
  const canonicalRoute = canonicalAliases.get(route) ?? route;
  const isAboutRoute = route === "/about" || route === "/observatory/about";
  writeRoute(route, pageHtml({
    route,
    title,
    description,
    canonicalRoute,
    body: isAboutRoute ? vigilAboutFallbackBody : "",
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

const taxonomyRootDir = join(docsDir, "observatory", "knowledge-base", "failure-taxonomy");
if (existsSync(taxonomyRootDir)) {
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
    <p>A structured alignment taxonomy for recurring AI governance boundaries, organised through stable Failure Families and selectable Failure Classes.</p>
    <h2>Failure families</h2>
    <ul>${taxonomyFamilies.map(({ document }) => {
      const family = document?.family;
      if (!family?.family_id) return "";
      return `<li><a href="/observatory/knowledge-base/failure-taxonomy/${encodeURIComponent(family.family_id)}">${escapeHtml(family.name || family.family_id)}</a> <code>${escapeHtml(family.family_id)}</code></li>`;
    }).filter(Boolean).join("")}</ul>
  </main>`;
  writeRoute(
    "/observatory/knowledge-base/failure-taxonomy",
    pageHtml({
      route: "/observatory/knowledge-base/failure-taxonomy",
      title: "VIGIL Observatory Alignment Taxonomy",
      description: "The maintained VIGIL Observatory Alignment Taxonomy for classifying evidence against recurring AI governance boundaries, with stable Failure Families and Failure Classes, recognition criteria, exclusions and governing invariants.",
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

function taxonomyCaseLinkHtml(example) {
  const meta = [example.classification_role, example.classification_confidence ? `${example.classification_confidence} confidence` : ""]
    .filter(Boolean)
    .join(" · ");
  return `<li><a href="/observatory/cases/${encodeURIComponent(example.incident_id)}"><code>${escapeHtml(example.incident_id)}</code> — ${escapeHtml(example.incident_title || example.incident_id)}</a>${meta ? ` <span>${escapeHtml(meta)}</span>` : ""}</li>`;
}

function taxonomyInvariantExemplarHtml(exemplar, classId) {
  return `<li><a href="/observatory/cases/${encodeURIComponent(exemplar.linked_incident_id)}"><code>${escapeHtml(exemplar.linked_incident_id)}</code> — ${escapeHtml(exemplar.title || exemplar.linked_incident_id)}</a> <span>Successful invariant · <a href="/observatory/knowledge-base/failure-taxonomy/${encodeURIComponent(classId)}"><code>${escapeHtml(classId)}</code></a></span></li>`;
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

  const familyRoute = `/observatory/knowledge-base/failure-taxonomy/${encodeURIComponent(family.family_id)}`;
  taxonomyRoutes.push(familyRoute);
  const familyDescription = conciseDescription(
    `VIGIL Observatory failure family ${family.family_id}: ${family.plain_english || family.definition || family.name}`,
    "VIGIL Observatory AI governance failure family.",
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
    <h2>Failure classes</h2>
    <ul>${familyClasses.map((item) => `<li><a href="/observatory/knowledge-base/failure-taxonomy/${encodeURIComponent(item.class_id)}">${escapeHtml(item.name || item.class_id)}</a> <code>${escapeHtml(item.class_id)}</code></li>`).join("")}</ul>
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
    const classRoute = `/observatory/knowledge-base/failure-taxonomy/${encodeURIComponent(item.class_id)}`;
    taxonomyRoutes.push(classRoute);
    const classDescription = conciseDescription(
      `VIGIL Observatory failure class ${item.class_id}: ${item.plain_english || item.definition || item.name}`,
      "VIGIL Observatory AI governance failure class.",
    );
    const classCaseExamples = taxonomyCaseExamplesForClass(item.class_id);
    const classInvariantExemplars = Array.isArray(item.invariant_exemplars) ? item.invariant_exemplars : [];
    const classExternalReferences = Array.isArray(item.external_references) ? item.external_references : [];
    const classBody = `<main data-static-crawl-fallback="vigil-taxonomy-class" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
      <p>VIGIL Observatory Alignment Taxonomy</p>
      <h1>${escapeHtml(item.name || item.class_id)}</h1>
      <p>${escapeHtml(item.plain_english || "")}</p>
      <dl>
        <dt>Immutable class ID</dt><dd>${escapeHtml(item.class_id)}</dd>
        <dt>Semantic code</dt><dd>${escapeHtml(item.class_code || "not stated")}</dd>
        <dt>Failure family</dt><dd><a href="/observatory/knowledge-base/failure-taxonomy/${encodeURIComponent(family.family_id)}">${escapeHtml(family.name || family.family_id)}</a> <code>${escapeHtml(family.family_id)}</code></dd>
        <dt>Status</dt><dd>${escapeHtml(item.status || "not stated")}</dd>
      </dl>
      <h2>Technical definition</h2>
      <p>${escapeHtml(item.definition || "Not stated.")}</p>
      <h2>Recognition criteria</h2>
      ${listHtml(item.recognition?.required_conditions)}
      <h2>Exclusions</h2>
      ${listHtml(item.exclusions)}
      <h2>Linked Case Files</h2>
      ${classCaseExamples.length ? `<ul>${classCaseExamples.map(taxonomyCaseLinkHtml).join("")}</ul>` : "<p>No classified failure Case Files are currently linked to this class.</p>"}
      ${classInvariantExemplars.length ? `<h2>Successful invariant exemplars</h2><ul>${classInvariantExemplars.map((exemplar) => taxonomyInvariantExemplarHtml(exemplar, item.class_id)).join("")}</ul>` : ""}
      ${classExternalReferences.length ? `<h2>Supporting evidence</h2><p>External sources supporting this Failure Class definition, boundary or recognition criteria.</p><ul>${classExternalReferences.map(taxonomyExternalReferenceHtml).join("")}</ul>` : ""}
    </main>`;
    writeRoute(
      classRoute,
      pageHtml({
        route: classRoute,
        title: `${item.name || item.class_id} | VIGIL Observatory Failure Class | CAM Initiative`,
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
  const description = record.summary || record.title || "VIGIL Observatory AI incident case file.";
  const body = `<main data-static-crawl-fallback="vigil-case" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory · ${escapeHtml(record.id)}</p>
    <h1>${escapeHtml(record.title || record.id)}</h1>
    <p>${escapeHtml(description)}</p>
    <dl>
      <dt>VIGIL Observatory classification status</dt><dd>${escapeHtml(record.classification_role === "successful-invariant" ? "Exemplar" : record.classification_role === "ambiguous-boundary" ? "Combination" : (record.classification_status || "not stated"))}</dd>
      <dt>VIGIL Observatory primary classification</dt><dd>${escapeHtml(classificationDisplay(record.primary_class_id, record.primary_family_id))}</dd>
      <dt>VIGIL Observatory secondary classifications</dt>${secondaryClassificationHtml(record)}
      <dt>Severity</dt><dd>${escapeHtml(record.severity || "not stated")}</dd>
      <dt>Vendor / platform</dt><dd>${escapeHtml(record.platform_or_vendor || "not stated")}</dd>
    </dl>
    ${externalAssessmentsHtml(record)}
  </main>`;
  writeRoute(route, pageHtml({ route, title, description, body }));
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
      description: "Browse the VIGIL Observatory AI incident database: documented Case Files with source evidence, diagnosis, failure classification, repair analysis and references.",
      body: caseIndexBody,
    }),
  );
}

// Only publish change dates when a trustworthy page-level modification timestamp is available.
// A build date is not a content modification date, so this sitemap intentionally omits modification-date elements.
const sitemapRoutes = [
  "/",
  ...staticRoutes.map(([route]) => route).filter((route) => !canonicalAliases.has(route)),
  ...taxonomyRoutes,
  ...incidentRecords.map((record) => `/observatory/cases/${encodeURIComponent(record.id)}`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((route) => `  <url>
    <loc>${routeUrl(route)}</loc>
  </url>`).join("\n")}
</urlset>
`;
writeFileSync(sitemapPath, sitemap);

console.log(`Prepared GitHub Pages SPA fallback: docs/404.html`);
console.log(`Generated ${staticRoutes.length} crawlable static route entrypoints`);
console.log(`Generated ${taxonomyRoutes.length} crawlable VIGIL Observatory taxonomy entrypoints`);
console.log(`Generated ${incidentRecords.length} crawlable VIGIL Observatory case entrypoints`);
console.log(`Generated sitemap with ${sitemapRoutes.length} URLs`);
console.log("Ensured GitHub Pages bypasses Jekyll: docs/.nojekyll");
