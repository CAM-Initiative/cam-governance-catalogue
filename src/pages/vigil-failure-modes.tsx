import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { FailureModeCard } from "@/components/vigil/FailureModeCard";
import { FailureModeDetail } from "@/components/vigil/FailureModeDetail";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilRecordDetail, loadVigilRegistryRecords, VIGIL_REGISTRY_SOURCE, type UnknownRecord } from "@/lib/vigilRegistry";
import { canonicalComparisonKey, deriveFailureFamilyCounts, normalizeFailureFamilyLabel, normalizeRecords, normalizeVigilRecord, publicRepairStateLabel, titleizeValue, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { matchesVigilSearch } from "@/lib/vigilPublicDisplay";

type PageState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; notice?: string }
  | { status: "error"; message: string };

type DetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; record: VigilIndexRecord }
  | { status: "error"; message: string };

const PAGE_SIZE = 18;

function mergeDetail(indexRecord: VigilIndexRecord, detail: UnknownRecord) {
  return normalizeVigilRecord({
    ...detail,
    path: typeof detail.path === "string" ? detail.path : indexRecord.path,
    raw_url: typeof detail.raw_url === "string" ? detail.raw_url : indexRecord.raw_url,
    github_blob_url: typeof detail.github_blob_url === "string" ? detail.github_blob_url : indexRecord.github_blob_url,
    source_registry: typeof detail.source_registry === "string" ? detail.source_registry : indexRecord.source_registry,
  });
}

