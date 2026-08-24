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

function knowledgeLabel(value: string) {
  return (clean(value) ?? value)
    .replace(/\bAi\b/g, "AI")
    .replace(/\bIct\b/g, "ICT");
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

function sourcePublicSummary(source: ExternalSourceEntry) {
  return source.public_summary?.trim() || "A substantive public summary is not yet available for this source.";
}

function summaryParagraphs(summary: string) {
  return summary.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function formatReviewDate(value?: string) {
  if (!value) return "Not yet substantively reviewed";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function reviewIsDue(value?: string) {
  if (!value) return true;
  const reviewed = new Date(`${value}T00:00:00Z`).getTime();
  if (Number.isNaN(reviewed)) return true;
  return Date.now() - reviewed > 90 * 24 * 60 * 60 * 1000;
}

function KnowledgeTags({ values }: { values?: string[] }) {
  if (!values?.length) return <span className="text-sm text-muted-foreground">Not yet classified</span>;
  return <div className="flex flex-wrap gap-2">
    {values.map((value) => <span key={value} className="rounded-full border border-border bg-card/55 px-2.5 py-1 text-xs font-medium text-foreground/85">{knowledgeLabel(value)}</span>)}
  </div>;
}

function SourceKnowledge({ source, compact = false }: { source: ExternalSourceEntry; compact?: boolean }) {
  const summary = sourcePublicSummary(source);
  const paragraphs = summaryParagraphs(summary);
  const due = reviewIsDue(source.last_substantive_reviewed);
  return <section className={`vigil-source-public-knowledge${compact ? " is-compact" : ""}`}>
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => <p key={`${source.vigil_source_id}-summary-${index}`} className="text-sm leading-relaxed text-foreground/90">{paragraph}</p>)}
    </div>
    {source.relevance_scope ? <div className="mt-4 border-t border-border/70 pt-4">
      <p className="vigil-library-kicker">Where it matters</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground/85">{source.relevance_scope}</p>
    </div> : null}
    <div className="mt-4 grid gap-4 border-t border-border/70 pt-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">AI governance relevance</p>
        <KnowledgeTags values={source.ai_governance_relevance} />
      </div>
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Relevant lifecycle stages</p>
        <KnowledgeTags values={source.applicable_lifecycle_stages} />
      </div>
    </div>
    <p className={`mt-4 text-xs font-medium ${due ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>
      {due ? "Review due · " : ""}Last substantively reviewed: {formatReviewDate(source.last_substantive_reviewed)}
    </p>
  </section>;
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
  const governanceExpectation = requirement.governance_expectation?.trim();
  const showGovernanceExpectation = Boolean(
    governanceExpectation
    && comparable(governanceExpectation) !== comparable(requirement.requirement_summary),
  );
  const hasRichDetail = Boolean(
    showGovernanceExpectation
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
    {hasRichDetail && <div className="vigil-baseline-detail-grid">
      <DetailList title="Governance expectation" values={showGovernanceExpectation && governanceExpectation ? [governanceExpectation] : undefined} />
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

    {!hasRichDetail && <p className="vigil-baseline-detail-unavailable">No additional structured detail is currently published for this clause.</p>}

    {requirement.governance_concepts?.length ? <p className="vigil-baseline-concepts"><strong>Governance concepts:</strong> {requirement.governance_concepts.map(clean).join(" · ")}</p> : null}

    <div className="vigil-baseline-clause-actions">
      {(requirement.authoritative_locator || source.official_locator) && <a href={requirement.authoritative_locator ?? source.official_locator} target="_blank" rel="noreferrer">Open official source <ExternalLink aria-hidden="true" /></a>}
    </div>
  </div>;
}

function SourceAbout({ source, previousVersions }: { source: ExternalSourceEntry; previousVersions: ExternalSourceEntry[] }) {
  return <details className="vigil-baseline-source-about">
    <summary>Source details &amp; provenance</summary>
    <div className="vigil-baseline-source-about-body">
      <dl className="vigil-baseline-source-facts">
        <div><dt>Publisher</dt><dd>{source.issuer ?? "Not specified"}</dd></div>
        <div><dt>Jurisdiction</dt><dd>{source.jurisdiction ?? "Not specified"}</dd></div>
        <div><dt>Source type</dt><dd>{clean(source.source_class) ?? "Not specified"}</dd></div>
        <div><dt>Lifecycle state</dt><dd>{clean(source.source_lifecycle_state) ?? "Not specified"}</dd></div>
        <div><dt>Publication date</dt><dd>{source.publication_date ?? "Not specified"}</dd></div>
        <div><dt>Effective date</dt><dd>{source.effective_date ?? "Not specified"}</dd></div>
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

function OverviewSources({ sources }: { sources: ExternalSourceEntry[] }) {
  if (!sources.length) return null;
  return <section className="mt-8" aria-labelledby="overview-sources-heading">
    <div className="mb-3 max-w-5xl">
      <p className="vigil-library-kicker">Source overviews</p>
      <h2 id="overview-sources-heading" className="mt-1 font-serif text-2xl text-foreground">Sources without public clause records</h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">These sources are part of the AI Governance Standards Baseline even though clause-level records are not currently represented. Each overview explains what the source governs, where it contributes to AI governance, its relevant lifecycle stages and when that assessment was last substantively reviewed.</p>
    </div>
    <div className="space-y-4">
      {sources.map((source) => <article key={externalSourceKey(source)} className="rounded-lg border border-border bg-background p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-4xl">
            <h3 className="font-sans text-lg font-semibold leading-snug text-foreground">{source.title}</h3>
            <p className="mt-1 font-mono text-sm leading-relaxed text-primary">{canonicalIdentifierLabel(source)} · Version {source.source_version}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{[source.issuer, source.jurisdiction, clean(source.source_class)].filter(Boolean).join(" · ")}</p>
          </div>
          {source.official_locator ? <a href={source.official_locator} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline" aria-label={`Open official source for ${source.title}`}>Open official source <ExternalLink className="h-4 w-4" aria-hidden="true" /></a> : null}
        </div>
        <div className="mt-4 border-t border-border/75 pt-4">
          <SourceKnowledge source={source} compact />
        </div>
      </article>)}
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

  const sourceCount = useMemo(() => state.status === "ready"
    ? new Set(state.sources.map((source) => sourceIdentity(source))).size
    : 0, [state]);

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
        source.public_summary,
        source.relevance_scope,
        source.last_substantive_reviewed,
        ...(source.ai_governance_relevance ?? []),
        ...(source.applicable_lifecycle_stages ?? []),
        canonicalIdentifierLabel(source),
        source.external_source_id,
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

  const clauseSources = useMemo(() => visibleSources.filter((source) =>
    (clausesBySource.get(externalSourceKey(source))?.length ?? 0) > 0
  ), [clausesBySource, visibleSources]);

  const overviewSources = useMemo(() => visibleSources.filter((source) =>
    (clausesBySource.get(externalSourceKey(source))?.length ?? 0) === 0
  ), [clausesBySource, visibleSources]);

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
      <p className="vigil-library-kicker">AI governance standards library</p>
      <h1>AI Governance Standards Baseline</h1>
      <p>A curated library of laws, standards, frameworks and technical guidance selected because each source contributes to a specific AI-governance question. Some directly set AI-specific rules or expectations; others provide relevant authority on issues such as privacy, cybersecurity, safety, accountability, risk or assurance. It is not intended to collect every law or standard that could conceivably apply to AI.</p>
    </header>

    {state.status === "loading" && <div className="vigil-reference-state">Loading AI Governance Standards Baseline…</div>}
    {state.status === "unavailable" && <div className="vigil-reference-state"><h2>AI Governance Standards Baseline unavailable</h2><p>{state.message}</p></div>}
    {state.status === "ready" && <>
      <div className="vigil-baseline-toolbar">
        <p><strong>{sourceCount.toLocaleString()}</strong> AI-governance sources · <strong>{state.requirements.length.toLocaleString()}</strong> clauses {(query || jurisdiction !== "all" || sourceType !== "all") ? <span>· {(clauseSources.length + overviewSources.length).toLocaleString()} current sources shown</span> : null}</p>
        <button type="button" className="vigil-baseline-download" onClick={downloadDataset} disabled={downloadState === "working"}>
          <Download aria-hidden="true" />
          {downloadState === "working" ? "Preparing dataset…" : "Download dataset"}
        </button>
      </div>
      {downloadState === "error" && <p className="vigil-baseline-download-error">The complete dataset could not be downloaded. Please try again.</p>}

      <div className="vigil-reference-controls vigil-baseline-controls">
        <SearchControl value={query} onChange={setQuery} placeholder="Search source, AI-governance theme, lifecycle stage, clause, duty or actor…" />
        <label className="vigil-reference-filter"><span>Source type</span><select value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option value="all">All source types</option>{sourceTypes.map((value) => <option value={value} key={value}>{clean(value) ?? value}</option>)}</select></label>
        <label className="vigil-reference-filter"><span>Jurisdiction</span><select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option value="all">All jurisdictions</option>{jurisdictions.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Search and filters apply to both lists below, including public source summaries, AI-governance relevance, lifecycle stages and clause text where clauses are available.</p>

      <section className="mt-6" aria-labelledby="clause-sources-heading">
        <div className="mb-3 max-w-5xl">
          <p className="vigil-library-kicker">Sources with clauses</p>
          <h2 id="clause-sources-heading" className="mt-1 font-serif text-2xl text-foreground">Browse governance clauses and controls</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">Open a source to understand its AI-governance relevance, review freshness and the clause-level records represented from it.</p>
        </div>
        <div className="vigil-baseline-library !mt-0" aria-label="AI governance sources with clauses">
          <div className="vigil-baseline-table-head" aria-hidden="true">
            <span>Source</span><span>Publisher / jurisdiction</span><span>Type</span><span>Clauses</span><span />
          </div>
          <div className="vigil-baseline-table-body">
            {clauseSources.map((source) => {
              const key = externalSourceKey(source);
              const clauses = clausesBySource.get(key) ?? [];
              const isOpen = openSource === key;
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
                <span className="vigil-baseline-clause-count"><strong>{clauses.length.toLocaleString()}</strong> clause{clauses.length === 1 ? "" : "s"}</span>
                <ChevronDown className="vigil-baseline-source-chevron" aria-hidden="true" />
              </>;

              return <div className={`vigil-baseline-source-row${isOpen ? " is-open" : ""}`} key={key}>
                <div className="relative">
                  <button type="button" className="vigil-baseline-source-button pr-20" aria-expanded={isOpen} onClick={() => {
                    setOpenSource(isOpen ? null : key);
                    setOpenClause(null);
                  }}>{rowContents}</button>

                  {source.official_locator && <a href={source.official_locator} target="_blank" rel="noreferrer" className="absolute right-11 top-1/2 -translate-y-1/2 text-primary hover:text-foreground" aria-label={`Open official source for ${source.title}`} title="Open official source"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}
                </div>

                {isOpen && <section className="vigil-baseline-source-detail" aria-label={`${source.title} clause detail`}>
                  <div className="border-b border-border/75 p-4 sm:p-5">
                    <SourceKnowledge source={source} />
                  </div>
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

                  <SourceAbout source={source} previousVersions={previousVersions} />
                </section>}
              </div>;
            })}
            {clauseSources.length === 0 && <div className="vigil-empty-panel">No clause-bearing sources match the current search and filters.</div>}
          </div>
        </div>
      </section>

      <OverviewSources sources={overviewSources} />

      {clauseSources.length === 0 && overviewSources.length === 0 && <div className="vigil-empty-panel mt-6">No sources match the current search and filters.</div>}
    </>}
  </div></main></Shell>;
}

// Historical route retained for compatibility. Clauses now live inside the
// curated AI-governance standards baseline rather than on a separate public surface.
export function VigilExternalRequirements() {
  return <VigilExternalGovernanceBaseline />;
}

export function VigilExternalSources() {
  return <VigilExternalGovernanceBaseline />;
}
