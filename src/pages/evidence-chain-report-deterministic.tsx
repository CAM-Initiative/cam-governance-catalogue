import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { EvidenceCard } from "@/components/vigil/EvidenceCard";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilIncidentRecords, loadVigilRecordDetail, type UnknownRecord } from "@/lib/vigilRegistry";
import {
  normalizeFailureFamilyLabel,
  normalizeRecords,
  normalizeVigilRecord,
  titleizeValue,
  type VigilIndexRecord,
} from "@/lib/vigilPresentation";
import { deriveFailureModePublicDetail } from "@/lib/vigilPublicDisplay";

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
  try { return mergeRecordDetail(indexRecord, await loadVigilRecordDetail(indexRecord.raw)); }
  catch { return indexRecord; }
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

function sourceEvidenceStatus(record: VigilIndexRecord | undefined, index: number) {
  if (!record || !Array.isArray(record.raw.source_records)) return {};
  const source = record.raw.source_records[index];
  if (!isObject(source)) return {};
  return {
    evidenceStatus: text(source.evidence_status),
    evidenceStatusBasis: text(source.evidence_status_basis),
  };
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

function severityDisplay(value?: string) {
  const raw = value?.trim();
  if (!raw) return "Not assessed";
  const code = raw.toUpperCase();
  const labels: Record<string, string> = {
    S0: "Critical",
    S1: "High",
    S2: "Moderate",
    S3: "Low",
    S4: "Negligible",
    SU: "To be assessed",
  };
  return labels[code] ? `${code} · ${labels[code]}` : titleizeValue(raw);
}

function taxonomyMeta(record: VigilIndexRecord) {
  const reference = firstText(record.raw, ["failure_classification.taxonomy_reference", "taxonomy_reference"]);
  const group = firstText(record.raw, ["failure_classification.canonical_failure_group", "canonical_failure_group"]);
  return {
    code: firstText(record.raw, ["failure_classification.primary_failure_family_code", "primary_failure_family_code", "failure_classification.canonical_failure_code", "canonical_failure_code"]) ?? (group ? `OPS.FF.${group.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_")}` : undefined),
    name: firstText(record.raw, ["failure_classification.canonical_failure_name", "canonical_failure_name"]),
    reference,
  };
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div><dt className="report-label">{label}</dt><dd className="mt-1 text-base leading-relaxed text-foreground/85">{value}</dd></div>;
}

function TextList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return <ul className="mt-2 space-y-2 text-base leading-relaxed text-foreground/85">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function Stage({ number, label, children }: { number: string; label: string; children: ReactNode }) {
  return <section className="report-section report-break-inside-avoid rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_98%)] p-5 md:p-6">
    <header className="-mx-1 flex items-start gap-4 border-b border-[hsl(38_25%_80%)] bg-[hsl(38_48%_98%)] px-1 pb-4">
      <span className="font-mono text-base tracking-[0.12em] text-cam-gold">{number}</span>
      <h2 className="font-serif text-2xl text-foreground">{label}</h2>
    </header>
    <div className="mt-4">{children}</div>
  </section>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border/70 p-4 text-base leading-relaxed text-muted-foreground">{children}</p>;
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
        if (!sourceIndex || sourceIndex.record_type !== "incident") throw new Error(`The canonical VIGIL Incident registry does not contain ${sourceId}.`);
        const incident = await detailedRecord(sourceIndex);
        if (!cancelled) setState({ status: "ready", sourceId, records: [incident], generatedAt: new Date().toISOString() });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: (error as Error).message });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [sourceId]);

  const observations: VigilIndexRecord[] = [];
  const failure = state.status === "ready" ? state.records[0] : undefined;
  const failureDetail = useMemo(() => failure ? deriveFailureModePublicDetail(failure.raw, failure.publicDisplay) : undefined, [failure]);
  const externalSources = useMemo(() => state.status === "ready" && failure ? dedupeEvidence([failure, ...observations].flatMap(externalEvidenceFor)) : [], [failure, observations, state]);
  const affectedSystems = useMemo(() => failure ? dedupeSystems([failure, ...observations]) : dedupeSystems(observations), [failure, observations]);

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 text-muted-foreground sm:px-6 md:px-10">Preparing deterministic Case File report…</main></Shell>;
  if (state.status === "error") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-10"><div className="vigil-reference-state"><h1>Report unavailable</h1><p>{state.message}</p><Link href="/observatory/cases">Return to Case Files →</Link></div></main></Shell>;

  const taxonomy: ReturnType<typeof taxonomyMeta> = failure ? taxonomyMeta(failure) : { code: undefined, name: undefined, reference: undefined };
  const family = failure ? normalizeFailureFamilyLabel(failure.failure_family)?.replace(/\s+Failures$/i, "") ?? failure.failure_family : undefined;
  const governanceAssessment = failure ? firstText(failure.raw, ["vigil_assessment.governance_interpretation"]) : undefined;
  const factualBasis = failure ? firstText(failure.raw, ["vigil_assessment.factual_basis"]) : undefined;
  const governanceSignificance = failure ? firstText(failure.raw, ["vigil_assessment.significance_to_cam", "why_it_matters_to_CAM"]) : undefined;
  const assessmentBoundaries = failure ? firstTextList(failure.raw, ["vigil_assessment.assessment_boundaries"]) : [];
  const severityBasis = failure ? firstText(failure.raw, ["severity_assessment.assessment_basis"]) : undefined;
  const severityAssessedOn = failure ? firstText(failure.raw, ["severity_assessment.assessed_on"]) : undefined;
  const diagnostic = diagnosticProvenance(failure);
  const title = failure?.title ?? "VIGIL Case File";
  const summary = failure?.summary ?? failure?.publicDisplay.finding;

  const references = [
    ...externalSources.map((source) => ({ key: `ext-${source.title}-${source.url ?? ""}`, label: source.title, detail: [source.publisher, source.date].filter(Boolean).join(" · "), url: source.url })),
    ...state.records.map((record) => ({ key: record.id, label: `${record.id} — ${record.title}`, detail: [record.record_last_updated, record.record_version ? `Version ${record.record_version}` : undefined].filter(Boolean).join(" · "), url: record.github_blob_url ?? record.raw_url })),
  ];

  return <Shell>
    <VigilObservatoryNav />
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-10 md:py-10">
      <div className="print:hidden mb-6 flex items-center justify-between gap-4">
        <Link href={`/observatory/cases/${encodeURIComponent(failure?.id ?? state.sourceId)}`} className="font-mono text-sm uppercase tracking-[0.1em] text-cam-gold">← Back to Case File</Link>
        <button type="button" onClick={() => window.print()} className="rounded-md border border-cam-gold/45 bg-background px-4 py-2 font-mono text-sm uppercase tracking-[0.08em] text-cam-gold">Print / save PDF</button>
      </div>

      <header className="mb-6 rounded-xl border border-[hsl(38_30%_78%)] bg-[hsl(38_48%_94%)] p-6 md:p-8">
        <p className="font-mono text-sm uppercase tracking-[0.16em] text-cam-gold">VIGIL Case File · deterministic report</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">{title}</h1>
        {summary && <p className="mt-3 max-w-4xl text-base leading-relaxed text-foreground/80">{summary}</p>}
        <dl className="mt-5 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
          <Field label="Incident" value={failure?.id ?? state.sourceId} />
          <Field label="Generated" value={state.generatedAt.replace("T", " ").replace(/\.\d{3}Z$/, " UTC")} />
        </dl>
      </header>

      <div className="space-y-5">
        <Stage number="01" label="Observation">
          {affectedSystems.length > 0 && <section className="mb-5 rounded-lg border border-border/70 bg-[hsl(38_48%_97%)] p-4">
            <p className="report-substantive-label">Affected systems</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{affectedSystems.map((system, index) => <article key={`${system.recordId}-${index}`}>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Field label="Provider / platform" value={system.provider} />
                <Field label="Product / service" value={system.product} />
                <Field label="Model / runtime" value={system.model} />
                <Field label="System type" value={system.systemType} />
                <Field label="Interface" value={system.interfaceSurface} />
                <Field label="Deployment context" value={system.deploymentContext} />
              </dl>
            </article>)}</div>
          </section>}
          {failureDetail?.evidence.length ? <div className="mt-4 space-y-3">{failureDetail.evidence.map((evidence, index) => <EvidenceCard key={`${evidence.title}-${index}`} evidence={{ ...evidence, ...sourceEvidenceStatus(failure, index) }} />)}</div> : null}
          {!failureDetail?.evidence.length && !affectedSystems.length && <Empty>No structured evidence is available in the current public projection.</Empty>}
        </Stage>

        <Stage number="02" label="Diagnosis">
          {failure ? <article className="space-y-5">
            <section>
              <p className="vigil-evidence-kicker">VIGIL governance assessment</p>
              <p className="mt-2 text-base leading-relaxed text-foreground/85">{governanceAssessment ?? failure.publicDisplay.finding ?? failure.summary}</p>
            </section>

            <section className="report-severity-assessment rounded-lg border border-border/70 bg-[hsl(38_48%_97%)] p-4">
              <p className="report-substantive-label">Severity assessment</p>
              <dl className="mt-3 grid gap-4 sm:grid-cols-[minmax(10rem,0.34fr)_minmax(0,1fr)]">
                <Field label="Severity" value={severityDisplay(failure.severity)} />
                <Field label="Severity basis" value={severityBasis} />
              </dl>
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
              <div className="grid gap-4">
                <section className="rounded-lg bg-[hsl(38_48%_97%)] p-4"><p className="report-substantive-label">Factual basis</p><p className="mt-2 text-base leading-relaxed text-foreground/85">{factualBasis ?? "A separate factual-basis statement is not yet published for this Incident."}</p></section>
                <section className="rounded-lg bg-[hsl(38_48%_97%)] p-4"><p className="report-substantive-label">Governance significance</p><p className="mt-2 text-base leading-relaxed text-foreground/85">{governanceSignificance ?? "Governance significance is not yet separately stated in the canonical Incident."}</p></section>
              </div>
              <aside className="rounded-lg bg-[hsl(38_48%_97%)] p-4">
                <p className="report-label">Diagnostic metadata</p>
                <dl className="mt-3 grid gap-4">
                  <Field label="Severity assessed" value={severityAssessedOn} />
                  <Field label="Method" value={diagnosticMethodLabel(diagnostic?.method)} />
                  <Field label="Diagnosed" value={diagnostic?.diagnosticDate} />
                  <Field label="AI collaborator" value={[diagnostic?.aiPlatform, diagnostic?.aiModel].filter(Boolean).join(" ") || undefined} />
                  <Field label="Review status" value={diagnostic?.reviewStatus ? titleizeValue(diagnostic.reviewStatus) : undefined} />
                  <Field label="Human contribution" value={diagnostic?.humanRole} />
                  <Field label="AI contribution" value={diagnostic?.aiRole} />
                  <Field label="Authority boundary" value={diagnostic?.authorityBoundary} />
                  <Field label="Model attribution" value={diagnostic?.attributionBasis} />
                </dl>
              </aside>
            </div>
            {assessmentBoundaries.length > 0 && <details className="vigil-evidence-limitations" open>
              <summary>Limits of the diagnosis</summary>
              <div className="vigil-evidence-boundary-list"><TextList items={assessmentBoundaries} /></div>
            </details>}
          </article> : <Empty>No structured diagnosis is available.</Empty>}
        </Stage>

        <Stage number="03" label="Classification">
          {failure ? <article>
            <p className="vigil-evidence-kicker">Taxonomy classification</p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Canonical code" value={taxonomy.code} />
              <Field label="Failure type" value={family} />
              <Field label="Canonical failure name" value={taxonomy.name} />
              <Field label="VIGIL mechanism subtype" value={failure.failure_subtype} />
              <Field label="Taxonomy reference" value={taxonomy.reference} />
            </dl>
          </article> : <Empty>No current taxonomy classification is linked.</Empty>}
        </Stage>

        <Stage number="04" label="References">
          {references.length > 0 ? <>
            <p className="vigil-evidence-kicker">Evidence and record references</p>
            <ol className="mt-3 space-y-3">{references.map((reference, index) => <li key={reference.key} className="flex gap-3 text-base leading-relaxed text-foreground/85"><span className="font-mono text-sm text-cam-gold">[{index + 1}]</span><span className="min-w-0"><strong>{reference.label}</strong>{reference.detail ? <span className="text-muted-foreground"> — {reference.detail}</span> : null}{reference.url ? <><br /><a href={reference.url} target="_blank" rel="noreferrer" className="break-all text-[hsl(32_62%_25%)] underline decoration-cam-gold/50 underline-offset-4">{reference.url}</a></> : null}</span></li>)}</ol>
          </> : <Empty>No references are currently available.</Empty>}
        </Stage>
      </div>

      <footer className="mt-6 border-t border-border/60 pt-4 text-sm leading-relaxed text-muted-foreground">
        This report is a deterministic print projection of the corresponding VIGIL Case File. It uses the same Incident anchor and record-local evidence scope as the interactive Case File; it does not add repair-layer material or adjacent Failure Mode analysis to the historical occurrence.
      </footer>
    </main>
  </Shell>;
}