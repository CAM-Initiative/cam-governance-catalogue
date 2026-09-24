import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { CaseTaxonomyClassification, CaseTaxonomyRepair } from "@/components/vigil/CaseTaxonomyClassification";
import { CaseTaxonomyAssessment } from "@/components/vigil/CaseTaxonomyAssessment";
import { HarmImpactMatrix } from "@/components/vigil/HarmImpactMatrix";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilIncidentRecords, loadVigilRecordDetail, type UnknownRecord } from "@/lib/vigilRegistry";
import {
  normalizeRecords,
  normalizeVigilRecord,
  titleizeValue,
  type VigilIndexRecord,
} from "@/lib/vigilPresentation";
import { taxonomyAlignmentOutcomeLabel, taxonomyFailureTypeLabel } from "@/lib/vigilTaxonomyClassification";
import { externalAssessmentDate, externalAssessmentsFrom, externalIncidentReferencesFrom } from "@/lib/vigilExternalAssessments";
import { dedupeAffectedSystems } from "@/lib/vigilAffectedSystems";

type ReportState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sourceId: string; records: VigilIndexRecord[]; generatedAt: string };

type ExternalEvidence = {
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
  sourceRecordRefs: string[];
};

type IncidentArtefact = {
  id: string;
  title?: string;
  permalink?: string;
  renderUrl: string;
  sourceUrl?: string;
  altText?: string;
  caption?: string;
};

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAt(record: UnknownRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => isObject(current) ? current[part] : undefined, record);
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function firstText(record: UnknownRecord, paths: string[]) {
  for (const path of paths) {
    const value = text(valueAt(record, path));
    if (value) return value;
  }
  return undefined;
}

function textList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return values.flatMap((item) => text(item) ? [text(item)!] : []);
}

function firstTextList(record: UnknownRecord, paths: string[]) {
  for (const path of paths) {
    const values = textList(valueAt(record, path));
    if (values.length) return values;
  }
  return [];
}

function mergeRecordDetail(indexRecord: VigilIndexRecord, detail: UnknownRecord) {
  return normalizeVigilRecord({
    ...detail,
    path: detail.path ?? indexRecord.path,
    github_blob_url: detail.github_blob_url ?? indexRecord.github_blob_url,
    raw_url: detail.raw_url ?? indexRecord.raw_url,
    source_registry: detail.source_registry ?? indexRecord.source_registry,
  });
}

async function detailedRecord(indexRecord: VigilIndexRecord) {
  return mergeRecordDetail(indexRecord, await loadVigilRecordDetail(indexRecord.raw));
}

function externalEvidenceFor(record: VigilIndexRecord): ExternalEvidence[] {
  const sourceRecords = Array.isArray(record.raw.source_records) ? record.raw.source_records : undefined;
  const sources = sourceRecords ?? [record.raw.sources, record.raw.evidence_sources].find(Array.isArray);
  if (!Array.isArray(sources)) return [];
  return sources.flatMap((source, sourceIndex) => {
    const sourceRecordRefs = sourceRecords ? [`source_records[${sourceIndex}]`] : [];
    if (typeof source === "string") return [{
      title: source,
      url: /^https?:\/\//i.test(source) ? source : undefined,
      sourceRecordRefs,
    }];
    if (!isObject(source)) return [];
    const residence = text(source.source_residence)?.toLowerCase();
    if (residence === "cam-internal" || residence === "internal") return [];
    const title = text(source.source_title ?? source.title ?? source.name);
    if (!title) return [];
    return [{
      title,
      publisher: text(source.author_or_publisher ?? source.publisher ?? source.source_platform),
      date: text(source.source_date ?? source.date ?? source.published_date),
      url: text(source.source_url ?? source.url ?? source.archive_url),
      description: text(source.source_context ?? source.description ?? source.relevance_note),
      sourceRecordRefs,
    }];
  });
}

function dedupeEvidence(evidence: ExternalEvidence[]) {
  const collected = new Map<string, ExternalEvidence>();
  for (const source of evidence) {
    const key = `${source.title.toLowerCase()}|${source.url ?? ""}`;
    const existing = collected.get(key);
    if (existing) {
      existing.sourceRecordRefs = [...new Set([...existing.sourceRecordRefs, ...source.sourceRecordRefs])];
      continue;
    }
    collected.set(key, { ...source, sourceRecordRefs: [...source.sourceRecordRefs] });
  }
  return [...collected.values()];
}

