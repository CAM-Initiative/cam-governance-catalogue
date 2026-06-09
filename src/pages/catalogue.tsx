import { KeyboardEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import registrySources from "@/config/registrySources.json";
import { fetchSourceText, resolveGithubBlobUrl, resolveRawSourceUrl } from "@/lib/sourceLoader";

type Instrument = Record<string, string | boolean | null | undefined>;
type SourceLoadState = { status: "idle" } | { status: "loading" } | { status: "ready"; text: string } | { status: "error"; error: string };
type SourceAction = "copy" | "download";
type SourceActionDialog = { action: SourceAction; instrument: Instrument; text: string } | null;
type Detail = { label: string; value: string; variant?: "wide" };

const searchFields = [
  "id",
  "title",
  "summary",
  "purpose",
  "domain",
  "status",
  "effect",
  "enforcement",
  "review_state",
  "authority_role",
];
const filterFields = ["domain", "instrument_class", "hierarchy_type", "status", "effect", "enforcement"];
const filterLabels: Record<string, string> = {
  domain: "domain",
  instrument_class: "type",
  hierarchy_type: "hierarchy",
  status: "status",
  effect: "effect",
  enforcement: "enforcement",
};
const missingPurposeMessage = "Purpose statement not yet available in catalogue metadata.";
const noAdditionalMetadataMessage = "No additional catalogue metadata is currently available for this instrument.";
const catalogueCitation = "CAM Initiative. CAM Initiative public governance infrastructure. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org";
const catalogueReuseNotice = "This is public-benefit governance infrastructure. Please cite CAM Initiative if you use this material. If this work is useful, support helps cover infrastructure, archival, publication, and maintenance costs.";
const catalogueSupportUrl = "https://buymeacoffee.com/cam_initiative";
const pageSize = 20;
const camRegistrySource = registrySources.cam;
const camSourceRepository = { repo: camRegistrySource.repo, branch: camRegistrySource.branch, basePath: "Governance" };
const camRegistryUrl = camRegistrySource.registry_index_url;
const camFallbackUrl = `${import.meta.env.BASE_URL}data/cam-governance-fallback.json`;

const metadataFields: Array<{ key: string; label: string }> = [
  { key: "domain", label: "Domain" },
  { key: "instrument_class", label: "Type" },
  { key: "hierarchy_type", label: "Hierarchy" },
  { key: "status", label: "Status" },
  { key: "effect", label: "Effect" },
  { key: "enforcement", label: "Enforcement" },
  { key: "id", label: "Instrument ID" },
];

const supplementalFields: Array<{ key: string; label: string }> = [
  { key: "link", label: "Source Path" },
  { key: "parent_id", label: "Parent Instrument" },
  { key: "review_state", label: "Review State" },
  { key: "authority_role", label: "Authority Role" },
  { key: "version", label: "Version" },
  { key: "updated_at", label: "Updated" },
  { key: "last_updated_utc", label: "Last Updated UTC" },
  { key: "pinned_sha", label: "Pinned SHA" },
  { key: "stack", label: "Governance Stack" },
  { key: "cycle_year", label: "Cycle Year" },
  { key: "seal", label: "Seal" },
  { key: "hierarchy_number", label: "Hierarchy Number" },
  { key: "is_derived", label: "Derived Record" },
  { key: "HASH", label: "Content Hash" },
];

function cleanValue(value?: string | boolean | null) {
  if (typeof value === "boolean") return value ? "Yes" : "No";

  return String(value ?? "")
    .replace(/^\*+\s*/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function displayValue(value?: string | boolean | null) {
  const cleaned = cleanValue(value);
  if (!cleaned) return "";
  if (cleaned === cleaned.toLowerCase() || cleaned === cleaned.toUpperCase()) return titleCase(cleaned);
  return cleaned;
}

function normalizeForDedupe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function rawDescription(it: Instrument) {
  return cleanValue(it.purpose) || cleanValue(it.summary);
}

function conciseDescription(it: Instrument) {
  const description = rawDescription(it);
  if (description.length <= 220) return description;
  return `${description.slice(0, 217).trimEnd()}…`;
}

function sourceUrl(instrument: Instrument) {
  return resolveGithubBlobUrl(instrument, camSourceRepository) ?? "";
}

function rawInstrumentSourceUrl(instrument: Instrument) {
  return resolveRawSourceUrl(instrument, camSourceRepository) ?? "";
}

function cacheBustUrl(url: string, version = Date.now()) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}

function itemsFromGovernanceIndex(data: unknown): Instrument[] {
  if (Array.isArray(data)) return data as Instrument[];
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: Instrument[] }).items;
  }
  return [];
}

