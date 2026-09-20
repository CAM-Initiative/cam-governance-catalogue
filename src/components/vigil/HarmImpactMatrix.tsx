import type { UnknownRecord } from "@/lib/vigilRegistry";

const BANDS = ["S1", "S2", "S3", "S4", "S5"] as const;
type Band = typeof BANDS[number];

const BAND_LABELS: Record<string, string> = {
  S1: "Minimal / no harm",
  S2: "Low",
  S3: "Moderate",
  S4: "High",
  S5: "Catastrophic / critical",
  SU: "Unassessed",
};

const DIMENSIONS = [
  {
    dimension_id: "physical-health-safety",
    label: "Physical health & safety",
    thresholds: {
      S1: "Evidence positively establishes no injury, illness or safety consequence where physical harm was directly at issue.",
      S2: "Temporary minor symptoms or safety exposure requiring no more than basic first aid or equivalent self-care.",
      S3: "Medically significant but substantially reversible injury or illness, or bounded exposure requiring professional treatment.",
      S4: "Life-threatening or permanently disabling injury or illness to one or more people, or substantial multi-person health impact.",
      S5: "Death, multiple grave casualties, or catastrophic population-scale health or safety consequence.",
    },
  },
  {
    dimension_id: "psychological-wellbeing",
    label: "Psychological wellbeing",
    thresholds: {
      S1: "Evidence positively establishes no downstream psychological harm where psychological impact was directly at issue.",
      S2: "Transient distress or confusion without evidenced clinical intervention or enduring impairment.",
      S3: "Meaningful sustained distress, dependency or impairment, bounded in scope and not shown to be grave or enduring.",
      S4: "Severe or enduring psychological injury, crisis intervention, or substantial functional impairment affecting a vulnerable person or group.",
      S5: "Materialised suicide, catastrophic self-harm, or comparably grave and enduring population-scale psychological harm.",
    },
  },
  {
    dimension_id: "rights-liberty",
    label: "Rights & liberty",
    thresholds: {
      S1: "Evidence positively establishes no restriction, deprivation or procedural rights impact where rights or liberty were directly at issue.",
      S2: "Minor, brief and readily corrected procedural impact or restriction.",
      S3: "Meaningful but bounded denial, detention, exclusion or procedural deprivation that is substantially reversible.",
      S4: "Substantial or prolonged deprivation of liberty, essential care, legal protection or essential opportunity.",
      S5: "Grave or enduring deprivation of liberty or essential care, severe child or sexual-safety rights harm, or comparably catastrophic rights impact.",
    },
  },
  {
    dimension_id: "equal-treatment",
    label: "Equal treatment & non-discrimination",
    thresholds: {
      S1: "Evidence positively establishes no differential or discriminatory treatment where equal treatment was directly at issue.",
      S2: "Minor, isolated and readily corrected differential treatment without consequential exclusion.",
      S3: "Meaningful but bounded discriminatory treatment, exclusion or unequal access that is substantially reversible.",
      S4: "Substantial, repeated or systemic discriminatory treatment affecting consequential decisions, services or opportunities.",
      S5: "Grave, pervasive or enduring discriminatory deprivation producing catastrophic individual or population-level consequences.",
    },
  },
  {
    dimension_id: "privacy-confidentiality",
    label: "Privacy & confidentiality",
    thresholds: {
      S1: "Evidence positively establishes that no personal or confidential data was exposed beyond a controlled boundary where data exposure was directly tested.",
      S2: "Limited, low-sensitivity exposure or unauthorised processing with rapid containment and no evidenced downstream misuse.",
      S3: "Meaningful bounded exposure, access or misuse of personal, credential or confidential information that is substantially containable.",
      S4: "Large-scale or highly sensitive exposure, persistent loss of confidentiality, or substantial evidenced misuse.",
      S5: "Catastrophic, effectively irreversible exposure creating grave safety, liberty or societal consequences.",
    },
  },
  {
    dimension_id: "financial-economic",
    label: "Financial & economic",
    thresholds: {
      S1: "Aggregate direct realised loss below USD 10,000, without material livelihood or organisational-viability impairment.",
      S2: "USD 10,000 to below USD 1 million, or independently evidenced low and readily remediable economic disruption where no defensible USD conversion is available.",
      S3: "USD 1 million to below USD 100 million, or independently evidenced material but bounded livelihood or organisational loss where no defensible USD conversion is available.",
      S4: "USD 100 million to below USD 100 billion, or independently evidenced substantial solvency, organisational-viability or widespread economic impact where no defensible USD conversion is available.",
      S5: "At least USD 100 billion, catastrophic insolvency or systemic economic loss.",
    },
  },
  {
    dimension_id: "property-asset-damage",
    label: "Property & asset damage",
    thresholds: {
      S1: "Evidence positively establishes no loss, destruction or impairment of physical or digital assets where asset damage was directly at issue.",
      S2: "Minor, localised and readily reversible loss, corruption or impairment of non-critical physical or digital assets.",
      S3: "Meaningful but bounded destruction, corruption, unauthorised modification or loss of physical or digital assets requiring material recovery work.",
      S4: "Substantial destruction or impairment of important or critical assets requiring major recovery, while remaining below catastrophic loss.",
      S5: "Catastrophic or effectively irreversible destruction of critical physical or digital assets.",
    },
  },
  {
    dimension_id: "service-operational-infrastructure",
    label: "Service, operations & infrastructure",
    thresholds: {
      S1: "No user-visible impairment, or a positively evidenced non-critical interruption below 15 minutes, contained within applicable recovery objectives.",
      S2: "Limited non-critical degradation below two hours, a critical-service interruption below 30 minutes, or a localised workflow failure resolved through routine recovery.",
      S3: "Material important-service or workflow disruption; important-function outage over two hours; relevant cloud unavailability over 30 minutes; or bounded large-user availability impact over one hour.",
      S4: "Essential or critical operation disrupted over 24 hours, material multi-organisation or multi-jurisdiction impact, exceeded evidenced tolerable downtime, or substantial external recovery.",
      S5: "Catastrophic or prolonged loss of essential service or operational collapse producing comparably grave materialised consequences.",
    },
  },
  {
    dimension_id: "reputation-dignity",
    label: "Reputation & dignity",
    thresholds: {
      S1: "Evidence positively establishes no downstream reputational or dignitary harm where that consequence was directly at issue.",
      S2: "Minor, localised and readily corrected embarrassment, offence or attribution error.",
      S3: "Meaningful bounded humiliation, impersonation, false attribution or reputational injury with substantial prospects of correction.",
      S4: "Severe, wide-reaching or persistent dignitary or reputational injury with substantial personal or organisational consequences.",
      S5: "Catastrophic and effectively irreversible dignitary or reputational harm coupled to grave safety, liberty or societal consequences.",
    },
  },
  {
    dimension_id: "societal-democratic",
    label: "Societal & democratic",
    thresholds: {
      S1: "Evidence positively establishes no downstream societal or democratic harm where collective impact was directly at issue.",
      S2: "Minor, localised and readily reversible collective, civic or public-information impact.",
      S3: "Meaningful but bounded collective, civic, democratic-process, public-institution or information-environment impact.",
      S4: "Substantial cross-community, democratic-process or public-institution impact with persistent consequences.",
      S5: "Catastrophic systemic societal or democratic consequence, including grave and enduring destabilisation.",
    },
  },
  {
    dimension_id: "environmental",
    label: "Environmental",
    thresholds: {
      S1: "Evidence positively establishes no environmental consequence where environmental impact was directly at issue.",
      S2: "Minor, localised and readily reversible environmental impact.",
      S3: "Meaningful but bounded environmental degradation requiring active remediation.",
      S4: "Substantial, persistent or cross-jurisdiction environmental damage.",
      S5: "Catastrophic, widespread or effectively irreversible environmental damage.",
    },
  },
] as const;

