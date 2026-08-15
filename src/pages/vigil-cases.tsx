import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { loadVigilRegistryRecords } from "@/lib/vigilRegistry";
import { normalizeRecords, titleizeValue, type VigilIndexRecord } from "@/lib/vigilPresentation";
import { matchesVigilSearch } from "@/lib/vigilPublicDisplay";

type PageState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; notice?: string }
  | { status: "error"; message: string };

function dateFor(record: VigilIndexRecord) {
  return record.publicDisplay.dates.firstObserved ?? record.date_recorded ?? record.publicDisplay.dates.published ?? record.record_last_updated ?? "";
}

function caseSummary(record: VigilIndexRecord) {
  return record.publicDisplay.observation?.observed
    ?? record.publicDisplay.finding
    ?? record.publicDisplay.failure?.definition
    ?? record.summary
    ?? "No public case summary is currently available.";
}

function caseAnchors(records: VigilIndexRecord[]) {
  const evidenceOrigins = records.filter((record) => record.record_type === "observation" || record.record_type === "research");
  const embeddedEvidenceFailures = records.filter((record) => record.record_type === "failure_mode" && record.publicDisplay.chain.observations.length === 0);
  return [...evidenceOrigins, ...embeddedEvidenceFailures]
    .filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id) === index)
    .sort((a, b) => dateFor(b).localeCompare(dateFor(a)) || a.title.localeCompare(b.title));
}

function compactEvidence(value?: string) {
  const normalized = String(value ?? "").toLowerCase();
  if (!normalized) return "Evidence recorded";
  if (normalized.includes("verified") || normalized.includes("confirmed")) return "Verified";
  if (normalized.includes("strong") || normalized.includes("substantial") || normalized.includes("multiple")) return "Supported";
  if (normalized.includes("partial") || normalized.includes("limited") || normalized.includes("provisional") || normalized.includes("uncertain")) return "Partial";
  return "Evidence recorded";
}

function ChainSummary({ record }: { record: VigilIndexRecord }) {
  const chain = record.publicDisplay.chain;
  const stages = [
    ["Evidence", chain.observations.length || (record.record_type === "observation" || record.record_type === "research") ? 1 : 0],
    ["Failure", chain.failureModes.length || record.record_type === "failure_mode" ? 1 : 0],
    ["Diagnosis", chain.proposals.length ? 1 : 0],
    ["Repair", chain.patches.length ? 1 : 0],
  ] as const;
  return <div className="vigil-case-chain-preview" aria-label="Case chain state">
    {stages.map(([label, present], index) => <span key={label} className={present ? "is-present" : undefined}>{label}{index < stages.length - 1 ? <b aria-hidden="true">→</b> : null}</span>)}
  </div>;
}

export default function VigilCases() {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadVigilRegistryRecords()
      .then((result) => {
        if (cancelled) return;
        setState({ status: "ready", records: caseAnchors(normalizeRecords(result.records)), notice: result.message });
      })
      .catch((error) => !cancelled && setState({ status: "error", message: (error as Error).message }));
    return () => { cancelled = true; };
  }, []);

  const records = state.status === "ready" ? state.records : [];
  const filtered = useMemo(() => records.filter((record) => matchesVigilSearch(record.searchText, search)), [records, search]);

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-cases-page">
        <div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10">
          <header className="vigil-simple-hero">
            <p className="vigil-library-kicker">Evidence → diagnosis → repair → learning</p>
            <h1>Case Files</h1>
            <p>Follow real-world evidence through failure classification, governance diagnosis, repair and durable learning without decoding the underlying record schema first.</p>
          </header>

          <div className="vigil-case-search-row">
            <label className="vigil-search-control">
              <Search aria-hidden="true" />
              <span className="sr-only">Search VIGIL case files</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search incidents, systems, evidence, failure patterns or controls…" />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X /></button>}
            </label>
            {state.status === "ready" && <span className="vigil-case-count">{filtered.length} case {filtered.length === 1 ? "file" : "files"}</span>}
          </div>

          {state.status === "loading" && <div className="vigil-registry-notice vigil-standalone-notice">Loading published VIGIL case origins…</div>}
          {state.status === "error" && <div className="vigil-registry-notice vigil-standalone-notice is-error">{state.message}</div>}
          {state.status === "ready" && state.notice && <div className="vigil-registry-notice vigil-standalone-notice">{state.notice}</div>}

          {state.status === "ready" && (
            <section className="vigil-case-list" aria-label="VIGIL Case Files">
              {filtered.map((record) => {
                const href = `/observatory/cases/${encodeURIComponent(record.id)}`;
                return (
                  <article key={record.id} className="vigil-case-card">
                    <Link href={href} className="vigil-case-card-link" aria-label={`Open case file ${record.title}`}>
                      <div className="vigil-case-card-main">
                        <div className="vigil-case-meta-line">
                          <span>{record.id}</span>
                          <span>{titleizeValue(record.record_type)}</span>
                          {dateFor(record) && <span>{dateFor(record)}</span>}
                        </div>
                        <h2>{record.title}</h2>
                        <p>{caseSummary(record)}</p>
                        <ChainSummary record={record} />
                      </div>
                      <div className="vigil-case-card-side">
                        <VigilStatusChip value={compactEvidence(record.evidence_confidence)} prefix="Evidence" />
                        <VigilStatusChip value={record.publicDisplay.lifecycleLabel ?? record.record_state} />
                        <span className="vigil-case-open-link">Open case file →</span>
                      </div>
                    </Link>
                  </article>
                );
              })}
              {filtered.length === 0 && <div className="vigil-empty-panel">No case files match that search. Try a broader description.</div>}
            </section>
          )}
        </div>
      </main>
    </Shell>
  );
}
