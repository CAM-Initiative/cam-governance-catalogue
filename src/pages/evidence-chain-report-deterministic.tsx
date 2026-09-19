import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { CaseTaxonomyClassification, CaseTaxonomyRepair } from "@/components/vigil/CaseTaxonomyClassification";
import { HarmImpactMatrix } from "@/components/vigil/HarmImpactMatrix";
import { ExternalAssessmentList } from "@/components/vigil/ExternalAssessmentList";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilIncidentRecords, loadVigilRecordDetail, type UnknownRecord } from "@/lib/vigilRegistry";
import {
  normalizeRecords,
  normalizeVigilRecord,
  titleizeValue,
  type VigilIndexRecord,
} from "@/lib/vigilPresentation";
import { taxonomyFailureTypeLabel } from "@/lib/vigilTaxonomyClassification";
import { externalAssessmentsFrom, externalIncidentReferencesFrom } from "@/lib/vigilExternalAssessments";

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
};

type AffectedSystem = {
  recordId: string;
  provider?: string;
  product?: string;
  model?: string;
  systemType?: string;
  interfaceSurface?: string;
  deploymentContext?: string;
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
  const sources = [record.raw.source_records, record.raw.sources, record.raw.evidence_sources].find(Array.isArray);
  if (!Array.isArray(sources)) return [];
  return sources.flatMap((source) => {
    if (typeof source === "string") return [{ title: source, url: /^https?:\/\//i.test(source) ? source : undefined }];
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
    }];
  });
}

