import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilObservatoryMasthead } from "@/components/vigil/VigilObservatoryMasthead";
import { VIGIL_MASTHEAD_ARTWORK } from "@/lib/vigilMastheadArtwork";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { loadVigilIncidentRecords, VIGIL_INCIDENT_REGISTRY_URL } from "@/lib/vigilRegistry";
import { canonicalComparisonKey, normalizeRecords, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { matchesVigilSearch } from "@/lib/vigilPublicDisplay";
import { hasStaticPublicationFallback, retireStaticPublicationFallback } from "@/lib/staticPublicationFallback";
import { taxonomyAlignmentOutcomeLabel, taxonomyFailureTypeLabel } from "@/lib/vigilTaxonomyClassification";
import VigilCasesDashboard, { countryDisplayName, countryFromJurisdiction } from "@/components/vigil/VigilCasesDashboard";
import { failureClassIds } from "@/lib/vigilDashboardMetrics.mjs";
import { getSelectedVigilBranch, vigilRawUrl, VIGIL_DEFAULT_BRANCH } from "@/lib/vigilBranchSource";
import { countryLookupFromProjection, matchesSelectedCountries, toggleSelectedCountry } from "@/lib/vigilDashboardGeography.mjs";
import { matchesClassificationSelection, toggleClassificationSelection } from "@/lib/vigilClassificationFilter.mjs";
import { INDEX_FACETS, NOT_INDEXED, facetOptionLabel, indexFacetOptions, matchesIndexFacets, toggleIndexFacetSelection } from "@/lib/vigilIndexFacets.mjs";
import { hasEvidencedHarmType, reconcileHarmSidecar } from "@/lib/vigilHarmDimensions.mjs";
import { harmDimensions } from "@/lib/vigilHarmReference";

type PageState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; notice?: string }
  | { status: "error"; message: string };

type SortKey = "id" | "classification" | "severity";
type SortDirection = "asc" | "desc";
type SortState = { key: SortKey; direction: SortDirection };

type ClassificationStatusCount = { key: string; label: string; count: number };

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
    const status = classificationStatusLabel(record);
    const label = taxonomyAlignmentOutcomeLabel(record.raw);
    const key = canonicalComparisonKey(status);
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