async function fetchGovernanceItems(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return itemsFromGovernanceIndex(await response.json());
}

function detailRows(it: Instrument, collapsedDescription: string) {
  const fullPurpose = rawDescription(it);
  const details: Detail[] = [];
  const seenValues = new Set<string>();

  function addDetail(detail: Detail) {
    const key = normalizeForDedupe(detail.value);
    if (seenValues.has(key)) return;
    seenValues.add(key);
    details.push(detail);
  }

  if (fullPurpose && fullPurpose !== collapsedDescription) {
    addDetail({ label: "Full Purpose / Abstract", value: fullPurpose, variant: "wide" });
  }

  metadataFields.forEach((field) => {
    const value = displayValue(it[field.key]);
    if (value) addDetail({ label: field.label, value });
  });

  supplementalFields.forEach((field) => {
    const value = field.key === "link" || field.key === "HASH" || field.key === "pinned_sha"
      ? cleanValue(it[field.key])
      : displayValue(it[field.key]);

    if (value) addDetail({ label: field.label, value });
  });

  return details;
}

function stopCardToggle(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

function instrumentMarkdownFileName(instrument: Instrument) {
  const id = cleanValue(instrument.id).replace(/[\\/:*?"<>|]+/g, "-").replace(/^-+|-+$/g, "");
  return `${id || "cam-instrument"}.md`;
}

function writeTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) throw new Error("Clipboard copy failed");
  return Promise.resolve();
}

function downloadMarkdownSource(instrument: Instrument, text: string) {
  const blob = new Blob([text.endsWith("\n") ? text : `${text}\n`], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = instrumentMarkdownFileName(instrument);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div className="h-2" key={index} aria-hidden="true" />;
        if (/^#{1,6}\s+/.test(trimmed)) {
          const level = trimmed.match(/^#+/)?.[0].length ?? 2;
          const content = trimmed.replace(/^#{1,6}\s+/, "");
          const className = level <= 2 ? "mt-4 font-serif text-xl leading-snug text-foreground" : "mt-3 font-serif text-lg leading-snug text-foreground";
          return <p className={className} key={index}>{content}</p>;
        }
        if (/^[-*]\s+/.test(trimmed)) {
          return <p className="pl-4" key={index}>• {trimmed.replace(/^[-*]\s+/, "")}</p>;
        }
        if (/^```/.test(trimmed)) return null;
        return <p key={index}>{trimmed.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

export default function Catalogue() {
  const [rows, setRows] = useState<Instrument[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [metadataOpenIds, setMetadataOpenIds] = useState<Set<string>>(() => new Set());
  const [openSourceIds, setOpenSourceIds] = useState<Set<string>>(() => new Set());
  const [sourceActionDialog, setSourceActionDialog] = useState<SourceActionDialog>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sourceLoads, setSourceLoads] = useState<Record<string, SourceLoadState>>({});
  const sourceTextCache = useRef(new Map<string, string>());

  useEffect(() => {
    let cancelled = false;

    fetchGovernanceItems(cacheBustUrl(camRegistryUrl))
      .catch(() => fetchGovernanceItems(camFallbackUrl))
      .then((items) => {
        if (!cancelled) setRows(items);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () =>
      Object.fromEntries(
        filterFields.map((f) => [f, [...new Set(rows.map((r) => r[f]).filter(Boolean))].sort()]),
      ),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = query.trim().toLowerCase();
        const qOk = !q || searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(q));
        const fOk = filterFields.every((f) => !filters[f] || String(r[f] ?? "") === filters[f]);
        return qOk && fOk;
      }),
    [rows, query, filters],
  );

  useEffect(() => {
    setCurrentPage(1);
    setExpandedId(null);
    setMetadataOpenIds(new Set());
    setOpenSourceIds(new Set());
  }, [query, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleCard(cardId: string) {
    setExpandedId((current) => {
      const next = current === cardId ? null : cardId;
      if (next) {
        setMetadataOpenIds((openIds) => {
          const updated = new Set(openIds);
          updated.add(cardId);
          return updated;
        });
      }
      return next;
    });
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, cardId: string) {
    if (event.currentTarget !== event.target) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard(cardId);
    }
  }

  function goToPage(page: number) {
    setCurrentPage(page);
    setExpandedId(null);
    setMetadataOpenIds(new Set());
    setOpenSourceIds(new Set());
  }

  function toggleMetadata(cardId: string) {
    setMetadataOpenIds((current) => {
      const next = new Set(current);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  async function readInstrumentSource(instrument: Instrument, cardId: string) {
    const rawUrl = rawInstrumentSourceUrl(instrument);
    if (!rawUrl) {
      setSourceLoads((current) => ({ ...current, [cardId]: { status: "error", error: "Canonical Markdown source is unavailable for this instrument." } }));
      return;
    }

    const cached = sourceTextCache.current.get(rawUrl);
    if (cached) {
      setSourceLoads((current) => ({ ...current, [cardId]: { status: "ready", text: cached } }));
      return;
    }

    setSourceLoads((current) => ({ ...current, [cardId]: { status: "loading" } }));
    try {
      const text = await fetchSourceText(rawUrl);
      sourceTextCache.current.set(rawUrl, text);
      setSourceLoads((current) => ({ ...current, [cardId]: { status: "ready", text } }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Canonical Markdown source could not be loaded.";
      setSourceLoads((current) => ({ ...current, [cardId]: { status: "error", error: message } }));
    }
  }

  function toggleInstrumentReader(instrument: Instrument, cardId: string) {
    if (openSourceIds.has(cardId)) {
      setOpenSourceIds((current) => {
        const next = new Set(current);
        next.delete(cardId);
        return next;
      });
      return;
    }

    if (expandedId !== cardId) setExpandedId(cardId);
    setOpenSourceIds((current) => {
      const next = new Set(current);
      next.add(cardId);
      return next;
    });
    setMetadataOpenIds((current) => {
      const next = new Set(current);
      next.delete(cardId);
      return next;
    });
    void readInstrumentSource(instrument, cardId);
  }

  async function confirmSourceAction() {
    if (!sourceActionDialog) return;

    if (sourceActionDialog.action === "copy") {
      await writeTextToClipboard(sourceActionDialog.text);
    } else {
      downloadMarkdownSource(sourceActionDialog.instrument, sourceActionDialog.text);
    }

    setSourceActionDialog(null);
  }

  function openSupportLink() {
    window.open(catalogueSupportUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Shell>
      <div className="container mx-auto max-w-7xl px-5 py-8 md:px-8 lg:px-10">
        <div className="mb-5">
          <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">
            Governance Registry
          </p>
          <h1 className="mb-3 font-serif text-3xl text-foreground md:text-4xl">Instrument Catalogue</h1>
          <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Search and filter the published CAM governance instruments. The catalogue keeps browsing focused on readable instrument context while preserving source links for canonical records.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <aside className="cam-parchment-card rounded-2xl p-4 shadow-sm lg:sticky lg:top-20">
            <div className="mb-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cam-gold">Catalogue controls</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Use search and filters to narrow instruments by domain, type, hierarchy, status, effect, or enforcement without changing the underlying source corpus.
              </p>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">Search</span>
              <input
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search instruments"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cam-gold">Filters</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Derived from catalogue metadata.</p>
              </div>
              <button
                type="button"
                onClick={() => setFilters({})}
                className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {filterFields.map((f) => (
                <label key={f} className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{filterLabels[f] || f}</span>
                  <select
                    aria-label={`Filter by ${filterLabels[f] || f}`}
                    className="w-full rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={filters[f] || ""}
                    onChange={(e) => setFilters((v) => ({ ...v, [f]: e.target.value }))}
                  >
                    <option value="">All {filterLabels[f] || f}</option>
                    {(options[f] || []).map((v) => (
                      <option key={String(v)} value={String(v)}>
                        {displayValue(v)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-border/70 bg-background/40 p-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Results are paged at 20 instruments per page for stable browsing and keyboard navigation.
              </p>
            </div>
          </aside>

          <section className="min-w-0 space-y-4" data-result-range-example="Showing 1–20">
            <div className="cam-parchment-card rounded-xl p-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70" aria-live="polite">
                  Showing {pageStart}–{pageEnd} of {filtered.length} instruments.
                </p>
                <nav className="flex items-center gap-2" aria-label="Catalogue pagination">
                  <button
                    type="button"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>

            <div className="space-y-2">
              {paginated.map((it, i) => {
                const globalIndex = (safePage - 1) * pageSize + i;
                const cardId = `${it.id || "instrument"}-${globalIndex}`;
                const detailsId = `catalogue-details-${globalIndex}`;
                const description = conciseDescription(it);
                const details = detailRows(it, description);
                const source = sourceUrl(it);
                const rawSource = rawInstrumentSourceUrl(it);
                const sourceLoad = sourceLoads[cardId] ?? { status: "idle" as const };
                const isExpanded = expandedId === cardId;

                return (
                  <article
                    key={cardId}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    onClick={() => toggleCard(cardId)}
                    onKeyDown={(event) => handleCardKeyDown(event, cardId)}
                    className="group cam-parchment-card cursor-pointer rounded-xl p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[hsl(36_48%_96%)] focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words font-mono text-xs uppercase tracking-[0.14em] text-cam-gold">
                          {it.id || "Unresolved/source mapping required"}
                        </p>
                        {source ? (
                          <a
                            href={source}
                            target="_blank"
                            rel="noreferrer"
                            onClick={stopCardToggle}
                            className="shrink-0 rounded-md border border-border bg-background/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold transition-colors hover:border-primary/30 hover:bg-card hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/25"
                          >
                            Source ↗
                          </a>
                        ) : (
                          <span className="shrink-0 rounded-md border border-red-200 bg-red-50/60 px-2.5 py-1 text-xs text-red-700">Source unavailable</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words font-serif text-xl leading-snug text-foreground">
                          {it.title || "Untitled instrument"}
                        </h2>
                        {description ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                        ) : (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground/70">{missingPurposeMessage}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
                        <button
                          type="button"
                          className="rounded-md border border-cam-gold/30 bg-[rgba(184,147,90,0.08)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleInstrumentReader(it, cardId);
                          }}
                          aria-expanded={openSourceIds.has(cardId)}
                          aria-controls={`${detailsId}-reader`}
                        >
                          {openSourceIds.has(cardId) ? "Close instrument" : "Read instrument"}
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-border bg-background/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleCard(cardId);
                          }}
                        >
                          {isExpanded ? "Hide details" : "Details"}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div id={detailsId} className="mt-4 border-t border-border pt-4" onClick={(event) => event.stopPropagation()}>
                        <div className="group rounded-xl border border-cam-gold/25 bg-[rgba(184,147,90,0.08)] p-3">
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 text-left font-mono text-xs uppercase tracking-[0.18em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background"
                            onClick={() => toggleMetadata(cardId)}
                            aria-expanded={metadataOpenIds.has(cardId)}
                            aria-controls={`${detailsId}-metadata`}
                          >
                            <span className={`inline-block h-0 w-0 shrink-0 border-y-[0.35rem] border-l-[0.52rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform duration-200 ${metadataOpenIds.has(cardId) ? "rotate-90" : ""}`} aria-hidden="true" />
                            <span>Metadata</span>
                          </button>
                          {metadataOpenIds.has(cardId) && (
                            <div id={`${detailsId}-metadata`} className="mt-3 border-t border-border/70 pt-3">
                              {details.length > 0 ? (
                                <dl className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                  {details.map((field) => (
                                    <div key={field.label} className={`rounded-lg border border-border bg-background/40 px-3 py-2 ${field.variant === "wide" ? "md:col-span-2 xl:col-span-3" : ""}`}>
                                      <dt className="inline font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}: </dt>
                                      <dd className="inline break-words text-sm leading-relaxed text-foreground">{field.value}</dd>
                                    </div>
                                  ))}
                                </dl>
                              ) : (
                                <p className="rounded-lg border border-border bg-background/45 p-3 text-sm leading-relaxed text-muted-foreground">
                                  {noAdditionalMetadataMessage}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div id={`${detailsId}-reader`} className="mt-3 rounded-xl border border-cam-gold/25 bg-[rgba(184,147,90,0.08)] p-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Canonical Markdown source</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Loaded on demand from the instrument source file.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="rounded-md border border-cam-gold/30 bg-card/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleInstrumentReader(it, cardId);
                                }}
                                aria-expanded={openSourceIds.has(cardId)}
                              >
                                {sourceLoad.status === "loading" ? "Loading…" : openSourceIds.has(cardId) ? "Close instrument" : "Read instrument"}
                              </button>
                              {source && <a className="rounded-md border border-border bg-card/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25" href={source} target="_blank" rel="noreferrer" onClick={stopCardToggle}>GitHub source ↗</a>}
                            </div>
                          </div>
                          {!rawSource && <p className="text-sm leading-relaxed text-muted-foreground">Canonical Markdown source is unavailable for this instrument.</p>}
                          {!openSourceIds.has(cardId) && rawSource && <p className="text-sm leading-relaxed text-muted-foreground">Select “Read instrument” to load the source Markdown inside the catalogue.</p>}
                          {openSourceIds.has(cardId) && sourceLoad.status === "loading" && <p className="text-sm leading-relaxed text-muted-foreground">Loading canonical Markdown source…</p>}
                          {openSourceIds.has(cardId) && sourceLoad.status === "error" && <p className="text-sm leading-relaxed text-muted-foreground">{sourceLoad.error}</p>}
                          {openSourceIds.has(cardId) && sourceLoad.status === "ready" && (
                            <div className="mt-4">
                              <div className="mb-3 flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-md border border-border bg-card/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSourceActionDialog({ action: "copy", instrument: it, text: sourceLoad.text });
                                  }}
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md border border-border bg-card/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSourceActionDialog({ action: "download", instrument: it, text: sourceLoad.text });
                                  }}
                                >
                                  Download
                                </button>
                              </div>
                              <div className="max-h-[42rem] overflow-auto rounded-xl border border-border/70 bg-background/45 p-4"><MarkdownText text={sourceLoad.text} /></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {sourceActionDialog && (
        <div
          aria-labelledby="catalogue-source-action-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          onClick={() => setSourceActionDialog(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-primary/25 bg-[hsl(36_48%_95%)] p-5 text-foreground shadow-2xl md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cam-gold">Catalogue source {sourceActionDialog.action}</p>
            <h2 id="catalogue-source-action-dialog-title" className="font-serif text-2xl leading-snug text-foreground">
              {sourceActionDialog.action === "copy" ? "Copy instrument Markdown" : "Download instrument Markdown"}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                This action uses the rendered instrument Markdown source and includes the CAM Initiative citation for reuse context.
              </p>
              <div className="rounded-xl border border-border bg-card/55 p-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">Please cite CAM Initiative if you use this material</p>
                <p className="font-mono text-xs leading-relaxed text-foreground">{catalogueCitation}</p>
              </div>
              <p>{catalogueReuseNotice}</p>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                type="button"
                onClick={() => setSourceActionDialog(null)}
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
                onClick={() => void confirmSourceAction()}
              >
                {sourceActionDialog.action === "copy" ? "Copy" : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
