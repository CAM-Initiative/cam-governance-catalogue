import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Shell } from "@/components/layout/Shell";
import { loadVigilRegistryRecords, VIGIL_REGISTRY_SOURCE } from "@/lib/vigilRegistry";
import { filterComparisonKey, humanLabel, isMeaningfulText, normalizeFilterLabel, normalizeRecords, previewText, recordTypeBadge, titleizeValue, type SummaryEntry, type VigilIndexRecord } from "@/lib/vigilPresentation";

const VIGIL_PAGE_SIZE = 20;

type FilterKey = "recordType" | "affectedPlatform" | "status";
type DateSort = "newest" | "oldest";

type FilterOption = { value: string; label: string };

const preferredStatuses = ["open", "watching", "triage", "routed", "deferred", "implemented", "closed", "closed-no-action", "closed-actioned"];
const exportNotice = "Filtered VIGIL index export from the CAM Interface. Canonical records remain in CAM-Initiative/Vigil.";
const filterConfig: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: "recordType", label: "Record Type", placeholder: "All record types" },
  { key: "affectedPlatform", label: "Affected Platform", placeholder: "All affected platforms" },
  { key: "status", label: "Record Status", placeholder: "All record statuses" },
];

function getFilterOptionsFromRecords(records: VigilIndexRecord[]) {
  return Object.fromEntries(
    filterConfig.map((filter) => {
      const optionsByKey = new Map<string, FilterOption>();
      for (const rawValue of records.flatMap((record) => valuesForFilter(record, filter.key))) {
        const label = normalizeFilterLabel(filter.key, rawValue);
        if (!label) continue;
        const key = filterComparisonKey(filter.key, rawValue);
        if (!optionsByKey.has(key)) optionsByKey.set(key, { value: label, label });
      }

      const options = [...optionsByKey.values()].sort((a, b) => a.label.localeCompare(b.label));
      if (filter.key === "recordType") {
        const preferred = ["Failure Modes", "Observations", "Proposals", "Patch Notes"];
        return [filter.key, [
          ...preferred.flatMap((label) => optionsByKey.get(filterComparisonKey(filter.key, label)) ?? []),
          ...options.filter((option) => !preferred.includes(option.label)),
        ]];
      }
      if (filter.key === "status") {
        const preferred = preferredStatuses.map(titleizeValue);
        return [filter.key, [
          ...preferred.flatMap((label) => optionsByKey.get(filterComparisonKey(filter.key, label)) ?? []),
          ...options.filter((option) => !preferred.includes(option.label)),
        ]];
      }
      return [filter.key, options];
    }),
  ) as Record<FilterKey, FilterOption[]>;
}

function valuesForFilter(record: VigilIndexRecord, key: FilterKey): string[] {
  const mapping: Record<FilterKey, string[] | undefined> = {
    recordType: [record.record_type],
    affectedPlatform: record.affected_platform_label ? [record.affected_platform_label] : undefined,
    status: record.record_state ? [record.record_state] : undefined,
  };
  return mapping[key] ?? [];
}

function recordTimestamp(record: VigilIndexRecord) {
  const dateValue = record.date_recorded ?? record.date_implemented;
  const timestamp = dateValue ? Date.parse(dateValue) : Number.NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!isMeaningfulText(value)) return null;

  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function SummaryBlock({ title, entries, defaultOpen = false }: { title: string; entries?: SummaryEntry[]; defaultOpen?: boolean }) {
  if (!entries?.length) return null;

  return (
    <details className="rounded-lg border border-border bg-background/35 px-3 py-2" open={defaultOpen}>
      <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold marker:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background [&::-webkit-details-marker]:hidden">
        <span className="inline-flex w-full items-center justify-between gap-3">
          <span>{title}</span>
          <span className="text-[9px] text-muted-foreground/60" aria-hidden="true">Open / close</span>
        </span>
      </summary>
      <div className="mt-3 grid gap-3 border-t border-border/70 pt-3 md:grid-cols-2">
        {entries.map((entry, index) => (
          <Field key={`${entry.label}-${index}`} label={entry.label} value={entry.value} />
        ))}
      </div>
    </details>
  );
}

