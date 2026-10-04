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

export function occurrenceRequirementRows(raw, requirements = []) {
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
        return source
          ? [{
              title: source.source_title || "Evidence source",
              referenceNumber: sourceIndex + 1,
              url: `#vigil-evidence-reference-${sourceIndex + 1}`,
            }]
          : [];
      }),
    }];
  });
}
