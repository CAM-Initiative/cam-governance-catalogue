import assert from "node:assert/strict";
import test from "node:test";
import { countryLookupFromProjection } from "../src/lib/vigilDashboardGeography.mjs";

const records = [
  { id: "VIGIL-INC-000001", record_version: "1.0", record_type: "incident" },
  { id: "VIGIL-INC-000002", record_version: "1.2", record_type: "incident" },
  { id: "VIGIL-INC-000003", record_version: "1.5", record_type: "incident" },
];
const matcher = value => value === "Australia" ? { id: "AU" } : undefined;

test("current canonical geography v2 maps reviewed single- and multi-country associations", () => {
  const projection = {
    registry_type: "incident_jurisdiction_projection",
    schema_version: "2.0.0",
    records: [
      { incident_id: "VIGIL-INC-000001", record_version: "1.0", scope: "single-jurisdiction", map_eligible: true, anchor_country_code: null, reviewed_country_codes: ["AU"] },
      { incident_id: "VIGIL-INC-000002", record_version: "1.2", scope: "cross-border", map_eligible: true, anchor_country_code: null, reviewed_country_codes: ["US", "CA", "US"] },
      { incident_id: "VIGIL-INC-000003", record_version: "1.5", scope: "single-jurisdiction", map_eligible: true, anchor_country_code: null, reviewed_country_codes: ["GB"] },
    ],
  };
  assert.deepEqual([...countryLookupFromProjection(records, projection, matcher)], [
    ["VIGIL-INC-000001", ["AU"]],
    ["VIGIL-INC-000002", ["US", "CA"]],
    ["VIGIL-INC-000003", ["GB"]],
  ]);
});

test("canonical map preserves version, map eligibility and explicit review gates", () => {
  const projection = {
    registry_type: "incident_jurisdiction_projection",
    records: [
      { incident_id: "VIGIL-INC-000001", record_version: "1.0", scope: "not-established", map_eligible: false, reviewed_country_codes: ["AU"] },
      { incident_id: "VIGIL-INC-000002", record_version: "9.0", scope: "single-jurisdiction", map_eligible: true, reviewed_country_codes: ["US"] },
      { incident_id: "VIGIL-INC-000003", record_version: "1.5", scope: "cross-border", map_eligible: true, reviewed_country_codes: [], country_codes_mentioned: ["US", "AU"] },
      { incident_id: "VIGIL-INC-000999", record_version: "1", scope: "single-jurisdiction", map_eligible: true, reviewed_country_codes: ["US"] },
    ],
  };
  assert.equal(countryLookupFromProjection(records, projection, matcher).size, 0);
});

test("old single-country canonical geography anchors remain supported", () => {
  const projection = {
    registry_type: "incident_jurisdiction_projection",
    records: [
      { incident_id: "VIGIL-INC-000001", record_version: "1.0", scope: "single-country", map_eligible: true, anchor_country_code: "AU" },
      { incident_id: "VIGIL-INC-000002", record_version: "1.2", scope: "cross-border", map_eligible: true, anchor_country_code: "US" },
    ],
  };
  assert.deepEqual([...countryLookupFromProjection(records, projection, matcher)], [["VIGIL-INC-000001", ["AU"]]]);
});

test("legacy website projection is version-checked and never guesses from record titles", () => {
  const projection = { records: [
    { id: "VIGIL-INC-000001", version: "1.0", jurisdiction: "Australia" },
    { id: "VIGIL-INC-000002", version: "1.0", jurisdiction: "Australia" },
  ] };
  assert.deepEqual([...countryLookupFromProjection(records, projection, matcher)], [["VIGIL-INC-000001", ["AU"]]]);
});

test("missing indexes never manufacture geographic coverage", () => {
  assert.equal(countryLookupFromProjection(records, {}, matcher).size, 0);
});
