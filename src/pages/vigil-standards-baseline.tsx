import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Search, X } from "lucide-react";
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

type SourceTab = "overview" | "relevance" | "clauses" | "review";

const TABS: Array<{ id: SourceTab; number: string; label: string }> = [
  { id: "overview", number: "01", label: "Overview" },
  { id: "relevance", number: "02", label: "Governance Relevance" },
  { id: "clauses", number: "03", label: "Clauses" },
  { id: "review", number: "04", label: "Evidence & Review" },
];

/*
 * Canonical VIGIL provenance currently establishes the production model but
 * does not identify the specific AI model that performed each historical
 * external-source review. The public surface must expose that gap rather than
 * invent retrospective specificity. See VIGIL-AUTHORSHIP-PROVENANCE-1.
 */
const EXTERNAL_REVIEW_PROVENANCE = {
  system: "AI system · specific model not recorded",
  productionMode: "Semi-autonomous",
  humanRole: "Contract approver",
  humanReview: "Not reviewed",
  humanVerification: "Not verified",
};

function clean(value?: string) {
  return value?.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function comparable(value?: string) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function knowledgeLabel(value: string) {
  return (clean(value) ?? value).replace(/\bAi\b/g, "AI").replace(/\bIct\b/g, "ICT");
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
  if (!value) return "No substantive review recorded";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function nextReviewDate(value?: string) {
  if (!value) return "Not scheduled";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Not scheduled";
  parsed.setUTCDate(parsed.getUTCDate() + 90);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function reviewIsDue(value?: string) {
  if (!value) return true;
  const reviewed = new Date(`${value}T00:00:00Z`).getTime();
  if (Number.isNaN(reviewed)) return true;
  return Date.now() - reviewed > 90 * 24 * 60 * 60 * 1000;
}

function listLabel(values?: string[]) {
  return values?.length ? values.map(knowledgeLabel).join(" · ") : "Not yet classified";
}

function SearchControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="vigil-search-control vigil-standards-search">
    <Search aria-hidden="true" />
    <span className="sr-only">Search AI Governance Standards Baseline</span>
    <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search source, governance theme, lifecycle stage, clause, duty or actor…" />
    {value && <button type="button" onClick={() => onChange("")} aria-label="Clear search"><X /></button>}
  </label>;
}

function Fact({ label, value }: { label: string; value?: string }) {
  return <div><dt>{label}</dt><dd>{value || "Not specified"}</dd></div>;
}

function ClauseDetail({ requirement, source }: { requirement: ExternalRequirementDetail; source: ExternalSourceEntry }) {
  const governanceExpectation = requirement.governance_expectation?.trim();
  const showExpectation = Boolean(governanceExpectation && comparable(governanceExpectation) !== comparable(requirement.requirement_summary));
  const detailRows: Array<[string, string[] | undefined]> = [
    ["Governance expectation", showExpectation && governanceExpectation ? [governanceExpectation] : undefined],
    ["Who it applies to", requirement.applicable_actor],
    ["What it governs", requirement.governed_object],
    ["Lifecycle stage", requirement.lifecycle_stage?.map((value) => clean(value) ?? value)],
    ["Evidence or documentation", requirement.evidence_expectation],
    ["Required artefacts", requirement.required_artefacts],
    ["How it can be verified", requirement.verification_method],
    ["When or how often", requirement.timing_or_frequency],
    ["When it applies", requirement.applicability_conditions],
    ["Exceptions or qualifications", requirement.exceptions_or_qualifications],
  ];
  const visible = detailRows.filter(([, values]) => values?.length);

  return <div className="vigil-standards-clause-detail">
    {visible.length ? <dl>{visible.map(([label, values]) => <div key={label}><dt>{label}</dt><dd>{values!.join(" · ")}</dd></div>)}</dl> : <p>No additional structured detail is currently published for this clause.</p>}
    {requirement.governance_concepts?.length ? <p><strong>Governance concepts:</strong> {requirement.governance_concepts.map(clean).join(" · ")}</p> : null}
    {(requirement.authoritative_locator || source.official_locator) ? <a href={requirement.authoritative_locator ?? source.official_locator} target="_blank" rel="noreferrer" aria-label="Open official source" title="Open official source"><ExternalLink aria-hidden="true" /></a> : null}
  </div>;
}

function clauseCoverageCopy(scope?: ExternalSourceScopeEntry) {
  const status = comparable(scope?.extraction_status);
  const access = comparable(scope?.source_access_status);
  const recordedScope = scope?.extraction_scope_notes?.trim();

  if (status === "blocked access") {
    return {
      heading: "Primary-text review is blocked",
      body: recordedScope || "Clause-level requirements are not represented because the primary normative text has not been available for lawful substantive review.",
      qualification: access.includes("metadata")
        ? "Only official metadata or an abstract is available. VIGIL does not infer normative clauses from metadata; controlled standards require lawful primary-text access before clause-level extraction."
        : undefined,
    };
  }

  if (status === "supporting only") {
    return {
      heading: "Clause decomposition is outside the current scope",
      body: recordedScope || "This source is retained as supporting authority rather than as a first-class clause-level requirement corpus.",
      qualification: access.includes("licensed")
        ? "Lawful licensed primary-text access is recorded. Copyrighted source text is not reproduced; the absence of clause records reflects the bounded extraction scope, not a prohibition on analytical abstraction."
        : undefined,
    };
  }

  if (status === "context only") {
    return {
      heading: "Context source — no clause decomposition",
      body: recordedScope || "This source is retained for context, comparison or taxonomy architecture rather than clause-level governance requirements.",
    };
  }

  if (status === "partial") {
    return {
      heading: "Clause review is incomplete",
      body: recordedScope || "The substantive review is partial and the current public dataset does not yet contain clause-level records for this source.",
    };
  }

  if (status === "complete") {
    return {
      heading: "No clause records met the bounded extraction criterion",
      body: recordedScope || "A substantive review is recorded, but it did not produce public clause-level records under VIGIL's current governance-significant extraction criterion.",
    };
  }

  return {
    heading: "Clause coverage is not yet represented",
    body: recordedScope || "The current source-scope record does not establish a published clause-level extraction for this source.",
  };
}

function ClauseCoverageCard({ scope }: { scope?: ExternalSourceScopeEntry }) {
  const copy = clauseCoverageCopy(scope);
  const outstanding = [...(scope?.known_unreviewed_sections ?? []), ...(scope?.inaccessible_sections ?? [])]
    .filter((value, index, values) => values.indexOf(value) === index);

  return <article className="vigil-standards-empty-card">
    <p className="vigil-library-kicker">Clause coverage</p>
    <h3>{copy.heading}</h3>
    <p>{copy.body}</p>
    {copy.qualification ? <p>{copy.qualification}</p> : null}
    {outstanding.length ? <p><strong>Not represented:</strong> {outstanding.join(" · ")}</p> : null}
    <dl className="vigil-standards-empty-facts">
      <Fact label="Coverage status" value={clean(scope?.extraction_status)} />
      <Fact label="Source access" value={clean(scope?.source_access_status)} />
    </dl>
  </article>;
}

function StandardsDossier({
  source,
  scope,
  clauses,
  previousVersions,
  activeTab,
  onTab,
}: {
  source: ExternalSourceEntry;
  scope?: ExternalSourceScopeEntry;
  clauses: ExternalRequirementDetail[];
  previousVersions: ExternalSourceEntry[];
  activeTab: SourceTab;
  onTab: (tab: SourceTab) => void;
}) {
  const due = reviewIsDue(source.last_substantive_reviewed);
  const reviewMethod = scope?.extraction_scope_notes?.trim()
    || "A substantive source review is recorded, but the current public source-scope record does not describe the extraction method in greater detail.";

  return <section className="vigil-standards-dossier" aria-label={`${source.title} reference dossier`}>
    <nav className="vigil-standards-tabs" aria-label={`${source.title} sections`}>
      {TABS.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? "is-active" : ""} onClick={() => onTab(tab.id)} aria-pressed={activeTab === tab.id}>
        <span>{tab.number}</span> {tab.label}
      </button>)}
    </nav>

    <div className="vigil-standards-tab-panel">
      {activeTab === "overview" && <div className="vigil-standards-reading">
        <div className="vigil-standards-reading-main">
          <p className="vigil-library-kicker">What this source is</p>
          {summaryParagraphs(sourcePublicSummary(source)).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <dl className="vigil-standards-facts">
          <Fact label="Publisher" value={source.issuer} />
          <Fact label="Jurisdiction" value={source.jurisdiction} />
          <Fact label="Source type" value={clean(source.source_class)} />
          <Fact label="Version" value={source.source_version} />
          <Fact label="Lifecycle state" value={clean(source.source_lifecycle_state)} />
          <Fact label="Publication date" value={source.publication_date ?? undefined} />
          <Fact label="Effective date" value={source.effective_date ?? undefined} />
        </dl>
      </div>}

      {activeTab === "relevance" && <div className="vigil-standards-reading vigil-standards-relevance">
        <div className="vigil-standards-reading-main">
          <p className="vigil-library-kicker">Where it matters</p>
          <p>{source.relevance_scope || "A separate relevance scope is not yet published for this source."}</p>
        </div>
        <dl className="vigil-standards-facts">
          <Fact label="AI governance relevance" value={listLabel(source.ai_governance_relevance)} />
          <Fact label="Relevant lifecycle stages" value={listLabel(source.applicable_lifecycle_stages)} />
        </dl>
      </div>}

      {activeTab === "clauses" && <div className="vigil-standards-clauses">
        {clauses.length ? clauses.map((clause) => <details key={clause.requirement_id} className="vigil-standards-clause">
          <summary>
            <span className="vigil-standards-clause-ref">{clause.clause_or_control}</span>
            <span className="vigil-standards-clause-copy">{clause.requirement_summary}</span>
            <span className="vigil-standards-clause-type">{clean(clause.expectation_type) ?? clean(clause.requirement_posture) ?? "Clause"}</span>
            <ChevronDown aria-hidden="true" />
          </summary>
          <ClauseDetail requirement={clause} source={source} />
        </details>) : <div className="vigil-standards-empty-tab"><ClauseCoverageCard scope={scope} /></div>}
      </div>}

      {activeTab === "review" && <div className="vigil-standards-review">
        <div className="vigil-standards-reading">
          <div className="vigil-standards-reading-main vigil-standards-review-main">
            <div className="vigil-standards-review-heading">
              <div><p className="vigil-library-kicker">Substantive review</p><p className="vigil-standards-review-date">{formatReviewDate(source.last_substantive_reviewed)}</p></div>
              {due ? <span className="vigil-status-chip" data-tone="moderate">Review due</span> : null}
            </div>
            <div className="vigil-standards-review-method">
              <p className="vigil-library-kicker">Review method</p>
              <p>{reviewMethod}</p>
            </div>
            <p className="vigil-standards-review-note">Review freshness is calculated from the last substantive source review. Routine metadata updates do not reset this date. The next review date is 90 days after the substantive review date.</p>
          </div>
          <dl className="vigil-standards-facts">
            <Fact label="Review system" value={EXTERNAL_REVIEW_PROVENANCE.system} />
            <Fact label="Production mode" value={EXTERNAL_REVIEW_PROVENANCE.productionMode} />
            <Fact label="Reviewed" value={formatReviewDate(source.last_substantive_reviewed)} />
            <Fact label="Next review" value={nextReviewDate(source.last_substantive_reviewed)} />
            <Fact label="Source access" value={clean(scope?.source_access_status)} />
            <Fact label="Extraction status" value={clean(scope?.extraction_status)} />
            <Fact label="Human role" value={EXTERNAL_REVIEW_PROVENANCE.humanRole} />
            <Fact label="Human substantive review" value={EXTERNAL_REVIEW_PROVENANCE.humanReview} />
            <Fact label="Human source verification" value={EXTERNAL_REVIEW_PROVENANCE.humanVerification} />
          </dl>
        </div>
        {previousVersions.length ? <section className="vigil-standards-versions">
          <p className="vigil-library-kicker">Previous versions</p>
          <ul>{previousVersions.map((version) => <li key={externalSourceKey(version)}><span>{version.source_version}{version.source_lifecycle_state ? ` · ${clean(version.source_lifecycle_state)}` : ""}</span>{version.official_locator ? <a href={version.official_locator} target="_blank" rel="noreferrer" aria-label={`Open version ${version.source_version}`}><ExternalLink aria-hidden="true" /></a> : null}</li>)}</ul>
        </section> : null}
      </div>}
    </div>
  </section>;
}

export default function VigilStandardsBaseline() {
  const [state, setState] = useState<BaselineState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [openSource, setOpenSource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SourceTab>("overview");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadExternalSources(), loadExternalRequirements(), loadExternalRequirementDetails(), loadExternalSourceScope()])
      .then(([sources, requirements, details, scopes]) => {
        if (cancelled) return;
        if (sources.status !== "ready") return setState({ status: "unavailable", message: sources.message });
        setState({ status: "ready", sources: sources.data, requirements: requirements.status === "ready" ? requirements.data : [], details: details.status === "ready" ? details.data : [], scopes: scopes.status === "ready" ? scopes.data : [] });
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
    for (const values of grouped.values()) values.sort((a, b) => a.clause_or_control.localeCompare(b.clause_or_control, undefined, { numeric: true }));
    return grouped;
  }, [detailsById, state]);
  const versionsByIdentity = useMemo(() => {
    const grouped = new Map<string, ExternalSourceEntry[]>();
    if (state.status !== "ready") return grouped;
    for (const source of state.sources) grouped.set(sourceIdentity(source), [...(grouped.get(sourceIdentity(source)) ?? []), source]);
    return grouped;
  }, [state]);

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
      const haystack = [source.title, source.issuer, source.jurisdiction, source.source_class, source.source_version, source.public_summary, source.relevance_scope, source.last_substantive_reviewed, scope?.extraction_status, scope?.extraction_scope_notes, scope?.source_access_status, ...(source.ai_governance_relevance ?? []), ...(source.applicable_lifecycle_stages ?? []), canonicalIdentifierLabel(source), ...clauses.flatMap((clause) => [clause.clause_or_control, clause.requirement_summary, clause.governance_expectation, ...(clause.applicable_actor ?? []), ...(clause.governed_object ?? []), ...(clause.lifecycle_stage ?? []), ...(clause.governance_concepts ?? [])])].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).sort((a, b) => a.title.localeCompare(b.title) || b.source_version.localeCompare(a.source_version));
  }, [clausesBySource, jurisdiction, query, scopeBySource, sourceType, state]);

  const sourceCount = state.status === "ready" ? new Set(state.sources.filter((source) => scopeBySource.get(externalSourceKey(source))?.extraction_status !== "superseded-version").map(sourceIdentity)).size : 0;
  const clauseCount = state.status === "ready" ? state.requirements.length : 0;

  return <Shell><VigilObservatoryNav /><main className="vigil-standards-page"><div className="container mx-auto max-w-[1500px] px-4 py-7 sm:px-6 md:px-10 md:py-9">
    <section className="vigil-standards-shell" aria-labelledby="standards-heading">
      <header className="vigil-standards-header">
        <p className="vigil-library-kicker">VIGIL Observatory</p>
        <h1 id="standards-heading">AI Governance Standards Baseline</h1>
        <p>A curated library of laws, standards, frameworks and technical guidance selected because each source contributes to a specific AI-governance question.</p>
      </header>

      {state.status === "loading" && <div className="vigil-reference-state">Loading AI Governance Standards Baseline…</div>}
      {state.status === "unavailable" && <div className="vigil-reference-state"><h2>AI Governance Standards Baseline unavailable</h2><p>{state.message}</p></div>}
      {state.status === "ready" && <>
        <section className="vigil-standards-toolbar" aria-label="Search and filter AI governance sources">
          <SearchControl value={query} onChange={setQuery} />
          <label><span>Source type</span><select value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option value="all">All source types</option>{sourceTypes.map((value) => <option key={value} value={value}>{clean(value) ?? value}</option>)}</select></label>
          <label><span>Jurisdiction</span><select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option value="all">All jurisdictions</option>{jurisdictions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <div className="vigil-standards-result-line"><span><strong>{visibleSources.length}</strong> of {sourceCount} sources</span><span>{clauseCount.toLocaleString()} clauses represented</span>{(query || sourceType !== "all" || jurisdiction !== "all") ? <button type="button" onClick={() => { setQuery(""); setSourceType("all"); setJurisdiction("all"); }}>Clear filters</button> : null}</div>
        </section>

        <section className="vigil-standards-library" aria-label="AI governance standards sources">
          <div className="vigil-standards-list-head" aria-hidden="true"><span>Source</span><span>Jurisdiction / type</span><span>Clauses</span><span /></div>
          {visibleSources.map((source) => {
            const key = externalSourceKey(source);
            const scope = scopeBySource.get(key);
            const clauses = clausesBySource.get(key) ?? [];
            const isOpen = openSource === key;
            const previousVersions = (versionsByIdentity.get(sourceIdentity(source)) ?? []).filter((version) => scopeBySource.get(externalSourceKey(version))?.extraction_status === "superseded-version").sort((a, b) => b.source_version.localeCompare(a.source_version, undefined, { numeric: true }));
            return <article className={`vigil-standards-source${isOpen ? " is-open" : ""}`} key={key}>
              <div className="vigil-standards-source-row">
                <button type="button" onClick={() => { setOpenSource(isOpen ? null : key); setActiveTab("overview"); }} aria-expanded={isOpen}>
                  <span className="vigil-standards-source-primary"><strong>{source.title}</strong><small>{canonicalIdentifierLabel(source)} · Version {source.source_version}</small></span>
                  <span className="vigil-standards-source-secondary"><strong>{source.jurisdiction ?? "Jurisdiction not specified"}</strong><small>{clean(source.source_class) ?? "Source type not specified"}</small></span>
                  <span className="vigil-standards-source-count"><strong>{clauses.length}</strong> clause{clauses.length === 1 ? "" : "s"}</span>
                  <ChevronDown aria-hidden="true" />
                </button>
                {source.official_locator ? <a href={source.official_locator} target="_blank" rel="noreferrer" aria-label={`Open official source for ${source.title}`} title="Open official source"><ExternalLink aria-hidden="true" /></a> : null}
              </div>
              {isOpen ? <StandardsDossier source={source} scope={scope} clauses={clauses} previousVersions={previousVersions} activeTab={activeTab} onTab={setActiveTab} /> : null}
            </article>;
          })}
          {!visibleSources.length ? <div className="vigil-empty-panel">No sources match the current search and filters.</div> : null}
        </section>
      </>}
    </section>
  </div></main></Shell>;
}
