const labels = { aligned: "Aligned", "not-aligned": "Not aligned", boundary: "Boundary" };
const forceLabels = {
  "government-voluntary-framework": "Government voluntary framework",
  "voluntary-consensus-standard": "Voluntary consensus standard",
  "binding-law": "Binding law",
  "voluntary-technical-specification": "Voluntary technical specification",
  "industry-framework": "Industry framework",
};
export const REQUIREMENT_ASSESSMENT_INTRO = "These assessments compare the evidence from this occurrence with each external requirement. Boundary means a relevant requirement cannot receive a decisive result because an occurrence fact is missing. Results do not establish organisation-wide compliance or certification.";

function standardHref(requirement) {
  if (!requirement?.vigil_source_id || !requirement?.source_version) return undefined;
  return `/observatory/ai-governance-standards/${encodeURIComponent(`${requirement.vigil_source_id}|${requirement.source_version}`)}/`;
}

// Mirror the Case File Section 06 public-source admission and deduplication.
// A source omitted from the public bibliography must never receive a citation.
export function publicRequirementEvidenceSources(raw) {
  const sources = Array.isArray(raw.source_records)
    ? raw.source_records
    : [raw.sources, raw.evidence_sources].find(Array.isArray) || [];
  const found = new Map();
  sources.forEach((source, index) => {
    if (!source) return;
    const value = typeof source === "string" ? { source_title: source, source_url: /^https?:\/\//i.test(source) ? source : undefined } : source;
    if (typeof value !== "object" || Array.isArray(value)) return;
    const residence = String(value.source_residence || "").toLowerCase();
    if (residence === "cam-internal" || residence === "internal") return;
    const title = [value.source_title, value.title, value.name].find(x => typeof x === "string" && x.trim())?.trim();
    if (!title) return;
    const url = [value.source_url, value.url, value.archive_url].find(x => typeof x === "string" && x.trim())?.trim();
    const publisher = [value.author_or_publisher, value.publisher, value.source_platform].find(x => typeof x === "string" && x.trim())?.trim();
    const date = [value.source_date, value.date, value.published_date].find(x => typeof x === "string" && x.trim())?.trim();
    const key = `${title.toLowerCase()}|${url ?? ""}`;
    if (found.has(key)) {
      found.get(key).sourceRecordRefs.push(`source_records[${index}]`);
    } else {
      found.set(key, { title, url, publisher, date, sourceRecordRefs: [`source_records[${index}]`] });
    }
  });
  return [...found.values()].map((source, index) => ({ ...source, referenceNumber: index + 1, href: `#vigil-evidence-reference-${index + 1}` }));
}

export function occurrenceRequirementRows(raw, requirements = [], sourceReferenceNumbers) {
  const catalogue = new Map(requirements.map(item => [item.requirement_id, item]));
  return (Array.isArray(raw.external_requirement_assessments) ? raw.external_requirement_assessments : []).flatMap((item, index) => {
    if (!item || !Object.hasOwn(labels, item.alignment_result)) return [];
    const requirement = catalogue.get(item.requirement_id);
    return [{
      key: `${item.requirement_id}-${index}`,
      alignmentResult: item.alignment_result,
      resultLabel: labels[item.alignment_result],
      title: requirement
        ? [requirement.canonical_source_identifier?.value || requirement.external_source_id || requirement.issuer, requirement.clause_or_control].filter(Boolean).join(" · ")
        : "Requirement details unavailable",
      summary: requirement?.requirement_summary || "The requirement description could not be resolved; the recorded assessment remains visible.",
      url: standardHref(requirement),
      normativeForce: forceLabels[requirement?.normative_force] || "Not recorded",
      assessmentBasis: item.assessment_basis,
      assessedOn: item.assessed_on,
      evidence: (Array.isArray(item.source_record_refs) ? item.source_record_refs : []).flatMap(ref => {
        const match = /^source_records\[(\d+)\]$/.exec(ref);
        const sourceIndex = match ? Number(match[1]) : undefined;
        const source = sourceIndex !== undefined ? raw.source_records?.[sourceIndex] : undefined;
        const referenceNumber = sourceReferenceNumbers
          ? sourceReferenceNumbers[ref]
          : sourceIndex !== undefined ? sourceIndex + 1 : undefined;
        // Never invent a link when the cited record is absent or excluded from Section 06.
        if (!source || !Number.isSafeInteger(referenceNumber) || referenceNumber < 1) return [];
        const title = typeof source === "string" ? source : source.source_title || source.title || source.name;
        if (typeof title !== "string" || !title.trim()) return [];
        return [{ title: title.trim(), referenceNumber, url: `#vigil-evidence-reference-${referenceNumber}` }];
      }).filter((source, index, values) => values.findIndex(other => other.referenceNumber === source.referenceNumber) === index),
    }];
  });
}