function sourceRecordUrl(record: Pick<VigilIndexRecord, "github_blob_url">) {
  return record.github_blob_url || undefined;
}

function sourceRawUrl(record: Pick<VigilIndexRecord, "raw_url">) {
  return record.raw_url || undefined;
}

function exportFileName(status: string) {
  const date = new Date().toISOString().slice(0, 10);
  const statusPart = (status || "all").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  return `vigil-current-view-${statusPart}-${date}.json`;
}

function summaryBlocksFor(record: VigilIndexRecord) {
  if (record.record_type === "observation") {
    return ["source_summary", "system_summary", "jurisdiction_summary", "classification_summary", "cam_summary"] as const;
  }
  if (record.record_type === "failure_mode") {
    return ["classification_summary", "triage_summary", "source_summary", "system_summary", "jurisdiction_summary", "cam_summary"] as const;
  }
  if (record.record_type === "proposal") {
    return ["proposal_summary", "source_summary", "external_relevance_summary", "cam_summary"] as const;
  }
  if (record.record_type === "patch_note") {
    return ["change_summary", "verification_summary", "impact_summary", "cam_summary"] as const;
  }
  return ["source_summary", "system_summary", "jurisdiction_summary", "classification_summary", "triage_summary", "proposal_summary", "change_summary", "external_relevance_summary", "impact_summary", "cam_summary"] as const;
}

function defaultOpenSummaryNames(record: VigilIndexRecord) {
  const preferredByType: Record<string, string[]> = {
    observation: ["source_summary", "system_summary"],
    failure_mode: ["classification_summary", "triage_summary"],
    proposal: ["proposal_summary"],
    patch_note: ["change_summary", "verification_summary"],
  };
  const meaningfulSummaries = summaryBlocksFor(record).filter((name) => record.summaries[name]?.length);
  const preferred = new Set((preferredByType[record.record_type] ?? []).filter((name) => meaningfulSummaries.includes(name as (typeof meaningfulSummaries)[number])));
  if (preferred.size > 0) return preferred;
  return new Set(meaningfulSummaries.slice(0, 1));
}

