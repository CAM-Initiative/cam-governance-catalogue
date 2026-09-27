import type { UnknownRecord } from "@/lib/vigilRegistry";

type ClauseRelationship = {
  classId?: string;
  relationship?: string;
  canonical: boolean;
  rationale?: string;
};

type ClauseAssessment = {
  sourceAnchor?: string;
  sourceParaphrase?: string;
  recoveredInvariant?: string;
  relationships: ClauseRelationship[];
};

type Props = {
  raw: UnknownRecord;
};

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseAssessment(raw: UnknownRecord): ClauseAssessment[] {
  const vigilAssessment = isObject(raw.vigil_assessment) ? raw.vigil_assessment : undefined;
  const sourceClauseAnalysis = vigilAssessment && isObject(vigilAssessment.source_clause_analysis)
    ? vigilAssessment.source_clause_analysis
    : undefined;
  const clauses = sourceClauseAnalysis && Array.isArray(sourceClauseAnalysis.clauses)
    ? sourceClauseAnalysis.clauses
    : [];

  return clauses.flatMap((value) => {
    if (!isObject(value)) return [];
    const relationships = Array.isArray(value.taxonomy_relationships)
      ? value.taxonomy_relationships.flatMap((relationship) => {
          if (!isObject(relationship)) return [];
          return [{
            classId: text(relationship.class_id),
            relationship: text(relationship.relationship),
            canonical: relationship.canonical_taxonomy_mapping === true,
            rationale: text(relationship.rationale),
          }];
        })
      : [];

    const sourceAnchor = text(value.source_anchor);
    const sourceParaphrase = text(value.source_paraphrase);
    const recoveredInvariant = text(value.recovered_invariant_interpretation);
    if (!sourceAnchor && !sourceParaphrase && !recoveredInvariant) return [];

    return [{ sourceAnchor, sourceParaphrase, recoveredInvariant, relationships }];
  });
}

function compactClassId(classId?: string) {
  return classId?.replace(/^VIGIL-/, "");
}

function taxonomyRelationshipLabel(relationship?: string) {
  switch (relationship) {
    case "failure-occurrence":
    case "failure-occurrence contribution":
      return "Failure occurred";
    case "successful-invariant":
      return "Invariant held";
    case "ambiguous-boundary exemplar":
      return "Boundary unresolved";
    default:
      return relationship
        ? relationship.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
        : "Taxonomy relationship";
  }
}

function taxonomyClassHref(classId?: string) {
  return classId ? `/observatory/alignment-taxonomy/${encodeURIComponent(classId)}/` : undefined;
}

function taxonomyAssessmentSummary(relationships: ClauseRelationship[]) {
  const canonical = relationships.filter((item) => item.canonical);
  const labels = canonical.map((item) => item.relationship?.toLowerCase() ?? "");
  const held = labels.some((label) => label.includes("successful-invariant"));
  const unresolved = labels.some((label) => label.includes("ambiguous-boundary"));
  const failure = labels.some((label) => label.includes("failure-occurrence"));
  const otherCanonical = canonical.some((item) => {
    const label = item.relationship?.toLowerCase() ?? "";
    return !label.includes("successful-invariant")
      && !label.includes("ambiguous-boundary")
      && !label.includes("failure-occurrence");
  });
  const adjacentOnly = relationships.some((item) => !item.canonical);

  let summary: string;
  if (held && failure) {
    summary = "The clause engages a governance boundary that held in the observed downstream behaviour, while the wording itself also contributes to the mapped governance mechanism where failure is evidenced.";
  } else if (unresolved && failure) {
    summary = "The clause exposes a reusable governance boundary, but this occurrence does not establish failure at that boundary. The wording nevertheless contributes to the mapped governance mechanism.";
  } else if (failure && otherCanonical) {
    summary = "The clause engages an additional governance boundary while also contributing to the mapped governance mechanism. The formal relationship is resolved in Classification.";
  } else if (held) {
    summary = "The clause engages a governance boundary that held in the observed downstream behaviour.";
  } else if (unresolved) {
    summary = "The clause exposes a reusable governance boundary, but this occurrence does not establish either failure or successful holding of that boundary.";
  } else if (failure) {
    summary = "The clause contributes directly to the mapped governance mechanism where failure is evidenced.";
  } else if (otherCanonical) {
    summary = "The clause engages a governance boundary that is carried forward into the formal taxonomy mapping.";
  } else {
    summary = "The clause contributes to the governance interpretation, but no separate canonical taxonomy relationship is asserted here.";
  }

  if (adjacentOnly) {
    summary += " A semantically adjacent taxonomy relationship was considered but was not made canonical because its occurrence conditions are not evidenced.";
  }
  return summary;
}

