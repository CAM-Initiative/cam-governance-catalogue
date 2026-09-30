import type { ReactNode } from "react";
import type { UnknownRecord } from "@/lib/vigilRegistry";

type ClauseRelationship = {
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
  taxonomyReferenceNumber?: number;
  taxonomyReferenceHref?: string;
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

function SourceClause({ clause }: { clause: ClauseAssessment }) {
  return <div className="vigil-taxonomy-source-wording">
    {clause.sourceAnchor ? <q>{clause.sourceAnchor}</q> : null}
    {clause.sourceParaphrase ? <p>{clause.sourceParaphrase}</p> : null}
    {!clause.sourceAnchor && !clause.sourceParaphrase
      ? <span>Source language is not separately published for this clause.</span>
      : null}
  </div>;
}

function RelationshipStack({
  relationships,
  render,
}: {
  relationships: ClauseRelationship[];
  render: (relationship: ClauseRelationship, index: number) => ReactNode;
}) {
  if (!relationships.length) return <span>—</span>;
  return <div className="vigil-taxonomy-assessment-stack">
    {relationships.map((relationship, index) => (
      <div className="vigil-taxonomy-assessment-stack-item" key={`${relationship.relationship ?? "relationship"}-${index}`}>
        {render(relationship, index)}
      </div>
    ))}
  </div>;
}

export function CaseTaxonomyAssessment({ raw, taxonomyReferenceNumber, taxonomyReferenceHref }: Props) {
  const clauses = parseAssessment(raw);
  if (!clauses.length) return null;

  return <section className="vigil-taxonomy-assessment" aria-labelledby="vigil-taxonomy-assessment-heading">
    <h3 className="vigil-case-editorial-subheading" id="vigil-taxonomy-assessment-heading">Incident breakdown</h3>
    <p className="vigil-taxonomy-assessment-intro">
      Incident evidence is broken into discrete observations, each analysed in the context of the occurrence and mapped to the {taxonomyReferenceNumber && taxonomyReferenceHref
        ? <a href={taxonomyReferenceHref}>VIGIL Alignment Taxonomy [{taxonomyReferenceNumber}]</a>
        : "VIGIL Alignment Taxonomy"} for formal adjudication.
    </p>
    <div className="vigil-external-assessment-table-wrap vigil-taxonomy-assessment-table-wrap" role="region" aria-label="VIGIL Observatory incident breakdown table" tabIndex={0}>
      <table className="vigil-external-assessment-table vigil-taxonomy-assessment-table">
        <caption className="sr-only">VIGIL Observatory Incident observations and occurrence-specific analysis mapped to the VIGIL Alignment Taxonomy for formal adjudication.</caption>
        <thead>
          <tr>
            <th scope="col">Incident observation</th>
            <th scope="col">Incident analysis</th>
          </tr>
        </thead>
        <tbody>
          {clauses.map((clause, index) => <tr key={`${clause.sourceAnchor ?? clause.sourceParaphrase ?? "clause"}-${index}`}>
            <td data-label="Incident observation"><SourceClause clause={clause} /></td>
            <td data-label="Incident analysis" className="vigil-taxonomy-incident-analysis">
              <RelationshipStack
                relationships={clause.relationships}
                render={(relationship) => relationship.rationale ?? taxonomyAssessmentSummary([relationship])}
              />
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>;
}
