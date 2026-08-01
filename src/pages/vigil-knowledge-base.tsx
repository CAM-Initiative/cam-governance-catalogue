import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { loadVigilRecordDetail, loadVigilRegistryRecords, type UnknownRecord } from "@/lib/vigilRegistry";

const LEARN_ID_PATTERN = /^VIGIL-\d{4}-LEARN-\d{4}$/i;
const CAM_CITATION = {
  label: "O’Rourke, M. V. (2026). Caelestis Architecture Model (Version 1.1.0). Zenodo.",
  doi: "https://doi.org/10.5281/zenodo.20686316",
  version: "1.1.0",
};

type LearnRecord = {
  raw: UnknownRecord;
  id: string;
  title: string;
  reportTitle: string;
  caseDescriptor?: string;
  summary: string;
  whatHappened: string[];
  governanceMisconception: string[];
  abstractedLearning: string;
  integratedLearning: string[];
  riskIfNotIntegrated: string[];
  futureApplication: string[];
  generalisationBoundary?: string;
  knowledgeStatus?: string;
  publicationStatus?: string;
  recordVersion?: string;
  recordLastUpdated?: string;
  knowledgeTags: string[];
  year: number;
  primaryVendors: string[];
  incidentStatus?: string;
  monitoringRequired: boolean;
  chainState?: string;
  primaryFailureFamilyCode?: string;
  canonicalFailureName?: string;
  taxonomyReference?: string;
  githubBlobUrl?: string;
  rawUrl?: string;
};

type PageState =
  | { status: "loading" }
  | { status: "ready"; records: LearnRecord[]; notice?: string }
  | { status: "error"; message: string };

type DetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; record: LearnRecord }
  | { status: "error"; record: LearnRecord; message: string };

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAt(record: UnknownRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
    return isObject(current) ? current[part] : undefined;
  }, record);
}

