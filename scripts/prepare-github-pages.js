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

function pageHtml({ route, title, description, body = "", canonicalRoute = route }) {
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

  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

function writeRoute(route, html) {
  const routeDir = join(docsDir, route.replace(/^\//, ""));
  mkdirSync(routeDir, { recursive: true });
  writeFileSync(join(routeDir, "index.html"), html);
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

const staticRoutes = [
  ["/about", "About CAM Initiative", "About CAM Initiative and its open AI governance architecture."],
  ["/datasets", "CAM Governance Datasets", "Machine-readable CAM and VIGIL Observatory governance datasets and registries."],
  ["/policy", "CAM Initiative Policy", "Policy, governance and publication information for CAM Initiative."],
  ["/privacy", "CAM Initiative Privacy", "Privacy information for the CAM Initiative website."],
  ["/observatory", "VIGIL Observatory", "VIGIL Observatory is the CAM Initiative's evidence-to-repair AI governance observatory, providing a public AI incident database through its canonical Case File registry."],
  ["/observatory/about", "About VIGIL Observatory", "VIGIL Observatory provides a public AI incident database through its Case File registry, combining incident evidence, governance diagnosis, failure classification and accountable repair."],
  ["/observatory/cases", "VIGIL Case Files — AI Incident Database", "Browse the VIGIL Observatory AI incident database: documented Case Files with evidence, diagnosis, failure classification, repair and references."],
  ["/observatory/incidents", "VIGIL Observatory Incidents", "Browse canonical VIGIL Observatory AI Incident records."],
  ["/observatory/knowledge-base", "VIGIL Observatory Knowledge Base", "VIGIL Observatory governance taxonomy, standards sources, policy and public knowledge resources."],
  ["/observatory/knowledge-base/failure-taxonomy", "VIGIL Failure Taxonomy", "The maintained VIGIL Failure Taxonomy for recurring AI governance and control-failure mechanisms, with versioned families, classes, recognition criteria, exclusions and classification boundaries."],
  ["/observatory/knowledge-base/standards-sources", "VIGIL Observatory Standards Sources", "External governance standards and source material used by VIGIL Observatory."],
  ["/observatory/knowledge-base/external-requirements", "VIGIL Observatory External Requirements", "External governance requirements referenced by VIGIL Observatory."],
  ["/observatory/knowledge-base/policy", "VIGIL Observatory Policy", "Policy information for VIGIL Observatory."],
];

for (const [route, title, description] of staticRoutes) {
  const canonicalRoute = route === "/observatory/incidents" ? "/observatory/cases" : route;
  writeRoute(route, pageHtml({ route, title, description, canonicalRoute }));
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
  console.warn(`Unable to load the VIGIL Observatory Failure Taxonomy for static crawl routes: ${error instanceof Error ? error.message : error}`);
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
    <h1>VIGIL Failure Taxonomy</h1>
    <p>A structured taxonomy of recurring AI governance failure mechanisms, organised into Failure Families and selectable Failure Classes.</p>
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
      title: "VIGIL Failure Taxonomy",
      description: "The maintained VIGIL Failure Taxonomy for recurring AI governance and control-failure mechanisms, with versioned families, classes, recognition criteria, exclusions and classification boundaries.",
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
    <p>VIGIL Failure Taxonomy</p>
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
      title: `${family.name || family.family_id} | VIGIL Observatory Failure Taxonomy | CAM Initiative`,
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
    const classBody = `<main data-static-crawl-fallback="vigil-taxonomy-class" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
      <p>VIGIL Failure Taxonomy</p>
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
  const title = `${record.id}: ${record.title || "VIGIL Incident"} | VIGIL Observatory`;
  const description = record.summary || record.severity_assessment?.materialised_consequence || record.title || "VIGIL Observatory AI incident case file.";
  const body = `<main data-static-crawl-fallback="vigil-case" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory · ${escapeHtml(record.id)}</p>
    <h1>${escapeHtml(record.title || record.id)}</h1>
    <p>${escapeHtml(description)}</p>
    <dl>
      <dt>VIGIL classification status</dt><dd>${escapeHtml(record.classification_role === "successful-invariant" ? "Exemplar" : (record.classification_status || "not stated"))}</dd>
      <dt>VIGIL primary classification</dt><dd>${escapeHtml(classificationDisplay(record.primary_class_id, record.primary_family_id))}</dd>
      <dt>VIGIL secondary classifications</dt>${secondaryClassificationHtml(record)}
      <dt>Severity</dt><dd>${escapeHtml(record.severity || "not stated")}</dd>
      <dt>Vendor / platform</dt><dd>${escapeHtml(record.platform_or_vendor || "not stated")}</dd>
    </dl>
  </main>`;
  writeRoute(route, pageHtml({ route, title, description, body }));
}

if (incidentRecords.length) {
  const caseIndexBody = `<main data-static-crawl-fallback="vigil-case-index" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory</p>
    <h1>VIGIL Case Files</h1>
    <p>AI incident database of documented VIGIL Incident investigations with evidence, diagnosis, classification and repair analysis.</p>
    <ul>${incidentRecords.map((record) => `<li><a href="/observatory/cases/${encodeURIComponent(record.id)}">${escapeHtml(record.title || record.id)}</a> <code>${escapeHtml(record.id)}</code></li>`).join("")}</ul>
  </main>`;
  writeRoute(
    "/observatory/cases",
    pageHtml({
      route: "/observatory/cases",
      title: "VIGIL Case Files — AI Incident Database | CAM Initiative",
      description: "Browse the VIGIL AI incident database: documented Case Files with source evidence, diagnosis, failure classification, repair analysis and references.",
      body: caseIndexBody,
    }),
  );
}

// Only publish change dates when a trustworthy page-level modification timestamp is available.
// A build date is not a content modification date, so this sitemap intentionally omits modification-date elements.
const sitemapRoutes = [
  "/",
  ...staticRoutes.map(([route]) => route).filter((route) => route !== "/observatory/incidents"),
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