// The Case File and deterministic report/PDF share this component. Prefer the
// canonical per-relationship rationale published by VIGIL; the generated summary
// exists only as a compatibility fallback for older records without rationale text.
function taxonomyAssessmentRationales(relationships: ClauseRelationship[]) {
  const rationales = relationships.flatMap((item) => item.rationale ? [item.rationale] : []);
  return rationales.length ? rationales : [taxonomyAssessmentSummary(relationships)];
}

function TaxonomyRelationshipAssessment({ relationship, clauseIndex, relationshipIndex }: {
  relationship: ClauseRelationship;
  clauseIndex: number;
  relationshipIndex: number;
}) {
  const href = taxonomyClassHref(relationship.classId);
  return <div className="vigil-taxonomy-assessment-rationale" key={`${clauseIndex}-${relationshipIndex}`}>
    <div className="vigil-taxonomy-assessment-mapping">
      {relationship.classId
        ? href
          ? <a href={href}><strong>{compactClassId(relationship.classId)}</strong></a>
          : <strong>{compactClassId(relationship.classId)}</strong>
        : null}
      <span>{taxonomyRelationshipLabel(relationship.relationship)}</span>
      {!relationship.canonical ? <span className="vigil-taxonomy-assessment-mapping-state">Non-canonical relationship</span> : null}
    </div>
    {relationship.rationale ? <p>{relationship.rationale}</p> : null}
  </div>;
}

export function CaseTaxonomyAssessment({ raw }: Props) {
  const clauses = parseAssessment(raw);
  if (!clauses.length) return null;

  return <section className="vigil-taxonomy-assessment" aria-labelledby="vigil-taxonomy-assessment-heading">
    <h3 className="vigil-case-editorial-subheading" id="vigil-taxonomy-assessment-heading">Incident breakdown</h3>
    <p className="vigil-taxonomy-assessment-intro">
      Clause-level breakdown of the incident into source wording, recovered governance principles, and the exact taxonomy boundaries carried forward into formal alignment classification.
    </p>
    <div className="vigil-external-assessment-table-wrap vigil-taxonomy-assessment-table-wrap" role="region" aria-label="VIGIL Observatory incident breakdown table" tabIndex={0}>
      <table className="vigil-external-assessment-table vigil-taxonomy-assessment-table">
        <caption className="sr-only">Clause-level VIGIL Observatory incident breakdown preceding formal alignment classification.</caption>
        <thead>
          <tr>
            <th scope="col">Source clause</th>
            <th scope="col">Recovered governance principle</th>
            <th scope="col">Incident analysis</th>
          </tr>
        </thead>
        <tbody>
          {clauses.map((clause, index) => <tr key={`${clause.sourceAnchor ?? clause.sourceParaphrase ?? "clause"}-${index}`}>
            <td>{clause.sourceAnchor
              ? <q>{clause.sourceAnchor}</q>
              : clause.sourceParaphrase ?? "Source language is paraphrased in the canonical Incident record."}</td>
            <td>{clause.recoveredInvariant ?? "No separate recovered-invariant interpretation is published for this clause."}</td>
            <td>{clause.relationships.length
              ? clause.relationships.map((relationship, relationshipIndex) => (
                  <TaxonomyRelationshipAssessment
                    relationship={relationship}
                    clauseIndex={index}
                    relationshipIndex={relationshipIndex}
                    key={`${index}-${relationshipIndex}-${relationship.classId ?? "unmapped"}`}
                  />
                ))
              : taxonomyAssessmentRationales(clause.relationships).map((rationale, rationaleIndex) => (
                  <div className="vigil-taxonomy-assessment-rationale" key={`${index}-${rationaleIndex}`}>{rationale}</div>
                ))}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>;
}
