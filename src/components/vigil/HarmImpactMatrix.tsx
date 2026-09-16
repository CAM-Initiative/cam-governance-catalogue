import type { UnknownRecord } from "@/lib/vigilRegistry";

const BANDS = ["S1", "S2", "S3", "S4", "S5"] as const;

const DIMENSIONS = [
  ["physical-health-safety", "Physical health & safety"],
  ["psychological-wellbeing", "Psychological wellbeing"],
  ["rights-liberty-equal-treatment", "Rights, liberty & equal treatment"],
  ["privacy-confidentiality", "Privacy & confidentiality"],
  ["financial-economic-property", "Financial, economic & property"],
  ["service-operational-infrastructure", "Service, operations & infrastructure"],
  ["reputation-dignity", "Reputation & dignity"],
  ["societal-democratic-environmental", "Societal, democratic & environmental"],
] as const;

const BAND_LABELS: Record<string, string> = {
  S1: "Minimal / none supported",
  S2: "Low",
  S3: "Moderate",
  S4: "High",
  S5: "Catastrophic / critical",
};

type MatrixRow = {
  dimension_id: string;
  assessment_status: string;
  severity?: string;
  threshold_id?: string;
  assessment_basis?: string;
  evidence_confidence?: string;
  observed_values?: unknown[];
};

function object(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function string(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function rowsFor(assessment?: UnknownRecord): MatrixRow[] {
  if (!Array.isArray(assessment?.dimensions)) return [];
  return assessment.dimensions.flatMap((value) => {
    const row = object(value);
    const dimensionId = string(row?.dimension_id);
    const status = string(row?.assessment_status);
    if (!row || !dimensionId || !status) return [];
    return [{
      dimension_id: dimensionId,
      assessment_status: status,
      severity: string(row.severity),
      threshold_id: string(row.threshold_id),
      assessment_basis: string(row.assessment_basis),
      evidence_confidence: string(row.evidence_confidence),
      observed_values: Array.isArray(row.observed_values) ? row.observed_values : undefined,
    }];
  });
}

function displayStatus(status: string) {
  if (status === "insufficient-evidence") return "Insufficient evidence";
  if (status === "not-applicable") return "Not applicable";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function dimensionLabel(id: string) {
  return DIMENSIONS.find(([value]) => value === id)?.[1] ?? id.split("-").join(" ");
}

export function HarmImpactMatrix({ assessment, compact = false }: { assessment?: UnknownRecord; compact?: boolean }) {
  const rows = rowsFor(assessment);
  const overall = string(assessment?.overall_severity) ?? "SU";
  const controlling = new Set(Array.isArray(assessment?.controlling_dimensions)
    ? assessment.controlling_dimensions.flatMap((value) => string(value) ?? [])
    : []);
  const displayRows: MatrixRow[] = rows.length
    ? rows
    : DIMENSIONS.map(([dimension_id]) => ({ dimension_id, assessment_status: "methodology" }));

  return <div className={`vigil-harm-matrix${compact ? " is-compact" : ""}`}>
    <div className="vigil-harm-matrix-overview">
      <div><span>Overall severity</span><strong className={`severity-${overall.toLowerCase()}`}>{overall}</strong><small>{overall === "SU" ? "Insufficient evidence to derive a band" : BAND_LABELS[overall]}</small></div>
      <p><strong>Derivation:</strong> highest supported materialised harm. Dimensions are not averaged or summed.</p>
    </div>
    <div className="vigil-harm-matrix-scroll" role="region" aria-label="VIGIL Harm Impact Matrix" tabIndex={0}>
      <table>
        <thead><tr><th scope="col">Harm dimension</th>{BANDS.map((band) => <th scope="col" key={band}><strong>{band}</strong><span>{BAND_LABELS[band]}</span></th>)}<th scope="col">Evidence state</th></tr></thead>
        <tbody>{displayRows.map((row) => {
          const isControlling = controlling.has(row.dimension_id);
          return <tr key={row.dimension_id} className={isControlling ? "is-controlling" : undefined}>
            <th scope="row"><span>{dimensionLabel(row.dimension_id)}</span>{isControlling ? <strong>Controls overall severity</strong> : null}</th>
            {BANDS.map((band) => {
              const selected = row.assessment_status === "assessed" && row.severity === band;
              return <td key={band} className={`band-${band.toLowerCase()}${selected ? " is-selected" : ""}${selected && isControlling ? " is-controlling" : ""}`} aria-label={`${dimensionLabel(row.dimension_id)} ${band}${selected ? ", selected" : ""}`}>
                <span aria-hidden="true">{selected ? "✓" : ""}</span><span className="sr-only">{selected ? `Selected ${band}` : `Not selected ${band}`}</span>
              </td>;
            })}
            <td className={`status-${row.assessment_status}`}><strong>{row.assessment_status === "methodology" ? "Threshold defined" : displayStatus(row.assessment_status)}</strong>{row.assessment_status === "unreported" ? <span>Not scored</span> : null}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {rows.length ? <div className="vigil-harm-matrix-details">
      {rows.filter((row) => row.assessment_status === "assessed" || row.assessment_status === "insufficient-evidence").map((row) => <article key={row.dimension_id} className={controlling.has(row.dimension_id) ? "is-controlling" : undefined}>
        <div><h4>{dimensionLabel(row.dimension_id)}</h4><span>{row.severity ? `${row.severity}${controlling.has(row.dimension_id) ? " · controlling" : ""}` : displayStatus(row.assessment_status)}</span></div>
        {row.threshold_id ? <p className="vigil-harm-threshold"><strong>Selected threshold:</strong> <code>{row.threshold_id}</code></p> : null}
        <p>{row.assessment_basis}</p>
      </article>)}
      {string(assessment?.coverage_note) ? <p className="vigil-harm-coverage"><strong>Assessment coverage:</strong> {string(assessment?.coverage_note)}</p> : null}
      {string(assessment?.assessment_gap) ? <p className="vigil-harm-coverage"><strong>Evidence needed:</strong> {string(assessment?.assessment_gap)}</p> : null}
    </div> : <p className="vigil-harm-method-note">Each row has its own S1–S5 thresholds. In a Case File, assessed cells are selected; unreported dimensions remain visibly unscored. SU applies when no dimension can be defensibly banded.</p>}
  </div>;
}