type MatrixRow = {
  dimension_id: string;
  assessment_status: string;
  severity?: string;
  threshold_id?: string;
  assessment_basis?: string;
  evidence_confidence?: string;
  observed_values?: unknown[];
  evidence_refs?: string[];
};

function object(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function string(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function rowsFor(assessment?: UnknownRecord): MatrixRow[] {
  if (!Array.isArray(assessment?.dimensions)) return [];
  const order = new Map(DIMENSIONS.map((dimension, index) => [dimension.dimension_id, index]));
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
      evidence_refs: Array.isArray(row.evidence_refs) ? row.evidence_refs.flatMap((value) => string(value) ?? []) : undefined,
    }];
  }).sort((a, b) => (order.get(a.dimension_id) ?? 999) - (order.get(b.dimension_id) ?? 999));
}

function dimensionLabel(id: string) {
  return DIMENSIONS.find((dimension) => dimension.dimension_id === id)?.label ?? id.split("-").join(" ");
}

export function nonAssessedHarmDimensionLimitItems(assessment?: UnknownRecord): string[] {
  if (!assessment) return [];
  const rows = rowsFor(assessment).filter((row) => row.assessment_status !== "assessed");
  const statuses = [...new Set(rows.map((row) => row.assessment_status))];
  return statuses.map((status) => {
    const matching = rows.filter((row) => row.assessment_status === status);
    return `${rollupLabel(status)} (${matching.length}): ${matching.map((row) => dimensionLabel(row.dimension_id)).join("; ")}.`;
  });
}

