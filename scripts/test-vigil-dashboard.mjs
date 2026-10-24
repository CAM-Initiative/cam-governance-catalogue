import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");
import { globePosition, globeRotationForLongitude } from "../src/lib/vigilGlobeCoordinates.mjs";
import { failureClassIds, topFailureClasses, severityDistribution } from "../src/lib/vigilDashboardMetrics.mjs";
import { donutSegmentAppearance } from "../src/lib/vigilDonutSelection.mjs";

test("counts only explicitly failure-role mappings, once per Incident", () => {
  const raw = {
    primary_classification: { class_id: "VIGIL-FC-000072", classification_role: "failure-occurrence" },
    secondary_classifications: [
      { class_id: "VIGIL-FC-000072", classification_role: "failure-occurrence" },
      { class_id: "VIGIL-FC-000081", classification_role: "successful-invariant" },
      { class_id: "VIGIL-FC-000075", classification_role: "ambiguous-boundary" },
      { class_id: "VIGIL-FC-000083" },
    ],
  };
  assert.deepEqual(failureClassIds(raw), ["VIGIL-FC-000072"]);
  assert.deepEqual(topFailureClasses([{ raw }, { raw: { primary_classification: { class_id: "VIGIL-FC-000072", classification_role: "failure-occurrence" } } }]), [{ id: "VIGIL-FC-000072", count: 2 }]);
});
test("unknown severity remains visibly unassessed instead of being inferred", () => {
  const d = severityDistribution([{ severity: "S4" }, {}, { severity: "unknown" }]);
  assert.equal(d.find(v => v.code === "S4").count, 1);
  assert.equal(d.find(v => v.code === "SU").count, 2);
});

