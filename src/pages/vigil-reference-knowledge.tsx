import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Search, X } from "lucide-react";
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
  | { status: "ready"; requirements: ExternalRequirement[]; sources: ExternalSourceEntry[]; requirementsUrl: string }
  | { status: "unavailable"; message: string };

type SourceState =
  | { status: "loading" }
  | {
      status: "ready";
      sources: ExternalSourceEntry[];
      requirements: ExternalRequirement[];
      requirementsAvailable: boolean;
      sourcesUrl: string;
      requirementsUrl?: string;
    }
  | { status: "unavailable"; message: string };

function clean(value?: string) {
  return value?.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function comparable(value?: string) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function uniqueText(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values.filter((value): value is string => Boolean(value)).filter((value) => {
    const key = comparable(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceSummaryMeta(source: ExternalSourceEntry, normativeForce?: string) {
  const title = comparable(source.title);
  const issuer = comparable(source.issuer);
  const visibleIssuer = source.issuer && issuer && !title.includes(issuer) ? source.issuer : undefined;
  return uniqueText([
    visibleIssuer,
    source.jurisdiction,
    clean(source.source_class),
    normativeForce,
  ]);
}

function sourceMap(entries: ExternalSourceEntry[]) {
  return new Map(entries.map((entry) => [externalSourceKey(entry), entry]));
}

function requirementSourceKey(requirement: Pick<ExternalRequirement, "vigil_source_id" | "source_version">) {
  return `${requirement.vigil_source_id}|${requirement.source_version}`;
}

function referenceFor(requirement: ExternalRequirement, source?: ExternalSourceEntry) {
  const native = canonicalIdentifierLabel(source);
  return [native, requirement.clause_or_control].filter(Boolean).join(" · ");
}

function normativeForcesBySource(requirements: ExternalRequirement[]) {
  const values = new Map<string, Set<string>>();
  for (const requirement of requirements) {
    if (!requirement.normative_force) continue;
    const key = requirementSourceKey(requirement);
    const bucket = values.get(key) ?? new Set<string>();
    bucket.add(requirement.normative_force);
    values.set(key, bucket);
  }
  return new Map([...values.entries()].map(([key, forceSet]) => {
    const labels = [...forceSet].map(clean).filter((value): value is string => Boolean(value));
    return [key, labels.join(" / ")];
  }));
}

function SearchControl({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="vigil-search-control vigil-reference-search">
    <Search aria-hidden="true" />
    <span className="sr-only">{placeholder}</span>
    <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    {value && <button type="button" onClick={() => onChange("")} aria-label="Clear search"><X /></button>}
  </label>;
}

function DatasetLink({ href, children }: { href: string; children: string }) {
  return <a className="vigil-dataset-link" href={href} target="_blank" rel="noreferrer" download>
    <Download aria-hidden="true" />
    {children}
  </a>;
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
      setState({
        status: "ready",
        requirements: requirements.data,
        sources: sources.status === "ready" ? sources.data : [],
        requirementsUrl: requirements.attemptedUrl,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const groups = useMemo(() => {
    if (state.status !== "ready") return [];
    const bySource = sourceMap(state.sources);
    const grouped = new Map<string, { source?: ExternalSourceEntry; requirements: ExternalRequirement[] }>();
    for (const requirement of state.requirements) {
      const key = requirementSourceKey(requirement);
      const group = grouped.get(key) ?? { source: bySource.get(key), requirements: [] };
      group.requirements.push(requirement);
      grouped.set(key, group);
    }
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return [...grouped.values()]
      .map((group) => ({ ...group, requirements: group.requirements.filter((requirement) => {
        if (!terms.length) return true;
        const haystack = [
          group.source?.title,
          group.source?.jurisdiction,
          canonicalIdentifierLabel(group.source),
          requirement.clause_or_control,
          requirement.requirement_summary,
          requirement.requirement_posture,
          requirement.normative_force,
          requirement.expectation_type,
          requirement.alignment_relationship,
          ...(requirement.applicable_actor ?? []),
          ...(requirement.governance_concepts ?? []),
        ].filter(Boolean).join(" ").toLowerCase();
        return terms.every((term) => haystack.includes(term));
      }) }))
      .filter((group) => group.requirements.length > 0)
      .sort((a, b) => (a.source?.title ?? a.requirements[0]?.external_source_id ?? "").localeCompare(b.source?.title ?? b.requirements[0]?.external_source_id ?? ""));
  }, [query, state]);

  return <Shell><VigilObservatoryNav /><main className="vigil-reference-page"><div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <Link href="/observatory/knowledge-base" className="vigil-back-link">← Knowledge Base</Link>
    <header className="vigil-simple-hero vigil-reference-hero">
      <p className="vigil-library-kicker">Governance requirement reference</p>
      <h1>External Requirements</h1>
      <p>Browse clause- and control-level governance requirements extracted from registered external sources, including requirement posture, normative force, applicable actors and governance concepts.</p>
    </header>
    <SearchControl value={query} onChange={setQuery} placeholder="Search instruments, clauses, jurisdiction, normative force, actors, concepts or requirement text…" />

    {state.status === "loading" && <div className="vigil-reference-state">Loading external requirements…</div>}
    {state.status === "unavailable" && <div className="vigil-reference-state"><h2>Requirement dataset unavailable</h2><p>{state.message}</p></div>}
    {state.status === "ready" && <>
      <div className="vigil-dataset-toolbar">
        <p><strong>{state.requirements.length.toLocaleString()}</strong> published requirement records across <strong>{groups.length.toLocaleString()}</strong> matching source/version groups.</p>
        <div className="vigil-dataset-actions"><DatasetLink href={state.requirementsUrl}>Download requirements dataset</DatasetLink></div>
      </div>
      <section className="vigil-reference-groups" aria-label="External requirement instruments">
        {groups.map((group) => {
          const first = group.requirements[0];
          const title = group.source?.title ?? first.external_source_id;
          const nativeId = canonicalIdentifierLabel(group.source);
          const forces = uniqueText(group.requirements.map((requirement) => clean(requirement.normative_force)));
          const groupMeta = uniqueText([group.source?.jurisdiction, ...forces]);
          return <details key={`${first.vigil_source_id}-${first.source_version}`} className="vigil-reference-group">
            <summary>
              <span><strong>{title}</strong><small>{nativeId} · Version {first.source_version}{groupMeta.length ? ` · ${groupMeta.join(" · ")}` : ""}</small></span>
              <b>{group.requirements.length} requirements</b>
            </summary>
            <div className="vigil-requirement-list">
              {group.requirements.map((requirement) => <article key={requirement.requirement_id} className="vigil-requirement-row">
                <div className="vigil-requirement-reference">{referenceFor(requirement, group.source)}</div>
                <h3>{requirement.requirement_summary}</h3>
                <div className="vigil-requirement-meta">
                  <span>Posture: {clean(requirement.requirement_posture)}</span>
                  {requirement.normative_force && <span>Force: {clean(requirement.normative_force)}</span>}
                  {requirement.expectation_type && <span>Expectation: {clean(requirement.expectation_type)}</span>}
                  {requirement.alignment_relationship && <span>Claim family: {clean(requirement.alignment_relationship)}</span>}
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
      </section>
    </>}
  </div></main></Shell>;
}

export function VigilExternalSources() {
  const [state, setState] = useState<SourceState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [normativeForce, setNormativeForce] = useState("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadExternalSources(), loadExternalRequirements()]).then(([sources, requirements]) => {
      if (cancelled) return;
      if (sources.status !== "ready") {
        setState({ status: "unavailable", message: sources.message });
        return;
      }
      setState({
        status: "ready",
        sources: sources.data,
        requirements: requirements.status === "ready" ? requirements.data : [],
        requirementsAvailable: requirements.status === "ready",
        sourcesUrl: sources.attemptedUrl,
        requirementsUrl: requirements.status === "ready" ? requirements.attemptedUrl : undefined,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const forceBySource = useMemo(() => state.status === "ready" ? normativeForcesBySource(state.requirements) : new Map<string, string>(), [state]);

  const jurisdictions = useMemo(() => {
    if (state.status !== "ready") return [];
    return uniqueText(state.sources.map((source) => source.jurisdiction)).sort((a, b) => a.localeCompare(b));
  }, [state]);

  const normativeForces = useMemo(() => {
    if (state.status !== "ready") return [];
    return uniqueText([...forceBySource.values()]).sort((a, b) => a.localeCompare(b));
  }, [forceBySource, state]);

  const filtered = useMemo(() => {
    if (state.status !== "ready") return [];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return state.sources.filter((source) => {
      const force = forceBySource.get(externalSourceKey(source));
      if (jurisdiction !== "all" && source.jurisdiction !== jurisdiction) return false;
      if (normativeForce !== "all" && force !== normativeForce) return false;
      if (!terms.length) return true;
      const haystack = [source.title, source.issuer, source.jurisdiction, source.source_class, source.source_lifecycle_state, source.source_version, canonicalIdentifierLabel(source), source.external_source_id, force].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).sort((a, b) => a.title.localeCompare(b.title) || b.source_version.localeCompare(a.source_version));
  }, [forceBySource, jurisdiction, normativeForce, query, state]);

  return <Shell><VigilObservatoryNav /><main className="vigil-reference-page"><div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <Link href="/observatory/knowledge-base" className="vigil-back-link">← Knowledge Base</Link>
    <header className="vigil-simple-hero vigil-reference-hero">
      <p className="vigil-library-kicker">Public governance reference dataset</p>
      <h1>Standards &amp; Sources</h1>
      <p>Browse registered external governance instruments by publisher identity, jurisdiction, version, source class and lifecycle. Where requirement metadata is available, source-level normative-force classification is shown separately from clause-level requirement posture.</p>
    </header>

    {state.status === "loading" && <div className="vigil-reference-state">Loading source register…</div>}
    {state.status === "unavailable" && <div className="vigil-reference-state"><h2>Source register unavailable</h2><p>{state.message}</p></div>}
    {state.status === "ready" && <>
      <div className="vigil-dataset-toolbar">
        <p><strong>{state.sources.length.toLocaleString()}</strong> published source versions. {filtered.length !== state.sources.length ? <span>{filtered.length.toLocaleString()} match the current filters.</span> : null}</p>
        <div className="vigil-dataset-actions">
          <DatasetLink href={state.sourcesUrl}>Download source dataset</DatasetLink>
          {state.requirementsUrl && <DatasetLink href={state.requirementsUrl}>Download requirements dataset</DatasetLink>}
        </div>
      </div>

      <div className="vigil-reference-controls">
        <SearchControl value={query} onChange={setQuery} placeholder="Search publisher, instrument, jurisdiction, source class, normative force, identifier or version…" />
        <label className="vigil-reference-filter"><span>Jurisdiction</span><select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option value="all">All jurisdictions</option>{jurisdictions.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label className="vigil-reference-filter"><span>Normative force</span><select value={normativeForce} onChange={(event) => setNormativeForce(event.target.value)} disabled={!state.requirementsAvailable}><option value="all">{state.requirementsAvailable ? "All authority categories" : "Requirements metadata unavailable"}</option>{normativeForces.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </div>

      <section className="vigil-source-table" aria-label="Authoritative external governance sources">
        <div className="vigil-source-table-head" aria-hidden="true"><span>Instrument</span><span>Canonical identifier</span><span>Version</span><span>Status</span><span></span></div>
        {filtered.map((source) => {
          const force = forceBySource.get(externalSourceKey(source));
          const summaryMeta = sourceSummaryMeta(source, force);
          return <article key={`${source.vigil_source_id}-${source.source_version}`} className="vigil-source-row">
            <div><h2>{source.title}</h2>{summaryMeta.length > 0 && <p className="vigil-source-summary-meta">{summaryMeta.join(" · ")}</p>}</div>
            <strong>{canonicalIdentifierLabel(source)}</strong>
            <span>{source.source_version}</span>
            <span>{clean(source.source_lifecycle_state) ?? "Not specified"}</span>
            <div>{source.official_locator && <a href={source.official_locator} target="_blank" rel="noreferrer" aria-label={`Open official source for ${source.title}`}><ExternalLink aria-hidden="true" /></a>}</div>
            <p className="vigil-source-internal">VIGIL internal: {source.vigil_source_id}</p>
          </article>;
        })}
        {filtered.length === 0 && <div className="vigil-empty-panel">No registered sources match the current search and filters.</div>}
      </section>
    </>}
  </div></main></Shell>;
}
