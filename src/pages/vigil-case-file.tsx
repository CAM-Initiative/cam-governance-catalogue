import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, CircleCheckBig, FileText } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { EvidenceCard } from "@/components/vigil/EvidenceCard";
import { CaseTaxonomyClassification, CaseTaxonomyRepair } from "@/components/vigil/CaseTaxonomyClassification";
import { HarmImpactMatrix } from "@/components/vigil/HarmImpactMatrix";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VIGIL_INCIDENT_CASE_SECTIONS } from "@/lib/vigilCaseSections";
import { loadVigilIncidentRecords, loadVigilRecordDetail, type UnknownRecord } from "@/lib/vigilRegistry";
import {
  normalizeRecords,
  normalizeVigilRecord,
  titleizeValue,
  type VigilIndexRecord,
} from "@/lib/vigilPresentation";
import { deriveIncidentPublicDetail } from "@/lib/vigilPublicDisplay";
import {
  loadTaxonomyReferenceTargets,
  taxonomyFailureTypeLabel,
  type TaxonomyReferenceTarget,
} from "@/lib/vigilTaxonomyClassification";

type CaseState =
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

type TaxonomyEvidenceReference = {
  key: string;
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  role?: string;
  classIds: string[];
};

type DiagnosticProvenance = {
  method?: string;
  diagnosticDate?: string;
  humanRole?: string;
  aiRole?: string;
  aiPlatform?: string;
  aiModel?: string;
  attributionBasis?: string;
  reviewStatus?: string;
  authorityBoundary?: string;
};

const CASE_VIEWS = VIGIL_INCIDENT_CASE_SECTIONS;

type StageId = typeof CASE_VIEWS[number]["id"];

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
  const seen = new Set<string>();
  return values.flatMap((item) => text(item) ? [text(item)!] : []).filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function diagnosticProvenance(record?: VigilIndexRecord): DiagnosticProvenance | undefined {
  if (!record || !isObject(record.raw.diagnostic_provenance)) return undefined;
  const provenance = record.raw.diagnostic_provenance;
  return {
    method: text(provenance.method),
    diagnosticDate: text(provenance.diagnostic_date),
    humanRole: text(provenance.human_role),
    aiRole: text(provenance.ai_role),
    aiPlatform: text(provenance.ai_platform),
    aiModel: text(provenance.ai_model),
    attributionBasis: text(provenance.model_attribution_basis),
    reviewStatus: text(provenance.review_status),
    authorityBoundary: text(provenance.authority_boundary),
  };
}

function diagnosticMethodLabel(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (
    normalized.includes("incident-02-record-split")
    || normalized.includes("occurrence-reconciliation")
    || normalized.includes("incident-02")
  ) return undefined;
  if (value === "human-ai-collaborative-analysis") return "Human–AI collaborative analysis";
  return titleizeValue(value);
}

function reviewStatusLabel(value?: string) {
  if (!value) return undefined;
  if (value === "human-reviewed-and-approved") return "Human reviewed and approved";
  return titleizeValue(value);
}

