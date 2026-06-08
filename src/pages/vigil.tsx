import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Shell } from "@/components/layout/Shell";
import { loadVigilRecordDetail, loadVigilRegistryRecords, VIGIL_REGISTRY_SOURCE, type UnknownRecord } from "@/lib/vigilRegistry";
import { filterComparisonKey, humanLabel, isMeaningfulText, normalizeFilterLabel, normalizeRecords, previewText, recordTypeBadge, titleizeValue, type SummaryEntry, type VigilIndexRecord } from "@/lib/vigilPresentation";

const VIGIL_PAGE_SIZE = 20;

type FilterKey = "recordType" | "affectedPlatform" | "status";
type SortKey = "id" | "date" | "platform" | "type" | "title" | "status";
type SortDirection = "asc" | "desc";
type SortConfig = { key: SortKey; direction: SortDirection };

type FilterOption = { value: string; label: string };
type DetailLoadState = { status: "loading" } | { status: "ready"; raw: UnknownRecord; displayRecord: VigilIndexRecord } | { status: "error"; error: string };

const preferredStatuses = ["open", "watching", "triage", "routed", "deferred", "implemented", "closed", "closed-no-action", "closed-actioned"];
const exportNotice = "Filtered VIGIL index-entry export from the CAM Governance Interface. Full canonical records remain in CAM-Initiative/Vigil and are loaded per record on demand.";
const vigilRecommendedCitation = "CAM Initiative. VIGIL: Evidence-to-Repair Governance Ledger. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org/vigil";
const vigilReuseNotice = "This is public-benefit governance infrastructure. Please cite VIGIL if you use this export. Public access does not imply unrestricted reuse; applicable licence and reuse terms apply.";
const vigilSupportUrl = "https://buymeacoffee.com/cam_initiative";
const vigilCitation = {
  recommended_citation: vigilRecommendedCitation,
  title: "VIGIL: Evidence-to-Repair Governance Ledger",
  publisher: "CAM Initiative",
  maintainer: "Aeon Governance Lab",
  year: "2026",
  url: "https://www.cam-initiative.org/vigil",
  repository: "https://github.com/CAM-Initiative/Vigil",
};

const evidenceRepairSteps = [
  { label: "Observe", text: "Identify a real-world incident, harm, or governance breakdown." },
  { label: "Record", text: "Preserve evidence and context." },
  { label: "Classify", text: "Map the failure against CAM domains and taxonomy." },
  { label: "Diagnose", text: "Identify design failures, accountability gaps, and governance weaknesses." },
  { label: "Repair", text: "Propose patches, standards, safeguards, or institutional responses." },
  { label: "Learn", text: "Feed the pattern back into future-system design and transition planning." },
];

const sortableColumns: Array<{ key: SortKey; label: string }> = [
  { key: "id", label: "Record ID" },
  { key: "date", label: "Date" },
  { key: "platform", label: "Platform" },
  { key: "type", label: "Type" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
];

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

function sortTextValue(value?: string) {
  const cleaned = String(value ?? "").trim();
  return cleaned ? cleaned.toLocaleLowerCase() : undefined;
}

function sortValueForRecord(record: VigilIndexRecord, key: SortKey) {
  if (key === "date") {
    const timestamp = recordTimestamp(record);
    return timestamp > 0 ? timestamp : undefined;
  }

  const values: Record<Exclude<SortKey, "date">, string | undefined> = {
    id: record.id,
    platform: record.platform_label,
    type: record.type_label,
    title: record.title,
    status: record.record_state,
  };

  return sortTextValue(values[key]);
}

function compareRecordsBySort(a: VigilIndexRecord, b: VigilIndexRecord, sortConfig: SortConfig) {
  const aValue = sortValueForRecord(a, sortConfig.key);
  const bValue = sortValueForRecord(b, sortConfig.key);

  if (aValue === undefined && bValue === undefined) return 0;
  if (aValue === undefined) return 1;
  if (bValue === undefined) return -1;

  const comparison = typeof aValue === "number" && typeof bValue === "number"
    ? aValue - bValue
    : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: "base" });

  return sortConfig.direction === "asc" ? comparison : -comparison;
}

