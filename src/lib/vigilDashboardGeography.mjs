// The Case Files preview must not mix geography projected from main with a
// separately selected VIGIL branch. This helper is pure and source-agnostic.
export function countryLookupFromProjection(records, projection, countryMatcher) {
  const byId = new Map(records.filter(record => record.record_type === "incident")
    .map(record => [record.id, String(record.record_version ?? "")]));
  const map = new Map();
  if (!projection || !Array.isArray(projection.records)) return map;

  if (projection.registry_type === "incident_jurisdiction_projection") {
    // The canonical VIGIL index is explicit that country anchors indicate
    // *jurisdiction association*, never a verified occurrence coordinate.
    for (const row of projection.records) {
      if (!row?.map_eligible || row.scope !== "single-country" ||
          !row.anchor_country_code || !byId.has(row.incident_id)) continue;
      if (byId.get(row.incident_id) !== String(row.record_version ?? "")) continue;
      map.set(row.incident_id, row.anchor_country_code);
    }
    return map;
  }

  // Compatibility mode for published MAIN data only: the old website's
  // primary-jurisdiction text projection. Do not use for preview working branches.
  for (const row of projection.records) {
    if (!row || typeof row.id !== "string" || !byId.has(row.id)) continue;
    if (String(row.version ?? "") !== byId.get(row.id)) continue;
    const matched = countryMatcher(row.jurisdiction);
    if (matched?.id) map.set(row.id, matched.id);
  }
  return map;
}
