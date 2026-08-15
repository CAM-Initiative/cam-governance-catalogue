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

function compactFamily(value: string) {
  return value.replace(/\s+Failures$/i, "");
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  }), [records, search, family, severity, evidence, repair, lifecycle, system, priority]);

  useEffect(() => setPage(1), [search, family, severity, evidence, repair, lifecycle, system, priority]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(search || family || severity || evidence || repair || lifecycle || system || priority);

  const clearFilters = () => {
    setSearch("");
    setFamily("");
    setSeverity("");
    setEvidence("");
    setRepair("");
    setLifecycle("");
    setSystem("");
    setPriority("");
  };

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
      <main className="vigil-library-page">
        <div className="container mx-auto max-w-[1500px] px-4 py-7 sm:px-6 md:px-10 md:py-9">
          <section className="vigil-library-shell" aria-labelledby="failure-mode-library-heading">
            <header className="vigil-library-header">
              <div>
                <p className="vigil-library-kicker">VIGIL public failure taxonomy</p>
                <h1 id="failure-mode-library-heading">AI Failure Mode Library</h1>
                <p className="vigil-library-description">Find, understand and compare documented AI failure patterns before tracing their evidence and governance response.</p>
              </div>
              {state.status === "ready" && (
                <div className="vigil-library-stats" aria-live="polite">
                  <span><strong>{records.length}</strong> failure modes</span>
                  <span><strong>{families.length}</strong> families</span>
                  {updated && <span>Updated <strong>{updated}</strong></span>}
                </div>
              )}
            </header>

            <section className="vigil-library-toolbar" aria-labelledby="failure-mode-search-heading">
              <h2 id="failure-mode-search-heading" className="sr-only">Search and filter failure modes</h2>
              <div className="vigil-search-row vigil-search-row-v2">
                <label className="vigil-search-control">
                  <Search aria-hidden="true" />
                  <span className="sr-only">Describe the behaviour you’re seeing…</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Describe the behaviour you’re seeing…"
                  />
                  {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X /></button>}
                </label>

                <label className="vigil-family-select">
                  <span>Failure family</span>
                  <select value={family} onChange={(event) => setFamily(event.target.value)}>
                    <option value="">All families ({records.length})</option>
                    {families.map((entry) => <option key={entry.key} value={entry.key}>{compactFamily(entry.label)} ({entry.count})</option>)}
                  </select>
                </label>

                <button type="button" className={`vigil-filter-button ${filtersOpen ? "is-active" : ""}`} aria-expanded={filtersOpen} aria-controls="vigil-filter-panel" onClick={() => setFiltersOpen((open) => !open)}>
                  <SlidersHorizontal aria-hidden="true" /> Filters
                </button>
              </div>

              {filtersOpen && (
                <div id="vigil-filter-panel" className="vigil-filter-panel">
                  <div className="vigil-primary-filters vigil-primary-filters-v2">
                    <Filter label="Severity" value={severity} onChange={setSeverity} options={options.severity.map((value) => ({ value, label: titleizeValue(value) }))} />
                    <Filter label="Evidence" value={evidence} onChange={setEvidence} options={options.evidence.map((value) => ({ value, label: titleizeValue(value) }))} />
                    <Filter label="Status" value={lifecycle} onChange={setLifecycle} options={options.lifecycle.map((value) => ({ value, label: titleizeValue(value) }))} />
                    <button type="button" className="vigil-advanced-filter-toggle" aria-expanded={advanced} onClick={() => setAdvanced((open) => !open)}>
                      Advanced filters {advanced ? "−" : "+"}
                    </button>
                  </div>
                  {advanced && (
                    <div className="vigil-advanced-filters">
                      <Filter label="Repair status" value={repair} onChange={setRepair} options={options.repair.map((value) => ({ value, label: titleizeValue(value) }))} />
                      <Filter label="Observed system / vendor" value={system} onChange={setSystem} options={options.system.map((value) => ({ value, label: value }))} />
                      <Filter label="Audit priority" value={priority} onChange={setPriority} options={options.priority.map((value) => ({ value, label: value }))} />
                    </div>
                  )}
                </div>
              )}

              <div className="vigil-result-summary">
                <span>{filtered.length} matching failure {filtered.length === 1 ? "mode" : "modes"}</span>
                {hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}
              </div>
            </section>

            {state.status === "loading" && <div className="vigil-registry-notice">Loading failure modes from {VIGIL_REGISTRY_SOURCE.registry_index_url}…</div>}
            {state.status === "error" && <div className="vigil-registry-notice is-error">{state.message}</div>}
            {state.status === "ready" && state.notice && <div className="vigil-registry-notice">{state.notice}</div>}

            <section className="vigil-fm-table vigil-fm-table-v2" aria-label="Failure mode catalogue">
              <div className="vigil-fm-table-header" aria-hidden="true">
                <span>Failure Mode</span>
                <span>Severity</span>
                <span>Evidence</span>
                <span>Status</span>
                <span></span>
              </div>
              <div className="vigil-fm-table-body">
                {pageRecords.map((record) => <FailureModeCard key={record.id} record={record} />)}
                {state.status === "ready" && filtered.length === 0 && <div className="vigil-empty-panel">No failure modes match those terms. Try a broader description or clear a filter.</div>}
              </div>
            </section>

            {filtered.length > PAGE_SIZE && (
              <nav className="vigil-pagination" aria-label="Failure mode result pages">
                <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                <span>Page {currentPage} of {pageCount}</span>
                <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
              </nav>
            )}
          </section>
        </div>
      </main>
    </Shell>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="vigil-filter-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