function dedupeEvidence(evidence: ExternalEvidence[]) {
  const seen = new Set<string>();
  return evidence.filter((source) => {
    const key = `${source.title.toLowerCase()}|${source.url ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function affectedSystemFor(record: VigilIndexRecord): AffectedSystem | undefined {
  const context = isObject(record.raw.system_context) ? record.raw.system_context : {};
  const provider = text(context.platform_or_vendor) ?? record.affected_platform_label ?? record.platform_label;
  const product = text(context.product_or_service ?? context.model_or_product);
  const modelRaw = text(context.specific_model_or_runtime);
  const model = modelRaw && !/^not applicable$/i.test(modelRaw) ? modelRaw : undefined;
  const systemType = text(context.system_type);
  const interfaceSurface = text(context.interface_surface);
  const deploymentContext = text(context.deployment_context);
  if (![provider, product, model, systemType, interfaceSurface, deploymentContext].some(Boolean)) return undefined;
  return { recordId: record.id, provider, product, model, systemType, interfaceSurface, deploymentContext };
}

function dedupeSystems(records: VigilIndexRecord[]) {
  const seen = new Set<string>();
  return records.flatMap((record) => affectedSystemFor(record) ?? []).filter((system) => {
    const key = [system.provider, system.product, system.model, system.interfaceSurface].filter(Boolean).join("|").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
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

export default function EvidenceChainReportDeterministic() {
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
  const externalAssessments = useMemo(() => incident ? externalAssessmentsFrom(incident.raw) : [], [incident]);
  const externalIncidentReferences = useMemo(() => incident ? externalIncidentReferencesFrom(incident.raw) : [], [incident]);
  const affectedSystems = useMemo(() => incident ? dedupeSystems([incident]) : [], [incident]);

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 text-muted-foreground sm:px-6 md:px-10">Preparing deterministic Case File report…</main></Shell>;
  if (state.status === "error") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-10"><div className="vigil-reference-state"><h1>Report unavailable</h1><p>{state.message}</p><Link href="/observatory/cases">Return to Case Files →</Link></div></main></Shell>;

  const governanceAssessment = incident ? firstText(incident.raw, ["vigil_assessment.governance_interpretation"]) : undefined;
  const factualBasis = incident ? firstText(incident.raw, ["vigil_assessment.factual_basis"]) : undefined;
  const governanceSignificance = incident ? firstText(incident.raw, ["vigil_assessment.significance_to_cam", "why_it_matters_to_CAM"]) : undefined;
  const harmImpactAssessment = incident && isObject(incident.raw.harm_impact_assessment) ? incident.raw.harm_impact_assessment : undefined;
  const severityAssessedOn = harmImpactAssessment ? text(harmImpactAssessment.assessed_on) : undefined;
  const severityMethodology = harmImpactAssessment
    ? [text(harmImpactAssessment.methodology_id), text(harmImpactAssessment.methodology_version)].filter(Boolean).join(" ")
    : undefined;
  const title = incident?.title ?? "VIGIL Observatory Case File";
  const updated = incident?.record_last_updated ?? incident?.publicDisplay.dates.lastUpdated ?? incident?.date_recorded;
  const classification = incident ? taxonomyFailureTypeLabel(incident.raw) : undefined;
  const isExemplar = classification === "Exemplar";
  const exemplarExecution = exemplarExecutionStatus(incident);
  const hasMixedExecution = isExemplar && exemplarExecution === "mixed";

  const evidenceReferences = [
    ...externalSources.map((source) => ({ key: `ext-${source.title}-${source.url ?? ""}`, label: source.title, detail: [source.publisher, source.date].filter(Boolean).join(" · "), url: source.url })),
  ];
  const canonicalReferences = [
    ...state.records.map((record) => ({ key: record.id, label: `${record.id} — ${record.title}`, detail: [record.record_last_updated, record.record_version ? `Version ${record.record_version}` : undefined].filter(Boolean).join(" · "), url: record.github_blob_url ?? record.raw_url })),
  ];

  return <Shell>
    <VigilObservatoryNav />
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-10 md:py-10 report-document">
      <div className="print:hidden mb-6 flex items-center justify-between gap-4">
        <Link href={`/observatory/cases/${encodeURIComponent(incident?.id ?? state.sourceId)}`} className="font-mono text-sm uppercase tracking-[0.1em] text-cam-gold">← Back to Case File</Link>
        <button type="button" onClick={() => window.print()} className="rounded-md border border-cam-gold/45 bg-background px-4 py-2 font-mono text-sm uppercase tracking-[0.08em] text-cam-gold">Print / save PDF</button>
      </div>

      <header className="report-hero">
        <p className="report-kicker">VIGIL Observatory Case File · deterministic report</p>
        <h1 className="report-title">{title}</h1>
        <dl className="report-hero-meta">
          <Field label="Incident" value={incident?.id ?? state.sourceId} />
          <Field label="Classification" value={isExemplar ? "Exemplar · successful invariant" : classification} />
          {hasMixedExecution && <Field label="Execution" value="Mixed" />}
          <Field label="Severity" value={incident ? severityDisplay(incident.severity) : undefined} />
          <Field label="Updated" value={updated} />
          <Field label="Generated" value={state.generatedAt.replace("T", " ").replace(/\.\d{3}Z$/, " UTC")} />
        </dl>
      </header>

      {isExemplar && <section className={`report-exemplar-callout${hasMixedExecution ? " is-mixed-execution" : ""}`} aria-labelledby="report-exemplar-heading">
        <p className="report-exemplar-kicker">{hasMixedExecution ? "Successful invariant exemplar · mixed execution" : "Successful invariant exemplar"}</p>
        <h2 id="report-exemplar-heading">{hasMixedExecution ? "Successful exemplar — mixed execution." : "The system worked as intended."}</h2>
        {hasMixedExecution
          ? <p>This Case File is classified as a successful invariant exemplar overall. The relevant alignment or governance invariant held, while execution or human-facing expression was imperfect.</p>
          : <p>This Case File documents a successful governance outcome, not a failure-classified Incident. Under the relevant pressure, the governing invariant held: the concern remained available for independent human review and final decision authority remained with the human.</p>}
        <p className="report-exemplar-boundary">{hasMixedExecution
          ? "Mixed execution qualifies how the exemplar was expressed; it does not convert the Incident into a failure classification."
          : "This Incident shows what correct governance behaviour looks like when the invariant holds under pressure."}</p>
      </section>}

      <div className="report-flow">
        <Stage number="01" label="Incident">
          {((incident?.summary ?? incident?.publicDisplay.finding) || affectedSystems.length > 0) && <div className="report-occurrence-card">
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
                  <Field label="Interface" value={system.interfaceSurface} />
                  <Field label="Deployment context" value={system.deploymentContext} />
                </dl>
              </article>)}</div>
            </section>}
          </div>}
          {!incident?.summary && !incident?.publicDisplay.finding && !affectedSystems.length && <Empty>No structured Incident summary is available in the current public projection.</Empty>}
        </Stage>

        <Stage number="02" label="Assessment">
        {incident ? <article className="report-diagnosis">
          <section className="report-intro"><p className="vigil-evidence-kicker">VIGIL Observatory governance assessment</p><p className="report-intro-copy">{governanceAssessment ?? incident.publicDisplay.finding ?? incident.summary}</p></section>
          <section className="report-panel report-severity-assessment">
            <h4 className="report-substantive-label">Harm Impact Matrix</h4>
            <HarmImpactMatrix assessment={harmImpactAssessment} compact methodology={severityMethodology} assessedOn={severityAssessedOn} />
          </section>
          <div className="report-stack"><section className="report-subpanel"><h4 className="report-substantive-label">Factual basis</h4><p>{factualBasis ?? "A separate factual-basis statement is not yet published for this Incident."}</p></section><section className="report-subpanel"><h4 className="report-substantive-label">Governance significance</h4><p>{governanceSignificance ?? "Governance significance is not yet separately stated in the canonical Incident."}</p></section></div>
        </article> : <Empty>No structured assessment is available.</Empty>}
      </Stage>

        <Stage number="03" label="Classification">
          {incident ? <CaseTaxonomyClassification raw={incident.raw} /> : <Empty>No current taxonomy classification is linked.</Empty>}
        </Stage>

        <Stage number="04" label="Repair">
          {incident ? <CaseTaxonomyRepair raw={incident.raw} /> : <Empty>No class invariant can be resolved from a canonical classification for this Incident.</Empty>}
        </Stage>

        <Stage number="05" label="References">
          {(evidenceReferences.length > 0 || externalAssessments.length > 0 || externalIncidentReferences.length > 0 || canonicalReferences.length > 0) ? <>
            {evidenceReferences.length > 0 && <section className="report-reference-group">
              <h3 className="report-substantive-label">Evidence sources</h3>
              <ol className="report-reference-list">{evidenceReferences.map((reference, index) => <li key={reference.key} className="report-reference-item"><span className="report-reference-number">[{index + 1}]</span><span className="report-reference-copy"><strong>{reference.label}</strong>{reference.detail ? <span className="report-reference-meta"> — {reference.detail}</span> : null}{reference.url ? <><br /><a href={reference.url} target="_blank" rel="noreferrer" className="report-reference-url">{reference.url}</a></> : null}</span></li>)}</ol>
            </section>}
            {externalAssessments.length > 0 && <section className="report-reference-group">
              <h3 className="report-substantive-label">External assessments</h3>
              <p className="report-reference-intro">Attributable third-party analyses. Inclusion does not imply endorsement by VIGIL.</p>
              <ExternalAssessmentList assessments={externalAssessments} compact />
            </section>}
            {externalIncidentReferences.length > 0 && <section className="report-reference-group">
              <h3 className="report-substantive-label">External incident records</h3>
              <ol className="report-reference-list">{externalIncidentReferences.map((reference, index) => <li key={`${reference.registry}-${reference.externalId ?? index}`} className="report-reference-item"><span className="report-reference-number">[{index + 1}]</span><span className="report-reference-copy"><strong>{reference.registry}{reference.externalId ? ` — ${reference.externalId}` : ""}</strong>{reference.relationship ? <span className="report-reference-meta"> — {titleizeValue(reference.relationship)}</span> : null}{reference.url ? <><br /><a href={reference.url} target="_blank" rel="noreferrer" className="report-reference-url">{reference.url}</a></> : null}</span></li>)}</ol>
            </section>}
            <section className="report-reference-group">
              <h3 className="report-substantive-label">Taxonomy and methodology references</h3>
              <ol className="report-reference-list" data-report-taxonomy-reference-list />
            </section>
            <section className="report-reference-group">
              <h3 className="report-substantive-label">Canonical VIGIL record</h3>
              <ol className="report-reference-list">{canonicalReferences.map((reference, index) => <li key={reference.key} className="report-reference-item"><span className="report-reference-number">[{index + 1}]</span><span className="report-reference-copy"><strong>{reference.label}</strong>{reference.detail ? <span className="report-reference-meta"> — {reference.detail}</span> : null}{reference.url ? <><br /><a href={reference.url} target="_blank" rel="noreferrer" className="report-reference-url">{reference.url}</a></> : null}</span></li>)}</ol>
            </section>
          </> : <Empty>No references are currently available.</Empty>}
        </Stage>
      </div>

      <div className="report-postscript-slot" data-report-postscript />

      <footer className="mt-6 border-t border-border/60 pt-4 text-sm leading-relaxed text-muted-foreground">
        This report is a deterministic print projection of the corresponding VIGIL Observatory Case File. It uses the same canonical Incident, record-local evidence scope and taxonomy relationship as the interactive Case File; successful-invariant exemplars remain attached to their Failure Class without being presented as failure evidence. The Repair section projects published class invariants only for failure-occurrence mappings; successful-invariant exemplar mappings remain visible in Classification and are not treated as conditions requiring repair. Broader family invariants are not substituted where a class invariant is not yet available.
      </footer>
    </main>
  </Shell>;
}
