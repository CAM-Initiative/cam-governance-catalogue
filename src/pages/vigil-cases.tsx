import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { loadVigilRegistryRecords, VIGIL_REGISTRY_SOURCE, type UnknownRecord } from "@/lib/vigilRegistry";
import { canonicalComparisonKey, normalizeRecords, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { matchesVigilSearch } from "@/lib/vigilPublicDisplay";

type PageState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; notice?: string }
  | { status: "error"; message: string };

type SortKey = "id" | "family" | "severity";
type SortDirection = "asc" | "desc";
type SortState = { key: SortKey; direction: SortDirection };

type FailureTypeCount = { key: string; label: string; count: number };

const PAGE_SIZE = 18;
const SEVERITY_ORDER: Record<string, number> = { S0: 0, S1: 1, S2: 2, S3: 3, S4: 4, SU: 5 };

function compactId(id: string) {
  return id.replace(/^VIGIL-\d{4}-/i, "");
}

function caseSummary(record: VigilIndexRecord) {
  return record.publicDisplay.failure?.definition
    ?? record.publicDisplay.finding
    ?? record.summary
    ?? "No public failure definition is currently available.";
}

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTaxonomyClassified(record: VigilIndexRecord) {
  // The Case Files table consumes the lean VIGIL registry projection, where the
  // native taxonomy mapping is published as taxonomy_classification_summary.
  const summary = isObject(record.raw.taxonomy_classification_summary)
    ? record.raw.taxonomy_classification_summary
    : undefined;
  const summaryStatus = typeof summary?.classification_status === "string"
    ? summary.classification_status.trim().toLowerCase()
    : "";
  const summaryClassId = typeof summary?.class_id === "string" ? summary.class_id.trim() : "";
  if (summaryStatus === "classified" || Boolean(summaryClassId)) return true;

  // Full FM detail can also reach this component in development/test fixtures.
  const full = isObject(record.raw.taxonomy_classification)
    ? record.raw.taxonomy_classification
    : undefined;
  const fullStatus = typeof full?.classification_status === "string"
    ? full.classification_status.trim().toLowerCase()
    : "";
  const primaryClass = isObject(full?.primary_class) ? full.primary_class : undefined;
  const fullClassId = typeof primaryClass?.class_id === "string" ? primaryClass.class_id.trim() : "";
  return fullStatus === "classified" || Boolean(fullClassId);
}

function failureTypeLabel(record: VigilIndexRecord) {
  return isTaxonomyClassified(record) ? "Classified" : "Not Classified";
}