function values(records: VigilIndexRecord[], getter: (record: VigilIndexRecord) => string | undefined) {
  return [...new Set(records.map(getter).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

export default function VigilFailureModes() {
  const [, params] = useRoute("/observatory/failure-modes/:recordId");
  const [, aliasParams] = useRoute("/vigil/:recordId");
  const recordId = decodeURIComponent(params?.recordId ?? aliasParams?.recordId ?? "");
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [detailState, setDetailState] = useState<DetailState>({ status: "idle" });
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("");
  const [severity, setSeverity] = useState("");
  const [evidence, setEvidence] = useState("");
  const [repair, setRepair] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [system, setSystem] = useState("");
  const [priority, setPriority] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    loadVigilRegistryRecords()
      .then((result) => {
        if (cancelled) return;
        const records = normalizeRecords(result.records).filter((record) => record.record_type === "failure_mode");
        setState({ status: "ready", records, notice: result.message });
      })
      .catch((error) => !cancelled && setState({ status: "error", message: (error as Error).message }));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!recordId || state.status !== "ready") {
      setDetailState({ status: "idle" });
      return;
    }
    const indexRecord = state.records.find((record) => record.id.toLocaleUpperCase() === recordId.toLocaleUpperCase());
    if (!indexRecord) {
      setDetailState({ status: "error", message: `Failure mode ${recordId} is not present in the published VIGIL registry.` });
      return;
    }
    let cancelled = false;
    setDetailState({ status: "loading" });
    loadVigilRecordDetail(indexRecord.raw)
      .then((detail) => !cancelled && setDetailState({ status: "ready", record: mergeDetail(indexRecord, detail) }))
      .catch((error) => !cancelled && setDetailState({ status: "error", message: (error as Error).message }));
    return () => { cancelled = true; };
  }, [recordId, state]);

  const records = state.status === "ready" ? state.records : [];
  const families = useMemo(() => deriveFailureFamilyCounts(records), [records]);
  const updated = useMemo(() => {
    const dates = values(records, (record) => record.record_last_updated ?? record.publicDisplay.dates.lastUpdated ?? record.date_recorded).sort();
    return dates.length ? dates[dates.length - 1] : undefined;
  }, [records]);
  const options = useMemo(() => ({
    severity: values(records, (record) => record.severity),
    evidence: values(records, (record) => record.evidence_confidence),
    repair: values(records, (record) => publicRepairStateLabel(record.repair_status, record.publicDisplay.repairState)),
    lifecycle: values(records, (record) => record.publicDisplay.lifecycleLabel ?? record.record_state),
    system: values(records, (record) => record.observed_vendor ?? record.platform_label),
    priority: values(records, (record) => record.triage_priority),
  }), [records]);

  const filtered = useMemo(() => records.filter((record) => {
    if (!matchesVigilSearch(record.searchText, search)) return false;
    if (family && canonicalComparisonKey(normalizeFailureFamilyLabel(record.failure_family)) !== family) return false;
    if (severity && record.severity !== severity) return false;
    if (evidence && record.evidence_confidence !== evidence) return false;
    if (repair && publicRepairStateLabel(record.repair_status, record.publicDisplay.repairState) !== repair) return false;
    if (lifecycle && (record.publicDisplay.lifecycleLabel ?? record.record_state) !== lifecycle) return false;
    if (system && (record.observed_vendor ?? record.platform_label) !== system) return false;
    if (priority && record.triage_priority !== priority) return false;
    return true;
  }), [records, search, family, severity, evidence, repair, lifecycle, system, priority, families]);

  useEffect(() => setPage(1), [search, family, severity, evidence, repair, lifecycle, system, priority]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(search || family || severity || evidence || repair || lifecycle || system || priority);

  if (recordId) {
    return (
      <Shell>
        <VigilObservatoryNav />
        {state.status === "loading" || detailState.status === "loading" || detailState.status === "idle"
          ? <div className="container mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground sm:px-6 md:px-10">Loading canonical failure mode…</div>
          : state.status === "error"
            ? <div className="container mx-auto max-w-6xl px-4 py-16 text-sm text-destructive sm:px-6 md:px-10">{state.message}</div>
            : detailState.status === "error"
              ? <div className="container mx-auto max-w-6xl px-4 py-16 text-sm text-destructive sm:px-6 md:px-10">{detailState.message}</div>
              : <FailureModeDetail record={detailState.record} />}
      </Shell>
    );
  }

  return (
    <Shell>
      <VigilObservatoryNav />
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10 md:py-14">
        <header className="max-w-4xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Understand the pattern</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground sm:text-5xl">AI Failure Mode Library</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">Find, understand and compare documented AI failure patterns before tracing their evidence and governance response.</p>
          {state.status === "ready" && (
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground" aria-live="polite">
              {records.length} documented failure modes · {families.length} families{updated ? ` · updated ${updated}` : ""}
            </p>
          )}
        </header>

        <section className="mt-9 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6" aria-labelledby="failure-mode-search-heading">
          <h2 id="failure-mode-search-heading" className="sr-only">Search and filter failure modes</h2>
          <label className="block">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Describe the behaviour you’re seeing…</span>
            <span className="mt-2 flex items-center gap-3 rounded-xl border border-input bg-background px-4 focus-within:border-primary/55 focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground/70"
                placeholder="e.g. manipulated a user, bypassed a control, lost context…"
              />
              {search && <button type="button" onClick={() => setSearch("")} className="rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search"><X className="h-4 w-4" /></button>}
            </span>
          </label>

          {families.length > 0 && (
            <nav className="mt-5" aria-label="Browse failure families">
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Failure families</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={!family} onClick={() => setFamily("")} className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!family ? "border-primary/55 bg-[hsl(var(--vigil-nav-active))] text-[hsl(var(--cam-corpus-selected-foreground))]" : "border-border bg-background text-muted-foreground hover:border-primary/35 hover:text-foreground"}`}>All {records.length}</button>
                {families.map((entry) => (
                  <button key={entry.key} type="button" aria-pressed={family === entry.key} onClick={() => setFamily(family === entry.key ? "" : entry.key)} className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${family === entry.key ? "border-primary/55 bg-[hsl(var(--vigil-nav-active))] text-[hsl(var(--cam-corpus-selected-foreground))]" : "border-border bg-background text-muted-foreground hover:border-primary/35 hover:text-foreground"}`}>
                    {entry.label} <span aria-label={`${entry.count} failure modes`}>{entry.count}</span>
                  </button>
                ))}
              </div>
            </nav>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Filter label="Failure family" value={family} onChange={setFamily} options={families.map((entry) => ({ value: entry.key, label: `${entry.label} (${entry.count})` }))} />
            <Filter label="Severity" value={severity} onChange={setSeverity} options={options.severity.map((value) => ({ value, label: titleizeValue(value) }))} />
            <Filter label="Evidence / confidence" value={evidence} onChange={setEvidence} options={options.evidence.map((value) => ({ value, label: titleizeValue(value) }))} />
            <Filter label="Repair status" value={repair} onChange={setRepair} options={options.repair.map((value) => ({ value, label: titleizeValue(value) }))} />
          </div>

          <button type="button" className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.11em] text-primary" aria-expanded={advanced} onClick={() => setAdvanced((open) => !open)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Advanced filters {advanced ? "−" : "+"}
          </button>
          {advanced && (
            <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <Filter label="Lifecycle state" value={lifecycle} onChange={setLifecycle} options={options.lifecycle.map((value) => ({ value, label: titleizeValue(value) }))} />
              <Filter label="Observed system / vendor" value={system} onChange={setSystem} options={options.system.map((value) => ({ value, label: value }))} />
              <Filter label="Audit priority" value={priority} onChange={setPriority} options={options.priority.map((value) => ({ value, label: value }))} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">{filtered.length} matching failure {filtered.length === 1 ? "mode" : "modes"}</p>
            {hasFilters && <button type="button" className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary hover:underline" onClick={() => { setSearch(""); setFamily(""); setSeverity(""); setEvidence(""); setRepair(""); setLifecycle(""); setSystem(""); setPriority(""); }}>Clear all filters</button>}
          </div>
        </section>

        {state.status === "loading" && <div className="mt-6 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Loading failure modes from {VIGIL_REGISTRY_SOURCE.registry_index_url}…</div>}
        {state.status === "error" && <div className="mt-6 rounded-xl border border-destructive/40 bg-card p-5 text-sm text-destructive">{state.message}</div>}
        {state.status === "ready" && state.notice && <div className="mt-6 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{state.notice}</div>}

        <div className="mt-7 grid gap-4">
          {pageRecords.map((record) => <FailureModeCard key={record.id} record={record} />)}
          {state.status === "ready" && filtered.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No failure modes match those terms. Try a broader description or clear a filter.</div>}
        </div>

        {filtered.length > PAGE_SIZE && (
          <nav className="mt-7 flex items-center justify-center gap-3" aria-label="Failure mode result pages">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] disabled:opacity-40">Previous</button>
            <span className="font-mono text-xs text-muted-foreground">Page {currentPage} of {pageCount}</span>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] disabled:opacity-40">Next</button>
          </nav>
        )}
      </div>
    </Shell>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <option value="">All</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
