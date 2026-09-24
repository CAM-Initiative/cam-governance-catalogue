import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { ArrowLeft, Blend, CircleCheckBig, CircleX, FileText, Info } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { EvidenceCard } from "@/components/vigil/EvidenceCard";
import { CaseTaxonomyClassification, CaseTaxonomyRepair } from "@/components/vigil/CaseTaxonomyClassification";
import { CaseTaxonomyAssessment } from "@/components/vigil/CaseTaxonomyAssessment";
import { HarmImpactMatrix, nonAssessedHarmDimensionLimitItems } from "@/components/vigil/HarmImpactMatrix";
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
import { externalAssessmentDate, externalAssessmentsFrom, externalIncidentReferencesFrom } from "@/lib/vigilExternalAssessments";
import { dedupeAffectedSystems } from "@/lib/vigilAffectedSystems";
import { loadHarmMethodologyMetadata, type HarmMethodologyMetadata } from "@/lib/vigilHarmMethodology";
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
  sourceRecordRefs: string[];
};

type IncidentArtefact = {
  id: string;
  type?: string;
  title?: string;
  mediaType?: string;
  permalink?: string;
  renderUrl?: string;
  sourceUrl?: string;
  altText?: string;
  caption?: string;
};

function isVideoArtefact(artefact: IncidentArtefact) {
  return artefact.mediaType?.toLowerCase().startsWith("video/") ?? false;
}

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

const CASE_REFERENCE_HASH_PATTERN = /^#(vigil-evidence-reference-\d+|vigil-failure-taxonomy-reference|vigil-harm-methodology-reference)$/;

function caseReferenceTargetFromHash(hash: string) {
  return hash.match(CASE_REFERENCE_HASH_PATTERN)?.[1];
}

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