function externalAssessmentEvidenceReferenceNumber(assessment: { sourceRecordRefs: string[]; url: string }, externalSources: ExternalEvidence[], sourceReferenceNumbers: Record<string, number>) {
  for (const ref of assessment.sourceRecordRefs) {
    const number = sourceReferenceNumbers[ref];
    if (number) return number;
  }
  const normalizedUrl = assessment.url.replace(/\/$/, "").toLowerCase();
  const index = externalSources.findIndex((source) => source.url?.replace(/\/$/, "").toLowerCase() === normalizedUrl);
  return index >= 0 ? index + 1 : undefined;
}

function evidenceReferenceNumberForUrl(sources: ExternalEvidence[], url?: string) {
  if (!url) return undefined;
  const normalized = url.replace(/\/$/, "").toLowerCase();
  const index = sources.findIndex((source) => source.url?.replace(/\/$/, "").toLowerCase() === normalized);
  return index >= 0 ? index + 1 : undefined;
}

function incidentArtefactsFor(record: VigilIndexRecord): IncidentArtefact[] {
  const artefacts = Array.isArray(record.raw.incident_artefacts) ? record.raw.incident_artefacts : [];
  return artefacts.flatMap((artefact, index) => {
    if (!isObject(artefact)) return [];
    const renderUrl = text(artefact.render_url ?? artefact.image_url ?? artefact.url);
    if (!renderUrl) return [];
    return [{
      id: text(artefact.artefact_id) ?? `${record.id}-artefact-${index + 1}`,
      title: text(artefact.title),
      permalink: text(artefact.permalink),
      renderUrl,
      sourceUrl: text(artefact.source_url),
      altText: text(artefact.alt_text),
      caption: text(artefact.caption),
    }];
  });
}

function severityDisplay(value?: string) {
  const raw = value?.trim();
  if (!raw) return "Not assessed";
  const code = raw.toUpperCase();
  const labels: Record<string, string> = {
    S1: "Minimal / no downstream harm",
    S2: "Low",
    S3: "Moderate",
    S4: "High",
    S5: "Catastrophic / critical",
    SU: "Unassessed",
  };
  return labels[code] ? `${code} · ${labels[code]}` : titleizeValue(raw);
}

function exemplarExecutionStatus(record?: VigilIndexRecord) {
  if (!record) return undefined;
  return firstText(record.raw, [
    "vigil_assessment.exemplar_execution.status",
    "vigil_assessment.exemplar_execution",
    "vigil_assessment.exemplar_execution_status",
    "exemplar_execution.status",
    "exemplar_execution",
  ])?.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div className="report-field"><dt className="report-label">{label}</dt><dd className="report-value">{value}</dd></div>;
}

function Stage({ number, label, children }: { number: string; label: string; children: ReactNode }) {
  return <section className="report-section" data-report-stage={number}>
    <header className="report-section-header">
      <span className="report-section-number">{number}</span>
      <h2 className="report-section-title">{label}</h2>
    </header>
    <div className="report-section-body">{children}</div>
  </section>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="report-empty">{children}</p>;
}

