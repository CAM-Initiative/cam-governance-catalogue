import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { loadVigilRegistryRecords } from "@/lib/vigilRegistry";
import {
  canonicalComparisonKey,
  deriveFailureFamilyCounts,
  normalizeFailureFamilyLabel,
  normalizeRecords,
  type VigilIndexRecord,
} from "@/lib/vigilPresentation";
import { matchesVigilSearch } from "@/lib/vigilPublicDisplay";

type PageState =
  | { status: "loading" }
  | { status: "ready"; records: VigilIndexRecord[]; notice?: string }
  | { status: "error"; message: string };

function compactId(id: string) {
  return id.replace(/^VIGIL-\d{4}-/i, "");
}

function caseSummary(record: VigilIndexRecord) {
  return record.publicDisplay.failure?.definition
    ?? record.publicDisplay.finding
    ?? record.summary
    ?? "No public failure definition is currently available.";
}

function familyLabel(record: VigilIndexRecord) {
  return normalizeFailureFamilyLabel(record.failure_family)?.replace(/\s+Failures$/i, "") ?? record.failure_family;
}

function failureModeCases(records: VigilIndexRecord[]) {
  return records
    .filter((record) => record.record_type === "failure_mode")
    .sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export default function VigilCases() {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadVigilRegistryRecords()
      .then((result) => {
        if (cancelled) return;
        setState({ status: "ready", records: failureModeCases(normalizeRecords(result.records)), notice: result.message });
      })
      .catch((error) => !cancelled && setState({ status: "error", message: (error as Error).message }));
    return () => { cancelled = true; };
  }, []);

  const records = state.status === "ready" ? state.records : [];
  const families = useMemo(() => deriveFailureFamilyCounts(records), [records]);
  const filtered = useMemo(() => records.filter((record) => {
    if (!matchesVigilSearch(record.searchText, search)) return false;
    if (family && canonicalComparisonKey(normalizeFailureFamilyLabel(record.failure_family)) !== family) return false;
    return true;
  }), [family, records, search]);

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-cases-page">
        <div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10">
          <header className="vigil-simple-hero">
            <p className="vigil-library-kicker">AI failure mode investigations</p>
            <h1>Case Files</h1>
            <p>Start with the repeatable failure pattern, then follow the evidence, classification, diagnosis, governance response, learning and provenance that surround it.</p>
          </header>

          <div className="vigil-case-search-row vigil-case-search-row-v3">
            <label className="vigil-search-control">
              <Search aria-hidden="true" />
              <span className="sr-only">Search VIGIL Case Files</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search AI failure mode investigations…" />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X /></button>}
            </label>
            <label className="vigil-family-select vigil-case-family-select">
              <span>Failure family</span>
              <select value={family} onChange={(event) => setFamily(event.target.value)}>
                <option value="">All families ({records.length})</option>
                {families.map((entry) => <option key={entry.key} value={entry.key}>{entry.label.replace(/\s+Failures$/i, "")} ({entry.count})</option>)}
              </select>
            </label>
            {state.status === "ready" && <span className="vigil-case-count">{filtered.length} case {filtered.length === 1 ? "file" : "files"}</span>}
          </div>

          {state.status === "loading" && <div className="vigil-registry-notice vigil-standalone-notice">Loading published VIGIL failure-mode investigations…</div>}
          {state.status === "error" && <div className="vigil-registry-notice vigil-standalone-notice is-error">{state.message}</div>}
          {state.status === "ready" && state.notice && <div className="vigil-registry-notice vigil-standalone-notice">{state.notice}</div>}

          {state.status === "ready" && (
            <section className="vigil-case-list vigil-case-list-v3" aria-label="VIGIL Case Files">
              {filtered.map((record) => {
                const href = `/observatory/cases/${encodeURIComponent(record.id)}`;
                const familyName = familyLabel(record);
                return (
                  <article key={record.id} className="vigil-case-card vigil-case-card-v3">
                    <Link href={href} className="vigil-case-card-link" aria-label={`Open case file ${record.title}`}>
                      <div className="vigil-case-card-main">
                        <div className="vigil-case-meta-line">
                          <span>{compactId(record.id)}</span>
                          {familyName && <span>{familyName}</span>}
                        </div>
                        <h2>{record.title}</h2>
                        <p>{caseSummary(record)}</p>
                      </div>
                      <div className="vigil-case-card-side vigil-case-card-side-v3">
                        <VigilStatusChip value={record.severity ?? "Not assessed"} />
                        <span className="vigil-case-open-link">View investigation →</span>
                      </div>
                    </Link>
                  </article>
                );
              })}
              {filtered.length === 0 && <div className="vigil-empty-panel">No case files match that search. Try a broader description or another failure family.</div>}
            </section>
          )}
        </div>
      </main>
    </Shell>
  );
}