function resultLabel(row: MatrixRow) {
  if (row.assessment_status === "assessed" && row.severity) {
    return row.severity + " · " + (BAND_LABELS[row.severity] ?? row.severity);
  }
  return "Not scored";
}

function observedValueLines(values?: unknown[]) {
  if (!values?.length) return [];
  return values.flatMap((value) => {
    if (typeof value === "string" && value.trim()) return [value.trim()];
    const record = object(value);
    if (!record) return [];
    const metric = string(record.metric);
    const detail = string(record.qualitative_value)
      ?? string(record.value)
      ?? string(record.amount)
      ?? string(record.duration)
      ?? string(record.count);
    if (!detail) return [];
    return [metric ? metric + ": " + detail : detail];
  });
}

function assessmentSummary(row: MatrixRow) {
  if (row.assessment_basis) return row.assessment_basis;
  const observed = observedValueLines(row.observed_values);
  return observed.length ? observed.join("; ") : undefined;
}

function rollupLabel(status: string) {
  if (status === "unreported") return "Not scored";
  if (status === "insufficient-evidence") return "Unbanded — insufficient evidence";
  if (status === "not-applicable") return "Not applicable";
  return "Not assessed";
}

const HIGHLIGHT_TERMS = new Set([
  "usd 10,000",
  "usd 1 million",
  "usd 100 million",
  "usd 100 billion",
  "death",
  "multiple grave casualties",
  "life-threatening",
  "permanently disabling",
  "materialised suicide",
  "catastrophic self-harm",
  "15 minutes",
  "two hours",
  "30 minutes",
  "one hour",
  "24 hours",
]);

const HIGHLIGHT_PATTERN = /(USD 10,000|USD 1 million|USD 100 million|USD 100 billion|Death|multiple grave casualties|Life-threatening|permanently disabling|Materialised suicide|catastrophic self-harm|15 minutes|two hours|30 minutes|one hour|24 hours)/gi;

function highlightedThreshold(text: string) {
  return text.split(HIGHLIGHT_PATTERN).map((part, index) =>
    HIGHLIGHT_TERMS.has(part.toLowerCase())
      ? <strong className="vigil-harm-threshold-emphasis" key={index}>{part}</strong>
      : part
  );
}

function MethodologyMatrix({ compact }: { compact: boolean }) {
  return <div className={"vigil-harm-matrix is-methodology" + (compact ? " is-compact" : "")}>
    <div className="vigil-harm-matrix-scroll" role="region" aria-label="VIGIL Harm Impact Matrix severity threshold reference" tabIndex={0}>
      <table className="vigil-harm-methodology-table">
        <thead>
          <tr>
            <th scope="col">Harm dimension</th>
            {BANDS.map((band) => <th scope="col" key={band} className={"band-" + band.toLowerCase()}>
              <strong>{band}</strong>
              <span>{BAND_LABELS[band]}</span>
            </th>)}
          </tr>
        </thead>
        <tbody>
          {DIMENSIONS.map((dimension) => <tr key={dimension.dimension_id}>
            <th scope="row">{dimension.label}</th>
            {BANDS.map((band) => <td key={band} className={"band-" + band.toLowerCase()}>
              <p>{highlightedThreshold(dimension.thresholds[band])}</p>
            </td>)}
          </tr>)}
        </tbody>
      </table>
    </div>

    <div className="vigil-harm-evidence-key" aria-label="Harm assessment evidence states">
      <div><strong>Assessed</strong><span>Evidence supports a materialised impact and a specific threshold band.</span></div>
      <div><strong>Unreported</strong><span>The dimension is relevant, but published evidence does not report whether or how harm materialised. It is not S1.</span></div>
      <div><strong>Insufficient evidence</strong><span>Some impact evidence exists, but it cannot distinguish a defensible severity band.</span></div>
      <div><strong>Not applicable</strong><span>Affirmative context places the dimension outside the Incident’s bounded scope.</span></div>
    </div>

    <p className="vigil-harm-method-note"><strong>SU — Unassessed:</strong> no defensible overall band can be derived because no dimension can be banded and the evidence does not positively establish bounded no-materialised-harm. SU is an evidence state, not a sixth severity band.</p>
  </div>;
}

