// Index-only facets. The Observatory does not infer dates, deployment,
// agent identity, governance compliance, or unreviewed categorical metadata.
// Values are read from the public Incident index's explicit typed fields.
export const NOT_INDEXED = "__not_established_in_index__";

export const INDEX_FACETS = [
  { id: "year", title: "Year of occurrence" },
  { id: "agentic", title: "Agentic status" },
  { id: "deployment", title: "Deployment state" },
  { id: "externalReach", title: "External reach" },
  { id: "activity", title: "Activity context" },
  { id: "vendor", title: "Platform / vendor" },
  { id: "adjudication", title: "Adjudication coverage" },
  { id: "sourceRole", title: "Evidence source role" },
  { id: "requirements", title: "External requirement assessments" },
  { id: "externalAssessments", title: "External assessments" },
  { id: "mappedClass", title: "Mapped Fidelity Class" },
];

const ROLE_VALUES = new Set(["failure-occurrence", "successful-invariant", "ambiguous-boundary"]);
const CLASS_ID = /^VIGIL-FC-\d{6}$/i;
const MISSING_LABEL = "Not established in index";

function asText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
function plain(value) {
  const s = asText(value);
  return s ? [s] : [];
}
function textArray(value) {
  return unique((Array.isArray(value) ? value : [value]).flatMap(plain));
}
function classIds(raw) {
  const primary = raw?.primary_classification;
  const rows = [primary, ...(Array.isArray(raw?.secondary_classifications) ? raw.secondary_classifications : [])];
  // An unasserted class ID is not a classification. Mapping-local role is required.
  return unique(rows.filter(x => x && ROLE_VALUES.has(x.classification_role) && CLASS_ID.test(x.class_id ?? ""))
    .map(x => x.class_id.toUpperCase()));
}
function assessmentPresence(value) {
  // Missing is not zero: unknown must not become "none".
  return Number.isInteger(value) && value >= 0
    ? [value ? "present" : "none"] : [];
}
function occurredYear(raw) {
  const value = asText(raw?.occurred_from);
  // Ignore malformed or ambiguous dates and do NOT replace with record creation year.
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!match) return [];
  const yr = Number(match[1]);
  if (yr < 1900 || yr > 2200) return [];
  if (match[2] && (Number(match[2]) < 1 || Number(match[2]) > 12)) return [];
  if (match[3]) {
    const date = new Date(Date.UTC(yr, Number(match[2]) - 1, Number(match[3])));
    if (date.getUTCFullYear() !== yr || date.getUTCMonth() !== Number(match[2]) - 1
      || date.getUTCDate() !== Number(match[3])) return [];
  }
  return [match[1]];
}
export function indexFacetValues(record, id) {
  const raw = record?.raw ?? record ?? {};
  let values = [];
  switch (id) {
    case "year": values = occurredYear(raw); break;
    case "agentic": values = plain(raw.agent_context?.agentic_status); break;
    case "deployment": values = plain(raw.occurrence_environment?.deployment_state); break;
    case "externalReach": values = plain(raw.occurrence_environment?.external_reach); break;
    case "activity": values = textArray(raw.occurrence_environment?.activity_contexts); break;
    case "vendor": values = plain(raw.platform_or_vendor); break;
    case "adjudication": values = plain(raw.adjudication_coverage?.status); break;
    case "sourceRole": values = textArray(raw.source_roles); break;
    case "requirements": values = assessmentPresence(raw.external_requirement_assessment_count); break;
    case "externalAssessments": values = assessmentPresence(raw.external_assessment_count); break;
    case "mappedClass": values = classIds(raw); break;
    default: return [];
  }
  return values.length ? unique(values) : [NOT_INDEXED];
}
export function facetOptionLabel(id, value) {
  if (value === NOT_INDEXED) return MISSING_LABEL;
  if (id === "requirements" || id === "externalAssessments") {
    return value === "present" ? "One or more assessments" : "None recorded";
  }
  if (id === "year") return value;
  if (id === "mappedClass") return value.replace(/^VIGIL-FC-0*/, "FC-");
  const names = {
    "pre-deployment": "Pre-deployment",
    "non-agentic": "Non-agentic",
    "not-established": "Not established",
    "unknown": "Unknown",
    "yes": "Yes",
    "no": "No",
    "partial": "Partial",
    "complete": "Complete",
  };
  if (names[value.toLowerCase()]) return names[value.toLowerCase()];
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, x => x.toUpperCase())
    .replace(/\bAi\b/g, "AI").replace(/\bLlm\b/g, "LLM")
    .replace(/\bApi\b/g, "API").replace(/\bGpt\b/g, "GPT");
}
export function indexFacetOptions(records, id) {
  const counts = new Map();
  for (const record of records) {
    for (const value of indexFacetValues(record, id))
      counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].map(([key, count]) => ({
    key, label: facetOptionLabel(id, key), count,
  })).sort((a, b) => id === "year"
    ? (a.key === NOT_INDEXED ? 1 : b.key === NOT_INDEXED ? -1 : b.key.localeCompare(a.key))
    : a.key === NOT_INDEXED ? 1 : b.key === NOT_INDEXED ? -1
      : b.count - a.count || a.label.localeCompare(b.label));
}
export function matchesIndexFacets(record, selected) {
  for (const [id, values] of Object.entries(selected)) {
    if (values.length && !indexFacetValues(record, id).some(value => values.includes(value)))
      return false;
  }
  return true;
}
export function toggleIndexFacetSelection(selected, id, value) {
  const values = selected[id] ?? [];
  const next = values.includes(value) ? values.filter(x => x !== value) : [...values, value];
  const result = { ...selected };
  if (next.length) result[id] = next;
  else delete result[id];
  return result;
}
