import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { loadVigilRegistryRecords } from "@/lib/vigilRegistry";
import { normalizeRecords, publicRepairStateLabel, titleizeValue, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { matchesVigilSearch } from "@/lib/vigilPublicDisplay";

type Projection = "incidents" | "repairs";

const config = {
  incidents: {
    eyebrow: "What happened?",
    title: "Incidents & Observations",
    description: "Browse the real-world observations and research evidence from which VIGIL diagnoses repeatable failure patterns.",
    types: new Set(["observation", "research"]),
    placeholder: "Search incidents, systems, sources or observed behaviour…",
  },
  repairs: {
    eyebrow: "What governance response resulted?",
    title: "Governance Repairs",
    description: "Trace proposals, implemented patches, corpus targets, verification and outstanding governance pathways.",
    types: new Set(["proposal", "patch_note", "patch"]),
    placeholder: "Search controls, proposals, patches or corpus targets…",
  },
} satisfies Record<Projection, { eyebrow: string; title: string; description: string; types: Set<string>; placeholder: string }>;

function recordFinding(record: VigilIndexRecord, projection: Projection) {
  if (projection === "incidents") return record.publicDisplay.observation?.observed ?? record.publicDisplay.finding ?? record.summary;
  return record.publicDisplay.patch?.repairSummary
    ?? record.publicDisplay.proposal?.proposedOutcome
    ?? record.publicDisplay.finding
    ?? record.summary;
}

function ProjectionPage({ projection }: { projection: Projection }) {
  const copy = config[projection];
  const [records, setRecords] = useState<VigilIndexRecord[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadVigilRegistryRecords()
      .then((result) => {
        if (cancelled) return;
        setRecords(normalizeRecords(result.records).filter((record) => copy.types.has(record.record_type)));
        setMessage(result.message ?? "");
        setState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage((error as Error).message);
        setState("error");
      });
    return () => { cancelled = true; };
  }, [copy.types]);

  const filtered = useMemo(() => records.filter((record) => matchesVigilSearch(record.searchText, search)), [records, search]);

  return (
    <Shell>
      <VigilObservatoryNav />
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10 md:py-14">
        <header className="max-w-4xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.19em] text-primary">{copy.eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{copy.description}</p>
        </header>

        <label className="mt-8 flex max-w-3xl items-center gap-3 rounded-xl border border-input bg-card px-4 shadow-sm focus-within:border-primary/55 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="sr-only">Search {copy.title}</span>
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.placeholder} className="min-w-0 flex-1 bg-transparent py-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground/70" />
        </label>

        {state === "loading" && <div className="mt-6 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Loading published VIGIL records…</div>}
        {state === "error" && <div className="mt-6 rounded-xl border border-destructive/40 bg-card p-5 text-sm text-destructive">{message}</div>}
        {state === "ready" && message && <div className="mt-6 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{message}</div>}

        {state === "ready" && (
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.11em] text-muted-foreground">{filtered.length} published {filtered.length === 1 ? "record" : "records"}</p>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filtered.map((record) => (
            <article key={record.id} className="cam-parchment-card flex flex-col rounded-2xl p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <span className="text-primary">{record.id}</span>
                <span>·</span>
                <span>{titleizeValue(record.record_type)}</span>
              </div>
              <h2 className="mt-3 font-serif text-2xl leading-snug text-foreground">{record.title}</h2>
              <p className="mt-3 flex-1 text-[15px] leading-7 text-foreground/80">{recordFinding(record, projection) || "No public summary is currently available."}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <VigilStatusChip value={record.evidence_confidence} prefix="Evidence" />
                <VigilStatusChip value={record.publicDisplay.lifecycleLabel ?? record.record_state} />
                {projection === "repairs" && <VigilStatusChip value={publicRepairStateLabel(record.repair_status, record.publicDisplay.repairState)} />}
              </div>
              <Link href={`/observatory/reports/${encodeURIComponent(record.id)}`} className="mt-5 inline-flex items-center gap-2 self-start font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary hover:underline">
                Trace record <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function VigilIncidents() {
  return <ProjectionPage projection="incidents" />;
}

export function VigilRepairs() {
  return <ProjectionPage projection="repairs" />;
}