test("Globe-only preview shows heat-like beacons rather than numeric sidebar captions or a visible selector", async () => {
  const [dashboard, globe, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/EarthGlobe3D.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.ok(dashboard.includes("<GlobeView locations="));
  assert.ok(!dashboard.includes("Drag to explore the Earth; choose a country"));
  assert.ok(!dashboard.includes("Jurisdictions mapped</span>"));
  assert.ok(!dashboard.includes("Not geographically mapped</span>"));
  assert.ok(!dashboard.includes("vigil-dashboard-region-chips\">"));
  assert.ok(dashboard.includes("vigil-dashboard-country-keyboard"));
  assert.ok(dashboard.includes("vigil-dashboard-geo-disclosure"));
  assert.ok(css.includes(".vigil-dashboard-country-keyboard:focus-within"));
  assert.ok(globe.includes("Math.log1p(location.count)"));
  assert.ok(globe.includes("THREE.AdditiveBlending"));
  assert.ok(globe.includes("hoveredBeacon(event)"));
  assert.ok(globe.includes("is-over-beacon"));
  assert.ok(!globe.includes("state.targets = locations.map"));
  assert.ok(!globe.includes("Arc3") && !globe.includes("countryConnections"), "Avoid fabricating geographical connections");
});
test("Donut labels show bracketed counts, with dimensional layers and keyboard filtering", async () => {
  const dashboard = await source("src/components/vigil/VigilCasesDashboard.tsx");
  assert.ok(dashboard.includes(">{item.code} ({item.count})</text>"));
  assert.ok(dashboard.includes("vigil-donut-dimensional-shadow"));
  assert.ok(dashboard.includes("vigil-donut-face"));
  assert.ok(dashboard.includes("vigil-donut-shade-"));
  assert.match(dashboard, /onKeyDown=\{event\s*=>/, "Interactive chart remains keyboard operable");
});

test("Globe reset clears the same dashboard filters as the toolbar in both rendering modes", async () => {
  const [page, dashboard, globe] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/EarthGlobe3D.tsx"),
  ]);
  const clear = page.match(/const clearFilters = \(\) => \{([\s\S]*?)\};/)?.[1] ?? "";
  for (const setter of ["setSearch", "setClassification", "setSeverity", "setJurisdiction", "setFailureClass"]) {
    assert.ok(clear.includes(setter + '("");'), setter + " is cleared by the globe and toolbar");
  }
  assert.match(page, /onClick=\{clearFilters\}>Clear filters/);
  assert.match(page, /onClearFilters=\{clearFilters\}/);
  assert.match(dashboard, /<EarthGlobe3D[^>]*onClearFilters=\{onClearFilters\}/);
  assert.match(dashboard, /setRotation\(15\); onClearFilters\(\)/);
  assert.match(dashboard, /Reset globe view and clear filters/);
  assert.match(globe, /const reset = useCallback\(\(\) => \{\s*onClearFilters\(\)/);
  assert.match(globe, /onClick=\{reset\} aria-label="Reset globe view and clear filters"/);
});

test("Donut selection physically separates the chosen severity and keeps angular proportions", async () => {
  const active = donutSegmentAppearance(18, 12, 60, true, true);
  const neighbour = donutSegmentAppearance(18, 12, 60, false, true);
  const idle = donutSegmentAppearance(18, 12, 60, false, false);
  assert.ok(Math.hypot(active.offsetX, active.offsetY) >= 9.9, "Selected arc visibly moves outward");
  assert.equal(Math.hypot(neighbour.offsetX, neighbour.offsetY), 0);
  assert.ok(
    active.radius + active.strokeWidth / 2 + Math.hypot(active.offsetX, active.offsetY) >
      neighbour.radius + neighbour.strokeWidth / 2 + 15,
    "A selected segment must visibly extend past the neutral ring including its outward offset"
  );
  assert.equal(active.opacity, 1);
  assert.ok(neighbour.opacity < 0.65);
  assert.equal(idle.opacity, 1);
  const [dashboard, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.ok(dashboard.includes("donutSegmentAppearance(start, item.count, total, isSelected, Boolean(selected))"));
  assert.ok(dashboard.includes("const circumference = 2 * Math.PI * appearance.radius;"), "Arc share must use actual selected radius");
  assert.match(dashboard, /className="vigil-dashboard-donut-slice" transform=/);
  assert.match(dashboard, /selectedCount \?\? total/);
  assert.match(dashboard, /SELECTED/);
  assert.match(css, /\.vigil-dashboard-severity-callout\.is-muted/);
  assert.match(css, /\.vigil-dashboard-severity-callout\.is-selected/);
});

test("Case Files result count, Clear filters, and pagination retain readable side gutters", async () => {
  const [styles, page] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.css"),
    source("src/pages/vigil-cases.tsx"),
  ]);
  assert.match(page, /className="vigil-result-summary(?: [^"]+)?"/);
  assert.match(page, /Clear filters/);
  assert.match(page, /className="vigil-pagination"/);
  assert.match(styles, /\.vigil-dashboard-case-column \.vigil-result-summary \{\s*padding-inline: clamp\(0\.8rem, 2vw, 1\.25rem\)/);
  assert.match(styles, /\.vigil-dashboard-case-column \.vigil-result-summary button \{\s*margin-inline-start: auto/);
  assert.match(styles, /\.vigil-dashboard-case-column \.vigil-pagination \{\s*padding-inline: clamp\(0\.9rem, 2vw, 1\.25rem\)/);
  assert.match(styles, /@media \(max-width: 540px\) \{[\s\S]*?\.vigil-dashboard-case-column \.vigil-result-summary/);
});

const approx = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `expected ${actual} ≈ ${expected}`);

test("Earth beacons match THREE.SphereGeometry UV texture orientation, not a rotated hemisphere", () => {
  const cases = [
    { name: "Australia", lat: -25, lon: 134 },
    { name: "United States", lat: 39, lon: -98 },
    { name: "United Kingdom", lat: 54, lon: -3 },
    { name: "Brazil", lat: -10, lon: -52 },
    { name: "Kenya", lat: 0, lon: 38 },
    { name: "New Zealand", lat: -42, lon: 174 },
    { name: "Greenwich", lat: 0, lon: 0 },
    { name: "Date line", lat: 0, lon: 180 },
  ];
  for (const { name, lat, lon } of cases) {
    const { x, y, z } = globePosition(lat, lon, 1);
    // Independent reference: default Three SphereGeometry's UV-parametric
    // vertex convention, with equirectangular lon=0 at u=0.5.
    const u = (lon + 180) / 360;
    const v = (90 - lat) / 180;
    const phi = u * Math.PI * 2;
    const theta = v * Math.PI;
    approx(x, -Math.cos(phi) * Math.sin(theta));
    approx(y, Math.cos(theta));
    approx(z, Math.sin(phi) * Math.sin(theta));
    approx(Math.hypot(x, y, z), 1);
    // A selected country must face the +Z camera, never be behind the Earth.
    const spin = globeRotationForLongitude(lon);
    const cameraX = x * Math.cos(spin) + z * Math.sin(spin);
    const cameraZ = -x * Math.sin(spin) + z * Math.cos(spin);
    approx(cameraX, 0);
    assert.ok(cameraZ > 0.01, name + " must be on visible hemisphere");
  }
  assert.ok(globePosition(-25, 134, 1).x < 0, "Australia is east of Greenwich in sphere-local texture coordinates");
  assert.ok(globePosition(-25, 134, 1).z < 0, "Australia must align with Oceania in equirectangular texture");
});

test("Globe removes blue atmosphere, uses warm gold beacons, and derives selection rotation from mapped longitude", async () => {
  const [globe, css] = await Promise.all([
    source("src/components/vigil/EarthGlobe3D.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.ok(globe.includes("globePosition(lat, lon, radius)"));
  assert.ok(globe.includes("globeRotationForLongitude(marker.lon)"));
  assert.ok(globe.includes("globeRotationForLongitude(START_LONGITUDE)"));
  assert.ok(!globe.includes("THREE.ShaderMaterial"));
  assert.ok(!globe.includes("haloGeometry"));
  assert.ok(!globe.includes("0x63ecff"));
  assert.ok(!globe.includes("0xe0fbff"));
  assert.ok(globe.includes("0xffbd59"), "ordinary beacons glow gold");
  assert.ok(globe.includes("0xffd58a"), "beacon core is warm gold");
  assert.match(css, /\.vigil-case-library-page \.vigil-dashboard-globe-scene::before \{\s*content: none;\s*display: none;/);
});

test("Interactive doughnut has no rectangular black SVG focus borders and retains keyboard-only focus indication", async () => {
  const [dashboard, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.ok(dashboard.includes('tabIndex={0} role="button"'), "ring segments remain keyboard focusable");
  assert.ok(dashboard.includes('role="button" tabIndex={0}'), "callouts remain keyboard focusable");
  assert.ok(dashboard.includes('aria-pressed={selected===item.code}'));
  assert.match(css, /\.vigil-dashboard-severity-callout:focus-visible \{\s*outline: none;/);
  assert.match(css, /\.vigil-dashboard-donut-segment:focus-visible \{\s*filter: drop-shadow/);
  assert.match(css, /\.vigil-dashboard-severity-callout:focus-visible \{\s*filter: drop-shadow/);
});

test("Case Files search and classification filter have card-edge inset, and globe info glyph is lowercase", async () => {
  const [css, dashboard, page, workspace] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.css"),
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  assert.match(page, /<section className="vigil-library-toolbar vigil-dashboard-filter-hub"/);
  assert.match(page, /className="vigil-search-row vigil-case-table-search"/);
  assert.match(page, /<span>Classification<\/span>/);
  assert.doesNotMatch(page, /<span>Severity<\/span>/);
  assert.match(workspace, /\.vigil-case-library-page \.vigil-dashboard-filter-hub \{[\s\S]*?padding: clamp\(\.85rem, 1\.8vw, 1\.2rem\) clamp\(\.9rem, 2vw, 1\.35rem\)/);
  assert.match(workspace, /@media \(max-width: 720px\) \{[\s\S]*?\.vigil-dashboard-filter-hub \{ padding: \.8rem \.85rem;/);
  assert.match(dashboard, /<summary aria-label="Globe data and imagery information" title="Globe data information">i<\/summary>/);
  assert.match(css, /\.vigil-dashboard-geo-disclosure > summary \{\s*text-transform: lowercase;/);
});

// Guard against silent zero-beacon regressions as VIGIL's geography schema evolves.
test("Case Files uses all reviewed country associations for globe beacons and filtering", async () => {
  const [dashboard, page, helper] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/pages/vigil-cases.tsx"),
    source("src/lib/vigilDashboardGeography.mjs"),
  ]);
  assert.match(dashboard, /countryByCase: Map<string, string\[\]>/);
  assert.match(dashboard, /for \(const id of new Set\(countryIds\)\)/);
  assert.match(page, /countryByCase\.get\(record\.id\)\?\.includes\(jurisdiction\)/);
  assert.match(helper, /row\.reviewed_country_codes/);
  assert.match(helper, /row\?\.map_eligible/);
});

test("Insight panels stay compact while donut severity labels remain readable and selectable", async () => {
  const [dashboard, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  // Keep the requested concise presentation in every filter state.
  assert.ok(!dashboard.includes("filter active. Select that segment again"));
  assert.ok(!dashboard.includes("Select a coloured segment or label to filter cases."));
  assert.ok(!dashboard.includes("Incident-level assessments across the current selection."));
  assert.ok(!dashboard.includes("Number of case files with each explicitly evidenced failure occurrence;"));
  assert.match(dashboard, /aria-pressed=\{selected===item\.code\}/);
  assert.match(dashboard, /donutSegmentAppearance\(start, item\.count, total, isSelected, Boolean\(selected\)\)/);
  assert.match(dashboard, /const gap = Math\.min\(47, \(upper - lower\) \/ Math\.max\(1, group\.length - 1\)\)/);
  assert.match(css, /\.vigil-dashboard-severity-label \{\s*font: 480 19px/);
  assert.match(css, /\.vigil-dashboard-severity-name \{\s*font: 460 17px/);
  assert.match(css, /\.vigil-dashboard-severity-callout\.is-muted \{ opacity: \.76/);
  assert.match(css, /\.vigil-dashboard-failures-panel \.vigil-dashboard-failure-list \{ margin-top: \.5rem/);
});

test("All three insight panels share a top-right information disclosure; typography is subdued until selection", async () => {
  const [dashboard, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.equal((dashboard.match(/<details className="vigil-dashboard-[^"]*panel-info"/g) ?? []).length, 3);
  assert.match(dashboard, /<summary aria-label="Globe data and imagery information"/);
  assert.match(dashboard, /<summary aria-label="Harm severity chart information"/);
  assert.match(dashboard, /<summary aria-label="Taxonomy intelligence counts information"/);
  assert.equal((dashboard.match(/Counts are distinct incidents, not mentions or evidence-source citations\./g) ?? []).length, 1);
  assert.doesNotMatch(dashboard, /<p className="vigil-dashboard-source-note">Counts are distinct incidents/);
  assert.match(css, /\.vigil-case-library-page \.vigil-dashboard-panel-info \{\s*position: absolute;\s*z-index: 8;\s*top: \.55rem;\s*right: \.55rem;/);
  assert.match(css, /\.vigil-dashboard-severity-callout\.is-selected \.vigil-dashboard-severity-label \{\s*font-size: 20\.5px;\s*font-weight: 750;/);
  assert.match(dashboard, /const calloutColor = selected === item\.code \? item\.color : "#99a9b8"/);
  assert.match(dashboard, /style=\{selected === item\.code \? \{ fill: item\.color \} : undefined\}/);
});

test("Experimental shared filter hub spans list and all dashboard instruments", async () => {
  const [page, styles, dashboard] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
    source("src/components/vigil/VigilCasesDashboard.tsx"),
  ]);
  const filterPosition = page.indexOf('className="vigil-library-toolbar vigil-dashboard-filter-hub"');
  const layoutPosition = page.indexOf('className="vigil-dashboard-layout"');
  assert.ok(filterPosition >= 0 && layoutPosition > filterPosition, "Shared query hub must be above both columns");
  assert.ok(page.includes('className="vigil-dashboard-case-heading"'));
  assert.ok(page.includes('className="vigil-result-summary vigil-dashboard-shared-selection"'));
  assert.match(page, /onClick=\{clearFilters\}>Clear filters/);
  assert.ok(page.includes('onClick={() => setJurisdiction("")}'));
  assert.match(styles, /html:not\(\[data-theme="dark"\]\) \.vigil-case-library-page \.vigil-dashboard-panel \{/);
  assert.match(styles, /\.vigil-dashboard-selection-chip:focus-visible/);
  assert.match(dashboard, /<Globe2 size=\{19\} \/> Jurisdiction coverage/);
  assert.match(dashboard, /Geographic Profile/);
  assert.doesNotMatch(dashboard, /Geographic intelligence/);
  assert.doesNotMatch(page, /One connected evidence set/);
  assert.doesNotMatch(page, /All severities/);
  assert.doesNotMatch(page, /severityStates/);
  assert.match(page, /onSeverity=\{setSeverity\}/);
  assert.match(dashboard, /<SeverityDonut records=\{distributionRecords\} selected=\{severity\} onSelect=\{onSeverity\}/);
});

// Touch this regression test to regenerate publication assets from the final review branch head.
