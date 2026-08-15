import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import {
  canonicalIdentifierLabel,
  externalSourceKey,
  loadExternalRequirements,
  loadExternalSources,
  type ExternalRequirement,
  type ExternalSourceEntry,
} from "@/lib/vigilExternalKnowledge";

type RequirementState =
  | { status: "loading" }
  | { status: "ready"; requirements: ExternalRequirement[]; sources: ExternalSourceEntry[] }
  | { status: "unavailable"; message: string };

type SourceState =
  | { status: "loading" }
  | { status: "ready"; sources: ExternalSourceEntry[] }
  | { status: "unavailable"; message: string };

function clean(value?: string) {
  return value?.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function comparable(value?: string) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sourceSummaryMeta(source: ExternalSourceEntry) {
  const title = comparable(source.title);
  const issuer = comparable(source.issuer);
  const visibleIssuer = source.issuer && issuer && !title.includes(issuer) ? source.issuer : undefined;
  const values = [visibleIssuer, source.jurisdiction, clean(source.source_class)].filter((value): value is string => Boolean(value));
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = comparable(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceMap(entries: ExternalSourceEntry[]) {
  return new Map(entries.map((entry) => [externalSourceKey(entry), entry]));
}

function referenceFor(requirement: ExternalRequirement, source?: ExternalSourceEntry) {
  const native = canonicalIdentifierLabel(source);
  return [native, requirement.clause_or_control].filter(Boolean).join(" · ");
}

function SearchControl({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="vigil-search-control vigil-reference-search">
    <Search aria-hidden="true" />
    <span className="sr-only">{placeholder}</span>
    <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    {value && <button type="button" onClick={() => onChange("")} aria-label="Clear search"><X /></button>}
  </label>;
}

export function VigilExternalRequirements() {
  const [state, setState] = useState<RequirementState>({ status: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadExternalRequirements(), loadExternalSources()]).then(([requirements, sources]) => {
      if (cancelled) return;
      if (requirements.status !== "ready") {
        setState({ status: "unavailable", message: requirements.message });
        return;
      }
      setState({ status: "ready", requirements: requirements.data, sources: sources.status === "ready" ? sources.data : [] });
    });
    return () => { cancelled = true; };
  }, []);

  const groups = useMemo(() => {
    if (state.status !== "ready") return [];
    const bySource = sourceMap(state.sources);
    const grouped = new Map<string, { source?: ExternalSourceEntry; requirements: ExternalRequirement[] }>();
    for (const requirement of state.requirements) {
      const key = `${requirement.vigil_source_id}|${requirement.source_version}`;
      const group = grouped.get(key) ?? { source: bySource.get(key), requirements: [] };
      group.requirements.push(requirement);
      grouped.set(key, group);
    }
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return [...grouped.values()]
      .map((group) => ({ ...group, requirements: group.requirements.filter((requirement) => {
        if (!terms.length) return true;
        const haystack = [group.source?.title, canonicalIdentifierLabel(group.source), requirement.clause_or_control, requirement.requirement_summary, requirement.requirement_posture, ...(requirement.applicable_actor ?? []), ...(requirement.governance_concepts ?? [])].filter(Boolean).join(" ").toLowerCase();
        return terms.every((term) => haystack.includes(term));
      }) }))
      .filter((group) => group.requirements.length > 0)
      .sort((a, b) => (a.source?.title ?? a.requirements[0]?.external_source_id ?? "").localeCompare(b.source?.title ?? b.requirements[0]?.external_source_id ?? ""));
  }, [query, state]);

  return <Shell><VigilObservatoryNav /><main className="vigil-reference-page"><div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <Link href="/observatory/knowledge-base" className="vigil-back-link">← Knowledge Base</Link>
    <header className="vigil-simple-hero vigil-reference-hero">
      <p className="vigil-library-kicker">Authoritative requirement reference</p>
      <h1>External Requirements</h1>
      <p>Browse requirement-level VIGIL reference data by the authoritative publisher’s identifier and clause. Internal <code>EXTREQ-*</code> identities remain available for VIGIL linking but are not presented as the external authority.</p>
    </header>
    <SearchControl value={query} onChange={setQuery} placeholder="Search instruments, clauses, actors, concepts or requirement text…" />

    {state.status === "loading" && <div className="vigil-reference-state">Loading canonical VIGIL external requirements…</div>}
    {state.status === "unavailable" && <div className="vigil-reference-state"><h2>Requirement projection not yet published</h2><p>{state.message}</p><p>The catalogue intentionally reads only canonical VIGIL <code>main</code>. When the separate VIGIL requirements work is merged and published, this collection will populate automatically.</p></div>}
    {state.status === "ready" && <section className="vigil-reference-groups" aria-label="External requirement instruments">
      {groups.map((group) => {
        const first = group.requirements[0];
        const title = group.source?.title ?? first.external_source_id;
        const nativeId = canonicalIdentifierLabel(group.source);
        return <details key={`${first.vigil_source_id}-${first.source_version}`} className="vigil-reference-group">
          <summary>
            <span><strong>{title}</strong><small>{nativeId} · Version {first.source_version}</small></span>
            <b>{group.requirements.length} requirements</b>
          </summary>
          <div className="vigil-requirement-list">
            {group.requirements.map((requirement) => <article key={requirement.requirement_id} className="vigil-requirement-row">
              <div className="vigil-requirement-reference">{referenceFor(requirement, group.source)}</div>
              <h3>{requirement.requirement_summary}</h3>
              <div className="vigil-requirement-meta">
                <span>{clean(requirement.requirement_posture)}</span>
                {requirement.interpretation_status && <span>{clean(requirement.interpretation_status)}</span>}
                {requirement.applicable_actor?.length ? <span>Actor: {requirement.applicable_actor.join("; ")}</span> : null}
              </div>
              {requirement.governance_concepts?.length ? <p className="vigil-requirement-concepts">{requirement.governance_concepts.map(clean).join(" · ")}</p> : null}
              <p className="vigil-internal-id">VIGIL internal identity: {requirement.requirement_id}</p>
            </article>)}
          </div>
        </details>;
      })}
      {groups.length === 0 && <div className="vigil-empty-panel">No published external requirements match that search.</div>}
    </section>}
  </div></main></Shell>;
}

export function VigilExternalSources() {
  const [state, setState] = useState<SourceState>({ status: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadExternalSources().then((result) => {
      if (cancelled) return;
      setState(result.status === "ready" ? { status: "ready", sources: result.data } : { status: "unavailable", message: result.message });
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (state.status !== "ready") return [];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return state.sources.filter((source) => {
      if (!terms.length) return true;
      const haystack = [source.title, source.issuer, source.jurisdiction, source.source_class, source.source_lifecycle_state, source.source_version, canonicalIdentifierLabel(source), source.external_source_id].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).sort((a, b) => a.title.localeCompare(b.title) || b.source_version.localeCompare(a.source_version));
  }, [query, state]);

  return <Shell><VigilObservatoryNav /><main className="vigil-reference-page"><div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <Link href="/observatory/knowledge-base" className="vigil-back-link">← Knowledge Base</Link>
    <header className="vigil-simple-hero vigil-reference-hero">
      <p className="vigil-library-kicker">Layer 0 source identity and lifecycle</p>
      <h1>Standards &amp; Sources</h1>
      <p>Browse the authoritative publisher or regulator identifiers VIGIL uses to monitor external governance instruments. OECD.AI and other third-party trackers may assist discovery but are not displayed as canonical authority.</p>
    </header>
    <SearchControl value={query} onChange={setQuery} placeholder="Search publisher, instrument, jurisdiction, canonical identifier or version…" />

    {state.status === "loading" && <div className="vigil-reference-state">Loading canonical VIGIL source register…</div>}
    {state.status === "unavailable" && <div className="vigil-reference-state"><h2>Source register unavailable</h2><p>{state.message}</p></div>}
    {state.status === "ready" && <section className="vigil-source-table" aria-label="Authoritative external governance sources">
      <div className="vigil-source-table-head" aria-hidden="true"><span>Instrument</span><span>Canonical identifier</span><span>Version</span><span>Status</span><span></span></div>
      {filtered.map((source) => {
        const summaryMeta = sourceSummaryMeta(source);
        return <article key={`${source.vigil_source_id}-${source.source_version}`} className="vigil-source-row">
          <div><h2>{source.title}</h2>{summaryMeta.length > 0 && <p className="vigil-source-summary-meta">{summaryMeta.join(" · ")}</p>}</div>
          <strong>{canonicalIdentifierLabel(source)}</strong>
          <span>{source.source_version}</span>
          <span>{clean(source.source_lifecycle_state) ?? "Not specified"}</span>
          <div>{source.official_locator && <a href={source.official_locator} target="_blank" rel="noreferrer" aria-label={`Open official source for ${source.title}`}><ExternalLink aria-hidden="true" /></a>}</div>
          <p className="vigil-source-internal">VIGIL internal: {source.vigil_source_id}</p>
        </article>;
      })}
      {filtered.length === 0 && <div className="vigil-empty-panel">No registered sources match that search.</div>}
    </section>}
  </div></main></Shell>;
}
