const labels = { met: "Met", "not-met": "Not met", "evidence-insufficient": "Insufficient evidence for a finding", "not-assessable": "Not assessable" };
export const REQUIREMENT_ASSESSMENT_INTRO = "VIGIL first establishes whether an external requirement applies to this occurrence. Only an applicable requirement receives a VIGIL finding. An Alignment Taxonomy failure does not by itself establish that an external requirement was not met. These findings do not assess organisation-wide governance programmes or overall legal or standards compliance.";

function standardHref(requirement) {
  if (!requirement?.vigil_source_id || !requirement?.source_version) return undefined;
  return `/observatory/ai-governance-standards/${encodeURIComponent(`${requirement.vigil_source_id}|${requirement.source_version}`)}/`;
}

export function occurrenceRequirementRows(raw, requirements = []) {
  const catalogue = new Map(requirements.map(item => [item.requirement_id, item]));
  return (Array.isArray(raw.external_requirement_assessments) ? raw.external_requirement_assessments : []).flatMap((item, index) => {
    if (!item || !["applicable", "insufficient-evidence", "not-applicable"].includes(item.applicability_status)) return [];
    const requirement = catalogue.get(item.requirement_id);
    const applicable = item.applicability_status === "applicable";
    return [{
      key: `${item.requirement_id}-${index}`,
      applicable,
      applicabilityStatus: item.applicability_status,
      title: requirement
        ? [requirement.canonical_source_identifier?.value || requirement.external_source_id || requirement.issuer, requirement.clause_or_control].filter(Boolean).join(" · ")
        : "Requirement details unavailable",
      summary: requirement?.requirement_summary || "The requirement description could not be resolved; the recorded assessment remains visible.",
      url: standardHref(requirement),
      normativeForce: requirement?.normative_force || requirement?.requirement_posture,
      applicability: applicable ? "Applicable" : item.applicability_status === "not-applicable" ? "Not applicable" : "Applicability unresolved",
      finding: applicable ? labels[item.finding] || "Finding not recorded" : undefined,
      applicabilityBasis: item.applicability_basis,
      findingBasis: applicable ? item.finding_basis : undefined,
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
