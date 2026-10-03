import { useEffect, useState } from "react";
import { loadExternalRequirementDetails, type ExternalRequirementDetail } from "@/lib/vigilExternalKnowledge";
import { occurrenceRequirementRows, REQUIREMENT_ASSESSMENT_INTRO, type RequirementRow } from "@/lib/vigilOccurrenceRequirements.mjs";
import type { UnknownRecord } from "@/lib/vigilRegistry";

function resultTone(row: RequirementRow) {
  if (row.finding === "Not met") return "failure";
  if (row.finding === "Met") return "met";
  if (row.applicabilityStatus === "not-applicable") return "not-applicable";
  if (row.applicabilityStatus === "insufficient-evidence" || row.finding?.includes("Insufficient")) return "unresolved";
  return "neutral";
}

function RequirementTable({ items, title }: { items: RequirementRow[]; title: string }) {
  if (!items.length) return <p className="vigil-case-empty">None recorded.</p>;
  return <div className="vigil-classification-web-table vigil-compliance-web-table" role="region" aria-label={title} tabIndex={0}>
    <table className="vigil-classification-table vigil-compliance-table">
      <thead><tr>
        <th scope="col">Assessment result</th>
        <th scope="col">External requirement</th>
        <th scope="col">Evidence and assessment basis</th>
      </tr></thead>
      <tbody>{items.map(row => <tr key={row.key}>
        <td data-label="Assessment result" className="vigil-compliance-result-cell">
          <span className={`vigil-compliance-result is-${resultTone(row)}`}>{row.finding || row.applicability}</span>
        </td>
        <td data-label="External requirement">
          <strong>{row.url ? <a href={row.url}>{row.title}</a> : row.title}</strong>
          <p>{row.summary}</p>
          {row.normativeForce && <p className="vigil-compliance-force">{row.normativeForce}</p>}
        </td>
        <td data-label="Evidence and assessment basis">
          <p><strong>Applicability:</strong> {row.applicabilityBasis}</p>
          {row.findingBasis && <p><strong>Finding:</strong> {row.findingBasis}</p>}
          {row.evidence.length > 0 && <p className="vigil-compliance-evidence-links"><strong>Evidence:</strong>{" "}
            {row.evidence.map((source, index) => <span key={source.url ?? index}>{index > 0 ? " · " : ""}<a href={source.url}>{source.referenceNumber ? `[${source.referenceNumber}] ` : ""}{source.title}</a></span>)}
          </p>}
        </td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function SecondaryAssessmentGroup({ items, title, summary }: { items: RequirementRow[]; title: string; summary: string }) {
  if (!items.length) return null;
  return <details className="vigil-compliance-secondary-group">
    <summary><span>{title}</span><span>{summary}</span></summary>
    <RequirementTable items={items} title={title} />
  </details>;
}

export function CaseRequirementAssessments({ raw }: { raw: UnknownRecord }) {
  const [requirements, setRequirements] = useState<ExternalRequirementDetail[]>([]);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let active = true;
    loadExternalRequirementDetails().then(result => {
      if (!active) return;
      setRequirements(result.status === "ready" ? result.data : []);
      setStatus(result.status);
    });
    return () => { active = false; };
  }, []);

  const rows = occurrenceRequirementRows(raw, requirements);
  if (!rows.length) return <p className="vigil-case-empty">No occurrence-specific external requirement assessment is published for this Case File.</p>;

  const applicableRows = rows.filter(row => row.applicable);
  const unresolvedRows = rows.filter(row => row.applicabilityStatus === "insufficient-evidence");
  const notApplicableRows = rows.filter(row => row.applicabilityStatus === "not-applicable");

  return <div className="vigil-taxonomy-compliance-view">
    <p className="vigil-compliance-intro">{REQUIREMENT_ASSESSMENT_INTRO}</p>
    {status !== "ready" && <p>{status === "loading" ? "Loading requirement descriptions…" : "Requirement descriptions are temporarily unavailable. Recorded applicability and findings are retained below."}</p>}

    <div className="vigil-compliance-counts" aria-label="External requirement assessment summary">
      <span><strong>{applicableRows.length}</strong> applicable</span>
      <span><strong>{unresolvedRows.length}</strong> applicability unresolved</span>
      <span><strong>{notApplicableRows.length}</strong> not applicable</span>
    </div>

    <section aria-label="Applicable requirements and findings">
      <h3 className="vigil-case-editorial-subheading">Applicable requirements and findings</h3>
      <RequirementTable items={applicableRows} title="Applicable requirements and findings" />
    </section>

    <div className="vigil-compliance-secondary">
      <SecondaryAssessmentGroup
        items={unresolvedRows}
        title="Applicability unresolved"
        summary="The evidence does not establish the source-defined scope or undertaking needed to decide applicability."
      />
      <SecondaryAssessmentGroup
        items={notApplicableRows}
        title="Not applicable to this occurrence"
        summary="A source-defined scope, timing, actor, lifecycle or other condition excludes the requirement from this occurrence."
      />
    </div>
  </div>;
}
