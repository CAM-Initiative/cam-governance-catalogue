import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { loadVigilIncidentRecords, VIGIL_INCIDENT_REGISTRY_URL } from "@/lib/vigilRegistry";
import { canonicalComparisonKey, normalizeRecords, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { matchesVigilSearch } from "@/lib/vigilPublicDisplay";
import { taxonomyFailureTypeLabel } from "@/lib/vigilTaxonomyClassification";

type PageState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; notice?: string }
  | { status: "error"; message: string };

type SortKey = "id" | "classification" | "severity";
type SortDirection = "asc" | "desc";
type SortState = { key: SortKey; direction: SortDirection };

type ClassificationStatusCount = { key: string; label: string; count: number };
type SeverityCount = { key: string; label: string; count: number };

const PAGE_SIZE = 18;
const SEVERITY_ORDER: Record<string, number> = { S1: 1, S2: 2, S3: 3, S4: 4, S5: 5, SU: 6 };

function compactId(id: string) {
  return id.replace(/^VIGIL-(?:\d{4}-)?/i, "");
}

function caseSummary(record: VigilIndexRecord) {
  return record.summary
    ?? record.publicDisplay.finding
    ?? "No public Incident summary is currently available.";
}

function classificationStatusLabel(record: VigilIndexRecord) {
  return taxonomyFailureTypeLabel(record.raw);
}

function classificationStatusCounts(records: VigilIndexRecord[]): ClassificationStatusCount[] {
  const counts = new Map<string, ClassificationStatusCount>();
  for (const record of records) {
    const label = classificationStatusLabel(record);
    const key = canonicalComparisonKey(label);
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { key, label, count: 1 });
  }
  return [...counts.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

function severityCode(record: VigilIndexRecord) {
  return String(record.severity ?? "SU").trim().toUpperCase();
}

function severityLabel(code: string) {
  const labels: Record<string, string> = {
    S1: "S1 · Minimal / no downstream harm",
    S2: "S2 · Low",
    S3: "S3 · Moderate",
    S4: "S4 · High",
    S5: "S5 · Catastrophic / critical",
    SU: "SU · Unassessed",
  };
  return labels[code] ?? code;
}

function severityCounts(records: VigilIndexRecord[]): SeverityCount[] {
  const counts = new Map<string, SeverityCount>();
  for (const record of records) {
    const key = severityCode(record);
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { key, label: severityLabel(key), count: 1 });
  }
  return [...counts.values()].sort((a, b) => (SEVERITY_ORDER[a.key] ?? 99) - (SEVERITY_ORDER[b.key] ?? 99));
}

function severityRank(record: VigilIndexRecord) {
  return SEVERITY_ORDER[severityCode(record)] ?? 6;
}

function incidentCases(records: VigilIndexRecord[]) {
  return records.filter((record) => record.record_type === "incident");
}

function compareCases(a: VigilIndexRecord, b: VigilIndexRecord, sort: SortState) {
  let comparison = 0;
  if (sort.key === "severity") comparison = severityRank(a) - severityRank(b);
  else if (sort.key === "classification") comparison = classificationStatusLabel(a).localeCompare(classificationStatusLabel(b), undefined, { sensitivity: "base" });
  else comparison = a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" });

  if (comparison === 0) comparison = a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" });
  return sort.direction === "asc" ? comparison : -comparison;
}

