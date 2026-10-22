import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");
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