function failureTypeCounts(records: VigilIndexRecord[]): FailureTypeCount[] {
  const counts = new Map<string, FailureTypeCount>();
  for (const record of records) {
    const label = failureTypeLabel(record);
    const key = canonicalComparisonKey(label);
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { key, label, count: 1 });
  }
  return [...counts.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

function severityRank(record: VigilIndexRecord) {
  return SEVERITY_ORDER[String(record.severity ?? "SU").trim().toUpperCase()] ?? 6;
}

function failureModeCases(records: VigilIndexRecord[]) {
  return records.filter((record) => record.record_type === "failure_mode");
}

function compareCases(a: VigilIndexRecord, b: VigilIndexRecord, sort: SortState) {
  let comparison = 0;
  if (sort.key === "severity") comparison = severityRank(a) - severityRank(b);
  else if (sort.key === "family") comparison = failureTypeLabel(a).localeCompare(failureTypeLabel(b), undefined, { sensitivity: "base" });
  else comparison = a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" });

  if (comparison === 0) comparison = a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" });
  return sort.direction === "asc" ? comparison : -comparison;
}

function values(records: VigilIndexRecord[], getter: (record: VigilIndexRecord) => string | undefined) {
  return [...new Set(records.map(getter).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

function CaseCell({ label, children }: { label: string; children: ReactNode }) {
  return <div className="vigil-case-table-cell"><span className="vigil-case-mobile-label">{label}</span>{children}</div>;
}

function SortHeading({ label, sortKey, sort, onSort }: { label: string; sortKey: SortKey; sort: SortState; onSort: (key: SortKey) => void }) {
  const active = sort.key === sortKey;
  return <button
    type="button"
    className={active ? "vigil-case-sort-heading is-active" : "vigil-case-sort-heading"}
    onClick={() => onSort(sortKey)}
    aria-label={`Sort by ${label}${active ? `, currently ${sort.direction === "asc" ? "ascending" : "descending"}` : ""}`}
  >
    <span>{label}</span>
    <span className="vigil-sort-indicator" aria-hidden="true">{active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span>
  </button>;
}

export default function VigilCases() {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "id", direction: "desc" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    loadVigilRegistryRecords()
      .then((result) => {
        if (cancelled) return;
        setState({ status: "ready", records: failureModeCases(normalizeRecords(result.records)), notice: result.message });
      })
      .catch((error) => !cancelled && setState({ status: "error", message: (error as Error).message }));
    return () => { cancelled = true; };
  }, []);

  const records = state.status === "ready" ? state.records : [];
  const families = useMemo(() => failureTypeCounts(records), [records]);
  const updated = useMemo(() => {
    const dates = values(records, (record) => record.record_last_updated ?? record.publicDisplay.dates.lastUpdated ?? record.date_recorded).sort();
    return dates.length ? dates[dates.length - 1] : undefined;
  }, [records]);

  const filtered = useMemo(() => records.filter((record) => {
    if (!matchesVigilSearch(record.searchText, search)) return false;
    if (family && canonicalComparisonKey(failureTypeLabel(record)) !== family) return false;
    return true;
  }), [family, records, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => compareCases(a, b, sort)), [filtered, sort]);

  useEffect(() => setPage(1), [search, family, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key ? (current.direction === "asc" ? "desc" : "asc") : key === "id" ? "desc" : "asc",
    }));
  }

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-library-page vigil-case-library-page">
        <div className="container mx-auto max-w-[1500px] px-4 py-7 sm:px-6 md:px-10 md:py-9">
          <section className="vigil-library-shell" aria-labelledby="case-files-heading">
            <header className="vigil-library-header">
              <div>
                <p className="vigil-library-kicker">VIGIL AI failure mode investigations</p>
                <h1 id="case-files-heading">Case Files</h1>
                <p className="vigil-library-description">Browse documented AI failure modes, newest first, then open an investigation through the six-stage Observation, Classification, Diagnosis, Repair, Learn and References model.</p>
              </div>
              {state.status === "ready" && (
                <div className="vigil-library-stats" aria-live="polite">
                  <span><strong>{records.length}</strong> case files</span>
                  <span><strong>{families.length}</strong> classification states</span>
                  {updated && <span>Updated <strong>{updated}</strong></span>}
                </div>
              )}
            </header>

            <section className="vigil-library-toolbar" aria-labelledby="case-search-heading">
              <h2 id="case-search-heading" className="sr-only">Search and filter Case Files</h2>
              <div className="vigil-search-row vigil-case-table-search">
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
                  <span>Classification status</span>
                  <select value={family} onChange={(event) => setFamily(event.target.value)}>
                    <option value="">All statuses ({records.length})</option>
                    {families.map((entry) => <option key={entry.key} value={entry.key}>{entry.label} ({entry.count})</option>)}
                  </select>
                </label>
              </div>
              <div className="vigil-result-summary">
                <span>{sorted.length} matching case {sorted.length === 1 ? "file" : "files"}</span>
                {(search || family) && <button type="button" onClick={() => { setSearch(""); setFamily(""); }}>Clear filters</button>}
              </div>
            </section>

            {state.status === "loading" && <div className="vigil-registry-notice">Loading Case Files from {VIGIL_REGISTRY_SOURCE.registry_index_url}…</div>}
            {state.status === "error" && <div className="vigil-registry-notice is-error">{state.message}</div>}
            {state.status === "ready" && state.notice && <div className="vigil-registry-notice">{state.notice}</div>}

            <section className="vigil-case-table" aria-label="AI failure mode Case Files">
              <div className="vigil-case-table-head">
                <SortHeading label="Failure Mode" sortKey="id" sort={sort} onSort={updateSort} />
                <SortHeading label="Classification" sortKey="family" sort={sort} onSort={updateSort} />
                <SortHeading label="Severity" sortKey="severity" sort={sort} onSort={updateSort} />
                <span></span>
              </div>
              <div className="vigil-case-table-body">
                {pageRecords.map((record) => {
                  const href = `/observatory/cases/${encodeURIComponent(record.id)}`;
                  return (
                    <article key={record.id} className="vigil-case-table-row">
                      <Link href={href} className="vigil-case-table-row-link" aria-label={`Open case file ${record.title}`}>
                        <div className="vigil-case-table-primary">
                          <span className="vigil-case-table-id" title={record.id}>{compactId(record.id)}</span>
                          <div className="vigil-case-table-copy">
                            <h2>{record.title}</h2>
                            <p>{caseSummary(record)}</p>
                          </div>
                        </div>
                        <CaseCell label="Classification"><span className="vigil-case-table-text">{failureTypeLabel(record)}</span></CaseCell>
                        <CaseCell label="Severity"><VigilStatusChip value={record.severity} /></CaseCell>
                        <span className="vigil-case-table-open" aria-hidden="true"><ChevronRight /></span>
                      </Link>
                    </article>
                  );
                })}
                {state.status === "ready" && sorted.length === 0 && <div className="vigil-empty-panel">No Case Files match those terms. Try a broader description or another classification status.</div>}
              </div>
            </section>

            {sorted.length > PAGE_SIZE && (
              <nav className="vigil-pagination" aria-label="Case File result pages">
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
