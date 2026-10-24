import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");
import { globePosition, globeRotationForLongitude } from "../src/lib/vigilGlobeCoordinates.mjs";
import { failureClassIds, topFailureClasses, severityDistribution } from "../src/lib/vigilDashboardMetrics.mjs";
import { donutSegmentAppearance } from "../src/lib/vigilDonutSelection.mjs";
import { matchesClassificationSelection, toggleClassificationSelection } from "../src/lib/vigilClassificationFilter.mjs";
import { INDEX_FACETS, NOT_INDEXED, indexFacetValues, indexFacetOptions, matchesIndexFacets, toggleIndexFacetSelection, facetOptionLabel } from "../src/lib/vigilIndexFacets.mjs";
import { layoutSeverityCallouts, CALLOUT_GEOMETRY } from "../src/lib/vigilDonutCallouts.mjs";
import { reconcileHarmSidecar, hasEvidencedHarmType, harmTypeCounts } from "../src/lib/vigilHarmDimensions.mjs";

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
test("Donut restores connected two-sided severity labels and keyboard selection", async () => {
  const dashboard = await source("src/components/vigil/VigilCasesDashboard.tsx");
  assert.ok(dashboard.includes("layoutSeverityCallouts"));
  assert.ok(dashboard.includes("vigil-dashboard-severity-callout"));
  assert.ok(dashboard.includes("vigil-dashboard-severity-name"));
  assert.ok(dashboard.includes("vigil-dashboard-severity-label"));
  assert.ok(dashboard.includes("vigil-donut-dimensional-shadow"));
  assert.ok(dashboard.includes("vigil-donut-face"));
  assert.ok(dashboard.includes("vigil-donut-shade-"));
  assert.doesNotMatch(dashboard, /vigil-dashboard-severity-key|vigil-dashboard-severity-item/);
  assert.match(dashboard, /onKeyDown=\{event\s*=>/, "Interactive chart remains keyboard operable");
});

test("Globe reset button is absent; selected countries still clear from the left rail", async () => {
  const [page, dashboard, globe] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/EarthGlobe3D.tsx"),
  ]);
  assert.ok(page.includes("onClick={clearFilters}>Clear filters"));
  assert.ok(dashboard.includes("<GlobeView locations="));
  assert.ok(globe.includes("callbackRef.current(hit.id)"));
  for (const x of [dashboard, globe]) {
    assert.ok(!x.includes("vigil-dashboard-reset-rotation"));
    assert.ok(!x.includes("onClearFilters"));
    assert.ok(!x.includes("RotateCcw"));
  }
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
  assert.ok(!dashboard.includes("vigil-dashboard-donut-caption"));
  assert.ok(dashboard.includes("vigil-dashboard-severity-callout"));
  assert.ok(dashboard.includes("aria-pressed={active}"));
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

test("Interactive donut and leader-line labels remain keyboard operable", async () => {
  const [dashboard, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.ok(dashboard.includes('tabIndex={0} role="button"'), "ring segments remain keyboard focusable");
  assert.ok(dashboard.includes('role="button" tabIndex={0}'), "connected callouts remain keyboard focusable");
  assert.ok(dashboard.includes('aria-pressed={active}'));
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
  assert.match(page, /className="vigil-dashboard-filter-search" role="search"/);
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
  assert.match(page, /matchesSelectedCountries\(countryByCase\.get\(record\.id\), jurisdictions\)/);
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
  assert.match(dashboard, /aria-pressed=\{active\}/);
  assert.match(dashboard, /donutSegmentAppearance\(start, item\.count, total, isSelected, Boolean\(selected\)\)/);
  assert.match(dashboard, /layoutSeverityCallouts\(/);
  assert.match(dashboard, /labels\.map\(item =>/);
  assert.match(dashboard, /strokeWidth=\{active \? 2\.6 : 1\.6\}/);
  assert.match(css, /\.vigil-dashboard-failures-panel \.vigil-dashboard-failure-list \{ margin-top: \.5rem/);
});

test("All three insight panels retain disclosures and selected leader-line labels", async () => {
  const [dashboard, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.equal((dashboard.match(/<details className="vigil-dashboard-[^"]*panel-info"/g) ?? []).length, 4);
  assert.match(dashboard, /<summary aria-label="Globe data and imagery information"/);
  assert.match(dashboard, /<summary aria-label="Harm severity chart information"/);
  assert.match(dashboard, /<summary aria-label="Taxonomy intelligence counts information"/);
  assert.equal((dashboard.match(/Counts represent distinct Case Files, not mentions or evidence-source citations\./g) ?? []).length, 1);
  assert.match(dashboard, /Selecting a class filters the Case Files and other charts without reordering this list/);
  assert.doesNotMatch(dashboard, /<p className="vigil-dashboard-source-note">Counts are distinct incidents/);
  assert.match(css, /\.vigil-case-library-page \.vigil-dashboard-panel-info \{\s*position: absolute;\s*z-index: 8;\s*top: \.55rem;\s*right: \.55rem;/);
  assert.match(dashboard, /className=\{`vigil-dashboard-severity-callout\$\{active \? " is-selected"/);
  assert.match(dashboard, /className="vigil-dashboard-severity-name"/);
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
  assert.ok(page.includes('className="vigil-dashboard-filter-search"'));
  assert.equal((page.match(/className="vigil-dashboard-filter-search"/g) ?? []).length, 1, "One search control filters the whole dashboard");
  assert.ok(page.includes('<div className="vigil-result-summary vigil-dashboard-shared-selection"'));
  assert.match(page, /onClick=\{clearFilters\}>Clear filters/);
  assert.ok(page.includes('onClick={() => toggleJurisdiction(code)}'));
  assert.match(styles, /html:not\(\[data-theme="dark"\]\) \.vigil-case-library-page \.vigil-dashboard-panel \{/);
  assert.match(styles, /\.vigil-dashboard-selection-chip:focus-visible/);
  assert.match(dashboard, /<Globe2 size=\{19\} aria-hidden="true" \/> Geographic Profile/);
  assert.match(dashboard, /Geographic Profile/);
  assert.doesNotMatch(dashboard, /Geographic intelligence/);
  assert.doesNotMatch(page, /One connected evidence set/);
  assert.doesNotMatch(page, /All severities/);
  assert.doesNotMatch(page, /severityStates/);
  assert.match(page, /onSeverity=\{setSeverity\}/);
  assert.match(page, /jurisdictions=\{jurisdictions\}/);
  assert.match(page, /jurisdictions\.map\(code =>/);
  assert.doesNotMatch(page, /\{sorted\.length\} in this view/);
  assert.match(dashboard, /<SeverityDonut records=\{distributionRecords\} selected=\{severity\} onSelect=\{onSeverity\}/);
});

test("Three-column desktop workbench keeps one filter source and accessible reading order", async () => {
  const [page, styles] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  const workbench = page.indexOf('className="vigil-dashboard-workspace"');
  const filters = page.indexOf('className="vigil-library-toolbar vigil-dashboard-filter-hub"');
  const results = page.indexOf('className="vigil-dashboard-case-column"');
  const insights = page.indexOf('<VigilCasesDashboard');
  assert.ok(workbench >= 0 && filters > workbench && results > filters && insights > results,
    "One workbench follows the accessible filters, case list, then insights reading order");
  assert.equal((page.match(/className="vigil-library-toolbar vigil-dashboard-filter-hub"/g) ?? []).length, 1);
  assert.equal((page.match(/<VigilCasesDashboard/g) ?? []).length, 1);
  assert.match(page, /className="vigil-dashboard-filter-match-count" aria-live="polite"/);
  assert.doesNotMatch(page, /vigil-dashboard-match-count/);
  assert.ok(page.includes('<div className="vigil-result-summary vigil-dashboard-shared-selection"'), "The matching total stays visible even when no filter is active");
  assert.ok(page.includes('onClick={() => toggleJurisdiction(code)}'), "Country chips still remove individual countries");
  assert.ok(styles.includes("@media (min-width: 1320px) {"));
  assert.ok(styles.includes("grid-template-columns: clamp(225px, 17.5vw, 250px) minmax(0, 1fr)"));
  assert.ok(styles.includes("grid-template-columns: minmax(0, 1fr) minmax(300px, 328px)"));
  assert.ok(styles.includes(".vigil-dashboard-case-column .vigil-case-table-row-link"));
  assert.ok(styles.includes("@media (max-width: 1319px)"));
  assert.ok(styles.includes("grid-template-columns: minmax(0, 1fr);\n  }"));

});


test("One persistent total reflects distinct matching incidents, not page slice or country multiplier", async () => {
  const page = await source("src/pages/vigil-cases.tsx");
  assert.match(page, /matchesSelectedCountries\(countryByCase\.get\(record\.id\), jurisdictions\)/);
  assert.match(page, /const sorted = useMemo\(\(\) => \[\.\.\.filtered\]\.sort/);
  assert.match(page, /\{sorted\.length\} matching \{sorted\.length === 1 \? "case file" : "case files"\}/);
  assert.doesNotMatch(page, /pageStart|pageEnd|Showing .* on this page|unique matching/);
  assert.equal((page.match(/vigil-dashboard-filter-match-count/g) ?? []).length, 1);
  assert.match(page, /className="vigil-pagination"/);
});

test("Mobile Case Files restores overhead filters, one case list, and stacked insights beneath", async () => {
  const [page, css] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  const filter = page.indexOf('className="vigil-library-toolbar vigil-dashboard-filter-hub"');
  const cases = page.indexOf('className="vigil-dashboard-case-column"');
  const insights = page.indexOf('<VigilCasesDashboard');
  assert.ok(filter >= 0 && cases > filter && insights > cases,
    "DOM order remains filters then Case Files then geographic/harm/taxonomy insights");
  const mobile = css.slice(css.lastIndexOf("/* Preserve the original mobile reading experience"));
  assert.ok(mobile.includes("@media (max-width: 1140px)"));
  assert.ok(mobile.includes("grid-template-columns: minmax(0, 1fr)"));
  assert.ok(mobile.includes("flex-direction: column"));
  assert.ok(mobile.includes("position: static"));
  assert.ok(mobile.includes("@media (max-width: 820px)"));
  assert.ok(mobile.includes("@media (max-width: 640px)"));
  assert.ok(mobile.includes(".vigil-case-library-page .vigil-dashboard-donut"));
  assert.ok(!mobile.includes(".vigil-dashboard-severity-key"));
});

test("Leader-line positions avoid overlapping at extreme proportions", () => {
  const severityCodes = ["S1", "S2", "S3", "S4", "S5", "SU"];
  const fixtures = [
    [23, 39, 68, 21, 4, 45],
    [1, 1, 1, 1, 1, 100],
    [100, 1, 1, 1, 1, 1],
    [1, 100, 1, 1, 1, 1],
    [1, 1, 100, 1, 1, 1],
    [1, 1, 1, 100, 1, 1],
    [1, 1, 1, 1, 100, 1],
    [0, 0, 0, 0, 0, 0],
  ];
  for (const counts of fixtures) {
    const total = counts.reduce((a,b) => a+b, 0);
    const labels = layoutSeverityCallouts(severityCodes.map((code,index) => ({
      code, count: counts[index],
    })), total);
    assert.equal(labels.length, counts.filter(count => count > 0).length);
    for (const label of labels) {
      assert.ok(Number.isFinite(label.y));
      assert.ok(label.y >= CALLOUT_GEOMETRY.minY - 0.01);
      assert.ok(label.y <= CALLOUT_GEOMETRY.maxY + 0.01);
    }
    for (const side of ["left", "right"]) {
      const items = labels.filter(item=>item.side===side).sort((a,b)=>a.y-b.y);
      for (let i=1;i<items.length;i++) {
        assert.ok(items[i].y - items[i-1].y >= 43,
          `Overlapping ${side}-hand labels: ${items[i-1].code} and ${items[i].code}`);
      }
    }
  }
});

test("Light-mode analytic cards use pale neutrals distinct from the image-layered hero", async () => {
  const [styles, masthead] = await Promise.all([
    source("src/vigil-dashboard-workspace-experiment.css"),
    source("src/vigil-observatory-masthead.css"),
  ]);
  assert.match(masthead, /soft-grey/);
  assert.match(masthead, /hsl\(30 4% 88%\)/);
  assert.match(masthead, /--masthead-artwork-opacity: 0\.82/);
  assert.match(styles, /masthead's peach effect is composited from grey backing/);
  assert.match(styles, /hsl\(27 7% 98%\)/);
  assert.match(styles, /hsl\(28 10% 94%\)/);
  assert.doesNotMatch(styles, /hsl\(26 15% 82%\)|hsl\(27 16% 79%\)/);
  assert.match(styles, /\.vigil-dashboard-severity-callout\.is-selected/);
  assert.ok(!styles.includes("grid-template-columns: minmax(0, .98fr) minmax(0, 1.02fr)"));
});

test("Classification checklist combines outcomes by union and supports independent chip removal", async () => {
  const page = await source("src/pages/vigil-cases.tsx");
  const styles = await source("src/vigil-dashboard-workspace-experiment.css");
  let active = [];
  active = toggleClassificationSelection(active, "failureevidenced");
  active = toggleClassificationSelection(active, "adjudicationincomplete");
  active = toggleClassificationSelection(active, "unclassified");
  assert.deepEqual(active, ["failureevidenced", "adjudicationincomplete", "unclassified"]);
  assert.equal(matchesClassificationSelection("failureevidenced", active), true);
  assert.equal(matchesClassificationSelection("adjudicationincomplete", active), true);
  assert.equal(matchesClassificationSelection("invariantheld", active), false);
  active = toggleClassificationSelection(active, "adjudicationincomplete");
  assert.deepEqual(active, ["failureevidenced", "unclassified"]);
  assert.equal(matchesClassificationSelection("invariantheld", []), true);
  assert.equal(toggleClassificationSelection(active, "").length, 2);
  assert.match(page, /<details className="vigil-dashboard-classification-facet"/);
  assert.match(page, /<summary className="vigil-dashboard-facet-heading">/);
  assert.match(page, /type="checkbox" checked=\{classifications\.includes\(entry\.key\)\}/);
  assert.match(page, /\{entry\.count\}/);
  assert.match(page, /classifications\.map\(key => <button/);
  assert.match(page, /matchesClassificationSelection\(canonicalComparisonKey\(classificationStatusLabel\(record\)\), classifications\)/);
  assert.match(page, /setClassifications\(\[\]\)/);
  assert.doesNotMatch(page, /<select value=\{classification\}/);
  assert.ok(styles.includes(".vigil-dashboard-classification-facet,"));
  assert.ok(styles.includes(".vigil-dashboard-index-facet {"));
  assert.match(styles, /\.vigil-dashboard-facet-option input\[type="checkbox"\]/);
  assert.match(styles, /background: transparent;\s*box-shadow: none;/);
});

test("Index-backed facets preserve year provenance, explicit unknowns and absence of inferred compliance", () => {
  const a = { raw: {
    occurred_from: "2026-06-18", date_recorded: "2026-10-24",
    platform_or_vendor: "OpenAI",
    agent_context: { agentic_status: "agentic" },
    occurrence_environment: {
      deployment_state: "pre-deployment", external_reach: "real-world",
      activity_contexts: ["evaluation", "research", "evaluation"],
    },
    adjudication_coverage: { status: "complete" },
    source_roles: ["incident-evidence", "harm-evidence", "incident-evidence"],
    external_requirement_assessment_count: 3,
    external_assessment_count: 0,
    primary_classification: { class_id: "VIGIL-FC-000042", classification_role: "failure-occurrence" },
    secondary_classifications: [
      { class_id: "VIGIL-FC-000042", classification_role: "successful-invariant" },
      { class_id: "VIGIL-FC-000075", classification_role: "ambiguous-boundary" },
      { class_id: "VIGIL-FC-000083" },
    ],
  }};
  const b = { raw: { occurred_from: null, date_recorded: "2026-10-24",
    agent_context: { agentic_status: "non-agentic" },
    external_requirement_assessment_count: 0,
  }};
  const c = { raw: { occurred_from: "2025-02-30", date_recorded: "2026-05-01",
    agent_context: { agentic_status: "agentic" },
  }};
  assert.deepEqual(indexFacetValues(a, "year"), ["2026"]);
  assert.deepEqual(indexFacetValues(b, "year"), [NOT_INDEXED], "recorded date must not substitute for occurrence date");
  assert.deepEqual(indexFacetValues(c, "year"), [NOT_INDEXED], "invalid dates must not be silently interpreted");
  assert.deepEqual(indexFacetValues(a, "activity"), ["evaluation", "research"]);
  assert.deepEqual(indexFacetValues(a, "externalAssessments"), ["none"]);
  assert.deepEqual(indexFacetValues(a, "requirements"), [], "retired facets are not offered");
  assert.deepEqual(indexFacetValues(a, "sourceRole"), [], "source roles are not selectable here");
  assert.deepEqual(indexFacetValues(a, "mappedClass"), [], "taxonomy ranking remains a separate instrument");
  assert.equal(facetOptionLabel("year",NOT_INDEXED),"Not established in index");
  assert.deepEqual(indexFacetOptions([a,b,c], "agentic").map(x => x.count), [2,1]);
  assert.deepEqual(indexFacetOptions([a,b,c], "year").map(x => [x.key,x.count]), [["2026",1],[NOT_INDEXED,2]]);
  assert.equal(indexFacetOptions([a,b,c], "activity").find(x=>x.key==="evaluation")?.count, 1);
});

test("Indexed metadata multiple choices use union within facets and intersection across facets", () => {
  const records = [
    { raw: {occurred_from:"2025-02", agent_context:{agentic_status:"agentic"}, platform_or_vendor:"Vendor A"} },
    { raw: {occurred_from:"2026", agent_context:{agentic_status:"agentic"}, platform_or_vendor:"Vendor B"} },
    { raw: {occurred_from:"2026", agent_context:{agentic_status:"non-agentic"}, platform_or_vendor:"Vendor C"} },
    { raw: {occurred_from:null, agent_context:{agentic_status:"agentic"}, platform_or_vendor:"Vendor A"} },
  ];
  let selected = {};
  selected = toggleIndexFacetSelection(selected,"year","2025");
  selected = toggleIndexFacetSelection(selected,"year","2026");
  selected = toggleIndexFacetSelection(selected,"agentic","agentic");
  assert.deepEqual(records.filter(r=>matchesIndexFacets(r,selected)).map(r=>r.raw.platform_or_vendor),["Vendor A","Vendor B"]);
  selected = toggleIndexFacetSelection(selected,"year","2025");
  assert.deepEqual(records.filter(r=>matchesIndexFacets(r,selected)).map(r=>r.raw.platform_or_vendor),["Vendor B"]);
  selected = toggleIndexFacetSelection(selected,"year",NOT_INDEXED);
  assert.deepEqual(records.filter(r=>matchesIndexFacets(r,selected)).map(r=>r.raw.platform_or_vendor),["Vendor B","Vendor A"]);
  selected = toggleIndexFacetSelection(selected,"year","2026");
  selected = toggleIndexFacetSelection(selected,"year",NOT_INDEXED);
  assert.equal("year" in selected,false);
  assert.equal(records.filter(r=>matchesIndexFacets(r,selected)).length,3);
});

test("Indexed facet UI is disclosure-based, resettable, and uses only the published projection", async () => {
  const [page, css] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  for (const id of ["year","agentic","deployment","activity","vendor",
    "adjudication","externalAssessments"]) {
    assert.ok(INDEX_FACETS.some(f=>f.id===id), `${id} exists in index facet registry`);
  }
  for (const id of ["mappedClass","requirements","sourceRole","externalReach"]) {
    assert.ok(!INDEX_FACETS.some(f=>f.id===id), `${id} was removed from the left filter rail`);
  }
  assert.match(page, /indexFacetOptions\(records, facet\.id\)/);
  assert.match(page, /matchesIndexFacets\(record, indexFacets\)/);
  assert.match(page, /indexedFacetCatalog\.map\(facet => <IndexFacet/);
  assert.match(page, /setIndexFacets\(\{\}\)/);
  assert.match(page, /toggleIndexFacet\(id, key\)/);
  assert.match(page, /type="checkbox" checked=\{selected\.includes\(option\.key\)\}/);
  assert.match(page, /Object\.entries\(indexFacets\)\.flatMap/);
  assert.match(css, /max-height: calc\(100dvh - 6\.2rem\)/);
  assert.match(css, /\.vigil-dashboard-index-facet\[open\]/);
  assert.match(css, /\.vigil-dashboard-metadata-facets \{/);
});

test("Donut gives S4 a long lower-left leader line without displacing S3", () => {
  const fixture = [
    {code:"S1",count:23},{code:"S2",count:39},{code:"S3",count:68},
    {code:"S4",count:21},{code:"S5",count:4},{code:"SU",count:45},
  ];
  const labels = layoutSeverityCallouts(fixture, fixture.reduce((sum,item)=>sum+item.count,0));
  const s3 = labels.find(item=>item.code==="S3");
  const s4 = labels.find(item=>item.code==="S4");
  const s5 = labels.find(item=>item.code==="S5");
  assert.equal(s3.side,"right");
  assert.equal(s4.side,"left");
  assert.ok(s4.y >= 248, "S4 callout extends into lower-left blank space");
  assert.ok(Math.abs(s4.y-s3.y) < 23, "S4 label mirrors S3's lower-right line");
  assert.ok(s4.y - s5.y >= CALLOUT_GEOMETRY.minGap, "S4 does not overlap S5");
  const naturalS4Y = CALLOUT_GEOMETRY.centerY + Math.sin(s4.midAngle)*100;
  assert.ok(s4.y-naturalS4Y >= 60, "S4 line is visibly lengthened");
});

test("Collapsed facets hide All, and vendor list is searchable, scrollable and mobile-limited", async () => {
  const [page, css] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  assert.doesNotMatch(page, /selected\.length \? `\$\{selected\.length\} selected` : "All"/);
  assert.doesNotMatch(page, /classifications\.length \? `\$\{classifications\.length\} selected` : "All"/);
  assert.match(page, /selected\.length > 0 && <span>/);
  assert.match(page, /classifications\.length > 0 && <span>/);
  assert.match(page, /id === "vendor"/);
  assert.match(page, /Search platform and vendor options/);
  assert.match(page, /setVendorQuery\(event\.target\.value\)/);
  assert.match(page, /vendorExpanded \? "Show fewer vendors"/);
  assert.match(page, /aria-expanded=\{vendorExpanded\}/);
  assert.match(css, /\.vigil-dashboard-index-facet\.is-vendor \.vigil-dashboard-facet-options/);
  assert.match(css, /overflow-y: auto;/);
  assert.match(css, /nth-of-type\(n\+8\)/);
  assert.match(css, /@media \(max-width: 1140px\)/);
  assert.match(css, /\.vigil-dashboard-vendor-show-more/);
  assert.match(css, /min\(15rem, 38dvh\)/);
  assert.match(page, /const vendorListRef = useRef<HTMLDivElement \| null>\(null\)/);
  assert.match(page, /element\.scrollBy\(\{ top: direction/);
  assert.match(page, /onScroll=\{isVendor \? refreshVendorScroll : undefined\}/);
  assert.match(page, /Scroll vendor list up/);
  assert.match(page, /Scroll vendor list down/);
  assert.match(page, /disabled=\{!vendorScroll\.up\}/);
  assert.match(page, /disabled=\{!vendorScroll\.down\}/);
  assert.match(page, /vendorScroll\.up|vendorScroll\.down/);
  assert.match(css, /scrollbar-gutter: stable/);
  assert.match(css, /scrollbar-width: auto/);
  assert.match(css, /::-webkit-scrollbar-thumb/);
  assert.match(css, /\.vigil-dashboard-vendor-scroll-buttons button:focus-visible/);
  assert.match(css, /\.vigil-dashboard-index-facet\.is-vendor\.is-expanded/);
  assert.match(css, /max-height: none;\s*overflow-y: visible/);
});

test("Case Files mono sidebar title and sans navigation retain other typography boundaries", async () => {
  const [css, dossier] = await Promise.all([
    source("src/vigil-dashboard-workspace-experiment.css"),
    source("src/vigil-observatory-instrument-experiment.css"),
  ]);
  assert.ok(css.includes("font: 600 .94rem/1.45 var(--app-font-sans), sans-serif;"));
  assert.match(css, /\.vigil-dashboard-facet-option \{[\s\S]*?font-family: var\(--app-font-sans\)/);
  assert.match(css, /\.vigil-dashboard-filter-hub \.vigil-dashboard-filter-search input \{[\s\S]*?font-family: var\(--app-font-sans\)/);
  assert.match(css, /\.vigil-dashboard-case-column \.vigil-case-table-text \{[\s\S]*?font-family: var\(--app-font-sans\)/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) 132px 72px 18px;/);
  assert.match(css, /\.vigil-dashboard-case-column \.vigil-case-sort-heading \{[\s\S]*?white-space: nowrap;/);
  assert.match(dossier, /\.vigil-case-file-page \.vigil-case-stage-tabs button \{[\s\S]*?font-family: var\(--app-font-sans\)/);
  assert.match(dossier, /\.vigil-case-file-page \.vigil-case-stage-tabs button span \{[\s\S]*?font-family: var\(--app-font-mono\)/);
});

test("Harm severity ring grows modestly but retains accessible callouts and selected expansion", async () => {
  const [dashboard, ring, workspace] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/lib/vigilDonutSelection.mjs"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  const normal = donutSegmentAppearance(0, 20, 100, false, false);
  const selected = donutSegmentAppearance(0, 20, 100, true, true);
  assert.equal(normal.radius, 75);
  assert.equal(selected.radius, 78);
  assert.equal(normal.strokeWidth, 25);
  assert.ok(normal.radius > 70 && normal.radius < 80, "ring enlargement remains modest");
  assert.match(dashboard, /r="75" fill="none" className="vigil-dashboard-donut-track"/);
  assert.match(dashboard, /const x0 = cx \+ dx \* \(active \? 106 : 91\)/);
  assert.match(dashboard, /role="button" tabIndex=\{0\} aria-label=\{`Filter/);
  assert.match(workspace, /\.vigil-dashboard-donut \{[\s\S]*?max-width: 440px;/);
  assert.ok(selected.radius + selected.strokeWidth / 2 > normal.radius + normal.strokeWidth / 2);
});

test("Matching-case title, conditional clear action, chips and live total occupy the filter rail", async () => {
  const [page, css] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  const heading = page.indexOf('id="case-filter-heading"');
  const chips = page.indexOf('className="vigil-dashboard-selection-chips"');
  const count = page.indexOf('className="vigil-dashboard-filter-match-count"');
  const facets = page.indexOf('className="vigil-dashboard-metadata-facets"');
  const cases = page.indexOf('className="vigil-dashboard-case-column"');
  const search = page.indexOf('className="vigil-dashboard-filter-search"');
  assert.ok(heading > 0 && chips > heading && count > chips && facets > count);
  assert.ok(count < search && search < facets && facets < cases, "Search follows the filter summary and precedes Classification; Case Files align with the globe");
  assert.ok(page.includes('<h2 id="case-filter-heading">Filters</h2>'));
  assert.match(page, /\{hasActiveFilters && <button type="button" className="vigil-dashboard-clear-all"/);
  assert.match(page, /\{hasActiveFilters && <div className="vigil-dashboard-selection-chips">/);
  assert.match(css, /\.vigil-dashboard-filter-hub \.vigil-dashboard-filter-controls/);
  assert.ok(!page.includes("Current view") && !page.includes("Matching case files</span>"));
});

test("Filter rail removes counts tooltip and retains sans dropdown choices", async () => {
  const [page, css] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  assert.doesNotMatch(page, /vigil-dashboard-facet-help|About filter counts|Counts reflect the full loaded index/);
  assert.doesNotMatch(css, /vigil-dashboard-facet-help|vigil-dashboard-facet-guidance/);
  assert.match(css, /\.vigil-dashboard-facet-option \{[\s\S]*?font-family: var\(--app-font-sans\)/);
  assert.ok(css.includes("font: 600 .94rem/1.45 var(--app-font-sans), sans-serif;"));
  assert.match(css, /\.vigil-dashboard-vendor-search input \{[\s\S]*?var\(--app-font-sans\)/);
});

test("Three insight widgets have a single icon-bearing title with no kicker", async () => {
  const dashboard = await source("src/components/vigil/VigilCasesDashboard.tsx");
  assert.match(dashboard, /<h2 id="vigil-dashboard-geography"><Globe2 size=\{19\} aria-hidden="true" \/> Geographic Profile<\/h2>/);
  assert.match(dashboard, /<h2 id="vigil-dashboard-severity"><ShieldAlert size=\{19\} aria-hidden="true" \/> Harm Severity<\/h2>/);
  assert.match(dashboard, /<h2 id="vigil-dashboard-failures"><Layers3 size=\{19\} aria-hidden="true" \/> Taxonomy Frequent Failures<\/h2>/);
  assert.doesNotMatch(dashboard, /vigil-dashboard-kicker|Jurisdiction coverage<\/h2>|Risk profile<\/span>|Most frequent failures<\/h2>/);
});

test("Taxonomy ranking excludes its own active class so clicking a failure does not reorder the list", async () => {
  const [page, dashboard] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/components/vigil/VigilCasesDashboard.tsx"),
  ]);
  // A selection that once promoted this class to first must leave ranking data
  // scoped to the other active filters instead of feeding back onto itself.
  const fixture = [
    { raw: { primary_classification: { class_id: "VIGIL-FC-000001", classification_role: "failure-occurrence" } } },
    { raw: { primary_classification: { class_id: "VIGIL-FC-000001", classification_role: "failure-occurrence" } } },
    { raw: { primary_classification: { class_id: "VIGIL-FC-000001", classification_role: "failure-occurrence" } } },
    { raw: { primary_classification: { class_id: "VIGIL-FC-000002", classification_role: "failure-occurrence" } } },
    { raw: { primary_classification: { class_id: "VIGIL-FC-000002", classification_role: "failure-occurrence" } } },
  ];
  const ranking = topFailureClasses(fixture);
  assert.deepEqual(ranking.map(item => item.id), ["VIGIL-FC-000001", "VIGIL-FC-000002"]);
  const selectedCases = fixture.filter(record => failureClassIds(record.raw).includes("VIGIL-FC-000002"));
  assert.deepEqual(topFailureClasses(selectedCases).map(item => item.id), ["VIGIL-FC-000002"]);
  // The public chart MUST use the original, other-filters-only population,
  // while case results continue to use the selected-class intersection.
  assert.match(page, /const rankingBaseCases = useMemo\(\(\) => records\.filter/);
  assert.match(page, /const baseCases = useMemo\(\(\) => rankingBaseCases\.filter\(record =>/);
  assert.match(page, /!failureClass \|\| failureClassIds\(record\.raw\)\.includes\(failureClass\)/);
  assert.match(page, /const taxonomyRecords = useMemo\(\(\) => rankingBaseCases\.filter\(record =>/);
  assert.match(page, /matchesSelectedCountries\(countryByCase\.get\(record\.id\), jurisdictions\)/);
  assert.match(page, /!severity \|\| severityCode\(record\) === severity/);
  assert.match(page, /taxonomyRecords=\{taxonomyRecords\}/);
  assert.match(dashboard, /topFailureClasses\(taxonomyRecords\)/);
  assert.doesNotMatch(dashboard, /topFailureClasses\(filteredRecords\)/);
  assert.match(dashboard, /aria-pressed=\{failureClass===entry\.id\}/);
  assert.match(dashboard, /Selecting a class filters the Case Files and other charts without reordering this list/);
});

test("Narrow desktop search rail uses concise placeholder without losing the accessible description", async () => {
  const [page, css] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  assert.match(page, /<span className="sr-only">Describe the behaviour you’re seeing…<\/span>/);
  assert.match(page, /placeholder="Search Case Files…"/);
  assert.doesNotMatch(page, /placeholder="Describe the behaviour you’re seeing…"/);
  assert.match(css, /grid-template-columns: clamp\(225px, 17\.5vw, 250px\)/);
  assert.match(css, /\.vigil-dashboard-filter-hub \.vigil-dashboard-filter-search input \{[\s\S]*?min-width: 0;[\s\S]*?width: 0;[\s\S]*?flex: 1 1 0%/);
  assert.match(page, /onClick=\{\(\) => setSearch\(""\)\} aria-label="Clear search"/);
});

test("Dashboard calm pass unifies case typography and compacts darker light-theme instruments", async () => {
  const [page, dashboard, globe, css] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/EarthGlobe3D.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  assert.ok(page.includes('<h2 id="case-filter-heading">Filters</h2>'));
  assert.equal((page.match(/className="vigil-dashboard-clear-all"/g) ?? []).length, 1);
  assert.ok(css.includes("font-family: var(--app-font-mono), monospace;"));
  assert.ok(css.includes("font-weight: 700;"));
  assert.ok(css.includes("font-weight: 400;"));
  assert.ok(css.includes("hsl(27 7% 98%)"));
  assert.ok(css.includes("hsl(28 10% 94%)"));
  assert.ok(css.includes("padding: .58rem .64rem .46rem;"));
  assert.ok(css.includes("width: min(100%, 222px)"));
  assert.ok(!dashboard.includes("vigil-dashboard-donut-caption"));
  assert.ok(!dashboard.includes("vigil-dashboard-reset-rotation"));
  assert.ok(!globe.includes("vigil-dashboard-reset-rotation"));
});

test("Desktop Case File rows reserve a consistent readable left gutter and compact right-side columns", async () => {
  const css = await source("src/vigil-dashboard-workspace-experiment.css");
  const after = css.slice(css.indexOf("/* More even row balance:"));
  assert.match(after, /@media \(min-width: 1320px\)/);
  assert.match(after, /\.vigil-dashboard-case-column \.vigil-case-table-head,[\s\S]*?\.vigil-case-table-row-link/);
  assert.match(after, /grid-template-columns: minmax\(0, 1fr\) 124px 68px 16px/);
  assert.match(after, /padding-left: 1\.2rem;\s*padding-right: \.75rem/);
});

test("Light mode donut callouts and count are near-black while dark mode remains untouched", async () => {
  const css = await source("src/vigil-dashboard-workspace-experiment.css");
  const contrastRules = css.slice(css.indexOf("/* Near-black severity chart labels"));
  assert.match(contrastRules, /html:not\(\[data-theme="dark"\]\) \.vigil-case-library-page/);
  assert.match(contrastRules, /\.vigil-dashboard-severity-label,[\s\S]*?\.vigil-dashboard-severity-name/);
  assert.match(contrastRules, /\.vigil-dashboard-donut-count \{\s*fill: hsl\(0 0% 9%\)/);
  assert.match(contrastRules, /\.vigil-dashboard-severity-callout\.is-muted \{\s*opacity: \.88/);
});

test("Filter Year label and matching count visual weight are concise while index semantics remain unchanged", async () => {
  const [facetSource, page, styles] = await Promise.all([
    source("src/lib/vigilIndexFacets.mjs"),
    source("src/pages/vigil-cases.tsx"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  assert.ok(INDEX_FACETS.some(facet => facet.id === "year" && facet.title === "Year"));
  assert.match(facetSource, /id: "year", title: "Year"/);
  assert.doesNotMatch(facetSource, /title: "Year of occurrence"/);
  assert.match(facetSource, /raw\?\.occurred_from/);
  assert.match(page, /className="vigil-dashboard-filter-match-count"/);
  assert.match(styles, /\.vigil-dashboard-filter-match-count strong \{ font-weight: 550; \}/);
  assert.match(page, /\{sorted.length\} matching \{sorted.length === 1 \? "case file" : "case files"\}/);
});

test("Six-column severity bar comparison preserves ordinal classes and separates SU", async () => {
  const [dashboard, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.match(dashboard, /function SeverityBars\(\{ records, selected, onSelect \}/);
  assert.match(dashboard, /const distribution = severityDistribution\(records\)/);
  assert.match(dashboard, /const maxCount = Math\.max\(1, \.\.\.distribution\.map\(item => item\.count\)\)/);
  assert.match(dashboard, /SEVERITIES\.map\(entry =>/);
  assert.match(dashboard, /entry\.code === "SU" \? " is-unassessed"/);
  assert.match(dashboard, /aria-pressed=\{isSelected\}/);
  assert.match(dashboard, /disabled=\{count === 0 && !isSelected\}/);
  assert.match(dashboard, /onSelect\(isSelected \? "" : entry\.code\)/);
  assert.match(dashboard, /height: `\$\{\(count \/ maxCount\) \* 82\}%`/);
  assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\) minmax\(0, 1\.18fr\)/);
  assert.match(css, /\.vigil-dashboard-bar-choice\.is-unassessed/);
  assert.match(css, /\.vigil-dashboard-bar-choice:focus-visible/);
});

test("Bar and donut share the exact same distribution and filter handler with bars default", async () => {
  const dashboard = await source("src/components/vigil/VigilCasesDashboard.tsx");
  assert.match(dashboard, /useState<"bars" \| "donut">\("bars"\)/);
  assert.match(dashboard, /aria-label="Severity chart view"/);
  assert.match(dashboard, /aria-pressed=\{severityChart === "bars"\}/);
  assert.match(dashboard, /aria-pressed=\{severityChart === "donut"\}/);
  assert.match(dashboard, /<SeverityBars records=\{distributionRecords\} selected=\{severity\} onSelect=\{onSeverity\}/);
  assert.match(dashboard, /<SeverityDonut records=\{distributionRecords\} selected=\{severity\} onSelect=\{onSeverity\}/);
  assert.match(dashboard, /SU is unassessed, not another severity band or evidence of minimal harm/);
  const chartStart = dashboard.indexOf('className="vigil-dashboard-severity-chart-area"');
  const toggleStart = dashboard.indexOf('className="vigil-dashboard-severity-view-switch"');
  const harmTypesStart = dashboard.indexOf('className="vigil-dashboard-panel vigil-dashboard-harm-types-panel"');
  assert.ok(chartStart > 0 && chartStart < toggleStart && toggleStart < harmTypesStart,
    "Bars/Donut switch follows the chart but precedes the next panel");
});

test("Severity bar labels display only legible codes; full category meanings move into info disclosure", async () => {
  const [dashboard, css] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  const bars = dashboard.slice(dashboard.indexOf("function SeverityBars("), dashboard.indexOf("export default function VigilCasesDashboard("));
  assert.match(bars, /vigil-dashboard-bar-code/);
  assert.doesNotMatch(bars, /vigil-dashboard-bar-name|\{entry\.label\}<\/span>/);
  assert.match(bars, /aria-label=\{\x60\$\{entry\.code\} \$\{entry\.label\}:/);
  assert.match(dashboard, /<dl className="vigil-dashboard-severity-legend">/);
  assert.match(dashboard, /SEVERITIES\.map\(entry => <div key=\{entry\.code\}>/);
  assert.match(dashboard, /<dd>\{entry\.label\}<\/dd>/);
  assert.match(css, /\.vigil-dashboard-bar-code \{[\s\S]*?\.84rem/);
  assert.match(css, /\.vigil-dashboard-severity-panel \.vigil-dashboard-severity-legend/);
});

// Touch this regression test to regenerate publication assets from the final review branch head.


test("Sparse HIM join honours record versions and excludes S1/unreported from positive harm totals", () => {
  const records = [
    { id: "VIGIL-INC-000001", record_version: "1.0" },
    { id: "VIGIL-INC-000002", record_version: "1.0" },
    { id: "VIGIL-INC-000003", record_version: "2.0" },
  ];
  const payload = { registry_type: "vigil_harm_dimensions", version: 1, record_count: 3, assessed_record_count: 3, entries: [
    { id: records[0].id, v: "1.0", p: "specific_consequence", d: [["privacy-confidentiality", "S3"], ["physical-health-safety", "S1"]] },
    { id: records[1].id, v: "1.0", p: "generic_deployed_evaluation", d: [["privacy-confidentiality", "S2"], ["rights-liberty", "S4"]] },
    { id: records[2].id, v: "OLD", p: "specific_consequence", d: [["privacy-confidentiality", "S5"]] },
  ]};
  const joined = reconcileHarmSidecar(payload, records);
  assert.equal(joined.stale, 1);
  assert.equal(joined.partial, true);
  assert.equal(joined.byId.size, 2);
  assert.equal(hasEvidencedHarmType(joined.byId, records[0].id, "privacy-confidentiality"), true);
  assert.equal(hasEvidencedHarmType(joined.byId, records[0].id, "physical-health-safety"), false);
  assert.equal(hasEvidencedHarmType(joined.byId, records[2].id, "privacy-confidentiality"), false);
  const definitions = [
    { dimension_id: "privacy-confidentiality", label: "Privacy and confidentiality" },
    { dimension_id: "physical-health-safety", label: "Physical health and safety" },
    { dimension_id: "rights-liberty", label: "Rights and liberty" },
  ];
  const counts = harmTypeCounts([...records, records[0]], joined.byId, definitions);
  assert.deepEqual(counts.map(x => [x.id, x.count]), [
    ["privacy-confidentiality", 2], ["rights-liberty", 1],
  ]);
  assert.equal(counts[0].specific, 1);
  assert.equal(counts[0].modelled, 1);
});

test("Real sparse harm sidecar remains tiny and joins current canonical index entries", async () => {
  const projection = JSON.parse(await source("docs/data/vigil-harm-dimensions.json"));
  assert.equal(projection.registry_type, "vigil_harm_dimensions");
  assert.equal(projection.record_count, 200);
  assert.equal(projection.assessed_record_count, 137);
  assert.ok(projection.entries.every(x => /^VIGIL-INC-\d{6}$/.test(x.id) && x.d.every(row => row.length === 2 && /^S[1-5]$/.test(row[1]))));
  assert.ok((await source("docs/data/vigil-harm-dimensions.json")).length < 60_000);
});

test("Severity and Case Files use a restrained common type scale, and harm count wording discloses methodology coverage", async () => {
  const [dashboard, chartStyles, caseStyles] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
    source("src/vigil-dashboard-workspace-experiment.css"),
  ]);
  assert.match(chartStyles, /\.vigil-dashboard-bar-code \{[\s\S]*?font: 700 \.84rem\/1\.25/);
  assert.match(chartStyles, /\.vigil-dashboard-bar-value \{[\s\S]*?font: 700 \.82rem\/1\.2/);
  assert.match(chartStyles, /\.vigil-dashboard-severity-view-switch \{[\s\S]*?margin: \.65rem auto 0;/);
  assert.match(caseStyles, /\.vigil-dashboard-case-column \.vigil-case-table-copy h2 \{[\s\S]*?font-size: 1\.12rem/);
  assert.match(caseStyles, /\.vigil-dashboard-case-column \.vigil-case-table-copy p \{[\s\S]*?font-size: 1rem/);
  assert.match(chartStyles, /\.vigil-dashboard-harm-type-label \{[\s\S]*?font-size: \.97rem/);
  assert.match(dashboard, /\x60Show all \$\{harmTypes\.length\} with S2–S5 findings \(\$\{harmDimensions\.length\} defined\)\x60/);
  assert.match(caseStyles, /\.vigil-dashboard-case-column \.vigil-case-table-text \{[\s\S]*?font-size: 1rem/);
  assert.match(caseStyles, /\.vigil-dashboard-filter-hub \.vigil-dashboard-filter-match-count \{[\s\S]*?font-size: \.94rem/);
  assert.match(chartStyles, /\.vigil-dashboard-failure-name strong \{[\s\S]*?font-size: \.96rem/);
  assert.match(caseStyles, /\.vigil-dashboard-facet-heading \{[\s\S]*?font: 600 \.94rem\/1\.45/);
  assert.ok(caseStyles.includes("color: hsl(var(--foreground) / .8);"), "The descriptions must not inherit faded microtext");
  assert.ok(caseStyles.includes("hsl(350 33% 42%), hsl(350 37% 52%)"), "Light mode retains blush bars");
  assert.doesNotMatch(caseStyles, /html\[data-theme="dark"\] \.vigil-case-library-page \.vigil-dashboard-harm-type-fill/, "Dark mode restores the existing gold bar token");
  assert.match(chartStyles, /\.vigil-case-library-page \.vigil-dashboard-harm-type-fill \{[\s\S]*?background: var\(--vd-accent\)/);
});

test("Harm Types cross-filter every existing instrument but preserves its own ranking order", async () => {
  const [page, dashboard, styles] = await Promise.all([
    source("src/pages/vigil-cases.tsx"),
    source("src/components/vigil/VigilCasesDashboard.tsx"),
    source("src/components/vigil/VigilCasesDashboard.css"),
  ]);
  assert.match(page, /const harmRecords = useMemo\(\(\) => baseCases\.filter/);
  assert.match(page, /const taxonomyRecords = useMemo\(\(\) => rankingBaseCases\.filter/);
  assert.match(page, /const mapRecords = useMemo\(\(\) => baseCases\.filter/);
  assert.match(page, /const distributionRecords = useMemo\(\(\) => baseCases\.filter/);
  assert.match(page, /&& matchesHarm\(record\)/);
  assert.match(page, /const matchesHarm = \(record: VigilIndexRecord\)/);
  assert.match(page, /onHarmType=\{setHarmType\}/);
  assert.match(page, /Harm: \{harmDimensions\.find\(/);
  assert.match(dashboard, /vigil-dashboard-harm-types-panel/);
  assert.match(dashboard, /aria-pressed=\{harmType === entry\.id\}/);
  assert.match(dashboard, /onHarmType\(harmType === entry\.id \? "" : entry\.id\)/);
  assert.match(dashboard, /S1 assessments are retained in the sparse index but excluded/);
  assert.match(styles, /\.vigil-dashboard-harm-type-choice:focus-visible/);
  const workspace = await source("src/vigil-dashboard-workspace-experiment.css");
  assert.ok(workspace.includes('html:not([data-theme="dark"]) .vigil-case-library-page .vigil-dashboard-harm-type-fill'));
  assert.ok(workspace.includes("hsl(350 33% 42%), hsl(350 37% 52%)"), "Harm Type fill uses the blush palette, not amber");
});
