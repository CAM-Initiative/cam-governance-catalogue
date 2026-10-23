// The Case Files preview must not mix geography projected from main with a
// separately selected VIGIL branch. This helper is pure and source-agnostic.
// A record may have more than one reviewed jurisdiction association. These
// country codes are NOT incident occurrence coordinates.
export function countryLookupFromProjection(records, projection, countryMatcher) {
  const byId = new Map(records.filter(record => record.record_type === "incident")
    .map(record => [record.id, String(record.record_version ?? "")]));
  const map = new Map();
  if (!projection || !Array.isArray(projection.records)) return map;

  if (projection.registry_type === "incident_jurisdiction_projection") {
    for (const row of projection.records) {
      if (!row?.map_eligible || !byId.has(row.incident_id)) continue;
      if (byId.get(row.incident_id) !== String(row.record_version ?? "")) continue;

      // Schema 2: reviewed_country_codes is the source-backed list, including
      // cross-border cases. Old single-country projections remain compatible.
      // Never derive a pin from unreviewed country_codes_mentioned or text.
      const candidates = Array.isArray(row.reviewed_country_codes)
        ? row.reviewed_country_codes
        : row.scope === "single-country" && row.anchor_country_code
          ? [row.anchor_country_code]
          : [];
      const codes = [...new Set(candidates.filter(code =>
        typeof code === "string" && /^[A-Z]{2}$/.test(code)
      ))];
      if (codes.length) map.set(row.incident_id, codes);
    }
    return map;
  }

  // Compatibility mode for published MAIN data only: the old website's
  // primary-jurisdiction text projection. Do not use for preview working branches.
  for (const row of projection.records) {
    if (!row || typeof row.id !== "string" || !byId.has(row.id)) continue;
    if (String(row.version ?? "") !== byId.get(row.id)) continue;
    const matched = countryMatcher(row.jurisdiction);
    if (matched?.id) map.set(row.id, [matched.id]);
  }
  return map;
}
