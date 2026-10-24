/* Indexed harm dimensions are assessment facts from the VIGIL sparse HIM
   sidecar. No inference from prose, search terms or classification mappings. */
const EVIDENCED_BANDS = new Set(["S2", "S3", "S4", "S5"]);
const ALL_BANDS = new Set(["S1", ...EVIDENCED_BANDS]);

export function reconcileHarmSidecar(payload, records) {
  if (!payload || payload.registry_type !== "vigil_harm_dimensions" || payload.version !== 1 ||
      !Array.isArray(payload.entries) || !Number.isInteger(payload.record_count)) {
    throw new Error("Harm dimensions projection does not satisfy the VIGIL public contract");
  }
  const byRecord = new Map(records.map(record => [record.id, record]));
  const byId = new Map();
  let stale = 0;
  for (const entry of payload.entries) {
    if (!entry || typeof entry.id !== "string" || !Array.isArray(entry.d)) throw new Error("Invalid harm index entry");
    const record = byRecord.get(entry.id);
    if (!record || (entry.v && record.record_version !== entry.v)) { stale++; continue; }
    if (byId.has(entry.id)) throw new Error("Duplicate incident in harm dimension sidecar");
    const seen = new Set();
    const dimensions = [];
    for (const row of entry.d) {
      if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== "string" ||
          !ALL_BANDS.has(row[1]) || seen.has(row[0])) throw new Error("Invalid assessed harm dimension");
      seen.add(row[0]);
      dimensions.push([row[0], row[1]]);
    }
    byId.set(entry.id, { pathway: entry.p ?? null, dimensions });
  }
  return {
    byId, recordCount: payload.record_count,
    assessedRecordCount: payload.assessed_record_count,
    partial: payload.record_count !== records.length || stale > 0,
    stale,
  };
}

export function hasEvidencedHarmType(byId, incidentId, dimensionId) {
  return (byId.get(incidentId)?.dimensions ?? [])
    .some(([id, band]) => id === dimensionId && EVIDENCED_BANDS.has(band));
}

export function harmTypeCounts(records, byId, dimensions) {
  const counts = new Map(dimensions.map(row => [row.dimension_id, {
    id: row.dimension_id, label: row.label, count: 0, specific: 0, modelled: 0, unspecified: 0,
  }]));
  const included = new Set();
  for (const record of records) {
    if (included.has(record.id)) continue;
    included.add(record.id);
    const entry = byId.get(record.id);
    if (!entry) continue;
    const seen = new Set();
    for (const [id, band] of entry.dimensions) {
      if (!EVIDENCED_BANDS.has(band) || seen.has(id)) continue;
      seen.add(id);
      const row = counts.get(id);
      if (!row) continue;
      row.count++;
      if (entry.pathway === "specific_consequence") row.specific++;
      else if (entry.pathway === "generic_deployed_evaluation") row.modelled++;
      else row.unspecified++;
    }
  }
  return [...counts.values()]
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