function compactId(id: string) {
  return id.replace(/^VIGIL-(?:\d{4}-)?/i, "");
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

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function Field({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return <div className="vigil-case-field"><dt>{label}</dt><dd className={mono ? "is-mono" : undefined}>{value}</dd></div>;
}

function Section({ id, number, title, description, children }: { id: string; number?: string; title: string; description: string; children: ReactNode }) {
  return <section id={id} className="vigil-case-section" aria-labelledby={`${id}-heading`}>
    <header>{number ? <span>{number}</span> : null}<div><h2 id={`${id}-heading`}>{title}</h2><p>{description}</p></div></header>
    <div className="vigil-case-section-body">{children}</div>
  </section>;
}

function TextList({ items }: { items: string[] }) {
  if (!items.length) return null;
  if (items.length === 1) return <p>{items[0]}</p>;
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function recordLink(record: VigilIndexRecord) {
  return record.github_blob_url ?? record.raw_url;
}

function taxonomyRelationshipLabel(reference: TaxonomyReferenceTarget) {
  if (reference.relationship === "exemplar") return "Successful-invariant exemplar relationship";
  if (reference.relationship === "primary") return "Primary taxonomy classification";
  if (reference.relationship === "secondary") return "Secondary taxonomy classification";
  return "Family-only taxonomy classification";
}

function taxonomyEvidenceKey(reference: TaxonomyReferenceTarget["externalReferences"][number]) {
  const url = text(reference.url)?.replace(/\/$/, "").toLowerCase();
  if (url) return `url:${url}`;
  return `meta:${[reference.publisher, reference.title, reference.date].map((value) => text(value)?.toLowerCase() ?? "").join("|")}`;
}

function collectTaxonomyEvidence(targets: TaxonomyReferenceTarget[]): TaxonomyEvidenceReference[] {
  const collected = new Map<string, TaxonomyEvidenceReference>();
  for (const target of targets) {
    for (const reference of target.externalReferences) {
      const key = taxonomyEvidenceKey(reference);
      const existing = collected.get(key);
      if (existing) {
        if (!existing.classIds.includes(target.id)) existing.classIds.push(target.id);
        continue;
      }
      collected.set(key, {
        key,
        title: text(reference.title) ?? "Taxonomy supporting reference",
        publisher: text(reference.publisher),
        date: text(reference.date),
        url: text(reference.url),
        role: text(reference.reference_role),
        classIds: [target.id],
      });
    }
  }
  return [...collected.values()];
}

export default function VigilCaseFile() {
  const [, caseParams] = useRoute("/observatory/cases/:recordId");
  const [, incidentParams] = useRoute("/observatory/incidents/:recordId");
  const sourceId = decodeURIComponent(caseParams?.recordId ?? incidentParams?.recordId ?? "").trim();
  const [state, setState] = useState<CaseState>({ status: "loading" });
  const [activeStage, setActiveStage] = useState<StageId>("observe");
  const [taxonomyReferences, setTaxonomyReferences] = useState<TaxonomyReferenceTarget[]>([]);

  useEffect(() => setActiveStage("observe"), [sourceId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const registry = await loadVigilIncidentRecords();
        const normalized = normalizeRecords(registry.records);
        const indexById = new Map(normalized.map((record) => [record.id, record]));
        const sourceIndex = indexById.get(sourceId);
        if (!sourceIndex || sourceIndex.record_type !== "incident") throw new Error(`The canonical VIGIL Incident registry does not contain ${sourceId}.`);

        const incident = await detailedRecord(sourceIndex);
        if (!cancelled) setState({
          status: "ready",
          sourceId,
          records: [incident],
          generatedAt: new Date().toISOString(),
        });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: (error as Error).message });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [sourceId]);

  const incident = state.status === "ready" ? state.records[0] : undefined;
  const incidentDetail = useMemo(() => incident ? deriveIncidentPublicDetail(incident.raw) : undefined, [incident]);
  const externalSources = useMemo(() => incident ? dedupeEvidence(externalEvidenceFor(incident)) : [], [incident]);
  const affectedSystems = useMemo(() => incident ? dedupeSystems([incident]) : [], [incident]);

  useEffect(() => {
    let cancelled = false;
    if (!incident) {
      setTaxonomyReferences([]);
      return () => { cancelled = true; };
    }
    void loadTaxonomyReferenceTargets(incident.raw)
      .then((references) => { if (!cancelled) setTaxonomyReferences(references); })
      .catch(() => { if (!cancelled) setTaxonomyReferences([]); });
    return () => { cancelled = true; };
  }, [incident]);

  const taxonomyEvidenceReferences = useMemo(
    () => collectTaxonomyEvidence(taxonomyReferences),
    [taxonomyReferences],
  );

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 text-muted-foreground sm:px-6 md:px-10">Preparing VIGIL Case File…</main></Shell>;
  if (state.status === "error") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-10"><div className="vigil-reference-state"><h1>Case File unavailable</h1><p>{state.message}</p><Link href="/observatory/cases">Return to Case Files →</Link></div></main></Shell>;

  const sourceRecord = state.records[0];
  const title = sourceRecord?.title ?? "VIGIL Case File";
  const classification = incident ? taxonomyFailureTypeLabel(incident.raw) : undefined;
  const isExemplar = classification === "Exemplar";
  const updated = incident?.record_last_updated ?? incident?.publicDisplay.dates.lastUpdated ?? incident?.date_recorded;
  const diagnostic = diagnosticProvenance(incident);
  const reportId = incident?.id ?? state.sourceId;

  const governanceAssessment = incident ? firstText(incident.raw, ["vigil_assessment.governance_interpretation"]) : undefined;
  const factualBasis = incident ? firstText(incident.raw, ["vigil_assessment.factual_basis"]) : undefined;
  const governanceSignificance = incident ? firstText(incident.raw, ["vigil_assessment.significance_to_cam", "why_it_matters_to_CAM"]) : undefined;
  const assessmentBoundaries = incident ? firstTextList(incident.raw, ["vigil_assessment.assessment_boundaries"]) : [];
  const harmImpactAssessment = incident && isObject(incident.raw.harm_impact_assessment) ? incident.raw.harm_impact_assessment : undefined;
  const severityAssessedOn = harmImpactAssessment ? text(harmImpactAssessment.assessed_on) : undefined;
  const severityMethodology = harmImpactAssessment
    ? [text(harmImpactAssessment.methodology_id), text(harmImpactAssessment.methodology_version)].filter(Boolean).join(" ")
    : undefined;
  const referenceCount = externalSources.length + taxonomyReferences.length + taxonomyEvidenceReferences.length + state.records.length;

  const renderStageContent = (stageId: StageId): ReactNode => {
    if (stageId === "observe") return <>
      {affectedSystems.length > 0 && <section className="vigil-affected-systems" aria-labelledby="affected-systems-heading">
        <div className="vigil-case-subheading"><p className="vigil-library-kicker">Affected systems</p><h3 id="affected-systems-heading">Platforms, products and runtimes named in the evidence</h3></div>
        <div className="vigil-affected-system-grid">{affectedSystems.map((system, index) => <article key={`${system.recordId}-${index}`}>
          <span>{compactId(system.recordId)}</span>
          <dl>
            <Field label="Provider / platform" value={system.provider} />
            <Field label="Product / service" value={system.product} />
            <Field label="Model / runtime" value={system.model} />
            <Field label="System type" value={system.systemType} />
            <Field label="Interface" value={system.interfaceSurface} />
            <Field label="Deployment context" value={system.deploymentContext} />
          </dl>
        </article>)}</div>
      </section>}
      {incidentDetail?.evidence.length ? <div className="vigil-evidence-list">{incidentDetail.evidence.map((evidence, index) => <EvidenceCard key={`${evidence.title}-${index}`} evidence={evidence} />)}</div> : null}
      {!incidentDetail?.evidence.length && externalSources.length > 0 && <p className="vigil-case-empty">{externalSources.length} external evidence source{externalSources.length === 1 ? " is" : "s are"} recorded for this investigation. The full bibliography is available under References.</p>}
      {affectedSystems.length === 0 && !incidentDetail?.evidence.length && externalSources.length === 0 && <p className="vigil-case-empty">No structured evidence is available in the current public projection.</p>}
    </>;

    if (stageId === "classify") return <>
      {incident ? <CaseTaxonomyClassification raw={incident.raw} /> : <p className="vigil-case-empty">No Incident is linked to this Case File, so no VIGIL taxonomy classification can be rendered.</p>}
    </>;

    if (stageId === "repair") return <>
      {incident ? <CaseTaxonomyRepair raw={incident.raw} /> : <p className="vigil-case-empty">No governing invariant can be resolved from a canonical classification for this Incident.</p>}
    </>;

    if (stageId === "diagnose") return <>
    {(incident || governanceAssessment) ? <article className="vigil-diagnosis-view">
      {incident && <div className="vigil-diagnosis-mechanism">
        <section className="vigil-severity-assessment" aria-labelledby="severity-assessment-heading">
          <div className="vigil-case-subheading"><p className="vigil-library-kicker">Occurrence-level severity</p><h3 id="severity-assessment-heading">Harm Impact Matrix</h3><p>This Case File shows the occurrence-specific assessment rather than the full methodology reference table. Each dimension records its evidence state, any supported band and threshold, and the evidence-backed basis. Controlling dimensions are identified explicitly.</p></div>
          <div className="vigil-severity-summary-grid"><article><dl>
            <Field label="Severity" value={severityDisplay(incident.severity)} />
            <Field label="Methodology" value={severityMethodology} mono />
            <Field label="Assessed" value={severityAssessedOn} mono />
          </dl></article></div>
          <HarmImpactMatrix assessment={harmImpactAssessment} />
        </section>

        <section className="vigil-diagnosis-definition">
          <p className="vigil-library-kicker">VIGIL governance assessment</p>
          <p className="vigil-diagnosis-assessment-summary">{governanceAssessment ?? incident.publicDisplay.finding ?? incident.summary}</p>

          <div className="vigil-diagnosis-analysis-layout">
            <div className="vigil-diagnosis-reading-stack">
              <section><h4 className="vigil-substantive-label">Factual basis</h4><p>{factualBasis ?? "A separate factual-basis statement is not yet published for this Incident."}</p></section>
              <section><h4 className="vigil-substantive-label">Governance significance</h4><p>{governanceSignificance ?? "Governance significance is not yet separately stated in the canonical Incident."}</p></section>
            </div>
            <aside className="vigil-diagnosis-metadata-panel" aria-label="Diagnostic metadata">
              <p className="vigil-diagnostic-meta-label">Diagnostic provenance</p>
              <dl className="vigil-evidence-review-meta">
                {diagnosticMethodLabel(diagnostic?.method) && <Field label="Method" value={diagnosticMethodLabel(diagnostic?.method)} />}
                {(diagnostic?.aiPlatform || diagnostic?.aiModel) && <Field label="AI collaborator" value={[diagnostic.aiPlatform, diagnostic.aiModel].filter(Boolean).join(" ")} />}
                <Field label="Diagnosed" value={diagnostic?.diagnosticDate} />
                <Field label="Review status" value={reviewStatusLabel(diagnostic?.reviewStatus)} />
                <Field label="Human contribution" value={diagnostic?.humanRole} />
                <Field label="AI contribution" value={diagnostic?.aiRole} />
                <Field label="Authority boundary" value={diagnostic?.authorityBoundary} />
                <Field label="Model attribution" value={diagnostic?.attributionBasis} />
              </dl>
            </aside>
          </div>
          {assessmentBoundaries.length > 0 && <details className="vigil-evidence-limitations vigil-diagnosis-limitations"><summary>Limits of the diagnosis</summary><div className="vigil-evidence-boundary-list"><TextList items={assessmentBoundaries} /></div></details>}
        </section>
      </div>}
    </article> : <p className="vigil-case-empty">No structured governance assessment is linked yet. The investigation may still be in evidence gathering or diagnosis.</p>}
  </>;

    if (stageId === "references") return referenceCount > 0 ? <div className="vigil-case-citations vigil-case-bibliography">
      <ol>
        {externalSources.map((source, index) => <li key={`${source.title}-${source.url}-${index}`}>
          <span>[{index + 1}]</span>
          <div>
            <strong>{source.title}</strong>
            {(source.publisher || source.date) && <p>{[source.publisher, source.date].filter(Boolean).join(" · ")}</p>}
            {source.url && <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>}
          </div>
        </li>)}
        {taxonomyReferences.map((reference, index) => <li key={`${reference.relationship}-${reference.id}`}>
          <span>[{externalSources.length + index + 1}]</span>
          <div>
            <strong>{reference.id} — {reference.title}</strong>
            <p>VIGIL Failure Taxonomy{reference.taxonomyVersion ? ` · Version ${reference.taxonomyVersion}` : ""} · {taxonomyRelationshipLabel(reference)}</p>
            <a href={reference.url} target="_blank" rel="noreferrer">{reference.url}</a>
          </div>
        </li>)}
        {taxonomyEvidenceReferences.map((reference, index) => <li key={`taxonomy-evidence-${reference.key}`}>
          <span>[{externalSources.length + taxonomyReferences.length + index + 1}]</span>
          <div>
            <strong>{reference.title}</strong>
            {(reference.publisher || reference.date || reference.role) && <p>{[
              reference.publisher,
              reference.date,
              reference.role ? titleizeValue(reference.role) : undefined,
            ].filter(Boolean).join(" · ")}</p>}
            <p>Taxonomy evidence supporting {reference.classIds.join(", ")}</p>
            {reference.url && <a href={reference.url} target="_blank" rel="noreferrer">{reference.url}</a>}
          </div>
        </li>)}
        {state.records.map((record, index) => <li key={record.id}>
          <span>[{externalSources.length + taxonomyReferences.length + taxonomyEvidenceReferences.length + index + 1}]</span>
          <div>
            <strong>{record.id} — {record.title}</strong>
            {recordLink(record) && <a href={recordLink(record)} target="_blank" rel="noreferrer">{recordLink(record)}</a>}
          </div>
        </li>)}
      </ol>
    </div> : <p className="vigil-case-empty">No references are currently available for this Case File.</p>;

    return null;
  };

  const activeDefinition = CASE_VIEWS.find((stage) => stage.id === activeStage) ?? CASE_VIEWS[0];
  const activeAriaLabel = `${activeDefinition.number} ${activeDefinition.label}`;

  return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10">
    <Link href="/observatory/cases" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> Case Files</Link>

    <header className={`vigil-case-file-hero vigil-case-file-hero-v4${isExemplar ? " is-exemplar" : ""}`}>
      <div className="vigil-case-file-title-block">
        <p className="vigil-library-kicker">{isExemplar ? "VIGIL Case File · Successful invariant exemplar" : "VIGIL Case File · AI Incident investigation"}</p>
        <h1>{title}</h1>
      </div>
      <aside className="vigil-case-meta-panel" aria-label="Case File metadata">
        <dl>
          <Field label="Incident" value={incident ? compactId(incident.id) : compactId(state.sourceId)} mono />
          <Field label="Classification" value={isExemplar ? "Exemplar · successful invariant" : classification} />
          <Field label="Severity" value={severityDisplay(incident?.severity)} />
          <Field label="Updated" value={updated} mono />
          <Field label="Generated at (UTC)" value={formatGeneratedAt(state.generatedAt)} mono />
        </dl>
        <Link href={`/observatory/reports/${encodeURIComponent(reportId)}`} className="vigil-case-print-button"><FileText aria-hidden="true" /> Generate report / PDF</Link>
      </aside>
    </header>

    {isExemplar && <section className="vigil-exemplar-callout" aria-labelledby="vigil-exemplar-heading">
      <div className="vigil-exemplar-callout-icon" aria-hidden="true"><CircleCheckBig /></div>
      <div className="vigil-exemplar-callout-copy">
        <p className="vigil-exemplar-callout-kicker">Successful invariant exemplar</p>
        <h2 id="vigil-exemplar-heading">The system worked as intended.</h2>
        <p>This Case File documents a successful governance outcome, not a failure occurrence. Under the relevant pressure, the governing invariant held: the concern remained available for independent human review and final decision authority remained with the human.</p>
        <p className="vigil-exemplar-callout-boundary">This occurrence shows what correct governance behaviour looks like when the invariant holds under pressure.</p>
      </div>
    </section>}

    <nav className="vigil-case-stage-nav" aria-label="Incident Case File sections">
      <div className="vigil-case-stage-tabs" role="tablist">
        {CASE_VIEWS.map((stage) => <button
          key={stage.id}
          type="button"
          role="tab"
          aria-selected={activeStage === stage.id}
          aria-controls={`case-panel-${stage.id}`}
          className={activeStage === stage.id ? "is-active" : undefined}
          onClick={() => setActiveStage(stage.id)}
        ><span>{stage.number}</span>{stage.label}</button>)}
      </div>
    </nav>

    <div className="vigil-case-active-stage" role="tabpanel" id={`case-panel-${activeStage}`} aria-label={activeAriaLabel}>
      <Section id={`case-${activeStage}`} number={activeDefinition.number} title={activeDefinition.label} description={activeDefinition.description}>
        {renderStageContent(activeStage)}
      </Section>
    </div>
  </div></main></Shell>;
}
