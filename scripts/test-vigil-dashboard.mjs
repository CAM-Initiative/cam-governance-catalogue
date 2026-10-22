import test from "node:test";
import assert from "node:assert/strict";
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
