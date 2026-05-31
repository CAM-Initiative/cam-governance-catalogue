import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";

type Instrument = Record<string, string>;

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
const pendingDescription = "Purpose statement pending / unresolved from source metadata.";

function instrumentDescription(it: Instrument) {
  return it.purpose || it.summary || pendingDescription;
}

function metadataLine(it: Instrument) {
  return [it.domain, it.instrument_class, it.status].filter(Boolean).join(" · ");
}

export default function Catalogue() {
  const [rows, setRows] = useState<Instrument[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

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
                <option value="">All {f}</option>
                {(options[f] || []).map((v: string) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((it, i) => {
            const description = instrumentDescription(it);
            const metadata = metadataLine(it);

            return (
              <article key={`${it.id}-${i}`} className="cam-parchment-card rounded-xl p-5 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-mono text-sm text-cam-gold">
                      {it.id || "Unresolved/source mapping required"}
                    </h2>
                    {metadata && <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">{metadata}</p>}
                  </div>
                  {it.link ? (
                    <a
                      href={`https://github.com/CAM-Initiative/Caelestis/blob/main/Governance/${it.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 font-mono text-sm uppercase tracking-[0.12em] text-cam-gold transition-colors hover:text-primary/80"
                    >
                      Source ↗
                    </a>
                  ) : (
                    <span className="shrink-0 text-sm text-red-700">Unresolved/source mapping required</span>
                  )}
                </div>
                <p className="mb-2 font-serif text-xl text-foreground">{it.title}</p>
                <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
