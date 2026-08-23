import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, ExternalLink, Search, X } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import {
  canonicalIdentifierLabel,
  downloadExternalGovernanceDataset,
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
  | {
      status: "ready";
      sources: ExternalSourceEntry[];
      requirements: ExternalRequirement[];
      details: ExternalRequirementDetail[];
      scopes: ExternalSourceScopeEntry[];
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

function requirementSourceKey(requirement: Pick<ExternalRequirement, "vigil_source_id" | "source_version">) {
  return `${requirement.vigil_source_id}|${requirement.source_version}`;
}

function sourceScopeKey(scope: Pick<ExternalSourceScopeEntry, "vigil_source_id" | "source_version">) {
  return `${scope.vigil_source_id}|${scope.source_version}`;
}

function sourceIdentity(source: ExternalSourceEntry) {
  return source.external_source_id || source.vigil_source_id;
}

function sourceRoleLabel(role?: string) {
  const labels: Record<string, string> = {
    "primary-ai-governance": "AI-specific governance source",
    "supporting-external-authority": "Supporting governance authority",
    "context-or-discovery": "Context and reference source",
    "excluded-from-current-scope": "Outside the current baseline",
  };
  return role ? labels[role] ?? clean(role) ?? role : "Role not specified";
}

function sourceRoleExplanation(role?: string) {
  if (role === "primary-ai-governance") {
    return "Included because this source is specifically about AI governance, AI risk, safety, assurance or technical controls and contains material guidance or obligations for governing AI systems.";
  }
  if (role === "supporting-external-authority") {
    return "Included because this broader law, standard or framework helps answer a specific AI-governance question, such as privacy, cybersecurity, safety, accountability or risk management.";
  }
  if (role === "context-or-discovery") {
    return "Included because it helps interpret terminology, reporting structures or the standards landscape relevant to AI governance.";
  }
  if (role === "excluded-from-current-scope") {
    return "Registered for traceability, but not used as part of the current external-governance baseline.";
  }
  return "Included because the source contributes to a specific question in the external AI-governance baseline.";
}

function clauseReviewLabel(scope: ExternalSourceScopeEntry | undefined, clauseCount: number) {
  if (clauseCount > 0) return `${clauseCount.toLocaleString()} clause${clauseCount === 1 ? "" : "s"}`;
  if (scope?.extraction_status === "blocked-access" && scope.source_access_status === "official-metadata-only") return "Copyright Protected";
  switch (scope?.extraction_status) {
    case "in-progress":
    case "partial":
      return "Review in progress";
    case "blocked-access":
      return "Access limited";
    case "complete":
      return "No public clauses";
    default:
      return "Review pending";
  }
}

function SearchControl({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="vigil-search-control vigil-reference-search">
    <Search aria-hidden="true" />
    <span className="sr-only">{placeholder}</span>
    <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    {value && <button type="button" onClick={() => onChange("")} aria-label="Clear search"><X /></button>}
  </label>;
}

function DetailList({ title, values }: { title: string; values?: string[] }) {
  if (!values?.length) return null;
  return <section className="vigil-baseline-detail-block">
    <h4>{title}</h4>
    {values.length === 1 ? <p>{values[0]}</p> : <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul>}
  </section>;
}

function ClauseDetail({ requirement, source }: { requirement: ExternalRequirementDetail; source: ExternalSourceEntry }) {
  const hasRichDetail = Boolean(
    requirement.governance_expectation
    || requirement.governed_object?.length
    || requirement.lifecycle_stage?.length
    || requirement.evidence_expectation?.length
    || requirement.required_artefacts?.length
    || requirement.verification_method?.length
    || requirement.timing_or_frequency?.length
    || requirement.applicability_conditions?.length
    || requirement.exceptions_or_qualifications?.length,
  );

  return <div className="vigil-baseline-clause-detail">
    <section className="vigil-baseline-clause-lead">
      <p className="vigil-library-kicker">What this clause says</p>
      <p>{requirement.governance_expectation ?? requirement.requirement_summary}</p>
    </section>

    {hasRichDetail && <div className="vigil-baseline-detail-grid">
      <DetailList title="Who it applies to" values={requirement.applicable_actor} />
      <DetailList title="What it governs" values={requirement.governed_object} />
      <DetailList title="Lifecycle stage" values={requirement.lifecycle_stage?.map((value) => clean(value) ?? value)} />
      <DetailList title="Evidence or documentation" values={requirement.evidence_expectation} />
      <DetailList title="Required artefacts" values={requirement.required_artefacts} />
      <DetailList title="How it can be verified" values={requirement.verification_method} />
      <DetailList title="When or how often" values={requirement.timing_or_frequency} />
      <DetailList title="When it applies" values={requirement.applicability_conditions} />
      <DetailList title="Exceptions or qualifications" values={requirement.exceptions_or_qualifications} />
    </div>}

    {!hasRichDetail && <p className="vigil-baseline-detail-unavailable">No additional structured detail is currently published for this clause beyond the reviewed summary above.</p>}

    {requirement.governance_concepts?.length ? <p className="vigil-baseline-concepts"><strong>Governance concepts:</strong> {requirement.governance_concepts.map(clean).join(" · ")}</p> : null}

    <div className="vigil-baseline-clause-actions">
      {(requirement.authoritative_locator || source.official_locator) && <a href={requirement.authoritative_locator ?? source.official_locator} target="_blank" rel="noreferrer">Open official source <ExternalLink aria-hidden="true" /></a>}
    </div>
  </div>;
}

function SourceAbout({ source, scope, previousVersions }: { source: ExternalSourceEntry; scope?: ExternalSourceScopeEntry; previousVersions: ExternalSourceEntry[] }) {
  return <details className="vigil-baseline-source-about">
    <summary>About this source &amp; review provenance</summary>
    <div className="vigil-baseline-source-about-body">
      <section>
        <p className="vigil-library-kicker">Why it is included</p>
        <p>{sourceRoleExplanation(scope?.source_role)}</p>
      </section>
      <dl className="vigil-baseline-source-facts">
        <div><dt>Publisher</dt><dd>{source.issuer ?? "Not specified"}</dd></div>
        <div><dt>Jurisdiction</dt><dd>{source.jurisdiction ?? "Not specified"}</dd></div>
        <div><dt>Source type</dt><dd>{clean(source.source_class) ?? "Not specified"}</dd></div>
        <div><dt>Role in the baseline</dt><dd>{sourceRoleLabel(scope?.source_role)}</dd></div>
        <div><dt>Review state</dt><dd>{clean(scope?.extraction_status) ?? "Not specified"}</dd></div>
        <div><dt>Source access</dt><dd>{clean(scope?.source_access_status) ?? "Not specified"}</dd></div>
        <div><dt>Lifecycle state</dt><dd>{clean(source.source_lifecycle_state) ?? "Not specified"}</dd></div>
        <div><dt>VIGIL source identity</dt><dd>{source.vigil_source_id}</dd></div>
      </dl>
      {previousVersions.length > 0 && <section className="border-t border-border/70">
        <p className="vigil-library-kicker">Previous versions</p>
        <ul className="mt-2 space-y-2">
          {previousVersions.map((version) => <li key={externalSourceKey(version)} className="flex flex-wrap items-center justify-between gap-3 text-sm leading-relaxed">
            <span><strong>{version.source_version}</strong>{version.source_lifecycle_state ? ` · ${clean(version.source_lifecycle_state)}` : ""}</span>
            {version.official_locator && <a href={version.official_locator} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Open source <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>}
          </li>)}
        </ul>
      </section>}
    </div>
  </details>;
}

function SupportingSources({ sources, scopeBySource }: { sources: ExternalSourceEntry[]; scopeBySource: Map<string, ExternalSourceScopeEntry> }) {
  if (!sources.length) return null;
  return <section className="mt-8" aria-labelledby="supporting-sources-heading">
    <div className="mb-3 max-w-5xl">
      <p className="vigil-library-kicker">Supporting &amp; contextual sources</p>
      <h2 id="supporting-sources-heading" className="mt-1 font-serif text-2xl text-foreground">Sources that inform specific governance questions</h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">These sources are part of the reference baseline because they provide relevant legal, technical or interpretive context. They are not presented as empty clause collections.</p>
    </div>
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      {sources.map((source) => {
        const scope = scopeBySource.get(externalSourceKey(source));
        return <article key={externalSourceKey(source)} className="grid gap-3 border-b border-border/75 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(260px,1fr)_minmax(360px,1.5fr)_auto] md:items-start">
          <div className="min-w-0">
            <h3 className="font-sans text-base font-semibold leading-snug text-foreground">{source.title}</h3>
            <p className="mt-1 font-mono text-sm leading-relaxed text-primary">{canonicalIdentifierLabel(source)} · Version {source.source_version}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{[source.issuer, source.jurisdiction].filter(Boolean).join(" · ")}</p>
          </div>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{sourceRoleLabel(scope?.source_role)}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">{sourceRoleExplanation(scope?.source_role)}</p>
          </div>
          {source.official_locator ? <a href={source.official_locator} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary hover:underline" aria-label={`Open official source for ${source.title}`} title="Open official source"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a> : <span />}
        </article>;
      })}
    </div>
  </section>;
}

function VigilExternalGovernanceBaseline() {
  const [state, setState] = useState<BaselineState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [openSource, setOpenSource] = useState<string | null>(null);
  const [openClause, setOpenClause] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadExternalSources(),
      loadExternalRequirements(),
      loadExternalRequirementDetails(),
      loadExternalSourceScope(),
    ]).then(([sources, requirements, details, scopes]) => {
      if (cancelled) return;
      if (sources.status !== "ready") {
        setState({ status: "unavailable", message: sources.message });
        return;
      }
      setState({
        status: "ready",
        sources: sources.data,
        requirements: requirements.status === "ready" ? requirements.data : [],
        details: details.status === "ready" ? details.data : [],
        scopes: scopes.status === "ready" ? scopes.data : [],
      });
    }).catch((error) => {
      if (!cancelled) setState({ status: "unavailable", message: (error as Error).message });
    });
    return () => { cancelled = true; };
  }, []);

  const scopeBySource = useMemo(() => state.status === "ready"
    ? new Map(state.scopes.map((scope) => [sourceScopeKey(scope), scope]))
    : new Map<string, ExternalSourceScopeEntry>(), [state]);

  const detailsById = useMemo(() => state.status === "ready"
    ? new Map(state.details.map((requirement) => [requirement.requirement_id, requirement]))
    : new Map<string, ExternalRequirementDetail>(), [state]);

  const clausesBySource = useMemo(() => {
    const grouped = new Map<string, ExternalRequirementDetail[]>();
    if (state.status !== "ready") return grouped;
    for (const requirement of state.requirements) {
      const detail = detailsById.get(requirement.requirement_id) ?? requirement;
      const key = requirementSourceKey(requirement);
      const bucket = grouped.get(key) ?? [];
      bucket.push(detail);
      grouped.set(key, bucket);
    }
    for (const bucket of grouped.values()) bucket.sort((a, b) => a.clause_or_control.localeCompare(b.clause_or_control, undefined, { numeric: true }));
    return grouped;
  }, [detailsById, state]);

  const versionsByIdentity = useMemo(() => {
    const grouped = new Map<string, ExternalSourceEntry[]>();
    if (state.status !== "ready") return grouped;
    for (const source of state.sources) {
      const key = sourceIdentity(source);
      grouped.set(key, [...(grouped.get(key) ?? []), source]);
    }
    return grouped;
  }, [state]);

  const jurisdictions = useMemo(() => state.status === "ready"
    ? uniqueText(state.sources.map((source) => source.jurisdiction)).sort((a, b) => a.localeCompare(b))
    : [], [state]);

  const sourceTypes = useMemo(() => state.status === "ready"
    ? uniqueText(state.sources.map((source) => source.source_class)).sort((a, b) => a.localeCompare(b))
    : [], [state]);

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
      const versionHistory = versionsByIdentity.get(sourceIdentity(source)) ?? [];
      const haystack = [
        source.title,
        source.issuer,
        source.jurisdiction,
        source.source_class,
        source.source_lifecycle_state,
        source.source_version,
        canonicalIdentifierLabel(source),
        source.external_source_id,
        scope?.source_role,
        scope?.extraction_status,
        ...versionHistory.flatMap((version) => [version.title, version.source_version, canonicalIdentifierLabel(version)]),
        ...clauses.flatMap((clause) => [
          clause.clause_or_control,
          clause.requirement_summary,
          clause.governance_expectation,
          clause.requirement_posture,
          clause.expectation_type,
          clause.normative_force,
          ...(clause.applicable_actor ?? []),
          ...(clause.governed_object ?? []),
          ...(clause.lifecycle_stage ?? []),
          ...(clause.governance_concepts ?? []),
        ]),
      ].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).sort((a, b) => a.title.localeCompare(b.title) || b.source_version.localeCompare(a.source_version));
  }, [clausesBySource, jurisdiction, query, scopeBySource, sourceType, state, versionsByIdentity]);

  const clauseSources = useMemo(() => visibleSources.filter((source) => {
    const scope = scopeBySource.get(externalSourceKey(source));
    const clauseCount = clausesBySource.get(externalSourceKey(source))?.length ?? 0;
    return clauseCount > 0 || scope?.source_role === "primary-ai-governance";
  }), [clausesBySource, scopeBySource, visibleSources]);

  const supportingSources = useMemo(() => visibleSources.filter((source) => {
    const scope = scopeBySource.get(externalSourceKey(source));
    const clauseCount = clausesBySource.get(externalSourceKey(source))?.length ?? 0;
    return clauseCount === 0 && ["supporting-external-authority", "context-or-discovery"].includes(scope?.source_role ?? "");
  }), [clausesBySource, scopeBySource, visibleSources]);

  async function downloadDataset() {
    setDownloadState("working");
    try {
      await downloadExternalGovernanceDataset();
      setDownloadState("idle");
    } catch {
      setDownloadState("error");
    }
  }

  return <Shell><VigilObservatoryNav /><main className="vigil-reference-page vigil-baseline-page"><div className="container mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <header className="vigil-simple-hero vigil-reference-hero">
      <p className="vigil-library-kicker">External AI governance reference library</p>
      <h1>External Governance Baseline</h1>
      <p>A curated library of laws, standards, frameworks and technical guidance selected because each source contributes to a specific AI-governance question. Some directly set AI-specific rules or expectations; others provide relevant authority on issues such as privacy, cybersecurity, safety, accountability, risk or assurance. It is not intended to collect every law or standard that could conceivably apply to AI.</p>
    </header>

    {state.status === "loading" && <div className="vigil-reference-state">Loading external governance baseline…</div>}
    {state.status === "unavailable" && <div className="vigil-reference-state"><h2>External governance baseline unavailable</h2><p>{state.message}</p></div>}
    {state.status === "ready" && <>
      <div className="vigil-baseline-toolbar">
        <p><strong>{state.sources.length.toLocaleString()}</strong> registered source versions · <strong>{state.requirements.length.toLocaleString()}</strong> clauses {(query || jurisdiction !== "all" || sourceType !== "all") ? <span>· {(clauseSources.length + supportingSources.length).toLocaleString()} current sources shown</span> : null}</p>
        <button type="button" className="vigil-baseline-download" onClick={downloadDataset} disabled={downloadState === "working"}>
          <Download aria-hidden="true" />
          {downloadState === "working" ? "Preparing dataset…" : "Download dataset"}
        </button>
      </div>
      {downloadState === "error" && <p className="vigil-baseline-download-error">The complete dataset could not be downloaded. Please try again.</p>}

      <div className="vigil-reference-controls vigil-baseline-controls">
        <SearchControl value={query} onChange={setQuery} placeholder="Search source, clause, duty, actor, lifecycle stage or governance concept…" />
        <label className="vigil-reference-filter"><span>Source type</span><select value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option value="all">All source types</option>{sourceTypes.map((value) => <option value={value} key={value}>{clean(value) ?? value}</option>)}</select></label>
        <label className="vigil-reference-filter"><span>Jurisdiction</span><select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option value="all">All jurisdictions</option>{jurisdictions.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Search and filters apply to both lists below, including clause text where clauses are available.</p>

      <section className="mt-6" aria-labelledby="clause-sources-heading">
        <div className="mb-3 max-w-5xl">
          <p className="vigil-library-kicker">Sources with clauses</p>
          <h2 id="clause-sources-heading" className="mt-1 font-serif text-2xl text-foreground">Browse governance clauses and controls</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">Open a source to browse its published clauses. Sources without public clause text stay collapsed and show their availability state instead.</p>
        </div>
        <div className="vigil-baseline-library !mt-0" aria-label="External governance sources with clauses">
          <div className="vigil-baseline-table-head" aria-hidden="true">
            <span>Source</span><span>Publisher / jurisdiction</span><span>Type</span><span>Clauses / access</span><span />
          </div>
          <div className="vigil-baseline-table-body">
            {clauseSources.map((source) => {
              const key = externalSourceKey(source);
              const scope = scopeBySource.get(key);
              const clauses = clausesBySource.get(key) ?? [];
              const canOpen = clauses.length > 0;
              const isOpen = canOpen && openSource === key;
              const previousVersions = (versionsByIdentity.get(sourceIdentity(source)) ?? [])
                .filter((version) => scopeBySource.get(externalSourceKey(version))?.extraction_status === "superseded-version")
                .sort((a, b) => b.source_version.localeCompare(a.source_version, undefined, { numeric: true }));

              const rowContents = <>
                <span className="vigil-baseline-source-primary">
                  <strong>{source.title}</strong>
                  <small>{canonicalIdentifierLabel(source)} · Version {source.source_version}</small>
                </span>
                <span className="vigil-baseline-source-meta">
                  <strong>{source.issuer ?? "Publisher not specified"}</strong>
                  <small>{source.jurisdiction ?? "Jurisdiction not specified"}</small>
                </span>
                <span>{clean(source.source_class) ?? "Not specified"}</span>
                <span className="vigil-baseline-clause-count">{clauses.length > 0 ? <><strong>{clauses.length.toLocaleString()}</strong> clause{clauses.length === 1 ? "" : "s"}</> : <span className="font-semibold text-foreground">{clauseReviewLabel(scope, clauses.length)}</span>}</span>
                {canOpen ? <ChevronDown className="vigil-baseline-source-chevron" aria-hidden="true" /> : <span />}
              </>;

              return <div className={`vigil-baseline-source-row relative${isOpen ? " is-open" : ""}`} key={key}>
                {canOpen ? <button type="button" className="vigil-baseline-source-button pr-20" aria-expanded={isOpen} onClick={() => {
                  setOpenSource(isOpen ? null : key);
                  setOpenClause(null);
                }}>{rowContents}</button> : <div className="vigil-baseline-source-button cursor-default pr-14">{rowContents}</div>}

                {source.official_locator && <a href={source.official_locator} target="_blank" rel="noreferrer" className={`absolute top-1/2 -translate-y-1/2 text-primary hover:text-foreground ${canOpen ? "right-11" : "right-4"}`} aria-label={`Open official source for ${source.title}`} title="Open official source"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}

                {isOpen && <section className="vigil-baseline-source-detail" aria-label={`${source.title} clause detail`}>
                  <div className="vigil-baseline-clause-table">
                    <div className="vigil-baseline-clause-head" aria-hidden="true"><span>Clause / control</span><span>What it says</span><span>Type</span><span /></div>
                    {clauses.map((clause) => {
                      const clauseOpen = openClause === clause.requirement_id;
                      return <div className={`vigil-baseline-clause-row${clauseOpen ? " is-open" : ""}`} key={clause.requirement_id}>
                        <button type="button" className="vigil-baseline-clause-button" aria-expanded={clauseOpen} onClick={() => setOpenClause(clauseOpen ? null : clause.requirement_id)}>
                          <span className="vigil-baseline-clause-ref">{clause.clause_or_control}</span>
                          <span className="vigil-baseline-clause-summary">{clause.requirement_summary}</span>
                          <span className="vigil-baseline-clause-type">{clean(clause.expectation_type) ?? clean(clause.requirement_posture) ?? "Clause"}</span>
                          <ChevronDown aria-hidden="true" />
                        </button>
                        {clauseOpen && <ClauseDetail requirement={clause} source={source} />}
                      </div>;
                    })}
                  </div>

                  <SourceAbout source={source} scope={scope} previousVersions={previousVersions} />
                </section>}
              </div>;
            })}
            {clauseSources.length === 0 && <div className="vigil-empty-panel">No clause-bearing or clause-review sources match the current search and filters.</div>}
          </div>
        </div>
      </section>

      <SupportingSources sources={supportingSources} scopeBySource={scopeBySource} />

      {clauseSources.length === 0 && supportingSources.length === 0 && <div className="vigil-empty-panel mt-6">No sources match the current search and filters.</div>}
    </>}
  </div></main></Shell>;
}

// Historical route retained for compatibility. Clauses now live inside the
// curated external-governance baseline rather than on a separate public surface.
export function VigilExternalRequirements() {
  return <VigilExternalGovernanceBaseline />;
}

export function VigilExternalSources() {
  return <VigilExternalGovernanceBaseline />;
}