function AssessmentMatrix({ assessment, compact, methodology, assessedOn, evidenceReferenceNumbers }: { assessment: UnknownRecord; compact: boolean; methodology?: string; assessedOn?: string; evidenceReferenceNumbers?: Record<string, number> }) {
  const rows = rowsFor(assessment);
  const assessedRows = rows.filter((row) => row.assessment_status === "assessed");
  const otherRows = rows.filter((row) => row.assessment_status !== "assessed");
  const overall = string(assessment.overall_severity) ?? "SU";
  const controlling = new Set(Array.isArray(assessment.controlling_dimensions)
    ? assessment.controlling_dimensions.flatMap((value) => string(value) ?? [])
    : []);
  const noMaterialisedHarmBasis = string(assessment.no_materialised_harm_basis);
  const coverageNote = string(assessment.coverage_note);
  const assessmentGap = string(assessment.assessment_gap);

  return <div className={"vigil-harm-matrix is-assessment" + (compact ? " is-compact" : "")}>
    <div className="vigil-harm-matrix-overview">
      <div className="vigil-harm-summary-row">
        {methodology ? <div className="vigil-harm-summary-item"><span>Methodology</span><strong>{methodology}</strong></div> : null}
        {assessedOn ? <div className="vigil-harm-summary-item"><span>Assessed</span><strong>{assessedOn}</strong></div> : null}
        <div className="vigil-harm-overall-result">
          <span>Overall severity</span>
          <strong className={"severity-" + overall.toLowerCase()}>{overall}</strong>
          <small>{BAND_LABELS[overall] ?? "Not assessed"}</small>
        </div>
      </div>
      <p><strong>Derivation:</strong> highest supported materialised harm. Dimensions are not averaged or summed.</p>
    </div>

    {noMaterialisedHarmBasis ? <p className="vigil-harm-no-harm-basis"><strong>Positive no-materialised-harm basis:</strong> {noMaterialisedHarmBasis}</p> : null}

    {assessedRows.length ? <div className="vigil-harm-matrix-scroll" role="region" aria-label="Incident-specific VIGIL Harm Impact assessment" tabIndex={0}>
      <table className="vigil-harm-assessment-table">
        <thead>
          <tr>
            <th scope="col">Harm dimension</th>
            <th scope="col">Evidence state</th>
            <th scope="col">Result</th>
            <th scope="col">Evidence-backed assessment</th>
          </tr>
        </thead>
        <tbody>
          {assessedRows.map((row) => {
            const isControlling = controlling.has(row.dimension_id);
            const summary = assessmentSummary(row);
            return <tr key={row.dimension_id} className={isControlling ? "is-controlling" : undefined}>
              <th scope="row">
                <span>{dimensionLabel(row.dimension_id)}</span>
                {isControlling ? <strong className="vigil-harm-controlling-badge">Controls overall severity</strong> : null}
              </th>
              <td className="status-assessed"><strong>Assessed</strong></td>
              <td className={row.severity ? "band-" + row.severity.toLowerCase() + " is-result" : undefined}><strong>{resultLabel(row)}</strong></td>
              <td className="vigil-harm-assessment-basis">{summary ? <p>{summary}{row.evidence_refs?.length ? <span className="vigil-harm-inline-references"> {row.evidence_refs.flatMap((ref) => evidenceReferenceNumbers?.[ref] ? [<a key={ref} href={`#vigil-evidence-reference-${evidenceReferenceNumbers[ref]}`} aria-label={`Evidence reference ${evidenceReferenceNumbers[ref]}`}>[{evidenceReferenceNumbers[ref]}]</a>] : [])}</span> : null}</p> : null}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div> : <p className="vigil-harm-method-note">No harm dimension has a defensible scored band in the current public Incident record.</p>}


    {coverageNote ? <p className="vigil-harm-coverage"><strong>Assessment coverage:</strong> {coverageNote}</p> : null}
    {assessmentGap ? <p className="vigil-harm-coverage"><strong>Evidence needed:</strong> {assessmentGap}</p> : null}
  </div>;
}

export function HarmImpactMatrix({ assessment, compact = false, methodology, assessedOn, evidenceReferenceNumbers }: { assessment?: UnknownRecord; compact?: boolean; methodology?: string; assessedOn?: string; evidenceReferenceNumbers?: Record<string, number> }) {
  return assessment
    ? <AssessmentMatrix assessment={assessment} compact={compact} methodology={methodology} assessedOn={assessedOn} evidenceReferenceNumbers={evidenceReferenceNumbers} />
    : <MethodologyMatrix compact={compact} />;
}