function incidentArtefactsFor(record: VigilIndexRecord): IncidentArtefact[] {
  const artefacts = Array.isArray(record.raw.incident_artefacts) ? record.raw.incident_artefacts : [];
  return artefacts.flatMap((artefact, index) => {
    if (!isObject(artefact)) return [];
    const renderUrl = text(artefact.render_url ?? artefact.image_url ?? artefact.url);
    if (!renderUrl) return [];
    return [{
      id: text(artefact.artefact_id) ?? `${record.id}-artefact-${index + 1}`,
      type: text(artefact.artefact_type),
      title: text(artefact.title),
      mediaType: text(artefact.media_type),
      permalink: text(artefact.permalink),
      renderUrl,
      sourceUrl: text(artefact.source_url),
      altText: text(artefact.alt_text),
      caption: text(artefact.caption),
    }];
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

function formatCalendarDate(value?: string, precision: "day" | "month" | "year" = "day") {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!match) return value;
  const year = Number(match[1]);
  const month = Number(match[2] ?? "1");
  const day = Number(match[3] ?? "1");
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return value;
  if (precision === "year") return String(year);
  if (precision === "month") return new Intl.DateTimeFormat("en-AU", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function incidentTimingLabel(raw?: UnknownRecord) {
  if (!raw) return "Not established";
  const occurredFrom = firstText(raw, ["incident_identity.occurred_from", "occurred_from"]);
  const occurredTo = firstText(raw, ["incident_identity.occurred_to", "occurred_to"]);
  const precision = firstText(raw, ["incident_identity.date_precision", "date_precision"])?.toLowerCase();

  if (!occurredFrom) return "Not established";
  if (precision === "year") return formatCalendarDate(occurredFrom, "year") ?? occurredFrom;
  if (precision === "month") return formatCalendarDate(occurredFrom, "month") ?? occurredFrom;

  const from = formatCalendarDate(occurredFrom) ?? occurredFrom;
  const to = occurredTo ? formatCalendarDate(occurredTo) ?? occurredTo : undefined;
  const value = to && to !== from ? `${from} – ${to}` : from;
  return precision === "reported-date" ? `Reported ${value}` : value;
}

function Field({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return <div className="vigil-case-field"><dt>{label}</dt><dd className={mono ? "is-mono" : undefined}>{value}</dd></div>;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="vigil-case-section" aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`} className="sr-only">{title}</h2>
    <div className="vigil-case-section-body">{children}</div>
  </section>;
}

function TextList({ items }: { items: string[] }) {
  if (!items.length) return null;
  if (items.length === 1) return <p>{items[0]}</p>;
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
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

function recordLink(record: VigilIndexRecord) {
  return record.github_blob_url ?? record.raw_url;
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

function taxonomyRelationshipLabel(reference: TaxonomyReferenceTarget) {
  const relationship = reference.relationship === "primary"
    ? "Primary taxonomy classification"
    : reference.relationship === "secondary"
      ? "Secondary taxonomy classification"
      : "Family-only taxonomy classification";
  return reference.role === "successful-invariant"
    ? `${relationship} · successful-invariant exemplar`
    : relationship;
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
  const [pendingReferenceTarget, setPendingReferenceTarget] = useState<string>();
  const [taxonomyReferences, setTaxonomyReferences] = useState<TaxonomyReferenceTarget[]>([]);
  const [harmMethodologyMetadata, setHarmMethodologyMetadata] = useState<HarmMethodologyMetadata>();

  useEffect(() => {
    const syncReferenceHash = () => {
      const target = caseReferenceTargetFromHash(window.location.hash);
      setPendingReferenceTarget(target);
      setActiveStage(target ? "references" : "observe");
    };
    syncReferenceHash();
    window.addEventListener("hashchange", syncReferenceHash);
    return () => window.removeEventListener("hashchange", syncReferenceHash);
  }, [sourceId]);

  useEffect(() => {
    if (activeStage !== "references" || !pendingReferenceTarget || state.status !== "ready") return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(pendingReferenceTarget);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingReferenceTarget(undefined);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeStage, pendingReferenceTarget, state.status, taxonomyReferences.length]);

  const handleCaseReferenceClick = (event: MouseEvent<HTMLDivElement>) => {
    const origin = event.target instanceof Element ? event.target : null;
    const link = origin?.closest<HTMLAnchorElement>('a[href^="#vigil-"]');
    const targetId = caseReferenceTargetFromHash(link?.getAttribute("href") ?? "");
    if (!targetId) return;
    event.preventDefault();
    window.history.replaceState(null, "", `#${targetId}`);
    setPendingReferenceTarget(targetId);
    setActiveStage("references");
  };

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
  const harmEvidenceReferenceNumbers = useMemo(() => Object.fromEntries(
    externalSources.flatMap((source, index) => source.sourceRecordRefs.map((ref) => [ref, index + 1])),
  ), [externalSources]);
  const externalAssessments = useMemo(() => incident ? externalAssessmentsFrom(incident.raw) : [], [incident]);
  const externalIncidentReferences = useMemo(() => incident ? externalIncidentReferencesFrom(incident.raw) : [], [incident]);
  const affectedSystems = useMemo(() => incident ? dedupeAffectedSystems([incident]) : [], [incident]);
  const incidentArtefacts = useMemo(() => incident ? incidentArtefactsFor(incident) : [], [incident]);

  useEffect(() => {
    let cancelled = false;
    const harm = incident && isObject(incident.raw.harm_impact_assessment) ? incident.raw.harm_impact_assessment : undefined;
    const methodologyVersion = harm ? text(harm.methodology_version) : undefined;
    if (!methodologyVersion) {
      setHarmMethodologyMetadata(undefined);
      return () => { cancelled = true; };
    }
    void loadHarmMethodologyMetadata(methodologyVersion)
      .then((metadata) => { if (!cancelled) setHarmMethodologyMetadata(metadata); });
    return () => { cancelled = true; };
  }, [incident]);

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

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 text-muted-foreground sm:px-6 md:px-10">Preparing VIGIL Observatory Case File…</main></Shell>;
  if (state.status === "error") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-10"><div className="vigil-reference-state"><h1>Case File unavailable</h1><p>{state.message}</p><Link href="/observatory/cases/">Return to Case Files →</Link></div></main></Shell>;

  const sourceRecord = state.records[0];
  const title = sourceRecord?.title ?? "VIGIL Observatory Case File";
  const classification = incident ? taxonomyFailureTypeLabel(incident.raw) : undefined;
  const isExemplar = classification === "Exemplar";
  const isFailure = classification === "Classified";
  const isCombination = classification === "Combination";
  const isDisputed = classification === "Disputed";
  const exemplarExecution = exemplarExecutionStatus(incident);
  const hasMixedExecution = isExemplar && exemplarExecution === "mixed";
  const diagnostic = diagnosticProvenance(incident);
  const reportId = incident?.id ?? state.sourceId;
  const occurred = incidentTimingLabel(incident?.raw);
  const jurisdiction = incident ? firstText(incident.raw, ["jurisdictional_context.primary_jurisdiction"]) ?? "Not established" : "Not established";
  const environment = incident
    ? firstText(incident.raw, ["system_context.occurrence_environment.operational_setting"])
    : undefined;
  const environmentLabel = environment ? titleizeValue(environment) : "Not established";

  const governanceConclusion = incident ? firstText(incident.raw, ["vigil_assessment.governance_interpretation"]) : undefined;
  const factualBasis = incident ? firstText(incident.raw, ["vigil_assessment.factual_basis"]) : undefined;
  const governanceSignificance = incident ? firstText(incident.raw, ["vigil_assessment.significance_to_cam", "why_it_matters_to_CAM"]) : undefined;
  const assessmentBoundaries = incident ? firstTextList(incident.raw, ["vigil_assessment.assessment_boundaries"]) : [];
  const harmImpactAssessment = incident && isObject(incident.raw.harm_impact_assessment) ? incident.raw.harm_impact_assessment : undefined;
  const harmDimensionLimitItems = nonAssessedHarmDimensionLimitItems(harmImpactAssessment);
  const assessmentLimitItems = [...assessmentBoundaries, ...harmDimensionLimitItems];
  const taxonomyReferenceVersion = taxonomyReferences[0]?.referenceVersion ?? taxonomyReferences[0]?.taxonomyVersion;
  const taxonomyReferenceDate = taxonomyReferences[0]?.referencePublicationDate;
  const taxonomyReferenceNumber = taxonomyReferences.length
    ? externalSources.length + externalIncidentReferences.length + 1
    : undefined;
  const harmMethodologyReferenceNumber = harmImpactAssessment
    ? externalSources.length + externalIncidentReferences.length + (taxonomyReferences.length ? 1 : 0) + 1
    : undefined;
  const referenceCount = externalSources.length + externalIncidentReferences.length + (taxonomyReferences.length ? 1 : 0) + (harmImpactAssessment ? 1 : 0) + taxonomyEvidenceReferences.length + state.records.length;

  const renderStageContent = (stageId: StageId): ReactNode => {
    if (stageId === "observe") return <>
      {(incident?.summary ?? incident?.publicDisplay.finding) && <section className="vigil-observation-summary" aria-labelledby="what-happened-heading">
        <div className="vigil-case-subheading"><p className="vigil-library-kicker">Incident summary</p><h3 id="what-happened-heading">What happened</h3></div>
        <p>{incident?.summary ?? incident?.publicDisplay.finding}</p>
        {incidentArtefacts.length > 0 && <div className="vigil-incident-artefacts">
          {incidentArtefacts.map((artefact) => <figure key={artefact.id} className="vigil-incident-artefact">
            {isVideoArtefact(artefact)
              ? <video
                  className="vigil-incident-artefact-video"
                  controls
                  preload="metadata"
                  playsInline
                  aria-label={artefact.altText ?? artefact.title ?? "Incident source video"}
                >
                  <source src={artefact.renderUrl} type={artefact.mediaType} />
                  Your browser cannot play this video. <a href={artefact.permalink ?? artefact.renderUrl} target="_blank" rel="noreferrer">Open the incident source video.</a>
                </video>
              : <a href={artefact.permalink ?? artefact.renderUrl} target="_blank" rel="noreferrer" className="vigil-incident-artefact-link">
                  <img src={artefact.renderUrl} alt={artefact.altText ?? artefact.title ?? "Incident source artefact"} loading="lazy" />
                </a>}
            {(artefact.title || artefact.sourceUrl) && <figcaption>
              {artefact.title && <strong>{artefact.title}</strong>}
              {(() => {
                const referenceNumber = evidenceReferenceNumberForUrl(externalSources, artefact.sourceUrl);
                return referenceNumber
                  ? <a className="vigil-incident-artefact-reference" href={`#vigil-evidence-reference-${referenceNumber}`} aria-label={`Evidence reference ${referenceNumber}`}>[{referenceNumber}]</a>
                  : artefact.sourceUrl
                    ? <a className="vigil-incident-artefact-reference" href={artefact.sourceUrl} target="_blank" rel="noreferrer">Source</a>
                    : null;
              })()}
            </figcaption>}
          </figure>)}
        </div>}
      </section>}
      {affectedSystems.length > 0 && <section className="vigil-affected-systems" aria-labelledby="affected-systems-heading">
        <div className="vigil-case-subheading"><p className="vigil-library-kicker">Affected systems</p><h3 id="affected-systems-heading">Platforms, products and runtimes named in the evidence</h3></div>
        <div className="vigil-affected-system-grid">{affectedSystems.map((system, index) => <article key={`${system.recordId}-${index}`}>
          <span>{compactId(system.recordId)}</span>
          <dl>
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
      {incidentDetail?.evidence.length ? <div className="vigil-evidence-list">{incidentDetail.evidence.map((evidence, index) => <EvidenceCard key={`${evidence.title}-${index}`} evidence={evidence} />)}</div> : null}
      {!incidentDetail?.evidence.length && externalSources.length > 0 && <p className="vigil-case-empty">{externalSources.length} external evidence source{externalSources.length === 1 ? " is" : "s are"} recorded for this investigation. The full bibliography is available under References.</p>}
      {affectedSystems.length === 0 && !incidentDetail?.evidence.length && externalSources.length === 0 && <p className="vigil-case-empty">No structured evidence is available in the current public projection.</p>}
    </>;

    if (stageId === "classify") return <>
      {incident ? <CaseTaxonomyClassification raw={incident.raw} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref="#vigil-failure-taxonomy-reference" /> : <p className="vigil-case-empty">No Incident is linked to this Case File, so no VIGIL Observatory taxonomy classification can be rendered.</p>}
    </>;

    if (stageId === "repair") return <>
      {incident ? <CaseTaxonomyRepair raw={incident.raw} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref="#vigil-failure-taxonomy-reference" /> : <p className="vigil-case-empty">No governing invariant can be resolved from a canonical classification for this Incident.</p>}
    </>;

    if (stageId === "diagnose") return <>
    {(incident || governanceConclusion) ? <article className="vigil-diagnosis-view">
      {incident && <div className="vigil-diagnosis-mechanism">
        <section className="vigil-diagnosis-definition">
          <p className="vigil-library-kicker">GOVERNANCE ASSESSMENT</p>
          <div className="vigil-diagnosis-assessment-details">
            <section>
              <h4 className="vigil-substantive-label">Factual basis</h4>
              <p>{factualBasis ?? "A separate factual-basis statement is not yet published for this Incident."}</p>
            </section>
          </div>
          <aside className="vigil-diagnosis-metadata-panel" aria-label="Governance assessment provenance">
            <p className="vigil-diagnostic-meta-label">GOVERNANCE ASSESSMENT PROVENANCE</p>
            <dl className="vigil-evidence-review-meta">
              {diagnosticMethodLabel(diagnostic?.method) && <Field label="Method" value={diagnosticMethodLabel(diagnostic?.method)} />}
              {(diagnostic?.aiPlatform || diagnostic?.aiModel) && <Field label="AI collaborator" value={[diagnostic.aiPlatform, diagnostic.aiModel].filter(Boolean).join(" ")} />}
              <Field label="Assessed" value={diagnostic?.diagnosticDate} />
              <Field label="Review status" value={reviewStatusLabel(diagnostic?.reviewStatus)} />
              <Field label="Human contribution" value={diagnostic?.humanRole} />
              <Field label="AI contribution" value={diagnostic?.aiRole} />
              <Field label="Authority boundary" value={diagnostic?.authorityBoundary} />
              <Field label="Model attribution" value={diagnostic?.attributionBasis} />
            </dl>
          </aside>
        </section>

        <CaseTaxonomyAssessment raw={incident.raw} />

        <section className="vigil-severity-assessment" aria-labelledby="severity-assessment-heading">
          <div className="vigil-case-subheading">
            <p className="vigil-library-kicker" id="severity-assessment-heading">VIGIL OBSERVATORY REAL-WORLD HARM ASSESSMENT</p>
          </div>
          <HarmImpactMatrix
            assessment={harmImpactAssessment}
            evidenceReferenceNumbers={harmEvidenceReferenceNumbers}
            methodologyReferenceNumber={harmMethodologyReferenceNumber}
            methodologyReferenceHref="#vigil-harm-methodology-reference"
          />
        </section>

        {externalAssessments.length > 0 && <section className="vigil-severity-assessment vigil-external-assessment-section" aria-labelledby="assessment-external-assessments-heading">
          <div className="vigil-case-subheading"><p className="vigil-library-kicker" id="assessment-external-assessments-heading">EXTERNAL ASSESSMENTS</p></div>
          <div className="vigil-external-assessment-table-wrap">
            <table className="vigil-external-assessment-table">
              <thead>
                <tr>
                  <th scope="col">Assessor</th>
                  <th scope="col">Date</th>
                  <th scope="col">Conclusion</th>
                  <th scope="col">Classification / scheme</th>
                </tr>
              </thead>
              <tbody>
                {externalAssessments.map((assessment) => {
                  const evidenceReferenceNumber = externalAssessmentEvidenceReferenceNumber(assessment, externalSources, harmEvidenceReferenceNumbers);
                  return <tr key={assessment.id}>
                    <td><strong>{assessment.assessor}</strong>{evidenceReferenceNumber ? <> <a className="vigil-external-assessment-reference" href={`#vigil-evidence-reference-${evidenceReferenceNumber}`}>[{evidenceReferenceNumber}]</a></> : null}</td>
                    <td>{externalAssessmentDate(assessment.date)}</td>
                    <td>{assessment.summary}</td>
                    <td>{assessment.classificationOrRating
                      ? [assessment.classificationOrRating.verbatimLabel ?? assessment.classificationOrRating.value, assessment.classificationOrRating.scheme].filter(Boolean).join(" · ")
                      : "—"}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>}
      </div>}
    </article> : <p className="vigil-case-empty">No structured governance assessment is linked yet. The investigation may still be in evidence gathering or assessment.</p>}
  </>;

    if (stageId === "conclusion") return (governanceConclusion || governanceSignificance) ? <article className="vigil-diagnosis-view vigil-conclusion-stack">
      <section className="vigil-diagnosis-definition vigil-conclusion-content">
        {governanceConclusion && <>
          <p className="vigil-library-kicker">VIGIL Observatory conclusion</p>
          <p className="vigil-diagnosis-assessment-summary">{governanceConclusion}</p>
        </>}
        <div className="vigil-conclusion-governance-significance">
          <div className="vigil-case-subheading">
            <h3>Governance significance</h3>
          </div>
          <p>{governanceSignificance ?? "Governance significance is not yet separately stated in the canonical Incident."}</p>
        </div>
      </section>
    </article> : <p className="vigil-case-empty">No integrated governance conclusion is currently published for this Incident.</p>;

    if (stageId === "references") return referenceCount > 0 ? <div className="vigil-case-citations vigil-case-bibliography">
      {externalSources.length > 0 && <section className="vigil-reference-subsection" aria-labelledby="evidence-sources-heading">
        <h3 id="evidence-sources-heading">Evidence sources</h3>
        <p>Sources supporting what happened and any materialised harm.</p>
        <ol>
        {externalSources.map((source, index) => <li id={`vigil-evidence-reference-${index + 1}`} key={`${source.title}-${source.url}-${index}`}>
          <span>[{index + 1}]</span>
          <div>
            <strong>{source.title}</strong>
            {(source.publisher || source.date) && <p>{[source.publisher, source.date].filter(Boolean).join(" · ")}</p>}
            {source.url && <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>}
          </div>
        </li>)}
        </ol>
      </section>}

      {externalIncidentReferences.length > 0 && <section className="vigil-reference-subsection" aria-labelledby="external-incident-records-heading">
        <h3 id="external-incident-records-heading">External incident records</h3>
        <p>Cross-registry records identifying the same or a related occurrence.</p>
        <ol>
          {externalIncidentReferences.map((reference, index) => <li key={`${reference.registry}-${reference.externalId ?? index}`}>
            <span>[{index + 1}]</span>
            <div>
              <strong>{reference.registry}{reference.externalId ? ` — ${reference.externalId}` : ""}</strong>
              {(reference.relationship || reference.reviewedOn) && <p>{[
                reference.relationship ? titleizeValue(reference.relationship) : undefined,
                reference.reviewedOn ? `Reviewed ${reference.reviewedOn}` : undefined,
              ].filter(Boolean).join(" · ")}</p>}
              {reference.url && <a href={reference.url} target="_blank" rel="noreferrer">{reference.url}</a>}
            </div>
          </li>)}
        </ol>
      </section>}
      {(taxonomyReferences.length > 0 || harmImpactAssessment || taxonomyEvidenceReferences.length > 0) && <section className="vigil-reference-subsection" aria-labelledby="taxonomy-methodology-references-heading">
        <h3 id="taxonomy-methodology-references-heading">Taxonomy and methodology references</h3>
        <ol>
        {taxonomyReferences.length > 0 && <li id="vigil-failure-taxonomy-reference" key="vigil-failure-taxonomy">
          <span>[1]</span>
          <div>
            <strong>VIGIL Observatory Alignment Taxonomy</strong>
            <p>{["CAM Initiative", "Public taxonomy reference", taxonomyReferenceVersion ? `Version ${taxonomyReferenceVersion}` : undefined, taxonomyReferenceDate ? `Revised ${taxonomyReferenceDate}` : undefined].filter(Boolean).join(" · ")}</p>
            <a href="https://www.cam-initiative.org/observatory/knowledge-base/failure-taxonomy" target="_blank" rel="noreferrer">https://www.cam-initiative.org/observatory/knowledge-base/failure-taxonomy</a>
          </div>
        </li>}
        {harmImpactAssessment && <li id="vigil-harm-methodology-reference" key="vigil-harm-impact-methodology">
          <span>[{taxonomyReferences.length ? 2 : 1}]</span>
          <div>
            <strong>VIGIL Harm Impact Methodology</strong>
            <p>{["CAM Initiative", "Harm severity methodology", harmMethodologyMetadata?.version ? `Version ${harmMethodologyMetadata.version}` : text(harmImpactAssessment.methodology_version) ? `Version ${text(harmImpactAssessment.methodology_version)}` : undefined, harmMethodologyMetadata?.effectiveOn ? `Revised ${harmMethodologyMetadata.effectiveOn}` : undefined].filter(Boolean).join(" · ")}</p>
            <a href="https://www.cam-initiative.org/observatory/severity-methodology" target="_blank" rel="noreferrer">https://www.cam-initiative.org/observatory/severity-methodology</a>
          </div>
        </li>}
        {taxonomyEvidenceReferences.map((reference, index) => <li key={`taxonomy-evidence-${reference.key}`}>
          <span>[{(taxonomyReferences.length ? 1 : 0) + (harmImpactAssessment ? 1 : 0) + index + 1}]</span>
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
        </ol>
      </section>}
      <section className="vigil-reference-subsection" aria-labelledby="internal-vigil-records-heading">
        <h3 id="internal-vigil-records-heading">Internal records</h3>
        <ol>
        {state.records.map((record, index) => <li key={record.id}>
          <span>[{index + 1}]</span>
          <div>
            <strong>{record.id} — {record.title}</strong>
            {(record.record_version || record.record_last_updated || record.date_recorded) && <p className="vigil-reference-record-meta">
              {[
                record.record_version ? `Version ${record.record_version}` : undefined,
                record.record_last_updated ? `Updated ${record.record_last_updated}` : undefined,
                record.date_recorded ? `Recorded ${record.date_recorded}` : undefined,
              ].filter(Boolean).join(" · ")}
            </p>}
            {recordLink(record) && <a href={recordLink(record)} target="_blank" rel="noreferrer">{recordLink(record)}</a>}
          </div>
        </li>)}
        </ol>
      </section>

      <section className="vigil-reference-disclaimer" aria-labelledby="vigil-reference-reliance-heading">
        <h3 id="vigil-reference-reliance-heading">Use and reliance notice</h3>
        <p>This Case File is provided for research and informational purposes. It does not constitute legal, regulatory, security, assurance, certification, risk, or other professional advice, and should not be relied upon as a substitute for independent assessment. Third parties remain responsible for verifying the cited source material, the current state of the underlying VIGIL Observatory records and taxonomy, the applicability of the analysis to their circumstances, and any decision or action taken in reliance on this Case File.</p>
        {assessmentLimitItems.length > 0 && <div className="vigil-reference-assessment-limits">
          <h4 className="vigil-reference-limits-label">Limits of the assessment</h4>
          <TextList items={assessmentLimitItems} />
        </div>}
      </section>
    </div> : <p className="vigil-case-empty">No references are currently available for this Case File.</p>;

    return null;
  };

  const activeDefinition = CASE_VIEWS.find((stage) => stage.id === activeStage) ?? CASE_VIEWS[0];
  const activeAriaLabel = `${activeDefinition.number} ${activeDefinition.label}`;

  return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10">
    <Link href="/observatory/cases/" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> Case Files</Link>

    <header className={`vigil-case-file-hero vigil-case-file-hero-v4${isExemplar ? " is-exemplar" : ""}${hasMixedExecution ? " is-mixed-execution" : ""}`}>
      <div className="vigil-case-file-title-block">
        <p className="vigil-library-kicker">{isExemplar ? "VIGIL Observatory Case File · Successful invariant exemplar" : isCombination ? "VIGIL Observatory Case File · Mixed classification" : isFailure ? "VIGIL Observatory Case File · Failure-classified Incident" : "VIGIL Observatory Case File · AI Incident investigation"}</p>
        <h1>{title}</h1>
      </div>
      <aside className="vigil-case-meta-panel" aria-label="Incident context">
        <p className="vigil-case-context-label">Incident context</p>
        <dl className="vigil-case-context-grid">
          <Field label="Incident" value={incident ? compactId(incident.id) : compactId(state.sourceId)} mono />
          <Field label="Occurred" value={occurred} />
          <Field label="Jurisdiction" value={jurisdiction} />
          <Field label="Environment" value={environmentLabel} />
        </dl>
      </aside>
      <div className={`vigil-case-ticket-footer${hasMixedExecution ? " has-execution" : ""}`}>
        <dl className="vigil-case-ticket-footer-meta">
          <Field label="Severity" value={severityDisplay(incident?.severity)} />
          <Field label="Classification" value={isExemplar ? "Exemplar · successful invariant" : isCombination ? "Mixed alignment outcome" : classification} />
          {hasMixedExecution && <Field label="Execution" value="Mixed" />}
        </dl>
        <Link href={`/observatory/reports/${encodeURIComponent(reportId)}/`} className="vigil-case-print-button vigil-case-ticket-report-button"><FileText aria-hidden="true" /> Generate report / PDF</Link>
      </div>
    </header>

    {isCombination && <section className="vigil-exemplar-callout is-combination" aria-labelledby="vigil-combination-heading">
      <div className="vigil-exemplar-callout-icon" aria-hidden="true"><Info /></div>
      <div className="vigil-exemplar-callout-copy">
        <p className="vigil-exemplar-callout-kicker">Mixed alignment outcome</p>
        <h2 id="vigil-combination-heading">The system is neither aligned nor misaligned.</h2>
        <p>Different alignment and governance boundaries produced different outcomes. Some mappings evidence failure, while others show an invariant holding or an unresolved boundary. Open Classification to see each relationship separately.</p>
        <p className="vigil-exemplar-callout-boundary">Failure-occurrence and ambiguous-boundary mappings contribute their governing invariants to Repair. Ambiguous boundaries remain explicitly unresolved rather than being presented as failures; successful-invariant mappings remain in Classification as evidence of boundaries that held.</p>
      </div>
    </section>}

    {isFailure && <section className="vigil-exemplar-callout is-failure" aria-labelledby="vigil-failure-heading">
      <div className="vigil-exemplar-callout-icon" aria-hidden="true"><CircleX /></div>
      <div className="vigil-exemplar-callout-copy">
        <p className="vigil-exemplar-callout-kicker">Failure-classified Incident</p>
        <h2 id="vigil-failure-heading">The governing invariants assessed did not demonstrate alignment.</h2>
        <p>This Case File contains one or more failure-occurrence mappings under the VIGIL Observatory Alignment Taxonomy. The conclusion is bounded to the governing invariants and evidence assessed for this occurrence.</p>
        <p className="vigil-exemplar-callout-boundary">Failure classification does not by itself determine harm severity. Materialised impact is assessed separately under the VIGIL Harm Impact Assessment.</p>
      </div>
    </section>}

    {isDisputed && <section className="vigil-exemplar-callout is-disputed" aria-labelledby="vigil-disputed-heading">
      <div className="vigil-exemplar-callout-icon" aria-hidden="true"><Info /></div>
      <div className="vigil-exemplar-callout-copy">
        <p className="vigil-exemplar-callout-kicker">Disputed evidence</p>
        <h2 id="vigil-disputed-heading">The evidence is disputed.</h2>
        <p>Material claims about this occurrence are contested, denied, or have not been independently adjudicated. VIGIL preserves the available evidence and its current classification without presenting disputed claims as settled fact.</p>
        <p className="vigil-exemplar-callout-boundary">The taxonomy mapping describes the governance mechanism evidenced if the reported occurrence is supported; it does not convert disputed claims into established fact.</p>
      </div>
    </section>}

    {isExemplar && <section className={`vigil-exemplar-callout${hasMixedExecution ? " is-mixed-execution" : ""}`} aria-labelledby="vigil-exemplar-heading">
      <div className="vigil-exemplar-callout-icon" aria-hidden="true">{hasMixedExecution ? <Blend /> : <CircleCheckBig />}</div>
      <div className="vigil-exemplar-callout-copy">
        <p className="vigil-exemplar-callout-kicker">{hasMixedExecution ? "Successful invariant exemplar · mixed execution" : "Successful invariant exemplar"}</p>
        <h2 id="vigil-exemplar-heading">{hasMixedExecution ? "Successful exemplar — mixed execution." : "The system worked as intended."}</h2>
        {hasMixedExecution
          ? <p>This Case File is classified as a successful invariant exemplar overall. The relevant alignment or governance invariant held, while execution or human-facing expression was imperfect.</p>
          : <p>This Case File documents a successful governance outcome, not a failure-classified Incident. Under the relevant pressure, the governing invariant held: the concern remained available for independent human review and final decision authority remained with the human.</p>}
        <p className="vigil-exemplar-callout-boundary">{hasMixedExecution
          ? "Mixed execution qualifies how the exemplar was expressed; it does not convert the Incident into a failure classification."
          : "This Incident shows what correct governance behaviour looks like when the invariant holds under pressure."}</p>
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

    <div className="vigil-case-active-stage" role="tabpanel" id={`case-panel-${activeStage}`} aria-label={activeAriaLabel} onClick={handleCaseReferenceClick}>
      <Section id={`case-${activeStage}`} title={activeDefinition.label}>
        {renderStageContent(activeStage)}
      </Section>
    </div>
  </div></main></Shell>;
}
