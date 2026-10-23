import { useEffect, useState } from "react";
import { loadCurrentHarmMethodologyDefinition, type HarmMethodologyDefinition } from "@/lib/vigilHarmMethodology";
import { harmThresholdParts } from "@/lib/vigilHarmEmphasis.mjs";
import { HARM_BANDS, harmDimensions } from "@/lib/vigilHarmReference";
import { publicHarmIndicatorLabel, publicHarmQuantificationNote, publicHarmInterpretiveNote } from "@/lib/vigilHarmPublic.mjs";
import type { UnknownRecord } from "@/lib/vigilRegistry";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";

const BANDS = HARM_BANDS;
const BAND_LABELS: Record<string, string> = {
  S1: "Minimal / no harm", S2: "Low", S3: "Moderate", S4: "High",
  S5: "Catastrophic / critical", SU: "Unassessed",
};
const DIMENSIONS = harmDimensions;

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

export function highlightedThreshold(text: string) {
  return harmThresholdParts(text).map((part, index) => part.emphasis
    ? <strong className="vigil-harm-threshold-emphasis" key={index}>{part.text}</strong>
    : part.text);
}

function MethodologyMatrix({ compact }: { compact: boolean }) {
  const [definition, setDefinition] = useState<HarmMethodologyDefinition>();
  useEffect(() => {
    let active = true;
    loadCurrentHarmMethodologyDefinition().then(value => { if (active && value) setDefinition(value); });
    return () => { active = false; };
  }, []);
  const dimensions = definition?.dimensions ?? DIMENSIONS;
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
          {dimensions.map((dimension) => <tr key={dimension.dimension_id}>
            <th scope="row">{dimension.label}</th>
            {BANDS.map((band) => <td key={band} className={"band-" + band.toLowerCase()}>
              <p>{highlightedThreshold(dimension.thresholds[band].criterion)}</p>
            </td>)}
          </tr>)}
        </tbody>
      </table>
    </div>

    {/* Canonical methodology adaptation notes sit outside the threshold cells so they remain readable and citable. */}
    <section className="vigil-harm-interpretive-notes" aria-labelledby="vigil-harm-interpretive-notes-heading">
      <h3 id="vigil-harm-interpretive-notes-heading">Interpretive notes</h3>
      {dimensions.flatMap((dimension) => dimension.adaptation_note
        ? [<p key={dimension.dimension_id}><strong>{dimension.label}:</strong> {publicHarmInterpretiveNote(dimension.adaptation_note)}</p>]
        : [])}
    </section>
    <section className="vigil-harm-interpretive-notes" aria-labelledby="harm-quantification-heading">
      <h3 id="harm-quantification-heading">Quantification and recognition guidance</h3>
      <p>Record the observed outcome, units, period, relevant denominator, uncertainty and source. Numerical indicators support the domain criteria; an audience count or elapsed time alone does not determine severity. Illustrative recovery periods are not mandatory waiting periods.</p>
      {dimensions.map((dimension) => <details key={dimension.dimension_id} className="vigil-harm-guidance-detail">
        <summary>{dimension.label}</summary>
        {publicHarmQuantificationNote(dimension.quantification_note) ? <p>{publicHarmQuantificationNote(dimension.quantification_note)}</p> : null}
        {dimension.interpretive_note ? <p>{publicHarmInterpretiveNote(dimension.interpretive_note)}</p> : null}
        <p><strong>Relevant indicators</strong></p>
        <ul>{(dimension.quantitative_indicators ?? []).map(indicator => <li key={indicator}>{publicHarmIndicatorLabel(indicator)}</li>)}</ul>
      </details>)}
    </section>
  </div>;
}

export function HarmEvidenceStateDefinitions() {
  return <section className="vigil-harm-definitions" aria-labelledby="vigil-harm-definitions-heading">
    <h3 id="vigil-harm-definitions-heading">Definitions</h3>
    <dl>
      <div><dt>Assessed</dt><dd>Evidence supports a materialised impact and a specific threshold band.</dd></div>
      <div><dt>Unreported</dt><dd>The dimension is relevant, but published evidence does not report whether or how harm materialised. It is not S1.</dd></div>
      <div><dt>Insufficient evidence</dt><dd>Some impact evidence exists, but it cannot distinguish a defensible severity band.</dd></div>
      <div><dt>Not applicable</dt><dd>Affirmative context places the dimension outside the Incident’s bounded scope.</dd></div>
      <div><dt>SU — Unassessed</dt><dd>No defensible overall band can be derived because no dimension can be banded and the evidence does not positively establish bounded no-materialised-harm. SU is an evidence state, not a sixth severity band.</dd></div>
    </dl>
  </section>;
}

