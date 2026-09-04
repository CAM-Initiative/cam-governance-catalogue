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

if (!existsSync(indexPath)) {
  throw new Error("GitHub Pages build did not produce docs/index.html");
}

mkdirSync(docsDir, { recursive: true });
copyFileSync(indexPath, fallbackPath);
writeFileSync(nojekyllPath, "");

const baseHtml = readFileSync(indexPath, "utf8");
const generatedDate = new Date().toISOString().slice(0, 10);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function routeUrl(route) {
  return `${siteOrigin}${route === "/" ? "/" : route}`;
}

function pageHtml({ route, title, description, body = "" }) {
  const url = routeUrl(route);
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

const staticRoutes = [
  ["/about", "About CAM Initiative", "About CAM Initiative and its open AI governance architecture."],
  ["/datasets", "CAM Governance Datasets", "Machine-readable CAM and VIGIL governance datasets and registries."],
  ["/policy", "CAM Initiative Policy", "Policy, governance and publication information for CAM Initiative."],
  ["/privacy", "CAM Initiative Privacy", "Privacy information for the CAM Initiative website."],
  ["/observatory", "VIGIL Observatory", "VIGIL documents AI incidents, governance failures, classifications, evidence and repair learning."],
  ["/observatory/about", "About VIGIL Observatory", "About the VIGIL AI governance incident observatory."],
  ["/observatory/cases", "VIGIL Case Files", "Browse documented AI incident investigations with evidence, classification, diagnosis and governance analysis."],
  ["/observatory/incidents", "VIGIL Incidents", "Browse canonical VIGIL AI incident records."],
  ["/observatory/knowledge-base", "VIGIL Knowledge Base", "VIGIL governance taxonomy, standards sources, policy and public knowledge resources."],
  ["/observatory/knowledge-base/failure-taxonomy", "VIGIL AI Governance Failure Taxonomy", "A structured taxonomy for classifying AI governance failure modes."],
  ["/observatory/knowledge-base/standards-sources", "VIGIL Standards Sources", "External governance standards and source material used by VIGIL."],
  ["/observatory/knowledge-base/external-requirements", "VIGIL External Requirements", "External governance requirements referenced by VIGIL."],
  ["/observatory/knowledge-base/policy", "VIGIL Policy", "Policy information for the VIGIL Observatory."],
];

for (const [route, title, description] of staticRoutes) {
  writeRoute(route, pageHtml({ route, title, description }));
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
  const description = record.summary || record.severity_assessment?.materialised_consequence || record.title || "VIGIL AI incident case file.";
  const body = `<main data-static-crawl-fallback="vigil-case" style="max-width:72rem;margin:0 auto;padding:2rem;font-family:system-ui,sans-serif">
    <p>VIGIL Observatory · ${escapeHtml(record.id)}</p>
    <h1>${escapeHtml(record.title || record.id)}</h1>
    <p>${escapeHtml(description)}</p>
    <dl>
      <dt>Classification status</dt><dd>${escapeHtml(record.classification_status || "not stated")}</dd>
      <dt>Severity</dt><dd>${escapeHtml(record.severity || "not stated")}</dd>
      <dt>Vendor / platform</dt><dd>${escapeHtml(record.platform_or_vendor || "not stated")}</dd>
    </dl>
  </main>`;
  writeRoute(route, pageHtml({ route, title, description, body }));
}

const sitemapRoutes = [
  "/",
  ...staticRoutes.map(([route]) => route),
  ...incidentRecords.map((record) => `/observatory/cases/${encodeURIComponent(record.id)}`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((route) => `  <url>
    <loc>${routeUrl(route)}</loc>
    <lastmod>${generatedDate}</lastmod>
  </url>`).join("\n")}
</urlset>
`;
writeFileSync(sitemapPath, sitemap);

console.log(`Prepared GitHub Pages SPA fallback: docs/404.html`);
console.log(`Generated ${staticRoutes.length} crawlable static route entrypoints`);
console.log(`Generated ${incidentRecords.length} crawlable VIGIL case entrypoints`);
console.log(`Generated sitemap with ${sitemapRoutes.length} URLs`);
console.log("Ensured GitHub Pages bypasses Jekyll: docs/.nojekyll");
