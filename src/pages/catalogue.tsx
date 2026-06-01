import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";

type Instrument = Record<string, string | null | undefined>;
type Chip = { label: string; value: string };
type Detail = { label: string; value?: string | null };

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

const detailFields: Array<{ key: string; label: string; fallback?: string }> = [
  { key: "id", label: "Instrument ID" },
  { key: "title", label: "Title" },
  { key: "domain", label: "Domain" },
  { key: "instrument_class", label: "Type" },
  { key: "hierarchy_type", label: "Hierarchy" },
  { key: "status", label: "Status" },
  { key: "effect", label: "Effect" },
  { key: "enforcement", label: "Enforcement" },
  { key: "purpose", label: "Purpose", fallback: missingPurposeMessage },
  { key: "link", label: "Source Path" },
  { key: "version", label: "Version" },
  { key: "review_state", label: "Review State" },
  { key: "authority_role", label: "Authority Role" },
  { key: "parent_id", label: "Parent Instrument" },
  { key: "updated_at", label: "Updated" },
  { key: "pinned_sha", label: "Pinned SHA" },
];

function cleanValue(value?: string | null) {
  return String(value ?? "")
    .replace(/^\*+\s*/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function displayValue(value?: string | null) {
  const cleaned = cleanValue(value);
  if (!cleaned) return "";
  if (cleaned === cleaned.toLowerCase() || cleaned === cleaned.toUpperCase()) return titleCase(cleaned);
  return cleaned;
}

function normalizeForDedupe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function instrumentDescription(it: Instrument) {
  return cleanValue(it.purpose) || cleanValue(it.summary);
}

function sourceUrl(link?: string | null) {
  const cleaned = cleanValue(link);
  return cleaned ? `https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/${cleaned}` : "";
}

function instrumentChips(it: Instrument) {
  const candidates: Chip[] = [
    { label: "Domain", value: displayValue(it.domain) },
    { label: "Type", value: displayValue(it.instrument_class) },
    { label: "Hierarchy", value: displayValue(it.hierarchy_type) },
    { label: "Status", value: displayValue(it.status) },
    { label: "Effect", value: displayValue(it.effect) },
    { label: "Enforcement", value: displayValue(it.enforcement) },
  ];
  const seen = new Set<string>();

  return candidates.filter((chip) => {
    if (!chip.value) return false;
    const key = normalizeForDedupe(chip.value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function detailRows(it: Instrument) {
  return detailFields
    .map<Detail>((field) => ({
      label: field.label,
      value: displayValue(it[field.key]) || field.fallback,
    }))
    .filter((field) => field.value);
}

function stopCardToggle(event: MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

export default function Catalogue() {
  const [rows, setRows] = useState<Instrument[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cam-governance.json`)
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
        setRows(items);
      });
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

  return (
    <Shell>
      <div className="container mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="mb-6">
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">
            Governance Registry
          </p>
          <h1 className="mb-3 font-serif text-4xl text-foreground">Instrument Catalogue</h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            Search and filter the published CAM governance instruments without modifying the source corpus.
          </p>
        </div>

        <div className="cam-parchment-card mb-6 rounded-2xl p-5 shadow-sm">
          <input
            className="mb-4 w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search instruments"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {filterFields.map((f) => (
              <select
                key={f}
                className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={filters[f] || ""}
                onChange={(e) => setFilters((v) => ({ ...v, [f]: e.target.value }))}
              >
                <option value="">All {filterLabels[f] || f}</option>
                {(options[f] || []).map((v) => (
                  <option key={String(v)} value={String(v)}>
                    {displayValue(String(v))}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((it, i) => {
            const cardId = `${it.id || "instrument"}-${i}`;
            const detailsId = `catalogue-details-${i}`;
            const description = instrumentDescription(it);
            const chips = instrumentChips(it);
            const details = detailRows(it);
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
                className="group cam-parchment-card cursor-pointer rounded-xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-mono text-sm text-cam-gold">
                      {it.id || "Unresolved/source mapping required"}
                    </h2>
                  </div>
                  {source ? (
                    <a
                      href={source}
                      target="_blank"
                      rel="noreferrer"
                      onClick={stopCardToggle}
                      className="shrink-0 rounded-md border border-border bg-background/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-cam-gold transition-colors hover:border-primary/30 hover:bg-card hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/25"
                    >
                      Source ↗
                    </a>
                  ) : (
                    <span className="shrink-0 rounded-md border border-red-200 bg-red-50/60 px-2.5 py-1 text-xs text-red-700">Source unavailable</span>
                  )}
                </div>

                <p className="mb-2 font-serif text-xl leading-snug text-foreground">{it.title || "Untitled instrument"}</p>
                {description ? (
                  <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground/70">{missingPurposeMessage}</p>
                )}

                {chips.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <span key={`${chip.label}-${chip.value}`} className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        <span className="text-foreground">{chip.label}:</span> {chip.value}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cam-gold">
                    {isExpanded ? "Hide metadata" : "View metadata"}
                  </span>
                  <span className={`text-lg leading-none text-cam-gold transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true">
                    ˅
                  </span>
                </div>

                {isExpanded && (
                  <div id={detailsId} className="mt-4 border-t border-border pt-4" onClick={(event) => event.stopPropagation()}>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {details.map((field) => (
                        <div key={field.label} className="rounded-lg border border-border bg-background/45 p-3">
                          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{field.label}</dt>
                          <dd className="mt-1 break-words text-sm leading-relaxed text-foreground">{field.value}</dd>
                        </div>
                      ))}
                    </dl>

                    {source && (
                      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-background/45 p-3 md:flex-row md:items-center md:justify-between">
                        <p className="break-words font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                          Source path: {it.link}
                        </p>
                        <a
                          href={source}
                          target="_blank"
                          rel="noreferrer"
                          onClick={stopCardToggle}
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/25"
                        >
                          Open source →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
