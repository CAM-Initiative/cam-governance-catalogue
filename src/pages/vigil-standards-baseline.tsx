import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import {
  canonicalIdentifierLabel,
  externalSourceKey,
  loadExternalRequirementDetails,
  loadExternalRequirements,
  loadExternalSourceScope,
  loadExternalSources,
  type ExternalRequirement,
  type ExternalRequirementDetail,
  type ExternalSourceEntry,
  type ExternalSourceScopeEntry,
} from "@/lib/vigilExternalKnowledge";

type BaselineState =
  | { status: "loading" }
  | { status: "ready"; sources: ExternalSourceEntry[]; requirements: ExternalRequirement[]; details: ExternalRequirementDetail[]; scopes: ExternalSourceScopeEntry[] }
  | { status: "unavailable"; message: string };

function clean(value?: string) {
  return value?.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueText(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values.filter((value): value is string => Boolean(value)).filter((value) => {
    const key = value.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function requirementSourceKey(requirement: Pick<ExternalRequirement, "vigil_source_id" | "source_version">) {
  return `${requirement.vigil_source_id}|${requirement.source_version}`;
}

function sourceScopeKey(scope: Pick<ExternalSourceScopeEntry, "vigil_source_id" | "source_version">) {
  return `${scope.vigil_source_id}|${scope.source_version}`;
}

function sourceIdentity(source: ExternalSourceEntry) {
  return source.external_source_id || source.vigil_source_id;
}

function sourcePublicSummary(source: ExternalSourceEntry) {
  return source.public_summary?.trim() || "A substantive public summary is not yet available for this source.";
}

function CaseCell({ label, children }: { label: string; children: ReactNode }) {
  return <div className="vigil-case-table-cell"><span className="vigil-case-mobile-label">{label}</span>{children}</div>;
}

export default function VigilStandardsBaseline() {
  const [state, setState] = useState<BaselineState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [sourceType, setSourceType] = useState("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadExternalSources(), loadExternalRequirements(), loadExternalRequirementDetails(), loadExternalSourceScope()])
      .then(([sources, requirements, details, scopes]) => {
        if (cancelled) return;
        if (sources.status !== "ready") return setState({ status: "unavailable", message: sources.message });
        setState({
          status: "ready",
          sources: sources.data,
          requirements: requirements.status === "ready" ? requirements.data : [],
          details: details.status === "ready" ? details.data : [],
          scopes: scopes.status === "ready" ? scopes.data : [],
        });
      })
      .catch((error) => !cancelled && setState({ status: "unavailable", message: (error as Error).message }));
    return () => { cancelled = true; };
  }, []);

  const scopeBySource = useMemo(() => state.status === "ready" ? new Map(state.scopes.map((scope) => [sourceScopeKey(scope), scope])) : new Map<string, ExternalSourceScopeEntry>(), [state]);
  const detailsById = useMemo(() => state.status === "ready" ? new Map(state.details.map((requirement) => [requirement.requirement_id, requirement])) : new Map<string, ExternalRequirementDetail>(), [state]);
  const clausesBySource = useMemo(() => {
    const grouped = new Map<string, ExternalRequirementDetail[]>();
    if (state.status !== "ready") return grouped;
    for (const requirement of state.requirements) {
      const key = requirementSourceKey(requirement);
      grouped.set(key, [...(grouped.get(key) ?? []), detailsById.get(requirement.requirement_id) ?? requirement]);
    }
    return grouped;
  }, [detailsById, state]);

  const jurisdictions = useMemo(() => state.status === "ready" ? uniqueText(state.sources.map((source) => source.jurisdiction)).sort() : [], [state]);
  const sourceTypes = useMemo(() => state.status === "ready" ? uniqueText(state.sources.map((source) => source.source_class)).sort() : [], [state]);

  const visibleSources = useMemo(() => {
    if (state.status !== "ready") return [];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return state.sources.filter((source) => {
      const key = externalSourceKey(source);
      const scope = scopeBySource.get(key);
      if (scope?.extraction_status === "superseded-version" || scope?.source_role === "excluded-from-current-scope") return false;
      if (jurisdiction !== "all" && source.jurisdiction !== jurisdiction) return false;
      if (sourceType !== "all" && source.source_class !== sourceType) return false;
      if (!terms.length) return true;
      const clauses = clausesBySource.get(key) ?? [];
      const reviewTerms = (source.substantive_review_provenance?.review_events ?? []).flatMap((event) => [
        event.review_date,
        event.review_system.provider,
        event.review_system.platform,
        event.review_system.model,
        event.ai_role,
        event.generation_mode,
        event.review_method.access_method,
        event.review_method.scope_method,
        event.review_scope,
      ]);
      const haystack = [
        source.title,
        source.issuer,
        source.jurisdiction,
        source.source_class,
        source.source_version,
        source.public_summary,
        source.relevance_scope,
        canonicalIdentifierLabel(source),
        scope?.extraction_status,
        scope?.extraction_scope_notes,
        scope?.source_access_status,
        ...reviewTerms,
        ...(source.ai_governance_relevance ?? []),
        ...(source.applicable_lifecycle_stages ?? []),
        ...clauses.flatMap((clause) => [
          clause.clause_or_control,
          clause.requirement_summary,
          clause.governance_expectation,
          ...(clause.applicable_actor ?? []),
          ...(clause.governed_object ?? []),
          ...(clause.lifecycle_stage ?? []),
          ...(clause.governance_concepts ?? []),
        ]),
      ].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).sort((a, b) => a.title.localeCompare(b.title) || b.source_version.localeCompare(a.source_version));
  }, [clausesBySource, jurisdiction, query, scopeBySource, sourceType, state]);

  const sourceCount = state.status === "ready" ? new Set(state.sources.filter((source) => scopeBySource.get(externalSourceKey(source))?.extraction_status !== "superseded-version").map(sourceIdentity)).size : 0;
  const clauseCount = state.status === "ready" ? state.requirements.length : 0;

  return <Shell><VigilObservatoryNav /><main className="vigil-library-page vigil-case-library-page vigil-standards-page"><div className="container mx-auto max-w-[1500px] px-4 py-7 sm:px-6 md:px-10 md:py-9">
    <section className="vigil-library-shell vigil-standards-shell" aria-labelledby="standards-heading">
      <header className="vigil-library-header vigil-standards-header">
        <div>
          <p className="vigil-library-kicker">VIGIL Observatory</p>
          <h1 id="standards-heading">AI Governance Standards</h1>
          <p className="vigil-library-description">A curated library of laws, standards, frameworks and technical guidance selected because each source contributes to a specific AI-governance question.</p>
        </div>
      </header>

      {state.status === "loading" && <div className="vigil-registry-notice">Loading AI Governance Standards…</div>}
      {state.status === "unavailable" && <div className="vigil-registry-notice is-error"><strong>AI Governance Standards unavailable.</strong> {state.message}</div>}
      {state.status === "ready" && <>
        <section className="vigil-library-toolbar vigil-standards-toolbar" aria-label="Search and filter AI governance sources">
          <div className="vigil-search-row vigil-case-table-search vigil-standards-search-row">
            <label className="vigil-search-control vigil-standards-search">
              <Search aria-hidden="true" />
              <span className="sr-only">Search AI Governance Standards</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search source, governance theme, lifecycle stage, clause, duty or actor…" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X /></button>}
            </label>

            <label className="vigil-family-select"><span>Source type</span><select value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option value="all">All source types</option>{sourceTypes.map((value) => <option key={value} value={value}>{clean(value) ?? value}</option>)}</select></label>
            <label className="vigil-family-select"><span>Jurisdiction</span><select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option value="all">All jurisdictions</option>{jurisdictions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
          <div className="vigil-result-summary"><span>{visibleSources.length} of {sourceCount} sources · {clauseCount.toLocaleString()} clauses represented</span>{(query || sourceType !== "all" || jurisdiction !== "all") ? <button type="button" onClick={() => { setQuery(""); setSourceType("all"); setJurisdiction("all"); }}>Clear filters</button> : null}</div>
        </section>

        <section className="vigil-case-table vigil-standards-case-table" aria-label="AI governance standards sources">
          <div className="vigil-case-table-head vigil-standards-case-table-head"><span>Source</span><span>Jurisdiction / type</span><span>Clauses</span><span /></div>
          <div className="vigil-case-table-body">
            {visibleSources.map((source) => {
              const key = externalSourceKey(source);
              const clauses = clausesBySource.get(key) ?? [];
              const href = `/observatory/knowledge-base/standards-sources/${encodeURIComponent(key)}`;
              return <article key={key} className="vigil-case-table-row vigil-standard-list-row">
                <Link href={href} className="vigil-case-table-row-link vigil-standard-list-row-link" aria-label={`Open standard ${source.title}`}>
                  <div className="vigil-case-table-primary vigil-standard-list-primary">
                    <span className="vigil-case-table-id" title={canonicalIdentifierLabel(source)}>{canonicalIdentifierLabel(source)}</span>
                    <div className="vigil-case-table-copy"><h2>{source.title}</h2><p>{sourcePublicSummary(source)}</p></div>
                  </div>
                  <CaseCell label="Jurisdiction / type"><span className="vigil-case-table-text"><strong>{source.jurisdiction ?? "Not specified"}</strong><small>{clean(source.source_class) ?? "Source type not specified"}</small></span></CaseCell>
                  <CaseCell label="Clauses"><span className="vigil-case-table-text">{clauses.length}</span></CaseCell>
                  <span className="vigil-case-table-open" aria-hidden="true"><ChevronRight /></span>
                </Link>
              </article>;
            })}
            {!visibleSources.length ? <div className="vigil-empty-panel">No sources match the current search and filters.</div> : null}
          </div>
        </section>
      </>}
    </section>
  </div></main></Shell>;
}
