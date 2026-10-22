// Public dashboard metrics are derived from canonical Incident index mappings.
// A class ID without an explicit occurrence role is never assumed to be a failure.
const VALID_CLASS = /^VIGIL-FC-\d{6}$/i;
const ROLES = new Set(["failure-occurrence", "successful-invariant", "ambiguous-boundary"]);

function mappingRows(raw) {
  const classification = raw?.taxonomy_classification;
  const primary = raw?.primary_classification ?? classification?.primary_classification;
  const secondaries = raw?.secondary_classifications ?? classification?.secondary_classifications ?? [];
  return [primary, ...(Array.isArray(secondaries) ? secondaries : [])];
}

export function failureClassIds(raw) {
  const ids = new Set();
  for (const row of mappingRows(raw)) {
    if (!row || typeof row !== "object") continue;
    const classId = row.class_id;
    const role = row.classification_role;
    if (typeof classId === "string" && VALID_CLASS.test(classId) && ROLES.has(role) && role === "failure-occurrence") {
      ids.add(classId.toUpperCase());
    }
  }
  return [...ids];
}

export function topFailureClasses(records, maxItems = 6) {
  const counts = new Map();
  for (const record of records) {
    for (const id of failureClassIds(record.raw ?? record)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts].map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, maxItems);
}

export const SEVERITY_ORDER = ["S1", "S2", "S3", "S4", "S5", "SU"];

export function severityDistribution(records) {
  const counts = Object.fromEntries(SEVERITY_ORDER.map(code => [code, 0]));
  for (const record of records) {
    const code = String(record.severity ?? record.raw?.harm_impact_assessment?.overall_severity ?? "SU").toUpperCase();
    counts[SEVERITY_ORDER.includes(code) ? code : "SU"] += 1;
  }
  return SEVERITY_ORDER.map(code => ({ code, count: counts[code] }));
}