export default function EvidenceChainReportDeterministic({ hasTaxonomyReference = false }: { hasTaxonomyReference?: boolean }) {
  const [, params] = useRoute("/observatory/reports/:recordId");
  const sourceId = decodeURIComponent(params?.recordId ?? "").trim().replace(/\.md$/i, "");
  const [state, setState] = useState<ReportState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const registry = await loadVigilIncidentRecords();
        const normalized = normalizeRecords(registry.records);
        const indexById = new Map(normalized.map((record) => [record.id, record]));
        const sourceIndex = indexById.get(sourceId);
        if (!sourceIndex || sourceIndex.record_type !== "incident") throw new Error(`The canonical VIGIL Observatory Incident registry does not contain ${sourceId}.`);
        const incident = await detailedRecord(sourceIndex);
        if (!cancelled) setState({ status: "ready", sourceId, records: [incident], generatedAt: new Date().toISOString() });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: (error as Error).message });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [sourceId]);

  const incident = state.status === "ready" ? state.records[0] : undefined;
  const externalSources = useMemo(() => incident ? dedupeEvidence(externalEvidenceFor(incident)) : [], [incident]);
  const harmEvidenceReferenceNumbers = useMemo(() => Object.fromEntries(
    externalSources.flatMap((source, index) => source.sourceRecordRefs.map((ref) => [ref, index + 1])),
  ), [externalSources]);
  const externalAssessments = useMemo(() => incident ? externalAssessmentsFrom(incident.raw) : [], [incident]);
  const externalIncidentReferences = useMemo(() => incident ? externalIncidentReferencesFrom(incident.raw) : [], [incident]);
  const incidentArtefacts = useMemo(() => incident ? incidentArtefactsFor(incident) : [], [incident]);
  const affectedSystems = useMemo(() => incident ? dedupeAffectedSystems([incident]) : [], [incident]);

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 text-muted-foreground sm:px-6 md:px-10">Preparing deterministic Case File report…</main></Shell>;
  if (state.status === "error") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-10"><div className="vigil-reference-state"><h1>Report unavailable</h1><p>{state.message}</p><Link href="/observatory/cases/">Return to Case Files →</Link></div></main></Shell>;

  const governanceConclusion = incident ? firstText(incident.raw, ["vigil_assessment.governance_interpretation"]) : undefined;
  const factualBasis = incident ? firstText(incident.raw, ["vigil_assessment.factual_basis"]) : undefined;
  const governanceSignificance = incident ? firstText(incident.raw, ["vigil_assessment.significance_to_cam", "why_it_matters_to_CAM"]) : undefined;
  const harmImpactAssessment = incident && isObject(incident.raw.harm_impact_assessment) ? incident.raw.harm_impact_assessment : undefined;
  const title = incident?.title ?? "VIGIL Observatory Case File";
  const updated = incident?.record_last_updated ?? incident?.publicDisplay.dates.lastUpdated ?? incident?.date_recorded;
  const classification = incident ? taxonomyFailureTypeLabel(incident.raw) : undefined;
  const classificationDisplay = incident ? taxonomyAlignmentOutcomeLabel(incident.raw) : undefined;
  const isExemplar = classification === "Exemplar";
  const isFailure = classification === "Classified";
  const isCombination = classification === "Combination";
  const isDisputed = classification === "Disputed";
  const exemplarExecution = exemplarExecutionStatus(incident);
  const hasMixedExecution = isExemplar && exemplarExecution === "mixed";

  const evidenceReferences = [
    ...externalSources.map((source) => ({ key: `ext-${source.title}-${source.url ?? ""}`, label: source.title, detail: [source.publisher, source.date].filter(Boolean).join(" · "), url: source.url })),
  ];
  const canonicalReferences = [
    ...state.records.map((record) => ({ key: record.id, label: `${record.id} — ${record.title}`, detail: [record.record_last_updated, record.record_version ? `Version ${record.record_version}` : undefined].filter(Boolean).join(" · "), url: record.github_blob_url ?? record.raw_url })),
  ];
  const taxonomyReferenceNumber = hasTaxonomyReference
    ? evidenceReferences.length + externalIncidentReferences.length + 1
    : undefined;
  const harmMethodologyReferenceNumber = harmImpactAssessment
    ? evidenceReferences.length + externalIncidentReferences.length + (hasTaxonomyReference ? 1 : 0) + 1
    : undefined;

  return <Shell>
    <VigilObservatoryNav />
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-10 md:py-10 report-document">
      <div className="print:hidden mb-6 flex items-center justify-between gap-4">
        <Link href={`/observatory/cases/${encodeURIComponent(incident?.id ?? state.sourceId)}/`} className="font-mono text-sm uppercase tracking-[0.1em] text-cam-gold">← Back to Case File</Link>
        <button type="button" onClick={() => window.print()} className="rounded-md border border-cam-gold/45 bg-background px-4 py-2 font-mono text-sm uppercase tracking-[0.08em] text-cam-gold">Print / save PDF</button>
      </div>

      <header className="report-hero">
        <p className="report-kicker">VIGIL Observatory Case File · deterministic report</p>
        <h1 className="report-title">{title}</h1>
        <dl className="report-hero-meta">
          <Field label="Incident" value={incident?.id ?? state.sourceId} />
          <Field label="Classification" value={classificationDisplay} />
          {hasMixedExecution && <Field label="Execution" value="Mixed" />}
          <Field label="Severity" value={incident ? severityDisplay(incident.severity) : undefined} />
          <Field label="Updated" value={updated} />
          <Field label="Generated" value={state.generatedAt.replace("T", " ").replace(/\.\d{3}Z$/, " UTC")} />
        </dl>
      </header>

      {isFailure && <section className="report-exemplar-callout is-failure" aria-labelledby="report-failure-heading">
        <p className="report-exemplar-kicker">Alignment outcome · Failure evidenced</p>
        <h2 id="report-failure-heading">The governing invariants assessed did not demonstrate alignment.</h2>
        <p>This Case File contains one or more mappings where failure is evidenced under the VIGIL Observatory Alignment Taxonomy. The conclusion is bounded to the governing invariants and evidence assessed for this occurrence.</p>
        <p className="report-exemplar-boundary">Alignment classification does not by itself determine harm severity. Materialised impact is assessed separately under the VIGIL Harm Impact Assessment.</p>
      </section>}

      {isCombination && <section className="report-exemplar-callout is-combination" aria-labelledby="report-combination-heading">
        <p className="report-exemplar-kicker">Mixed alignment outcome</p>
        <h2 id="report-combination-heading">The system is neither aligned nor misaligned.</h2>
        <p>Different alignment and governance boundaries produced different outcomes. Some mappings evidence failure, while others show an invariant holding or an unresolved boundary.</p>
        <p className="report-exemplar-boundary">Ambiguous boundaries remain explicitly unresolved rather than being presented as failures; successful-invariant mappings remain visible as evidence of boundaries that held.</p>
      </section>}

      {isDisputed && <section className="report-exemplar-callout is-disputed" aria-labelledby="report-disputed-heading">
        <p className="report-exemplar-kicker">Disputed evidence</p>
        <h2 id="report-disputed-heading">The evidence is disputed.</h2>
        <p>Material claims about this occurrence are contested, denied, or have not been independently adjudicated. The report preserves the current evidence state without presenting disputed claims as settled fact.</p>
        <p className="report-exemplar-boundary">The taxonomy mapping describes the governance mechanism evidenced if the reported occurrence is supported; it does not convert disputed claims into established fact.</p>
      </section>}

      {isExemplar && <section className={`report-exemplar-callout${hasMixedExecution ? " is-mixed-execution" : ""}`} aria-labelledby="report-exemplar-heading">
        <p className="report-exemplar-kicker">{hasMixedExecution ? "Alignment exemplar · mixed execution" : "Alignment exemplar · Invariant held"}</p>
        <h2 id="report-exemplar-heading">{hasMixedExecution ? "Successful exemplar — mixed execution." : "The system worked as intended."}</h2>
        {hasMixedExecution
          ? <p>This Case File is presented as an alignment exemplar overall. The relevant governance invariant held, while execution or human-facing expression was imperfect.</p>
          : <p>This Case File documents an invariant-held governance outcome. Under the relevant pressure, the governing invariant held: the concern remained available for independent human review and final decision authority remained with the human.</p>}
        <p className="report-exemplar-boundary">{hasMixedExecution
          ? "Mixed execution qualifies how the exemplar was expressed; it does not change the invariant-held alignment outcome."
          : "This Incident shows what correct governance behaviour looks like when the invariant holds under pressure."}</p>
      </section>}

      <div className="report-flow">
        <Stage number="01" label="Incident">
          {((incident?.summary ?? incident?.publicDisplay.finding) || incidentArtefacts.length > 0 || affectedSystems.length > 0) && <div className="report-occurrence-card">
            {(incident?.summary ?? incident?.publicDisplay.finding) && <section className="report-observation-summary">
              <p className="vigil-evidence-kicker">Incident summary</p>
              <h4 className="report-substantive-label">What happened</h4>
              <p>{incident?.summary ?? incident?.publicDisplay.finding}</p>
            </section>}
            {affectedSystems.length > 0 && <section className="report-affected-systems">
              <h4 className="report-substantive-label">Affected systems</h4>
              <div className="report-system-grid">{affectedSystems.map((system, index) => <article key={`${system.recordId}-${index}`} className="report-system-record">
                <dl className="report-metadata-grid report-metadata-grid--2">
                  <Field label="Provider / platform" value={system.provider} />
                  <Field label="Product / service" value={system.product} />
                  <Field label="Model / runtime" value={system.model} />
                  <Field label="System type" value={system.systemType} />
                  <Field label="Agent configuration" value={system.agentConfiguration} />
                  <Field label="Agent count" value={system.agentCount} />
                  <Field label="Interface" value={system.interfaceSurface} />
                  <Field label="Occurrence setting" value={system.occurrenceSetting} />
                  <Field label="Testing conducted by" value={system.testingActor} />
                  <Field label="Deployment context" value={system.deploymentContext} />
                </dl>
              </article>)}</div>
            </section>}
            {incidentArtefacts.length > 0 && <section className="report-incident-artefacts" aria-label="Incident source artefacts">
              {incidentArtefacts.map((artefact) => <figure key={artefact.id} className="report-incident-artefact">
                <a href={artefact.permalink ?? artefact.renderUrl} target="_blank" rel="noreferrer" className="report-incident-artefact-link">
                  <img src={artefact.renderUrl} alt={artefact.altText ?? artefact.title ?? "Incident source artefact"} loading="eager" />
                </a>
                {(artefact.title || artefact.sourceUrl) && <figcaption>
                  {artefact.title && <strong>{artefact.title}</strong>}
                  {(() => {
                    const referenceNumber = evidenceReferenceNumberForUrl(externalSources, artefact.sourceUrl);
                    return referenceNumber
                      ? <a className="report-inline-reference" href={`#vigil-evidence-reference-${referenceNumber}`} aria-label={`Evidence reference ${referenceNumber}`}>[{referenceNumber}]</a>
                      : artefact.sourceUrl
                        ? <a className="report-inline-reference" href={artefact.sourceUrl} target="_blank" rel="noreferrer">Source</a>
                        : null;
                  })()}
                </figcaption>}
              </figure>)}
            </section>}
          </div>}
          {!incident?.summary && !incident?.publicDisplay.finding && !incidentArtefacts.length && !affectedSystems.length && <Empty>No structured Incident summary is available in the current public projection.</Empty>}
        </Stage>

        <Stage number="02" label="Assessment">
        {incident ? <article className="report-diagnosis">
          <section className="report-intro">
            <p className="vigil-evidence-kicker">GOVERNANCE ASSESSMENT</p>
            <div className="report-assessment-details">
              <section><h4 className="report-substantive-label">Factual basis</h4><p>{factualBasis ?? "A separate factual-basis statement is not yet published for this Incident."}</p></section>
            </div>
          </section>

          <CaseTaxonomyAssessment raw={incident.raw} />

          <section className="report-severity-assessment">
            <p className="vigil-library-kicker report-peer-assessment-heading">VIGIL OBSERVATORY REAL-WORLD HARM ASSESSMENT</p>
            <HarmImpactMatrix
              assessment={harmImpactAssessment}
              compact
              evidenceReferenceNumbers={harmEvidenceReferenceNumbers}
              methodologyReferenceNumber={harmMethodologyReferenceNumber}
              methodologyReferenceHref="#vigil-harm-methodology-reference"
            />
          </section>

          {externalAssessments.length > 0 && <section className="report-external-assessments report-peer-assessment">
            <p className="vigil-library-kicker report-peer-assessment-heading">EXTERNAL ASSESSMENTS</p>
            <table className="report-external-assessment-table">
              <thead><tr><th>Assessor</th><th>Date</th><th>Conclusion</th><th>Classification / scheme</th></tr></thead>
              <tbody>{externalAssessments.map((assessment) => {
                const evidenceReferenceNumber = externalAssessmentEvidenceReferenceNumber(assessment, externalSources, harmEvidenceReferenceNumbers);
                return <tr key={assessment.id}>
                  <td><strong>{assessment.assessor}</strong>{evidenceReferenceNumber ? <> <a className="report-inline-reference" href={`#vigil-evidence-reference-${evidenceReferenceNumber}`}>[{evidenceReferenceNumber}]</a></> : null}</td>
                  <td>{externalAssessmentDate(assessment.date)}</td>
                  <td>{assessment.summary}</td>
                  <td>{assessment.classificationOrRating
                    ? [assessment.classificationOrRating.verbatimLabel ?? assessment.classificationOrRating.value, assessment.classificationOrRating.scheme].filter(Boolean).join(" · ")
                    : "—"}</td>
                </tr>;
              })}</tbody>
            </table>
          </section>}
        </article> : <Empty>No structured assessment is available.</Empty>}
      </Stage>

        <Stage number="03" label="Classification">
          {incident ? <CaseTaxonomyClassification raw={incident.raw} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref="#vigil-failure-taxonomy-reference" /> : <Empty>No current Alignment Taxonomy classification is linked.</Empty>}
        </Stage>

        <Stage number="04" label="Repair">
          {incident ? <CaseTaxonomyRepair raw={incident.raw} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref="#vigil-failure-taxonomy-reference" /> : <Empty>No class invariant can be resolved from a canonical classification for this Incident.</Empty>}
        </Stage>

        <Stage number="05" label="Conclusion">
          {(governanceConclusion || governanceSignificance) ? <section className="report-intro">
            {governanceConclusion && <>
              <p className="vigil-evidence-kicker">VIGIL Observatory conclusion</p>
              <p className="report-intro-copy">{governanceConclusion}</p>
            </>}
            <div className="report-governance-significance">
              <div className="vigil-case-subheading">
                <h3>Governance significance</h3>
              </div>
              <p>{governanceSignificance ?? "Governance significance is not yet separately stated in the canonical Incident."}</p>
            </div>
          </section> : <Empty>No integrated governance conclusion is currently published for this Incident.</Empty>}
        </Stage>

        <Stage number="06" label="References">
          {(evidenceReferences.length > 0 || externalIncidentReferences.length > 0 || canonicalReferences.length > 0) ? <>
            {evidenceReferences.length > 0 && <section className="report-reference-group">
              <h3 className="report-substantive-label">Evidence sources</h3>
              <ol className="report-reference-list">{evidenceReferences.map((reference, index) => <li id={`vigil-evidence-reference-${index + 1}`} key={reference.key} className="report-reference-item"><span className="report-reference-number" aria-hidden="true" /><span className="report-reference-copy"><strong>{reference.label}</strong>{reference.detail ? <span className="report-reference-meta"> — {reference.detail}</span> : null}{reference.url ? <><br /><a href={reference.url} target="_blank" rel="noreferrer" className="report-reference-url">{reference.url}</a></> : null}</span></li>)}</ol>
            </section>}

            {externalIncidentReferences.length > 0 && <section className="report-reference-group">
              <h3 className="report-substantive-label">External incident records</h3>
              <ol className="report-reference-list">{externalIncidentReferences.map((reference, index) => <li key={`${reference.registry}-${reference.externalId ?? index}`} className="report-reference-item"><span className="report-reference-number" aria-hidden="true" /><span className="report-reference-copy"><strong>{reference.registry}{reference.externalId ? ` — ${reference.externalId}` : ""}</strong>{reference.relationship ? <span className="report-reference-meta"> — {titleizeValue(reference.relationship)}</span> : null}{reference.url ? <><br /><a href={reference.url} target="_blank" rel="noreferrer" className="report-reference-url">{reference.url}</a></> : null}</span></li>)}</ol>
            </section>}
            <section className="report-reference-group">
              <h3 className="report-substantive-label">Taxonomy and methodology references</h3>
              <ol className="report-reference-list" data-report-taxonomy-reference-list />
            </section>
            <section className="report-reference-group">
              <h3 className="report-substantive-label">Internal records</h3>
              <ol className="report-reference-list">{canonicalReferences.map((reference, index) => <li key={reference.key} className="report-reference-item"><span className="report-reference-number" aria-hidden="true" /><span className="report-reference-copy"><strong>{reference.label}</strong>{reference.detail ? <span className="report-reference-meta"> — {reference.detail}</span> : null}{reference.url ? <><br /><a href={reference.url} target="_blank" rel="noreferrer" className="report-reference-url">{reference.url}</a></> : null}</span></li>)}</ol>
            </section>
          </> : <Empty>No references are currently available.</Empty>}
        </Stage>
      </div>

      <div className="report-postscript-slot" data-report-postscript />

      <footer className="mt-6 border-t border-border/60 pt-4 text-sm leading-relaxed text-muted-foreground">
        This report is a deterministic print projection of the corresponding VIGIL Observatory Case File. It uses the same canonical Incident, record-local evidence scope and Alignment Taxonomy relationships as the interactive Case File. Invariant-held exemplar mappings remain attached to their Failure Class without being presented as failure evidence. Repair projects published class invariants for mappings where failure is evidenced or the boundary remains unresolved; unresolved boundaries remain explicitly unresolved, while invariant-held mappings remain visible in Classification and are not treated as conditions requiring repair. Broader family invariants are not substituted where a class invariant is not yet available.
      </footer>
    </main>
  </Shell>;
}
