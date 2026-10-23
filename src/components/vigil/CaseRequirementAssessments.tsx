import { AlignmentIcon, alignmentIconKind } from "@/lib/vigilAlignmentIcon.mjs";
import { useEffect, useState } from "react";
import { loadExternalRequirementDetails, type ExternalRequirementDetail } from "@/lib/vigilExternalKnowledge";
import { occurrenceRequirementRows, REQUIREMENT_ASSESSMENT_INTRO, type RequirementRow } from "@/lib/vigilOccurrenceRequirements.mjs";
import type { UnknownRecord } from "@/lib/vigilRegistry";

function RequirementTable({ items, title }: { items: RequirementRow[]; title: string }) {
  if (!items.length) return <p className="vigil-case-empty">None recorded.</p>;
  return <div className="vigil-classification-web-table vigil-compliance-web-table" role="region" aria-label={title} tabIndex={0}>
    <table className="vigil-classification-table vigil-compliance-table">
      <thead><tr>
        <th scope="col">Assessment result</th>
        <th scope="col">External requirement</th>
        <th scope="col">Normative force</th>
        <th scope="col">Evidence and assessment basis</th>
      </tr></thead>
      <tbody>{items.map(row => <tr key={row.key}>
        <td data-label="Assessment result" className="vigil-compliance-result-cell">
          <span className={`vigil-compliance-result is-${row.alignmentResult}`}><AlignmentIcon kind={alignmentIconKind(row.alignmentResult)} /><span>{row.resultLabel}</span></span>
        </td>
        <td data-label="External requirement">
          <strong>{row.url ? <a href={row.url}>{row.title}</a> : row.title}</strong>
          <p>{row.summary}</p>
        </td>
        <td data-label="Normative force" className="vigil-compliance-force">{row.normativeForce}</td>
        <td data-label="Evidence and assessment basis">
          <p>{row.assessmentBasis}{row.evidence.length > 0 ? <span className="vigil-compliance-inline-references"> {row.evidence.map(source =>
            <a key={source.referenceNumber} href={source.url} aria-label={`Evidence reference ${source.referenceNumber}`}>[{source.referenceNumber}]</a>
          )}</span> : null}</p>
          {row.assessedOn && <p><strong>Assessed:</strong> <time dateTime={row.assessedOn}>{row.assessedOn}</time></p>}
        </td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function CaseRequirementAssessments({ raw, sourceReferenceNumbers }: { raw: UnknownRecord; sourceReferenceNumbers?: Record<string, number> }) {
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

  const rows = occurrenceRequirementRows(raw, requirements, sourceReferenceNumbers);
  if (!rows.length) return <p className="vigil-case-empty">No occurrence-specific external requirement assessment is published for this Case File.</p>;

  return <div className="vigil-taxonomy-compliance-view">
    <p className="vigil-compliance-intro">{REQUIREMENT_ASSESSMENT_INTRO}</p>
    {status !== "ready" && <p>{status === "loading" ? "Loading requirement descriptions…" : "Requirement descriptions are temporarily unavailable. Recorded assessments remain visible below."}</p>}
    <div className="vigil-compliance-counts" aria-label="External requirement assessment summary">
      {(["aligned", "not-aligned", "boundary"] as const).map(result => <span key={result}>
        <strong>{rows.filter(row => row.alignmentResult === result).length}</strong>{" "}
        {{ aligned: "Aligned", "not-aligned": "Not aligned", boundary: "Boundary" }[result]}
      </span>)}
    </div>
    <RequirementTable items={rows} title="Occurrence external requirement assessments" />
  </div>;
}