function AssessmentMatrix({ assessment, compact, evidenceReferenceNumbers, methodologyReferenceNumber, methodologyReferenceHref }: { assessment: UnknownRecord; compact: boolean; evidenceReferenceNumbers?: Record<string, number>; methodologyReferenceNumber?: number; methodologyReferenceHref?: string }) {
  const rows = rowsFor(assessment);
  const assessedRows = rows.filter((row) => row.assessment_status === "assessed");
  const overall = string(assessment.overall_severity) ?? "SU";
  const aggregate = assessment.assessment_pathway === "generic_deployed_evaluation";
  const controlling = new Set(Array.isArray(assessment.controlling_dimensions)
    ? assessment.controlling_dimensions.flatMap((value) => string(value) ?? [])
    : []);
  const noMaterialisedHarmBasis = string(assessment.no_materialised_harm_basis);
  const assessmentGap = string(assessment.assessment_gap);

  const derivationNote = noMaterialisedHarmBasis
    ? <>No materialised downstream harm was established for the bounded occurrence. S1 is assigned under the VIGIL-HIM positive no-materialised-harm pathway. <strong>Basis:</strong> {noMaterialisedHarmBasis}</>
    : overall === "SU"
      ? <>No defensible overall severity band could be derived because no Harm Impact dimension could be banded and positive no-materialised-harm was not established. SU denotes an unassessed evidence state, not a sixth severity band.</>
      : assessedRows.length
        ? <>{aggregate ? "Overall Aggregate Harm is determined by the highest supported aggregate dimension band." : "Overall harm severity is determined by the highest supported materialised harm across the assessed dimensions."}</>
        : <>No harm dimension has a defensible scored band in the current public Incident record.</>;

  return <div className={"vigil-harm-matrix is-assessment" + (compact ? " is-compact" : "")} data-harm-footer="contextual">
    {aggregate ? <p className="vigil-harm-coverage"><strong>Aggregate Harm — modelled from deployed evaluation.</strong> This is an evidence-bounded estimate for a deployed-system mechanism. Eligible users or decision opportunities are not a count of injured people. The assessment basis identifies the tested pathway, denominator and limitations.</p> : null}
    {assessedRows.length ? <div className="vigil-harm-matrix-scroll" role="region" aria-label="Incident-specific VIGIL Harm Impact assessment" tabIndex={0}>
      <table className="vigil-harm-assessment-table">
        <thead>
          <tr>
            <th scope="col">Harm dimension</th>
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
              <td className={row.severity ? "band-" + row.severity.toLowerCase() + " is-result" : undefined}>
                {row.severity
                  ? <span className="vigil-harm-result-chip"><VigilStatusChip value={row.severity} /><span>{BAND_LABELS[row.severity] ?? row.severity}</span></span>
                  : <strong>{resultLabel(row)}</strong>}
              </td>
              {/* evidence_refs are canonical row-local provenance; citation numbers are resolved against the final deduplicated Evidence sources list. */}
              <td className="vigil-harm-assessment-basis">{summary ? <p>{summary}{row.evidence_refs?.length ? <span className="vigil-harm-inline-references"> {row.evidence_refs.flatMap((ref) => evidenceReferenceNumbers?.[ref] ? [<a key={ref} href={`#vigil-evidence-reference-${evidenceReferenceNumbers[ref]}`} aria-label={`Evidence reference ${evidenceReferenceNumbers[ref]}`}>[{evidenceReferenceNumbers[ref]}]</a>] : [])}</span> : null}</p> : null}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div> : null}

    {/* One context-sensitive methodology footer closes every public assessment; coverage_note remains canonical audit data rather than duplicate public prose. */}
    <p className="vigil-harm-method-note vigil-harm-derivation-note">{derivationNote}{methodologyReferenceNumber && methodologyReferenceHref ? <> <a className="vigil-harm-methodology-reference" href={methodologyReferenceHref} aria-label={`VIGIL Harm Impact Methodology reference ${methodologyReferenceNumber}`}>[{methodologyReferenceNumber}]</a></> : null}</p>
    {assessmentGap ? <p className="vigil-harm-coverage"><strong>Evidence gap:</strong> {assessmentGap}</p> : null}
  </div>;
}

export function HarmImpactMatrix({ assessment, compact = false, evidenceReferenceNumbers, methodologyReferenceNumber, methodologyReferenceHref }: { assessment?: UnknownRecord; compact?: boolean; evidenceReferenceNumbers?: Record<string, number>; methodologyReferenceNumber?: number; methodologyReferenceHref?: string }) {
  return assessment
    ? <AssessmentMatrix assessment={assessment} compact={compact} evidenceReferenceNumbers={evidenceReferenceNumbers} methodologyReferenceNumber={methodologyReferenceNumber} methodologyReferenceHref={methodologyReferenceHref} />
    : <MethodologyMatrix compact={compact} />;
}