export default function Vigil() {
  const [records, setRecords] = useState<VigilIndexRecord[]>([]);
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    recordType: "",
    affectedPlatform: "",
    status: "",
  });
  const [search, setSearch] = useState("");
  const [dateSort, setDateSort] = useState<DateSort>("newest");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadNotice, setLoadNotice] = useState("");
  const [recordPage, setRecordPage] = useState(1);
  const [expandedRecordKeys, setExpandedRecordKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;

    loadVigilRegistryRecords()
      .then((result) => {
        if (cancelled) return;
        setRecords(normalizeRecords(result.records));
        setLoadNotice(result.message ?? "");
        setLoadState("ready");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setErrorMessage(error.message);
        setRecords([]);
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filterOptions = useMemo(() => getFilterOptionsFromRecords(records), [records]);

  const filtered = useMemo(
    () => records.filter((record) => {
      const filtersOk = filterConfig.every((filter) => {
        const selected = filters[filter.key];
        if (!selected) return true;
        const selectedKey = filterComparisonKey(filter.key, selected);
        return valuesForFilter(record, filter.key).some((value) => filterComparisonKey(filter.key, value) === selectedKey);
      });
      const searchOk = !search.trim() || record.searchText.includes(search.trim().toLowerCase());
      return filtersOk && searchOk;
    }).sort((a, b) => {
      const direction = dateSort === "newest" ? -1 : 1;
      return (recordTimestamp(a) - recordTimestamp(b)) * direction;
    }),
    [dateSort, filters, records, search],
  );

  useEffect(() => {
    setRecordPage(1);
  }, [dateSort, filters, search]);

  const recordPageCount = Math.max(1, Math.ceil(filtered.length / VIGIL_PAGE_SIZE));
  const currentRecordPage = Math.min(recordPage, recordPageCount);
  const recordPageStart = (currentRecordPage - 1) * VIGIL_PAGE_SIZE;
  const pagedRecords = filtered.slice(recordPageStart, recordPageStart + VIGIL_PAGE_SIZE);
  const visibleRecordStart = filtered.length === 0 ? 0 : recordPageStart + 1;
  const visibleRecordEnd = Math.min(recordPageStart + VIGIL_PAGE_SIZE, filtered.length);

  function setFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleExpandedRecord(recordKey: string) {
    setExpandedRecordKeys((current) => {
      const next = new Set(current);
      if (next.has(recordKey)) {
        next.delete(recordKey);
      } else {
        next.add(recordKey);
      }
      return next;
    });
  }

  function handleRecordRowKeyDown(event: KeyboardEvent<HTMLDivElement>, recordKey: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleExpandedRecord(recordKey);
  }

  function exportCurrentView() {
    const payload = {
      export_notice: exportNotice,
      exported_at_utc: new Date().toISOString(),
      source: VIGIL_REGISTRY_SOURCE.registry_index_url,
      filters: { ...filters, search, date_sort: dateSort },
      record_count: filtered.length,
      records: filtered.map(({ raw }) => raw),
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(filters.status);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell>
      <div className="container mx-auto max-w-7xl px-5 py-8 md:px-8 lg:px-10">
        <div className="mb-5">
          <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">Evidence-to-Repair Governance Ledger</p>
          <h1 className="mb-3 font-serif text-3xl text-foreground md:text-4xl">VIGIL Observatory</h1>
          <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-base">
            VIGIL records observations, failure modes, CAM proposals, and implemented patch notes from the live VIGIL registry index with public-facing source, system, jurisdiction, classification, and routing summaries.
          </p>
        </div>

        <details className="cam-parchment-card mb-5 rounded-xl p-3 text-sm shadow-sm">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] text-cam-gold">About VIGIL</summary>
          <div className="mt-3 space-y-2 leading-relaxed text-muted-foreground">
            <p>VIGIL is CAM’s public observatory for recording AI governance signals, runtime failures, implementation gaps, proposals, and corrective patches.</p>
            <p>It helps translate scattered incidents, field observations, platform behaviours, model failures, and governance proposals into structured records that can be reviewed, filtered, cited, and connected back to the CAM framework.</p>
            <p>Observation and Failure Mode records focus on what was seen: the public source, affected system, jurisdictional context, observed behaviour, and triage relevance.</p>
            <p>Proposal and Patch Note records focus on what should change: the affected CAM domain, target instrument, implementation context, and governance rationale.</p>
            <p>Together, VIGIL acts as a bridge between lived runtime evidence and formal governance maintenance.</p>
          </div>
        </details>

        <section className="space-y-4" data-result-range-example="Showing 1–20">
          <div className="cam-parchment-card rounded-xl p-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                aria-label="Search VIGIL records"
                className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search VIGIL records"
              />
              <button
                className="self-start rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-background/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:self-auto"
                type="button"
                onClick={exportCurrentView}
                disabled={loadState !== "ready" || filtered.length === 0}
              >
                Export JSON
              </button>
            </div>
          </div>

          <div className="cam-parchment-card rounded-xl p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cam-gold">Public filters</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Use the compact institutional filters below, or search across the full public record text.</p>
              </div>
              <button
                className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground"
                type="button"
                onClick={() => setFilters({ recordType: "", affectedPlatform: "", status: "" })}
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {filterConfig.map((filter) => (
                <label key={filter.key} className="block">
                  <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">{filter.label}</span>
                  <select
                    aria-label={`Filter by ${filter.label}`}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={filters[filter.key]}
                    onChange={(event) => setFilter(filter.key, event.target.value)}
                  >
                    <option value="">{filter.placeholder}</option>
                    {filterOptions[filter.key].map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              ))}

              <label className="block">
                <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">Date sort</span>
                <select
                  aria-label="Sort VIGIL records by date"
                  className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={dateSort}
                  onChange={(event) => setDateSort(event.target.value as DateSort)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>
          </div>

            {loadState === "loading" && <div className="cam-parchment-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">Loading VIGIL records from <code>{VIGIL_REGISTRY_SOURCE.registry_index_url}</code>…</div>}

            {loadState === "error" && (
              <div className="cam-parchment-card rounded-xl p-5 shadow-sm">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-700">Records unavailable</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{errorMessage || `VIGIL registry could not be loaded from the live registry source. Attempted ${VIGIL_REGISTRY_SOURCE.registry_index_url}.`}</p>
              </div>
            )}

            {loadState === "ready" && loadNotice && (
              <div className="cam-parchment-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">{loadNotice}</div>
            )}

            {loadState === "ready" && records.length === 0 && (
              <div className="cam-parchment-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">No VIGIL records are currently published in <code>{VIGIL_REGISTRY_SOURCE.registry_index_url}</code>.</div>
            )}

            {loadState === "ready" && filtered.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-3 shadow-sm md:flex-row md:items-center md:justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70" aria-live="polite">
                  Showing {visibleRecordStart}–{visibleRecordEnd} of {filtered.length} VIGIL records.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setRecordPage((page) => Math.max(1, page - 1))}
                    disabled={currentRecordPage === 1}
                    aria-label="Show previous VIGIL records page"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">Page {currentRecordPage} of {recordPageCount}</span>
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setRecordPage((page) => Math.min(recordPageCount, page + 1))}
                    disabled={currentRecordPage === recordPageCount}
                    aria-label="Show next VIGIL records page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {loadState === "ready" && filtered.length > 0 && (
              <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground/75">Select any entry to expand record details and inspect raw JSON.</p>
            )}

            <div className="space-y-2">
              {loadState === "ready" && filtered.length > 0 && (
                <div className="hidden gap-2 rounded-lg border border-border bg-card/45 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 md:grid md:grid-cols-[6.5rem_6.5rem_7.5rem_5rem_minmax(0,1fr)_5rem_4.5rem]">
                  <div>Record ID</div>
                  <div>Date</div>
                  <div>Platform</div>
                  <div>Type</div>
                  <div>Title</div>
                  <div>Status</div>
                  <div className="md:text-right">Source</div>
                </div>
              )}

              {pagedRecords.map((record, index) => {
                const recordDate = record.date_recorded ?? record.date_implemented ?? "Date not specified";
                const sourceHref = sourceRecordUrl(record);
                const rawHref = sourceRawUrl(record);
                const recordKey = `${record.id}-${record.path ?? index}`;
                const detailsPanelId = `vigil-record-details-${recordKey.replace(/[^A-Za-z0-9_-]/g, "-")}`;
                const isExpanded = expandedRecordKeys.has(recordKey);
                const displayRecordId = record.id;
                const defaultOpenSummaries = defaultOpenSummaryNames(record);

                return (
                <article key={recordKey} className="group cam-parchment-card rounded-xl shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[hsl(36_48%_96%)] focus-within:ring-2 focus-within:ring-primary/20">
                  {!isExpanded && (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={detailsPanelId}
                    className="cursor-pointer px-3 py-2.5 text-sm transition md:px-4"
                    onClick={() => toggleExpandedRecord(recordKey)}
                    onKeyDown={(event) => handleRecordRowKeyDown(event, recordKey)}
                  >
                    <div className="font-sans">
                      <div className="space-y-3 md:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">Record ID</p>
                            <p className="mt-1 break-words font-mono text-[11px] text-cam-gold">{displayRecordId}</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-border bg-card px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                            {isExpanded ? "Collapse" : "Expand"}
                          </span>
                        </div>

                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">Title</p>
                          <h2 className="mt-1 break-words font-serif text-lg leading-snug text-foreground">{record.title}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-background/35 p-3">
                          <Field label="Record Type" value={record.type_label} />
                          <Field label="Record Status" value={record.record_state} />
                          <Field label="Record Date" value={recordDate} />
                          <Field label="Affected Platform" value={record.platform_label} />
                        </div>

                        {previewText(record.summary) && record.summary !== record.title && (
                          <p className="text-sm leading-relaxed text-muted-foreground">{previewText(record.summary, 220)}</p>
                        )}

                        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                          {sourceHref ? (
                            <a className="inline-flex whitespace-nowrap font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] underline-offset-4 transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background" href={sourceHref} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>Source ↗</a>
                          ) : (
                            <span className="font-sans text-[11px] text-muted-foreground/50">No source link listed</span>
                          )}
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Details {isExpanded ? "−" : "+"}</span>
                        </div>
                      </div>

                      <div className="hidden gap-2 md:grid md:grid-cols-[6.5rem_6.5rem_7.5rem_5rem_minmax(0,1fr)_5rem_4.5rem] md:items-center">
                        <div className="break-words font-mono text-[10px] text-cam-gold">{displayRecordId}</div>
                        <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground/75">{recordDate}</div>
                        <div className="font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(32_62%_25%)]">{record.platform_label}</div>
                        <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground/75">{record.type_label}</div>
                        <h2 className="min-w-0 whitespace-normal break-words font-sans text-sm font-medium leading-snug text-foreground md:text-[15px]">{record.title}</h2>
                        <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground/75">{record.record_state}</div>
                        <div className="flex items-center md:justify-end">
                          {sourceHref ? (
                            <a className="inline-flex whitespace-nowrap font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] underline-offset-4 transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background" href={sourceHref} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>Source ↗</a>
                          ) : (
                            <span className="font-sans text-[10px] text-muted-foreground/40" aria-hidden="true">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {isExpanded && (
                  <div id={detailsPanelId} className="px-3 py-4 md:px-4">
                    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-mono text-[11px] text-cam-gold">{record.id}</p>
                        <h2 className="mt-1 break-words font-serif text-xl leading-snug text-foreground">{record.title}</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[record.type_label, record.record_state, recordDate, record.platform_label].filter(isMeaningfulText).map((value) => (
                            <span key={value} className="rounded-full border border-border bg-card px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{value}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                        onClick={() => toggleExpandedRecord(recordKey)}
                        aria-expanded={isExpanded}
                        aria-controls={detailsPanelId}
                      >
                        Collapse record −
                      </button>
                    </div>

                    {previewText(record.summary) && record.summary !== record.title && <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{record.summary}</p>}

                    <div className="mb-4 grid gap-3 rounded-lg border border-border/70 bg-background/30 p-3 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="Date Implemented" value={record.record_type === "patch_note" ? record.date_implemented : undefined} />
                      <Field label="Evidence Confidence" value={record.record_type === "patch_note" ? undefined : record.evidence_confidence} />
                      <Field label="Next Action" value={["observation", "proposal"].includes(record.record_type) ? record.next_action : undefined} />
                      <Field label="Source Platform" value={record.source_platform} />
                      <Field label="Source Type" value={record.source_types?.join("; ")} />
                      <Field label="Source Context" value={record.source_record_hint} />
                      <Field label="Observed System Vendor" value={record.observed_vendor} />
                      <Field label="Observed Model / Product" value={record.observed_product} />
                    </div>

                    <div className="space-y-2">
                      {summaryBlocksFor(record).map((name) => (
                        <SummaryBlock key={name} title={humanLabel(name)} entries={record.summaries[name]} defaultOpen={defaultOpenSummaries.has(name)} />
                      ))}
                    </div>

                    <details className="mt-4 rounded-lg border border-border bg-background/35 p-3">
                      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Technical JSON record</summary>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Human-readable fields above are the primary detail view. This raw JSON is retained for technical inspection; export remains available for downloads.</p>
                      {(record.record_type === "proposal" || record.record_type === "patch_note") && (
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <Field label="Affected Domains" value={record.affected_domains?.join("; ")} />
                          <Field label="Affected Instruments" value={record.affected_instruments?.join("; ")} />
                          <Field label="Affected Annexes" value={record.affected_annexes?.join("; ")} />
                        </div>
                      )}
                      <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-card/70 p-3 text-xs leading-relaxed text-muted-foreground">{JSON.stringify(record.raw, null, 2)}</pre>
                    </details>

                    {(record.path || sourceHref || rawHref) && (
                      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3 md:flex-row md:items-center md:justify-between">
                        <p className="break-words font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Source record: {record.path ?? record.github_blob_url ?? record.raw_url}</p>
                        {sourceHref && <a className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background/80" href={sourceHref} target="_blank" rel="noreferrer">Open source record →</a>}
                      </div>
                    )}
                  </div>
                  )}
                </article>
                );
              })}
            </div>
          </section>
      </div>
    </Shell>
  );
}
