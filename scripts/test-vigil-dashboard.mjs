import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");
import { globePosition, globeRotationForLongitude } from "../src/lib/vigilGlobeCoordinates.mjs";
import { failureClassIds, topFailureClasses, severityDistribution } from "../src/lib/vigilDashboardMetrics.mjs";

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
  assert.ok(dashboard.includes("onKeyDown={event=>"), "Interactive chart remains keyboard operable");
});

test("Case Files result count, Clear filters, and pagination retain readable side gutters", async () => {
  const [styles, page] = await Promise.all([
    source("src/components/vigil/VigilCasesDashboard.css"),
    source("src/pages/vigil-cases.tsx"),
  ]);
  assert.match(page, /className="vigil-result-summary"/);
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
