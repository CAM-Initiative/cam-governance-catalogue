import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import registrySources from "@/config/registrySources.json";

type Instrument = Record<string, string | boolean | null | undefined>;
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
const pageSize = 20;
const camRegistrySource = registrySources.cam;
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

function sourceUrl(link?: string | boolean | null) {
  const cleaned = cleanValue(link);
  return cleaned ? `https://github.com/${camRegistrySource.repo}/blob/${camRegistrySource.branch}/Governance/${cleaned}` : "";
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

function stopCardToggle(event: MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

export default function Catalogue() {
  const [rows, setRows] = useState<Instrument[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
  }, [query, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleCard(cardId: string) {
    setExpandedId((current) => (current === cardId ? null : cardId));
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
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Use search and filters to narrow instruments by domain, type, hierarchy, status, effect, or enforcement without changing the underlying source corpus.
              </p>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">Search</span>
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
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Derived from catalogue metadata.</p>
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
                  <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">{filterLabels[f] || f}</span>
                  <select
                    aria-label={`Filter by ${filterLabels[f] || f}`}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70" aria-live="polite">
                Showing {pageStart}–{pageEnd} of {filtered.length} instruments.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
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
                const source = sourceUrl(it.link);
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

                      <div className="flex justify-end border-t border-border/70 pt-3">
                        <span className="rounded-md border border-border bg-background/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cam-gold">
                          {isExpanded ? "Hide details" : "Details"}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div id={detailsId} className="mt-4 border-t border-border pt-4" onClick={(event) => event.stopPropagation()}>
                        {details.length > 0 ? (
                          <dl className="grid gap-3 md:grid-cols-2">
                            {details.map((field) => (
                              <div key={field.label} className={`rounded-lg border border-border bg-background/45 p-3 ${field.variant === "wide" ? "md:col-span-2" : ""}`}>
                                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</dt>
                                <dd className="mt-1 break-words text-sm leading-relaxed text-foreground">{field.value}</dd>
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
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}