function jsonFileName(record: VigilIndexRecord) {
  return `${(record.id || "vigil-record").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "vigil-record"}.json`;
}

function recordKeyFor(record: VigilIndexRecord, index = 0) {
  return [record.id, record.path, record.raw_url, record.github_blob_url, String(index)].filter(isMeaningfulText).join("::");
}

function detailDisplayRecord(indexRecord: VigilIndexRecord, detail: UnknownRecord) {
  const normalized = normalizeRecords([{
    ...detail,
    path: typeof detail.path === "string" ? detail.path : indexRecord.path,
    raw_url: typeof detail.raw_url === "string" ? detail.raw_url : indexRecord.raw_url,
    github_blob_url: typeof detail.github_blob_url === "string" ? detail.github_blob_url : indexRecord.github_blob_url,
    source_registry: typeof detail.source_registry === "string" ? detail.source_registry : indexRecord.source_registry,
  }])[0];
  return { ...normalized, raw: detail };
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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "date", direction: "desc" });
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadNotice, setLoadNotice] = useState("");
  const [recordPage, setRecordPage] = useState(1);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [expandedRecordKeys, setExpandedRecordKeys] = useState<Set<string>>(() => new Set());
  const [copiedRecordKey, setCopiedRecordKey] = useState<string | null>(null);
  const [detailLoads, setDetailLoads] = useState<Record<string, DetailLoadState>>({});
  const detailLoadPromises = useRef<Partial<Record<string, Promise<UnknownRecord>>>>({});

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
    }).sort((a, b) => compareRecordsBySort(a, b, sortConfig)),
    [filters, records, search, sortConfig],
  );

  useEffect(() => {
    setRecordPage(1);
  }, [filters, search, sortConfig]);

  useEffect(() => {
    if (!isExportDialogOpen) return;

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setIsExportDialogOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isExportDialogOpen]);

  const recordPageCount = Math.max(1, Math.ceil(filtered.length / VIGIL_PAGE_SIZE));
  const currentRecordPage = Math.min(recordPage, recordPageCount);
  const recordPageStart = (currentRecordPage - 1) * VIGIL_PAGE_SIZE;
  const pagedRecords = filtered.slice(recordPageStart, recordPageStart + VIGIL_PAGE_SIZE);
  const visibleRecordStart = filtered.length === 0 ? 0 : recordPageStart + 1;
  const visibleRecordEnd = Math.min(recordPageStart + VIGIL_PAGE_SIZE, filtered.length);

  function setFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }


  function updateSort(key: SortKey) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  async function ensureRecordDetail(record: VigilIndexRecord, recordKey: string) {
    const existing = detailLoads[recordKey];
    if (existing?.status === "ready") return existing.raw;
    if (detailLoadPromises.current[recordKey]) return detailLoadPromises.current[recordKey];

    setDetailLoads((current) => ({ ...current, [recordKey]: { status: "loading" } }));
    const detailPromise = loadVigilRecordDetail(record.raw)
      .then((raw) => {
        const displayRecord = detailDisplayRecord(record, raw);
        setDetailLoads((current) => ({ ...current, [recordKey]: { status: "ready", raw, displayRecord } }));
        return raw;
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "VIGIL canonical record could not be loaded.";
        setDetailLoads((current) => ({ ...current, [recordKey]: { status: "error", error: message } }));
        return record.raw;
      })
      .finally(() => {
        delete detailLoadPromises.current[recordKey];
      });

    detailLoadPromises.current[recordKey] = detailPromise;
    return detailPromise;
  }

  async function copyRecordJson(record: VigilIndexRecord, recordKey: string) {
    const detailJson = await ensureRecordDetail(record, recordKey);
    const jsonText = JSON.stringify(detailJson, null, 2);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = jsonText;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("Clipboard copy failed");
      }

      setCopiedRecordKey(recordKey);
      window.setTimeout(() => {
        setCopiedRecordKey((current) => (current === recordKey ? null : current));
      }, 2000);
    } catch {
      setCopiedRecordKey(null);
    }
  }

  async function downloadRecordJson(record: VigilIndexRecord, recordKey: string) {
    const detailJson = await ensureRecordDetail(record, recordKey);
    const blob = new Blob([`${JSON.stringify(detailJson, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = jsonFileName(record);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function toggleExpandedRecord(record: VigilIndexRecord, recordKey: string) {
    const shouldLoadDetail = !expandedRecordKeys.has(recordKey);
    setExpandedRecordKeys((current) => {
      const next = new Set(current);
      if (next.has(recordKey)) {
        next.delete(recordKey);
      } else {
        next.add(recordKey);
      }
      return next;
    });
    if (shouldLoadDetail) void ensureRecordDetail(record, recordKey);
  }

  function handleRecordRowKeyDown(event: KeyboardEvent<HTMLDivElement>, record: VigilIndexRecord, recordKey: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleExpandedRecord(record, recordKey);
  }

  function exportCurrentView() {
    const payload = {
      export_notice: exportNotice,
      exported_at_utc: new Date().toISOString(),
      source: VIGIL_REGISTRY_SOURCE.registry_index_url,
      source_registry: VIGIL_REGISTRY_SOURCE.registry_index_url,
      citation: vigilCitation,
      reuse_notice: vigilReuseNotice,
      filters: { ...filters, search, sort: sortConfig },
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
    setIsExportDialogOpen(false);
  }

  function openSupportLink() {
    window.open(vigilSupportUrl, "_blank", "noopener,noreferrer");
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

        <details className="group cam-parchment-card mb-5 rounded-xl p-3 text-sm shadow-sm transition hover:border-primary/30 hover:bg-[hsl(36_48%_96%)]">
          <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.18em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background [&::-webkit-details-marker]:hidden">
            <span className="inline-flex w-full items-center gap-3">
              <span className="inline-block h-0 w-0 shrink-0 border-y-[0.35rem] border-l-[0.52rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
              <span>About VIGIL</span>
            </span>
          </summary>
          <div className="mt-3 space-y-5 border-t border-border/70 pt-3 leading-relaxed text-muted-foreground">
            <div className="space-y-2">
              <p>VIGIL is CAM’s public evidence-to-repair governance ledger. It records AI governance signals, runtime failures, implementation gaps, proposals, corrective patches, and source-linked digital ecosystem observations.</p>
              <p>It helps translate scattered incidents, field observations, platform behaviours, model failures, and governance proposals into structured records that can be reviewed, filtered, cited, and connected back to the CAM framework.</p>
            </div>


            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">From evidence to repair:</p>
              <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
                {evidenceRepairSteps.map((step, index) => (
                  <div className="contents" key={step.label}>
                    <div className="rounded-lg border border-border bg-background/35 p-3">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">{step.label}</p>
                      <p className="text-xs leading-relaxed md:text-sm">{step.text}</p>
                    </div>
                    {index < evidenceRepairSteps.length - 1 && (
                      <div className="flex items-center justify-center text-cam-gold/75" aria-hidden="true">
                        <span className="hidden lg:inline">→</span>
                        <span className="lg:hidden">↓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Record types</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/35 p-3">
                  <p className="font-medium text-foreground">Observation — what was seen.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">A source-linked record of an observed AI-system behaviour, platform signal, governance gap, or emerging digital ecosystem event.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/35 p-3">
                  <p className="font-medium text-foreground">Failure Mode — the pattern.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">A structured classification of a recurring, significant, or governance-relevant failure pattern.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/35 p-3">
                  <p className="font-medium text-foreground">Proposal — what might change.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">A candidate governance, schema, taxonomy, interface, operational, or doctrinal change. Proposals are exploratory unless implemented by a patch note.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/35 p-3">
                  <p className="font-medium text-foreground">Patch Note — what changed.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">A record of an implemented repair, registry update, schema change, validator change, interface fix, or governance-maintenance action.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/35 p-3 md:col-span-2">
                  <p className="font-medium text-foreground">Source / Research — supporting context.</p>
                  <p className="mt-1 text-xs leading-relaxed md:text-sm">Research notes, source records, or supporting evidence that may inform observations, proposals, or future governance work.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-primary/20 bg-card/45 p-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Lifecycle note</p>
                <p className="text-xs leading-relaxed md:text-sm">Records may move from observation to failure mode, proposal, patch note, monitoring, resolved, inactive, or superseded states. Not every observation becomes a proposal, and not every failure mode requires a new instrument.</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-card/45 p-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">What VIGIL is not</p>
                <p className="text-xs leading-relaxed md:text-sm">VIGIL is not a regulator, legal determination system, safety certification body, or final incident adjudication authority. Records are governance artefacts intended to support analysis, review, and repair.</p>
              </div>
            </div>
          </div>
        </details>


        {isExportDialogOpen && (
          <div
            aria-labelledby="vigil-export-dialog-title"
            aria-modal="true"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
            role="dialog"
          >
            <div className="w-full max-w-lg rounded-2xl border border-primary/25 bg-[hsl(36_48%_95%)] p-5 text-foreground shadow-2xl md:p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cam-gold">VIGIL export</p>
              <h2 id="vigil-export-dialog-title" className="font-serif text-2xl leading-snug text-foreground">Export current VIGIL view</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>This export contains public VIGIL registry records filtered by the current search and filter settings.</p>
                <div className="rounded-xl border border-border bg-card/55 p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Please cite VIGIL if you use this data</p>
                  <p className="font-mono text-xs leading-relaxed text-foreground">{vigilRecommendedCitation}</p>
                </div>
                <p>This is public-benefit governance infrastructure. If this work is useful, support helps cover infrastructure, archival, publication, and maintenance costs.</p>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={() => setIsExportDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={openSupportLink}
                >
                  Support this work
                </button>
                <button
                  className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(32_62%_25%)] transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={exportCurrentView}
                >
                  Download JSON
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="space-y-4" data-result-range-example="Showing 1–20">
          <div className="cam-parchment-card rounded-xl p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">Public filters</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Search and narrow public records by type, affected platform, and status without changing the live VIGIL source data.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilters({ recordType: "", affectedPlatform: "", status: "" });
                  }}
                >
                  Clear
                </button>
                <button
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={() => setIsExportDialogOpen(true)}
                  disabled={loadState !== "ready" || filtered.length === 0}
                >
                  Export current view
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/75">Search</span>
                <input
                  aria-label="Search VIGIL records"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search VIGIL records"
                />
              </label>
              {filterConfig.map((filter) => (
                <label key={filter.key} className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/75">{filter.label}</span>
                  <select
                    aria-label={`Filter by ${filter.label}`}
                    className="w-full rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            </div>
            {loadState === "ready" && (
              <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-3 md:flex-row md:items-center md:justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground/75" aria-live="polite">
                  Showing {visibleRecordStart}–{visibleRecordEnd} of {filtered.length} VIGIL records.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setRecordPage((page) => Math.max(1, page - 1))}
                    disabled={currentRecordPage === 1 || filtered.length === 0}
                    aria-label="Show previous VIGIL records page"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Page {currentRecordPage} of {recordPageCount}</span>
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => setRecordPage((page) => Math.min(recordPageCount, page + 1))}
                    disabled={currentRecordPage === recordPageCount || filtered.length === 0}
                    aria-label="Show next VIGIL records page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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
              <p className="font-sans text-sm leading-relaxed text-muted-foreground">Select any entry to expand record details and inspect raw JSON. Click a column heading to sort records.</p>
            )}

            <div className="space-y-2">
              {loadState === "ready" && filtered.length > 0 && (
                <div className="hidden gap-2 rounded-lg border border-border bg-card/60 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground md:grid md:grid-cols-[7rem_7rem_8rem_6rem_minmax(0,1fr)_6rem]" role="row">
                  {sortableColumns.map((column) => {
                    const isActive = sortConfig.key === column.key;
                    return (
                      <div key={column.key} role="columnheader" aria-sort={isActive ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition hover:bg-background/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background ${isActive ? "text-cam-gold" : "text-muted-foreground"}`}
                          onClick={() => updateSort(column.key)}
                          aria-label={`Sort VIGIL records by ${column.label} ${isActive && sortConfig.direction === "asc" ? "descending" : "ascending"}`}
                        >
                          <span>{column.label}</span>
                          <span className={isActive ? "text-cam-gold" : "text-muted-foreground/60"} aria-hidden="true">{isActive ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {pagedRecords.map((record, index) => {
                const recordDate = record.date_recorded ?? record.date_implemented ?? "Date not specified";
                const sourceHref = sourceRecordUrl(record);
                const rawHref = sourceRawUrl(record);
                const recordKey = recordKeyFor(record, recordPageStart + index);
                const detailsPanelId = `vigil-record-details-${recordKey.replace(/[^A-Za-z0-9_-]/g, "-")}`;
                const isExpanded = expandedRecordKeys.has(recordKey);
                const detailLoad = detailLoads[recordKey];
                const detailRecord = detailLoad?.status === "ready" ? detailLoad.displayRecord : record;
                const detailRecordDate = detailRecord.date_recorded ?? detailRecord.date_implemented ?? "Date not specified";
                const displayRecordId = record.id;
                const defaultOpenSummaries = defaultOpenSummaryNames(detailRecord);

                return (
                <article key={recordKey} className="group cam-parchment-card rounded-xl shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[hsl(36_48%_96%)] focus-within:ring-2 focus-within:ring-primary/20">
                  {!isExpanded && (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={detailsPanelId}
                    className="cursor-pointer px-3 py-2.5 text-sm transition md:px-4"
                    onClick={() => toggleExpandedRecord(record, recordKey)}
                    onKeyDown={(event) => handleRecordRowKeyDown(event, record, recordKey)}
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
                          <h2 className="mt-1 break-words font-mono text-base font-normal leading-snug text-foreground/90">{record.title}</h2>
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

                        <div className="flex items-center justify-end gap-3 border-t border-border/70 pt-3">
                          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Details {isExpanded ? "−" : "+"}</span>
                        </div>
                      </div>

                      <div className="hidden gap-2 md:grid md:grid-cols-[7rem_7rem_8rem_6rem_minmax(0,1fr)_6rem] md:items-center">
                        <div className="break-words font-mono text-[11px] leading-snug text-cam-gold">{displayRecordId}</div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">{recordDate}</div>
                        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[hsl(32_62%_25%)]">{record.platform_label}</div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">{record.type_label}</div>
                        <h2 className="min-w-0 whitespace-normal break-words font-mono text-[15px] font-normal leading-snug text-foreground/90 lg:text-base">{record.title}</h2>
                        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">{record.record_state}</div>
                      </div>
                    </div>
                  </div>
                  )}

                  {isExpanded && (
                  <div id={detailsPanelId} className="px-3 py-4 md:px-4">
                    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-mono text-[11px] text-cam-gold">{detailRecord.id}</p>
                        <h2 className="mt-1 break-words font-mono text-xl font-normal leading-snug text-foreground/90">{detailRecord.title}</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[detailRecord.type_label, detailRecord.record_state, detailRecordDate, detailRecord.platform_label].filter(isMeaningfulText).map((value) => (
                            <span key={value} className="rounded-full border border-border bg-card px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{value}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                        onClick={() => toggleExpandedRecord(record, recordKey)}
                        aria-expanded={isExpanded}
                        aria-controls={detailsPanelId}
                      >
                        Collapse record −
                      </button>
                    </div>

                    {detailLoad?.status === "loading" && (
                      <div className="mb-4 rounded-lg border border-border bg-card/60 p-3 text-xs leading-relaxed text-muted-foreground" role="status">
                        Loading canonical VIGIL record detail…
                      </div>
                    )}

                    {detailLoad?.status === "error" && (
                      <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs leading-relaxed text-red-800" role="alert">
                        Detailed canonical record could not be loaded. Showing the registry index entry instead. {detailLoad.error}
                      </div>
                    )}

                    {previewText(detailRecord.summary) && detailRecord.summary !== detailRecord.title && <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{detailRecord.summary}</p>}

                    <div className="mb-4 grid gap-3 rounded-lg border border-border/70 bg-background/30 p-3 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="Date Implemented" value={detailRecord.record_type === "patch_note" ? detailRecord.date_implemented : undefined} />
                      <Field label="Evidence Confidence" value={detailRecord.record_type === "patch_note" ? undefined : detailRecord.evidence_confidence} />
                      <Field label="Next Action" value={["observation", "proposal"].includes(detailRecord.record_type) ? detailRecord.next_action : undefined} />
                      <Field label="Source Platform" value={detailRecord.source_platform} />
                      <Field label="Source Type" value={detailRecord.source_types?.join("; ")} />
                      <Field label="Source Context" value={detailRecord.source_record_hint} />
                      <Field label="Observed System Vendor" value={detailRecord.observed_vendor} />
                      <Field label="Observed Model / Product" value={detailRecord.observed_product} />
                    </div>

                    <div className="space-y-2">
                      {summaryBlocksFor(detailRecord).map((name) => (
                        <SummaryBlock key={name} title={humanLabel(name)} entries={detailRecord.summaries[name]} defaultOpen={defaultOpenSummaries.has(name)} />
                      ))}
                    </div>

                    <details className="mt-4 rounded-lg border border-border bg-background/35 p-3">
                      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background">Technical JSON record</summary>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-xs leading-relaxed text-muted-foreground">Human-readable fields above are the primary detail view. This raw JSON is retained for technical inspection; export remains available for downloads.</p>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background"
                            onClick={() => copyRecordJson(record, recordKey)}
                            aria-label={`Copy raw JSON for ${detailRecord.id}`}
                          >
                            {copiedRecordKey === recordKey ? "Copied" : "Copy JSON"}
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background"
                            onClick={() => downloadRecordJson(record, recordKey)}
                            aria-label={`Download raw JSON for ${detailRecord.id}`}
                          >
                            Download JSON
                          </button>
                        </div>
                      </div>
                      {(detailRecord.record_type === "proposal" || detailRecord.record_type === "patch_note") && (
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <Field label="Affected Domains" value={detailRecord.affected_domains?.join("; ")} />
                          <Field label="Affected Instruments" value={detailRecord.affected_instruments?.join("; ")} />
                          <Field label="Affected Annexes" value={detailRecord.affected_annexes?.join("; ")} />
                        </div>
                      )}
                      <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-card/70 p-3 text-xs leading-relaxed text-muted-foreground">{JSON.stringify(detailRecord.raw, null, 2)}</pre>
                    </details>

                    {(record.path || sourceHref || rawHref) && (
                      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3 md:flex-row md:items-center md:justify-between">
                        <p className="break-words font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Record path: {record.path ?? record.github_blob_url ?? record.raw_url}</p>
                        {sourceHref && <a className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background/80" href={sourceHref} target="_blank" rel="noreferrer">Open record →</a>}
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
