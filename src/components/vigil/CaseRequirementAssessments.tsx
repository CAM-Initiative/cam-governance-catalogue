import { useEffect, useState } from "react";
import { loadExternalRequirementDetails, type ExternalRequirementDetail } from "@/lib/vigilExternalKnowledge";
import { occurrenceRequirementRows, REQUIREMENT_ASSESSMENT_INTRO, type RequirementRow } from "@/lib/vigilOccurrenceRequirements.mjs";
import type { UnknownRecord } from "@/lib/vigilRegistry";

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
  const table = (items: RequirementRow[], title: string) => <section aria-label={title}>
    <h3 className="vigil-case-editorial-subheading">{title}</h3>
    {!items.length ? <p className="vigil-case-empty">None recorded.</p> : <div className="vigil-classification-web-table vigil-compliance-web-table" role="region" aria-label={title} tabIndex={0}>
      <table className="vigil-classification-table vigil-compliance-table"><thead><tr>
        <th scope="col">External requirement</th><th scope="col">{items[0].applicable ? "VIGIL Finding" : "Applicability"}</th><th scope="col">Evidence and assessment basis</th>
      </tr></thead><tbody>{items.map(row => <tr key={row.key}>
        <td data-label="External requirement"><strong>{row.url ? <a href={row.url} target="_blank" rel="noreferrer">{row.title}</a> : row.title}</strong><p>{row.summary}</p>{row.normativeForce && <p>{row.normativeForce}</p>}</td>
        <td data-label={row.applicable ? "VIGIL Finding" : "Applicability"}>{row.finding || row.applicability}</td>
        <td data-label="Evidence and assessment basis"><p><strong>Applicability:</strong> {row.applicabilityBasis}</p>{row.findingBasis && <p><strong>Finding:</strong> {row.findingBasis}</p>}{row.evidence.length > 0 && <ul>{row.evidence.map((source, index) => <li key={index}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : source.title}</li>)}</ul>}</td>
      </tr>)}</tbody></table>
    </div>}
  </section>;
  return <div className="vigil-taxonomy-compliance-view"><p className="vigil-compliance-intro">{REQUIREMENT_ASSESSMENT_INTRO}</p>
    {status !== "ready" && <p>{status === "loading" ? "Loading requirement descriptions…" : "Requirement descriptions are temporarily unavailable. Recorded applicability and findings are retained below."}</p>}
    {table(rows.filter(row => row.applicable), "Applicable requirements and findings")}
    {table(rows.filter(row => !row.applicable), "Applicability unresolved or not applicable")}
  </div>;
}