function values(records: VigilIndexRecord[], getter: (record: VigilIndexRecord) => string | undefined) {
  return [...new Set(records.map(getter).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

type PaginationToken = number | "start-ellipsis" | "end-ellipsis";

function paginationTokens(currentPage: number, pageCount: number): PaginationToken[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

  const pages = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 4) [2, 3, 4, 5].forEach((pageNumber) => pages.add(pageNumber));
  if (currentPage >= pageCount - 3) [pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1].forEach((pageNumber) => pages.add(pageNumber));

  const visible = [...pages].filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount).sort((a, b) => a - b);
  const tokens: PaginationToken[] = [];
  visible.forEach((pageNumber, index) => {
    const previous = visible[index - 1];
    if (previous && pageNumber - previous > 1) tokens.push(previous === 1 ? "start-ellipsis" : "end-ellipsis");
    tokens.push(pageNumber);
  });
  return tokens;
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
  const [classification, setClassification] = useState("");
  const [severity, setSeverity] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "id", direction: "desc" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    loadVigilIncidentRecords()
      .then((result) => {
        if (cancelled) return;
        setState({ status: "ready", records: incidentCases(normalizeRecords(result.records)), notice: result.message });
      })
      .catch((error) => !cancelled && setState({ status: "error", message: (error as Error).message }));
    return () => { cancelled = true; };
  }, []);

  const records = state.status === "ready" ? state.records : [];
  const classificationStates = useMemo(() => classificationStatusCounts(records), [records]);
  const severityStates = useMemo(() => severityCounts(records), [records]);
  const updated = useMemo(() => {
    const dates = values(records, (record) => record.record_last_updated ?? record.publicDisplay.dates.lastUpdated ?? record.date_recorded).sort();
    return dates.length ? dates[dates.length - 1] : undefined;
  }, [records]);

  const filtered = useMemo(() => records.filter((record) => {
    if (!matchesVigilSearch(record.searchText, search)) return false;
    if (classification && canonicalComparisonKey(classificationStatusLabel(record)) !== classification) return false;
    if (severity && severityCode(record) !== severity) return false;
    return true;
  }), [classification, records, search, severity]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => compareCases(a, b, sort)), [filtered, sort]);

  useEffect(() => setPage(1), [search, classification, severity, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pagination = useMemo(() => paginationTokens(currentPage, pageCount), [currentPage, pageCount]);

  function goToPage(targetPage: number) {
    const boundedPage = Math.max(1, Math.min(pageCount, targetPage));
    if (boundedPage === currentPage) return;
    setPage(boundedPage);
    window.requestAnimationFrame(() => {
      document.querySelector(".vigil-case-table")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

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
                <p className="vigil-library-kicker">VIGIL Observatory Incident investigations</p>
                <h1 id="case-files-heading">Case Files</h1>
              </div>
              {state.status === "ready" && (
                <div className="vigil-library-stats" aria-live="polite">
                  <span><strong>{records.length}</strong> case files</span>
                  <span><strong>{classificationStates.length}</strong> classification states</span>
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
                  <span>Classification</span>
                  <select value={classification} onChange={(event) => setClassification(event.target.value)}>
                    <option value="">All classifications ({records.length})</option>
                    {classificationStates.map((entry) => <option key={entry.key} value={entry.key}>{entry.label} ({entry.count})</option>)}
                  </select>
                </label>

                <label className="vigil-family-select">
                  <span>Severity</span>
                  <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
                    <option value="">All severities ({records.length})</option>
                    {severityStates.map((entry) => <option key={entry.key} value={entry.key}>{entry.label} ({entry.count})</option>)}
                  </select>
                </label>
              </div>
              <div className="vigil-result-summary">
                <span>{sorted.length} matching case {sorted.length === 1 ? "file" : "files"}</span>
                {(search || classification || severity) && <button type="button" onClick={() => { setSearch(""); setClassification(""); setSeverity(""); }}>Clear filters</button>}
              </div>
            </section>

            {state.status === "loading" && <div className="vigil-registry-notice">Loading Case Files from {VIGIL_INCIDENT_REGISTRY_URL}…</div>}
            {state.status === "error" && <div className="vigil-registry-notice is-error">{state.message}</div>}
            {state.status === "ready" && state.notice && <div className="vigil-registry-notice">{state.notice}</div>}

            <section className="vigil-case-table" aria-label="AI Incident Case Files">
              <div className="vigil-case-table-head">
                <SortHeading label="Incident" sortKey="id" sort={sort} onSort={updateSort} />
                <SortHeading label="Classification" sortKey="classification" sort={sort} onSort={updateSort} />
                <SortHeading label="Severity" sortKey="severity" sort={sort} onSort={updateSort} />
                <span></span>
              </div>
              <div className="vigil-case-table-body">
                {pageRecords.map((record) => {
                  const href = `/observatory/cases/${encodeURIComponent(record.id)}`;
                  const classificationLabel = classificationStatusLabel(record);
                  const exemplar = classificationLabel === "Exemplar";
                  return (
                    <article key={record.id} className={`vigil-case-table-row${exemplar ? " is-exemplar" : ""}`}>
                      <Link href={href} className="vigil-case-table-row-link" aria-label={`Open case file ${record.title}`}>
                        <div className="vigil-case-table-primary">
                          <span className="vigil-case-table-id" title={record.id}>{compactId(record.id)}</span>
                          <div className="vigil-case-table-copy">
                            <h2>{record.title}</h2>
                            <p>{caseSummary(record)}</p>
                          </div>
                        </div>
                        <CaseCell label="Classification"><span className="vigil-case-table-text">{classificationLabel}</span></CaseCell>
                        <CaseCell label="Severity"><VigilStatusChip value={record.severity} /></CaseCell>
                        <span className="vigil-case-table-open" aria-hidden="true"><ChevronRight /></span>
                      </Link>
                    </article>
                  );
                })}
                {state.status === "ready" && sorted.length === 0 && <div className="vigil-empty-panel">No Case Files match those terms. Try a broader description or another classification.</div>}
              </div>
            </section>

            {sorted.length > PAGE_SIZE && (
              <nav className="vigil-pagination" aria-label="Case File result pages">
                <span className="sr-only">Page {currentPage} of {pageCount}</span>
                <button
                  type="button"
                  className="vigil-pagination-arrow is-boundary"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(1)}
                  aria-label="First page"
                  title="First page"
                ><ChevronsLeft aria-hidden="true" /></button>
                <button
                  type="button"
                  className="vigil-pagination-arrow"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  aria-label="Previous page"
                  title="Previous page"
                ><ChevronLeft aria-hidden="true" /></button>
                <div className="vigil-pagination-pages">
                  {pagination.map((token) => typeof token === "number"
                    ? <button
                        key={token}
                        type="button"
                        className={token === currentPage ? "vigil-pagination-page is-current" : "vigil-pagination-page"}
                        onClick={() => goToPage(token)}
                        aria-current={token === currentPage ? "page" : undefined}
                        aria-label={token === currentPage ? `Page ${token}, current page` : `Go to page ${token}`}
                      >{token}</button>
                    : <span key={token} className="vigil-pagination-ellipsis" aria-hidden="true">…</span>)}
                </div>
                <button
                  type="button"
                  className="vigil-pagination-arrow"
                  disabled={currentPage === pageCount}
                  onClick={() => goToPage(currentPage + 1)}
                  aria-label="Next page"
                  title="Next page"
                ><ChevronRight aria-hidden="true" /></button>
                <button
                  type="button"
                  className="vigil-pagination-arrow is-boundary"
                  disabled={currentPage === pageCount}
                  onClick={() => goToPage(pageCount)}
                  aria-label="Last page"
                  title="Last page"
                ><ChevronsRight aria-hidden="true" /></button>
              </nav>
            )}
          </section>
        </div>
      </main>
    </Shell>
  );
}