function firstValue(record: UnknownRecord, paths: string[]): unknown {
  for (const path of paths) {
    const value = valueAt(record, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function textList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const seen = new Set<string>();
  return values.flatMap((item) => {
    const itemText = text(item);
    return itemText ? [itemText] : [];
  }).filter((item) => {
    const key = item.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function taxonomyLink(record: UnknownRecord) {
  const links = record.failure_taxonomy_links;
  return Array.isArray(links) && isObject(links[0]) ? links[0] : undefined;
}

function recordYear(id: string, record: UnknownRecord) {
  const explicit = Number(firstValue(record, ["year", "case_context.year"]));
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const idYear = Number(id.match(/^VIGIL-(\d{4})-/i)?.[1]);
  return Number.isFinite(idYear) ? idYear : new Date().getUTCFullYear();
}

function normalizeLearnRecord(record: UnknownRecord): LearnRecord | undefined {
  const id = text(firstValue(record, ["id", "record_id", "record_identity.record_id"]));
  const recordType = text(firstValue(record, ["record_type", "record_identity.record_type"]));
  if (!id || !LEARN_ID_PATTERN.test(id) || (recordType && recordType.toLocaleLowerCase() !== "learn")) return undefined;

  const taxonomy = taxonomyLink(record);
  const title = text(firstValue(record, ["report_title", "title", "record_identity.title"])) ?? id;
  const summary = text(record.summary) ?? "No case summary is currently available.";
  const abstractedLearning = text(record.abstracted_learning) ?? summary;
  const monitoringValue = firstValue(record, ["monitoring_required", "case_context.monitoring_required"]);
  const integratedLearning = textList(record.integrated_learning);
  const legacyLearning = textList(record.must_not_be_forgotten);

  return {
    raw: record,
    id,
    title,
    reportTitle: title,
    caseDescriptor: text(record.case_descriptor),
    summary,
    whatHappened: textList(record.what_happened),
    governanceMisconception: textList(record.governance_misconception),
    abstractedLearning,
    integratedLearning: integratedLearning.length > 0 ? integratedLearning : legacyLearning,
    riskIfNotIntegrated: textList(record.risk_if_not_integrated),
    futureApplication: textList(record.future_application),
    generalisationBoundary: text(record.generalisation_boundary),
    knowledgeStatus: text(record.knowledge_status),
    publicationStatus: text(record.publication_status),
    recordVersion: text(firstValue(record, ["record_version", "version", "record_identity.version"])),
    recordLastUpdated: text(firstValue(record, ["record_last_updated", "record_identity.updated"])),
    knowledgeTags: textList(record.knowledge_tags),
    year: recordYear(id, record),
    primaryVendors: textList(firstValue(record, ["primary_vendors", "case_context.primary_vendors"])),
    incidentStatus: text(firstValue(record, ["incident_status", "case_context.incident_status"])),
    monitoringRequired: monitoringValue === true || String(monitoringValue ?? "").toLocaleLowerCase() === "true",
    chainState: text(firstValue(record, ["chain_state", "chain_completion.overall_status"])),
    primaryFailureFamilyCode: text(firstValue(record, ["primary_failure_family_code"])) ?? text(taxonomy?.primary_failure_family_code),
    canonicalFailureName: text(firstValue(record, ["canonical_failure_name"])) ?? text(taxonomy?.canonical_failure_name),
    taxonomyReference: text(firstValue(record, ["taxonomy_reference"])) ?? text(taxonomy?.taxonomy_reference),
    githubBlobUrl: text(record.github_blob_url),
    rawUrl: text(record.raw_url),
  };
}

function mergeDetail(indexRecord: LearnRecord, detail: UnknownRecord) {
  return normalizeLearnRecord({
    ...indexRecord.raw,
    ...detail,
    path: detail.path ?? indexRecord.raw.path,
    github_blob_url: detail.github_blob_url ?? indexRecord.githubBlobUrl,
    raw_url: detail.raw_url ?? indexRecord.rawUrl,
  }) ?? indexRecord;
}

function displayLabel(value?: string) {
  return value?.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function searchText(record: LearnRecord) {
  return [
    record.id,
    record.title,
    record.caseDescriptor,
    record.summary,
    ...record.whatHappened,
    ...record.governanceMisconception,
    record.abstractedLearning,
    ...record.integratedLearning,
    ...record.riskIfNotIntegrated,
    record.generalisationBoundary,
    record.canonicalFailureName,
    record.primaryFailureFamilyCode,
    record.taxonomyReference,
    ...record.futureApplication,
    ...record.knowledgeTags,
    ...record.primaryVendors,
  ].filter(Boolean).join(" ").toLocaleLowerCase();
}

function matchesSearch(record: LearnRecord, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const haystack = searchText(record);
  return terms.every((term) => haystack.includes(term));
}

function StatusBadges({ record }: { record: LearnRecord }) {
  const complete = record.chainState?.toLocaleLowerCase() === "complete";
  return <div className="flex flex-wrap gap-2">
    <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.11em] text-muted-foreground">
      {displayLabel(record.knowledgeStatus) ?? "Knowledge status not specified"}
    </span>
    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.11em] text-[hsl(32_62%_25%)]">
      {complete ? "Complete evidence chain" : "Learning record"}
    </span>
    {record.monitoringRequired && <span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.11em] text-rose-900">Monitoring ongoing</span>}
  </div>;
}

function LearningList({ items }: { items: string[] }) {
  return <ul className="space-y-2 text-base leading-relaxed text-foreground/85">{items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /><span>{item}</span></li>)}</ul>;
}

function FailureClassPanel({ record }: { record: LearnRecord }) {
  if (!record.canonicalFailureName && !record.primaryFailureFamilyCode) return null;
  return <section className="mt-5 rounded-2xl border border-cam-gold/35 bg-[hsl(38_48%_94%)] p-4">
    <p className="report-label">Failure class</p>
    {record.canonicalFailureName && <p className="mt-1.5 font-serif text-lg leading-snug text-foreground">{record.canonicalFailureName}</p>}
    {record.primaryFailureFamilyCode && <div className="mt-3"><p className="report-label">Failure family</p><p className="mt-1 font-mono text-sm text-foreground/75">{record.primaryFailureFamilyCode}</p></div>}
  </section>;
}

function TaxonomyProvenance({ record }: { record: LearnRecord }) {
  if (!record.taxonomyReference && !record.primaryFailureFamilyCode) return null;
  return <DetailSection title="Taxonomy and corpus provenance">
    <dl className="grid gap-4 sm:grid-cols-2">
      {record.primaryFailureFamilyCode && <div><dt className="report-label">Failure family</dt><dd className="mt-1 font-mono">{record.primaryFailureFamilyCode}</dd></div>}
      {record.taxonomyReference && <div><dt className="report-label">Corpus reference</dt><dd className="mt-1">{record.taxonomyReference}</dd></div>}
    </dl>
    <p className="mt-4 border-t border-cam-gold/25 pt-4 text-sm leading-relaxed text-muted-foreground">
      Corpus citation · v{CAM_CITATION.version} · <a href={CAM_CITATION.doi} target="_blank" rel="noreferrer" className="underline decoration-cam-gold/60 underline-offset-4 hover:text-foreground">{CAM_CITATION.label} DOI: 10.5281/zenodo.20686316</a>
    </p>
  </DetailSection>;
}

function KnowledgeCard({ record }: { record: LearnRecord }) {
  return <article className="cam-parchment-card overflow-hidden rounded-3xl border border-cam-gold/30 shadow-lg transition hover:-translate-y-0.5 hover:border-cam-gold/50 hover:shadow-xl">
    <div className="border-b border-cam-gold/25 bg-[hsl(36_48%_96%)] px-6 py-4 md:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">{record.id}</p>
        <StatusBadges record={record} />
      </div>
    </div>
    <div className="p-6 md:p-7">
      <h3 className="font-serif text-3xl leading-tight text-foreground md:text-[2rem]">{record.title}</h3>
      {record.caseDescriptor && <p className="mt-3 text-base font-medium leading-relaxed text-foreground/70">{record.caseDescriptor}</p>}
      <FailureClassPanel record={record} />
      <p className="mt-5 text-base leading-relaxed text-foreground/85">{record.summary}</p>
      <div className="mt-7 flex flex-wrap gap-3 border-t border-border/65 pt-5">
        <Link href={`/observatory/knowledge-base/${encodeURIComponent(record.id)}`} className="inline-flex min-h-11 items-center rounded-xl bg-rose-900 px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-rose-50 transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 focus-visible:ring-offset-background">Open record</Link>
      </div>
    </div>
  </article>;
}

function DetailSection({ title, children, tone = "default" }: { title: string; children: React.ReactNode; tone?: "default" | "risk" | "summary" }) {
  const toneClass = tone === "risk" ? "border-rose-300 bg-rose-100/65" : tone === "summary" ? "bg-[hsl(38_48%_94%)]/65" : "bg-transparent";
  return <section className={`border-t border-cam-gold/25 px-6 py-6 md:px-8 ${toneClass}`}>
    <h2 className="font-serif text-2xl text-foreground">{title}</h2>
    <div className="mt-4 text-base leading-relaxed text-foreground/85">{children}</div>
  </section>;
}

function KnowledgeDetail({ record }: { record: LearnRecord }) {
  const reportId = record.id;
  return <div className="space-y-5">
    <Link href="/observatory/knowledge-base" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.13em] text-cam-gold hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Knowledge Base</Link>
    <article className="cam-parchment-card overflow-hidden rounded-3xl border border-cam-gold/30 shadow-xl">
      <header className="bg-[hsl(36_48%_96%)] px-6 py-7 md:px-8 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-cam-gold">{record.id}</p>
          <StatusBadges record={record} />
        </div>
        <h1 className="mt-4 max-w-5xl font-serif text-4xl leading-tight text-foreground md:text-5xl">{record.title}</h1>
        {record.caseDescriptor && <p className="mt-3 max-w-4xl text-lg leading-relaxed text-muted-foreground">{record.caseDescriptor}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/observatory/reports/${encodeURIComponent(reportId)}`} className="rounded-lg bg-rose-900 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-rose-50 transition hover:bg-rose-800">Open full evidence report</Link>
        </div>
        <FailureClassPanel record={record} />
      </header>

      <DetailSection title="Knowledge Base Summary" tone="summary">
        <p>{record.abstractedLearning}</p>
      </DetailSection>

      {record.whatHappened.length > 0 && <DetailSection title="What Happened">
        <ol className="list-decimal space-y-3 pl-5">{record.whatHappened.map((item) => <li key={item}>{item}</li>)}</ol>
      </DetailSection>}

      {record.riskIfNotIntegrated.length > 0 && <DetailSection title="Governance Risks" tone="risk">
        <LearningList items={record.riskIfNotIntegrated} />
      </DetailSection>}

      {record.governanceMisconception.length > 0 && <DetailSection title="Governance Reasoning">
        <LearningList items={record.governanceMisconception} />
      </DetailSection>}

      {record.integratedLearning.length > 0 && <DetailSection title="Key Takeaways">
        <LearningList items={record.integratedLearning} />
      </DetailSection>}

      {record.futureApplication.length > 0 && <DetailSection title="Future Application"><ul className="space-y-2">{record.futureApplication.map((item) => <li key={item}>{item}</li>)}</ul></DetailSection>}

      {record.generalisationBoundary && <DetailSection title="Limitations"><p>{record.generalisationBoundary}</p></DetailSection>}

      <DetailSection title="Publication">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="report-label">Evidence chain</dt><dd className="mt-1">{displayLabel(record.chainState) ?? "Not specified"}</dd></div>
          <div><dt className="report-label">Knowledge status</dt><dd className="mt-1">{displayLabel(record.knowledgeStatus) ?? "Not specified"}</dd></div>
          <div><dt className="report-label">Publication status</dt><dd className="mt-1">{displayLabel(record.publicationStatus) ?? "Not specified"}</dd></div>
          <div><dt className="report-label">Monitoring</dt><dd className="mt-1">{record.monitoringRequired ? "Required" : "Not currently declared"}</dd></div>
          <div><dt className="report-label">Record version</dt><dd className="mt-1">{record.recordVersion ?? "Not specified"}</dd></div>
          <div><dt className="report-label">Last updated</dt><dd className="mt-1">{record.recordLastUpdated ?? "Not specified"}</dd></div>
        </dl>
      </DetailSection>
      <TaxonomyProvenance record={record} />
    </article>
  </div>;
}

export default function VigilKnowledgeBase() {
  const [, detailParams] = useRoute("/observatory/knowledge-base/:recordId");
  const selectedId = decodeURIComponent(detailParams?.recordId ?? "").trim();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [detailState, setDetailState] = useState<DetailState>({ status: "idle" });
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [failureFamily, setFailureFamily] = useState("");
  const [application, setApplication] = useState("");
  const [monitoring, setMonitoring] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadVigilRegistryRecords()
      .then((result) => {
        if (cancelled) return;
        const records = result.records
          .map(normalizeLearnRecord)
          .filter((record): record is LearnRecord => Boolean(record))
          .filter((record) => !record.publicationStatus || record.publicationStatus.toLocaleLowerCase() === "published")
          .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
        setState({ status: "ready", records, notice: result.message });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", message: error.message });
      });
    return () => { cancelled = true; };
  }, []);

  const records = state.status === "ready" ? state.records : [];
  const selectedIndexRecord = selectedId ? records.find((record) => record.id.toLocaleLowerCase() === selectedId.toLocaleLowerCase()) : undefined;

  useEffect(() => {
    let cancelled = false;
    if (!selectedId || !selectedIndexRecord) {
      setDetailState({ status: "idle" });
      return () => { cancelled = true; };
    }
    setDetailState({ status: "loading" });
    loadVigilRecordDetail(selectedIndexRecord.raw)
      .then((detail) => {
        if (!cancelled) setDetailState({ status: "ready", record: mergeDetail(selectedIndexRecord, detail) });
      })
      .catch((error: Error) => {
        if (!cancelled) setDetailState({ status: "error", record: selectedIndexRecord, message: error.message });
      });
    return () => { cancelled = true; };
  }, [selectedId, selectedIndexRecord]);

  const filterOptions = useMemo(() => ({
    years: [...new Set(records.map((record) => String(record.year)))].sort((a, b) => Number(b) - Number(a)),
    families: [...new Set(records.map((record) => record.primaryFailureFamilyCode).filter((value): value is string => Boolean(value)))].sort(),
    applications: [...new Set(records.flatMap((record) => record.futureApplication))].sort(),
  }), [records]);

  const filtered = useMemo(() => records.filter((record) => {
    if (!matchesSearch(record, query)) return false;
    if (year && String(record.year) !== year) return false;
    if (failureFamily && record.primaryFailureFamilyCode !== failureFamily) return false;
    if (application && !record.futureApplication.includes(application)) return false;
    if (monitoring === "required" && !record.monitoringRequired) return false;
    if (monitoring === "not-required" && record.monitoringRequired) return false;
    return true;
  }), [application, failureFamily, monitoring, query, records, year]);

  const grouped = useMemo(() => {
    const groups = new Map<number, LearnRecord[]>();
    for (const record of filtered) groups.set(record.year, [...(groups.get(record.year) ?? []), record]);
    return [...groups.entries()].sort(([a], [b]) => b - a);
  }, [filtered]);

  const detailRecord = detailState.status === "ready" || detailState.status === "error" ? detailState.record : selectedIndexRecord;

  return <Shell><main className="container mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-12 lg:px-10">
    {selectedId ? <>
      {state.status === "loading" || detailState.status === "loading" ? <div className="cam-parchment-card rounded-xl p-6 text-muted-foreground">Preparing the learning record…</div> : null}
      {state.status === "error" && <div className="cam-parchment-card rounded-xl p-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-rose-800">Knowledge Base unavailable</p><p className="mt-3 text-muted-foreground">{state.message}</p></div>}
      {state.status === "ready" && !selectedIndexRecord && <div className="cam-parchment-card rounded-xl p-6"><p className="font-serif text-2xl text-foreground">Learning record not found</p><p className="mt-3 text-muted-foreground">The current VIGIL registry does not contain {selectedId}.</p><Link href="/observatory/knowledge-base" className="mt-4 inline-flex font-mono text-xs uppercase tracking-[0.12em] text-cam-gold">Return to Knowledge Base →</Link></div>}
      {detailRecord && <><KnowledgeDetail record={detailRecord} />{detailState.status === "error" && <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">The canonical LEARN detail could not be loaded, so this page is showing its published registry projection. {detailState.message}</p>}</>}
    </> : <>
      <header className="border-b border-border/70 pb-7">
        <div className="flex items-start gap-4"><div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-cam-gold"><BookOpen className="h-6 w-6" aria-hidden="true" /></div><div><p className="font-mono text-sm uppercase tracking-[0.2em] text-cam-gold">VIGIL Observatory</p><h1 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">Knowledge Base</h1></div></div>
        <p className="mt-4 max-w-4xl text-lg leading-relaxed text-muted-foreground">Completed evidence chains translated into reusable governance lessons. Search by case, failure taxonomy, application, vendor, or the principle that should not be forgotten.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Link href="/observatory" className="rounded-lg border border-border bg-card px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">Browse the VIGIL Ledger</Link></div>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside aria-label="Knowledge Base search and filters" className="cam-parchment-card rounded-2xl p-4 shadow-sm lg:sticky lg:top-20">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">Search the Knowledge Base</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Find a completed lesson by incident, failure family, application, vendor, principle, or VIGIL record ID.</p>
          </div>
          <label className="relative block"><span className="sr-only">Search lessons learned</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons…" className="w-full rounded-xl border border-input bg-background/70 py-3 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15" /></label>
          <div className="mt-5 space-y-4 border-t border-border/65 pt-5">
            <label className="block"><span className="report-label">Year</span><select value={year} onChange={(event) => setYear(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm"><option value="">All years</option>{filterOptions.years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="block"><span className="report-label">Failure family</span><select value={failureFamily} onChange={(event) => setFailureFamily(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm"><option value="">All failure families</option>{filterOptions.families.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="block"><span className="report-label">Application</span><select value={application} onChange={(event) => setApplication(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm"><option value="">All applications</option>{filterOptions.applications.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="block"><span className="report-label">Monitoring</span><select value={monitoring} onChange={(event) => setMonitoring(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm"><option value="">All monitoring states</option><option value="required">Monitoring ongoing</option><option value="not-required">No monitoring declared</option></select></label>
          </div>
          {(query || year || failureFamily || application || monitoring) && <button type="button" onClick={() => { setQuery(""); setYear(""); setFailureFamily(""); setApplication(""); setMonitoring(""); }} className="mt-5 w-full rounded-xl border border-cam-gold/35 bg-card px-3 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/55 hover:bg-background">Clear search and filters</button>}
        </aside>

        <section className="min-w-0" aria-label="Published VIGIL lessons">
          {state.status === "loading" && <div className="cam-parchment-card rounded-2xl p-6 text-muted-foreground">Loading published learning records…</div>}
          {state.status === "error" && <div className="cam-parchment-card rounded-2xl p-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-rose-800">Knowledge Base unavailable</p><p className="mt-3 text-muted-foreground">{state.message}</p></div>}
          {state.status === "ready" && <>
            {state.notice && <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{state.notice}</p>}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-4">
              <div><p className="font-mono text-xs uppercase tracking-[0.14em] text-cam-gold">Published lessons</p><p className="mt-1 text-sm text-muted-foreground">{filtered.length} lesson{filtered.length === 1 ? "" : "s"} in this view</p></div>
            </div>
            {grouped.length ? <div className="space-y-12">{grouped.map(([groupYear, groupRecords]) => <section key={groupYear} aria-labelledby={`knowledge-year-${groupYear}`}><div className="flex items-center gap-4"><h2 id={`knowledge-year-${groupYear}`} className="font-serif text-3xl text-foreground">{groupYear}</h2><div className="h-px flex-1 bg-border" /></div><div className="mt-5 space-y-6">{groupRecords.map((record) => <KnowledgeCard key={record.id} record={record} />)}</div></section>)}</div> : <div className="cam-parchment-card rounded-2xl p-6"><p className="font-serif text-2xl text-foreground">No published lessons match this view</p><p className="mt-3 text-muted-foreground">Clear one or more filters, or check again after a VIGIL evidence chain has been closed with a published LEARN record.</p></div>}
          </>}
        </section>
      </div>
    </>}
  </main></Shell>;
}
