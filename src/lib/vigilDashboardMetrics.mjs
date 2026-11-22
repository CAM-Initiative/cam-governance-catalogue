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

// A distinct (Incident, Fidelity Class, role) contributes once to each
// role-specific statistic, regardless of how many source episodes support it.
// Different roles of the same class are never collapsed into one result.
export function classOutcomePairs(raw) {
  const seen = new Set();
  const pairs = [];
  for (const row of mappingRows(raw)) {
    if (!row || typeof row !== "object") continue;
    const classId = row.class_id;
    const role = row.classification_role;
    if (typeof classId !== "string" || !VALID_CLASS.test(classId) || !ROLES.has(role)) continue;
    const normalized = classId.toUpperCase();
    const key = `${normalized}|${role}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ classId: normalized, role });
  }
  return pairs;
}

export function classOutcomeCounts(records) {
  const counts = {
    "failure-occurrence": 0,
    "successful-invariant": 0,
    "ambiguous-boundary": 0,
    distinctIncidents: 0,
  };
  const incidents = new Set();
  const seen = new Set();
  for (const [index, value] of records.entries()) {
    const raw = value.raw ?? value;
    const incidentId = value.id ?? raw.id ?? `row-${index}`;
    incidents.add(incidentId);
    for (const { classId, role } of classOutcomePairs(raw)) {
      const key = `${incidentId}|${classId}|${role}`;
      if (seen.has(key)) continue;
      seen.add(key);
      counts[role] += 1;
    }
  }
  counts.distinctIncidents = incidents.size;
  return counts;
}

export function failureClassIds(raw) {
  return classOutcomePairs(raw)
    .filter(({ role }) => role === "failure-occurrence")
    .map(({ classId }) => classId);
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