// The indexed metadata facets share the Classification disclosure affordance.
// "All" clears that one facet; its checked state does not imply every individual
// value was explicitly selected. Counts describe the loaded complete corpus.
function IndexFacet({ id, title, options, total, selected, onToggle, onClear }: {
  id: string; title: string; options: ClassificationStatusCount[]; total: number;
  selected: string[]; onToggle: (id: string, value: string) => void; onClear: (id: string) => void;
}) {
  const isVendor = id === "vendor";
  const [vendorQuery, setVendorQuery] = useState("");
  const [vendorExpanded, setVendorExpanded] = useState(false);
  const vendorListRef = useRef<HTMLDivElement | null>(null);
  const [vendorScroll, setVendorScroll] = useState({ up: false, down: false });
  const refreshVendorScroll = () => {
    const element = vendorListRef.current;
    if (!element) return;
    setVendorScroll({
      up: element.scrollTop > 2,
      down: element.scrollTop + element.clientHeight < element.scrollHeight - 2,
    });
  };
  const query = vendorQuery.trim().toLocaleLowerCase();
  const matchingOptions = isVendor
    ? options.filter(option => !query || option.label.toLocaleLowerCase().includes(query))
      .sort((a,b) => Number(selected.includes(b.key)) - Number(selected.includes(a.key)))
    : options;
  useEffect(() => {
    if (!isVendor || !vendorListRef.current) return;
    vendorListRef.current.scrollTop = 0;
    // Re-evaluate after the browser lays out the clipped option list.
    const frame = window.requestAnimationFrame(refreshVendorScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [isVendor, vendorQuery, vendorExpanded, matchingOptions.length, options.length]);
  const scrollVendors = (direction: -1 | 1) => {
    const element = vendorListRef.current;
    if (!element) return;
    element.scrollBy({ top: direction * Math.max(115, Math.floor(element.clientHeight * .75)), behavior: "smooth" });
  };
  const facetClass = [
    "vigil-dashboard-index-facet",
    isVendor ? "is-vendor" : "",
    vendorExpanded ? "is-expanded" : "",
    query ? "has-query" : "",
  ].filter(Boolean).join(" ");
  return <details className={facetClass} aria-label={`${title} filters`}>
    <summary className="vigil-dashboard-facet-heading">
      <span>{title}</span>
      <span className="vigil-dashboard-facet-state">
        {selected.length > 0 && <span>{selected.length} selected</span>}
        <ChevronDown size={15} aria-hidden="true"/>
      </span>
    </summary>
    {isVendor && <label className="vigil-dashboard-vendor-search">
      <Search size={15} aria-hidden="true"/>
      <span className="sr-only">Find a platform or vendor</span>
      <input type="search" value={vendorQuery} onChange={event => setVendorQuery(event.target.value)}
        placeholder="Find a vendor…" aria-label="Search platform and vendor options"/>
    </label>}
    <div className="vigil-dashboard-facet-options" role="group" aria-label={`Filter by ${title}`}
      ref={isVendor ? vendorListRef : undefined} onScroll={isVendor ? refreshVendorScroll : undefined}
      tabIndex={isVendor ? 0 : undefined}>
      <label className="vigil-dashboard-facet-option">
        <input type="checkbox" checked={selected.length === 0} onChange={() => onClear(id)}/>
        <span className="vigil-dashboard-facet-option-name">All {title.toLowerCase()}</span>
        <span className="vigil-dashboard-facet-count">{total}</span>
      </label>
      {matchingOptions.map(option => <label
        className={`vigil-dashboard-facet-option${selected.includes(option.key) ? " is-selected" : ""}`} key={option.key}>
        <input type="checkbox" checked={selected.includes(option.key)}
          onChange={() => onToggle(id, option.key)}/>
        <span className="vigil-dashboard-facet-option-name">{option.label}</span>
        <span className="vigil-dashboard-facet-count">{option.count}</span>
      </label>)}
      {isVendor && matchingOptions.length === 0 && <p className="vigil-dashboard-facet-no-results">No matching vendors.</p>}
    </div>
    {isVendor && options.length > 6 && <div className="vigil-dashboard-vendor-controls">
      <span className="vigil-dashboard-vendor-scroll-caption" aria-live="polite">
        {matchingOptions.length} {query ? "matching " : ""}vendors · scroll list
      </span>
      <div className="vigil-dashboard-vendor-scroll-buttons">
        <button type="button" onClick={() => scrollVendors(-1)} disabled={!vendorScroll.up}
          aria-label="Scroll vendor list up" title="Previous vendors"><ChevronUp size={17} aria-hidden="true"/></button>
        <button type="button" onClick={() => scrollVendors(1)} disabled={!vendorScroll.down}
          aria-label="Scroll vendor list down" title="More vendors"><ChevronDown size={17} aria-hidden="true"/></button>
      </div>
    </div>}
    {isVendor && !query && options.length > 6 && <button type="button"
      className="vigil-dashboard-vendor-show-more" aria-expanded={vendorExpanded}
      onClick={() => setVendorExpanded(value => !value)}>
      {vendorExpanded ? "Show fewer vendors" : `Show all ${options.length} vendors`}
    </button>}
  </details>;
}

export default function VigilCases() {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [search, setSearch] = useState("");
  // Multiple classification outcomes combine as OR, while search, country,
  // severity and taxonomy filters remain intersections with that set.
  const [classifications, setClassifications] = useState<string[]>([]);
  const toggleClassification = (key: string) => {
    setClassifications(current => toggleClassificationSelection(current, key));
  };
  const [severity, setSeverity] = useState("");
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const toggleJurisdiction = (code: string) => setJurisdictions(current => toggleSelectedCountry(current, code));
  const [failureClass, setFailureClass] = useState("");
  const [harmType, setHarmType] = useState("");
  const [harmProjection, setHarmProjection] = useState<ReturnType<typeof reconcileHarmSidecar> | null>(null);
  const [harmLoadNote, setHarmLoadNote] = useState("Loading assessed harm dimensions…");
  const [indexFacets, setIndexFacets] = useState<Record<string, string[]>>({});
  const toggleIndexFacet = (id: string, key: string) =>
    setIndexFacets(current => toggleIndexFacetSelection(current, id, key));
  const clearIndexFacet = (id: string) =>
    setIndexFacets(current => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  // All filters can be cleared in the left rail; chips remove individual selections.
  const clearFilters = () => {
    setSearch("");
    setClassifications([]);
    setSeverity("");
    setHarmType("");
    setJurisdictions([]);
    setFailureClass("");
    setIndexFacets({});
  };
  const [countryByCase, setCountryByCase] = useState<Map<string, string[]>>(new Map());
  const [geographyAvailable, setGeographyAvailable] = useState(false);
  const [geographyNote, setGeographyNote] = useState("Geographic index is loading.");
  const [sort, setSort] = useState<SortState>({ key: "id", direction: "asc" });
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

  useEffect(() => {
    if (state.status !== "ready") return;
    let active = true;
    const records = state.records;
    const selectedBranch = getSelectedVigilBranch();

    async function loadGeography() {
      let projection: unknown;
      let legacy = false;
      try {
        const url = await vigilRawUrl("vigil/VIGIL.Incidents.Jurisdictions.Index.json");
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("Current VIGIL branch has no published geography index");
        projection = await response.json();
      } catch {
        // A working VIGIL branch must NEVER silently borrow the default
        // branch's cached geography or manufacture a physical location.
        if (selectedBranch !== VIGIL_DEFAULT_BRANCH) {
          if (active) {
            setCountryByCase(new Map());
            setGeographyAvailable(false);
            setGeographyNote("This VIGIL working branch has no matching geography index. Country pins are unavailable; Case Files remain accessible.");
          }
          return;
        }
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}data/vigil-dashboard-jurisdictions.json`);
          if (!response.ok) throw new Error("Cached jurisdiction projection is unavailable");
          projection = await response.json();
          legacy = true;
        } catch {
          if (active) {
            setCountryByCase(new Map());
            setGeographyAvailable(false);
            setGeographyNote("No current jurisdiction projection is available. Case Files remain accessible.");
          }
          return;
        }
      }
      if (!active) return;
      const countryMap = countryLookupFromProjection(
        records, projection,
        (value: unknown) => countryFromJurisdiction(typeof value === "string" ? value : "")
      );
      setCountryByCase(countryMap);
      setGeographyAvailable(true);
      setGeographyNote(legacy
        ? "Legacy primary-jurisdiction descriptions (not independently verified event locations)."
        : "VIGIL source-field-derived country associations; not verified physical occurrence locations. Unlocated, multi-country and global cases remain in the library.");
    }
    void loadGeography();
    return () => { active = false; };
  }, [state]);

  useEffect(() => {
    if (state.status !== "ready") return;
    let active = true;
    const records = state.records;
    async function loadHarmProjection() {
      const selectedBranch = getSelectedVigilBranch();
      let data: unknown;
      let cached = false;
      try {
        const url = await vigilRawUrl("vigil/VIGIL.Harm.Dimensions.Index.json");
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("VIGIL harm index unavailable");
        data = await response.json();
      } catch {
        if (selectedBranch !== VIGIL_DEFAULT_BRANCH) {
          if (active) { setHarmProjection(null); setHarmLoadNote("No harm index on this selected VIGIL branch."); }
          return;
        }
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}data/vigil-harm-dimensions.json`);
          if (!response.ok) throw new Error("Cached harm index unavailable");
          data = await response.json();
          cached = true;
        } catch {
          if (active) { setHarmProjection(null); setHarmLoadNote("Assessed harm dimensions are unavailable."); }
          return;
        }
      }
      try {
        const result = reconcileHarmSidecar(data, records);
        if (!active) return;
        setHarmProjection(result);
        setHarmLoadNote(result.partial
          ? "Partial coverage: Incident record versions differ or index counts have changed."
          : cached ? "Cached deterministic harm data; the upstream index is not yet on main." : "");
      } catch {
        if (active) { setHarmProjection(null); setHarmLoadNote("Harm index failed version/structure validation."); }
      }
    }
    void loadHarmProjection();
    return () => { active = false; };
  }, [state]);

  const records = state.status === "ready" ? state.records : [];
  const classificationStates = useMemo(() => classificationStatusCounts(records), [records]);
  const indexedFacetCatalog = useMemo(() => INDEX_FACETS.map(facet => ({
    ...facet,
    options: indexFacetOptions(records, facet.id),
  })).filter(facet => facet.options.some(option => option.key !== NOT_INDEXED)), [records]);
  const updated = useMemo(() => {
    const dates = values(records, (record) => record.record_last_updated ?? record.publicDisplay.dates.lastUpdated ?? record.date_recorded).sort();
    return dates.length ? dates[dates.length - 1] : undefined;
  }, [records]);

  // Independent instruments exclude only the filter they themselves control.
  // Keep the taxonomy ranking's cohort independent of the selected taxonomy class:
  // selecting a failure must not promote it to first place or replace the top six.
  const rankingBaseCases = useMemo(() => records.filter((record) => {
    if (!matchesVigilSearch(record.searchText, search)) return false;
    if (!matchesClassificationSelection(canonicalComparisonKey(classificationStatusLabel(record)), classifications)) return false;
    if (!matchesIndexFacets(record, indexFacets)) return false;
    return true;
  }), [classifications, indexFacets, records, search]);
  const baseCases = useMemo(() => rankingBaseCases.filter(record =>
    !failureClass || failureClassIds(record.raw).includes(failureClass)
  ), [rankingBaseCases, failureClass]);
  const harmById = useMemo(() => harmProjection?.byId ?? new Map(), [harmProjection]);
  const matchesHarm = (record: VigilIndexRecord) =>
    !harmType || hasEvidencedHarmType(harmById, record.id, harmType);
  // Own selected harm-type filter is deliberately excluded from this ranking.
  const harmRecords = useMemo(() => baseCases.filter(record =>
    matchesSelectedCountries(countryByCase.get(record.id), jurisdictions)
    && (!severity || severityCode(record) === severity)
  ), [baseCases, countryByCase, jurisdictions, severity]);
  const taxonomyRecords = useMemo(() => rankingBaseCases.filter(record =>
    matchesSelectedCountries(countryByCase.get(record.id), jurisdictions)
    && (!severity || severityCode(record) === severity)
    && matchesHarm(record)
  ), [rankingBaseCases, countryByCase, jurisdictions, severity, harmType, harmById]);
  const mapRecords = useMemo(() => baseCases.filter(record => {
    if (severity && severityCode(record) !== severity) return false;
    return matchesHarm(record);
  }), [baseCases, severity, harmType, harmById]);
  const distributionRecords = useMemo(() => baseCases.filter(record =>
    matchesSelectedCountries(countryByCase.get(record.id), jurisdictions) && matchesHarm(record)
  ), [baseCases, countryByCase, jurisdictions, harmType, harmById]);
  const filtered = useMemo(() => distributionRecords.filter(record =>
    !severity || severityCode(record) === severity
  ), [distributionRecords, severity]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => compareCases(a, b, sort)), [filtered, sort]);

  useEffect(() => setPage(1), [search, classifications, severity, jurisdictions, failureClass, harmType, indexFacets, sort]);
  const hasActiveFilters = Boolean(search || classifications.length || severity || jurisdictions.length || failureClass || harmType || Object.keys(indexFacets).length);
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
      direction: current.key === key ? (current.direction === "asc" ? "desc" : "asc") : "asc",
    }));
  }

  const staticPublicationFallbackAvailable = hasStaticPublicationFallback("vigil-case-index");
  useEffect(() => {
    if (state.status === "ready") retireStaticPublicationFallback("vigil-case-index");
  }, [state.status]);

  if (state.status !== "ready" && staticPublicationFallbackAvailable) return null;

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-library-page vigil-case-library-page">
        <div className="container mx-auto max-w-[1500px] px-4 py-7 sm:px-6 md:px-10 md:py-9">
          <section className="vigil-library-shell vigil-taxonomy-shell" aria-labelledby="case-files-heading">
            <VigilObservatoryMasthead
              titleId="case-files-heading"
              kicker="VIGIL Observatory · Incident investigations"
              title="Case Files"
              description="Detailed analysis of real-world AI incidents using a consistent evidence-to-conclusion method for comparison and adjudication."
              artworkSrc={VIGIL_MASTHEAD_ARTWORK.cases}
              contextLabel="Collection context"
              mode="collection"
              visual="cases"
              ariaLive="polite"
              metadata={[
                { label: "Status", value: "Beta" },
                { label: "Case Files", value: state.status === "ready" ? records.length : "—" },
                { label: "Classification states", value: state.status === "ready" ? classificationStates.length : "—" },
                { label: "Last updated", value: updated ?? "Loading" },
              ]}
            />

            <div className="vigil-dashboard-workspace">
              <section className="vigil-library-toolbar vigil-dashboard-filter-hub" aria-labelledby="case-filter-heading">
              <div className="vigil-dashboard-filter-hub-header">
                <div>
                  <span className="vigil-dashboard-eyebrow">01 / Refine</span>
                  <h2 id="case-filter-heading">Filters</h2>
                </div>
                {hasActiveFilters && <button type="button" className="vigil-dashboard-clear-all" onClick={clearFilters}>Clear filters</button>}
              </div>
              <div className="vigil-dashboard-filter-controls">
              <div className="vigil-result-summary vigil-dashboard-shared-selection">
                {hasActiveFilters && <div className="vigil-dashboard-selection-chips">
                  {search && <button type="button" className="vigil-dashboard-selection-chip" onClick={() => setSearch("")} aria-label="Remove search filter">Search: {search}<X aria-hidden="true" size={13} /></button>}
                  {classifications.map(key => <button type="button" key={key} className="vigil-dashboard-selection-chip" onClick={() => toggleClassification(key)} aria-label={`Remove ${classificationStates.find(entry => entry.key === key)?.label ?? key} classification filter`}>Classification: {classificationStates.find(entry => entry.key === key)?.label ?? key}<X aria-hidden="true" size={13} /></button>)}
                  {severity && <button type="button" className="vigil-dashboard-selection-chip" onClick={() => setSeverity("")} aria-label="Remove severity filter">{severityLabel(severity)}<X aria-hidden="true" size={13} /></button>}
                  {jurisdictions.map(code => <button type="button" key={code} className="vigil-dashboard-selection-chip" onClick={() => toggleJurisdiction(code)} aria-label={`Remove ${countryDisplayName(code)} jurisdiction filter`}>Jurisdiction: {countryDisplayName(code)}<X aria-hidden="true" size={13} /></button>)}
                  {failureClass && <button type="button" className="vigil-dashboard-selection-chip" onClick={() => setFailureClass("")} aria-label="Remove fidelity class filter">{failureClass.replace("VIGIL-FC-", "FC-")}<X aria-hidden="true" size={13} /></button>}
                   {harmType && <button type="button" className="vigil-dashboard-selection-chip" onClick={() => setHarmType("")} aria-label="Remove assessed harm type filter">Harm: {harmDimensions.find(d => d.dimension_id === harmType)?.label ?? harmType}<X aria-hidden="true" size={13} /></button>}
                  {Object.entries(indexFacets).flatMap(([id, keys]) => keys.map(key =>
                    <button type="button" key={`${id}:${key}`} className="vigil-dashboard-selection-chip"
                      onClick={() => toggleIndexFacet(id, key)} aria-label={`Remove ${INDEX_FACETS.find(facet => facet.id === id)?.title ?? id}: ${facetOptionLabel(id,key)} filter`}>
                      {INDEX_FACETS.find(facet => facet.id === id)?.title ?? id}: {facetOptionLabel(id, key)}<X aria-hidden="true" size={13}/>
                    </button>
                  ))}
                 </div>}
                 <p className="vigil-dashboard-filter-match-count" aria-live="polite" aria-atomic="true"><strong>{sorted.length} matching {sorted.length === 1 ? "case file" : "case files"}</strong></p>
                 {hasActiveFilters && <a className="vigil-dashboard-mobile-insights-link" href="#vigil-dashboard-geography">Explore the globe &amp; insights ↓</a>}
               </div>
                <div className="vigil-dashboard-filter-search" role="search" aria-label="Search Case Files">
                  <label className="vigil-search-control">
                    <Search aria-hidden="true" />
                    <span className="sr-only">Describe the behaviour you’re seeing…</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search Case Files…"
                    />
                    {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X /></button>}
                  </label>
                </div>
                <div className="vigil-dashboard-metadata-facets">
                <details className="vigil-dashboard-classification-facet" aria-label="Classification filters">
                  <summary className="vigil-dashboard-facet-heading">
                    <span>Classification</span>
                    <span className="vigil-dashboard-facet-state">
                      {classifications.length > 0 && <span>{classifications.length} selected</span>}
                      <ChevronDown size={15} aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="vigil-dashboard-facet-options" role="group" aria-label="Choose classification outcomes">
                    <label className="vigil-dashboard-facet-option">
                      <input type="checkbox" checked={classifications.length === 0}
                        onChange={() => setClassifications([])} />
                      <span className="vigil-dashboard-facet-option-name">All classifications</span>
                      <span className="vigil-dashboard-facet-count">{records.length}</span>
                    </label>
                    {classificationStates.map(entry =>
                      <label className="vigil-dashboard-facet-option" key={entry.key}>
                        <input type="checkbox" checked={classifications.includes(entry.key)}
                          onChange={() => toggleClassification(entry.key)} />
                        <span className="vigil-dashboard-facet-option-name">{entry.label}</span>
                        <span className="vigil-dashboard-facet-count">{entry.count}</span>
                      </label>
                    )}
                  </div>
                </details>
                {indexedFacetCatalog.map(facet => <IndexFacet key={facet.id} id={facet.id} title={facet.title}
                  options={facet.options} total={records.length} selected={indexFacets[facet.id] ?? []}
                  onToggle={toggleIndexFacet} onClear={clearIndexFacet}/>)}
                </div>
              </div>
              {!hasActiveFilters && <a className="vigil-dashboard-mobile-insights-link" href="#vigil-dashboard-geography">Explore the globe &amp; insights ↓</a>}
            </section>

            <div className="vigil-dashboard-layout">
              <div className="vigil-dashboard-case-column">
              <header className="vigil-dashboard-register-heading">
                <div>
                  <p className="vigil-dashboard-eyebrow">02 / Incident register</p>
                  <h2>Investigated cases</h2>
                  <p>Open a Case File to examine the evidence and recorded assessment.</p>
                </div>
              </header>

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
                  const href = `/observatory/cases/${encodeURIComponent(record.id)}/`;
                  const classificationStatus = classificationStatusLabel(record);
                  const classificationLabel = taxonomyAlignmentOutcomeLabel(record.raw);
                  const exemplar = classificationStatus === "Exemplar";
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
              </div>
              <VigilCasesDashboard
                mapRecords={mapRecords}
                distributionRecords={distributionRecords}
                taxonomyRecords={taxonomyRecords}
                harmRecords={harmRecords}
                harmById={harmById}
                harmAvailable={Boolean(harmProjection)}
                harmNote={harmLoadNote}
                harmType={harmType}
                onHarmType={setHarmType}
                severity={severity}
                jurisdictions={jurisdictions}
                failureClass={failureClass}
                onSeverity={setSeverity}
                onJurisdiction={toggleJurisdiction}
                onFailureClass={setFailureClass}
                countryByCase={countryByCase}
                geographyAvailable={geographyAvailable}
                geographyNote={geographyNote}
              />
            </div>
            </div>
          </section>
        </div>
      </main>
    </Shell>
  );
}
