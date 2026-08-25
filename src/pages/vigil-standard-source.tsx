import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
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
  type ExternalReviewEvent,
  type ExternalSourceEntry,
  type ExternalSourceScopeEntry,
} from "@/lib/vigilExternalKnowledge";

type DetailState =
  | { status: "loading" }
  | { status: "unavailable"; message: string }
  | {
      status: "ready";
      sources: ExternalSourceEntry[];
      requirements: ExternalRequirement[];
      details: ExternalRequirementDetail[];
      scopes: ExternalSourceScopeEntry[];
    };

type SourceTab = "overview" | "relevance" | "clauses" | "review";

const TABS: Array<{ id: SourceTab; number: string; label: string }> = [
  { id: "overview", number: "01", label: "Overview" },
  { id: "relevance", number: "02", label: "Governance Relevance" },
  { id: "clauses", number: "03", label: "Clauses" },
  { id: "review", number: "04", label: "Evidence & Review" },
];

function clean(value?: string) {
  return value?.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function comparable(value?: string) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function knowledgeLabel(value: string) {
  return (clean(value) ?? value).replace(/\bAi\b/g, "AI").replace(/\bIct\b/g, "ICT");
}

function listLabel(values?: string[]) {
  return values?.length ? values.map(knowledgeLabel).join(" · ") : "Not yet classified";
}

function sourceScopeKey(scope: Pick<ExternalSourceScopeEntry, "vigil_source_id" | "source_version">) {
  return `${scope.vigil_source_id}|${scope.source_version}`;
}

function requirementSourceKey(requirement: Pick<ExternalRequirement, "vigil_source_id" | "source_version">) {
  return `${requirement.vigil_source_id}|${requirement.source_version}`;
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

function currentReviewEvent(source: ExternalSourceEntry) {
  const provenance = source.substantive_review_provenance;
  if (!provenance?.review_events?.length) return undefined;
  return provenance.review_events.find((event) => event.review_event_id === provenance.current_review_event_id)
    ?? [...provenance.review_events].sort((a, b) => a.review_date.localeCompare(b.review_date)).at(-1);
}

function reviewMethodLabel(event?: ExternalReviewEvent) {
  if (!event) return undefined;
  return [clean(event.review_method.access_method), clean(event.review_method.scope_method)].filter(Boolean).join(" · ");
}

function reviewSystemLabel(event?: ExternalReviewEvent) {
  if (!event) return undefined;
  return [event.review_system.provider, event.review_system.platform].filter(Boolean).join(" · ");
}

function Fact({ label, value }: { label: string; value?: string }) {
  return <div><dt>{label}</dt><dd>{value || "Not specified"}</dd></div>;
}

function CaseField({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  return <div className="vigil-case-field"><dt>{label}</dt><dd className={mono ? "is-mono" : undefined}>{value || "Not specified"}</dd></div>;
}

function ClauseDetail({ requirement, source }: { requirement: ExternalRequirementDetail; source: ExternalSourceEntry }) {
  const governanceExpectation = requirement.governance_expectation?.trim();
  const showExpectation = Boolean(governanceExpectation && comparable(governanceExpectation) !== comparable(requirement.requirement_summary));
  const rows: Array<[string, string[] | undefined]> = [
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
  const visible = rows.filter(([, values]) => values?.length);

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

  if (status === "blocked access") return {
    heading: "Primary-text review is blocked",
    body: recordedScope || "Clause-level requirements are not represented because the primary normative text has not been available for lawful substantive review.",
    qualification: access.includes("metadata") ? "Only official metadata or an abstract is available. VIGIL does not infer normative clauses from metadata; controlled standards require lawful primary-text access before clause-level review." : undefined,
  };
  if (status === "supporting only") return {
    heading: "Clause decomposition is outside the current scope",
    body: recordedScope || "This source is retained as supporting authority rather than as a first-class clause-level requirement corpus.",
    qualification: access.includes("licensed") ? "Lawful licensed primary-text access is recorded. Copyrighted source text is not reproduced; the absence of clause records reflects the bounded review scope, not a prohibition on analytical abstraction." : undefined,
  };
  if (status === "context only") return { heading: "Context source — no clause decomposition", body: recordedScope || "This source is retained for context, comparison or taxonomy architecture rather than clause-level governance requirements." };
  if (status === "partial") return { heading: "Clause review is incomplete", body: recordedScope || "The substantive review is partial and the current public dataset does not yet contain clause-level records for this source." };
  if (status === "complete") return { heading: "No clause records met the bounded review criterion", body: recordedScope || "A substantive review is recorded, but it did not produce public clause-level records under VIGIL's current governance-significant review criterion." };
  return { heading: "Clause coverage is not yet represented", body: recordedScope || "The current source-scope record does not establish a published clause-level review for this source." };
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

function ReviewHistory({ events }: { events: ExternalReviewEvent[] }) {
  if (events.length < 2) return null;
  const ordered = [...events].sort((a, b) => b.review_date.localeCompare(a.review_date));
  return <details className="vigil-standards-review-history">
    <summary>Review history <span>{events.length} events</span></summary>
    <div className="vigil-standards-review-history-list">
      {ordered.map((event) => <article key={event.review_event_id}>
        <div className="vigil-standards-review-history-heading"><strong>{formatReviewDate(event.review_date)}</strong><span>{event.review_system.provider} · {event.review_system.model}</span></div>
        <p>{event.review_scope}</p>
        <small>{reviewMethodLabel(event)}</small>
      </article>)}
    </div>
  </details>;
}

export default function VigilStandardSource() {
  const [, params] = useRoute("/observatory/knowledge-base/standards-sources/:sourceKey");
  const requestedKey = decodeURIComponent(params?.sourceKey ?? "");
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [activeTab, setActiveTab] = useState<SourceTab>("overview");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [requestedKey]);

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

  const detailById = useMemo(() => state.status === "ready" ? new Map(state.details.map((item) => [item.requirement_id, item])) : new Map<string, ExternalRequirementDetail>(), [state]);
  const source = state.status === "ready" ? state.sources.find((item) => externalSourceKey(item) === requestedKey) : undefined;
  const scope = state.status === "ready" ? state.scopes.find((item) => sourceScopeKey(item) === requestedKey) : undefined;
  const clauses = state.status === "ready" ? state.requirements
    .filter((item) => requirementSourceKey(item) === requestedKey)
    .map((item) => detailById.get(item.requirement_id) ?? item)
    .sort((a, b) => a.clause_or_control.localeCompare(b.clause_or_control, undefined, { numeric: true })) : [];
  const previousVersions = state.status === "ready" && source ? state.sources
    .filter((item) => sourceIdentity(item) === sourceIdentity(source) && externalSourceKey(item) !== requestedKey)
    .sort((a, b) => b.source_version.localeCompare(a.source_version, undefined, { numeric: true })) : [];

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10"><Link href="/observatory/knowledge-base/standards-sources" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> AI Governance Standards</Link><div className="vigil-reference-state">Loading standard…</div></div></main></Shell>;
  if (state.status === "unavailable") return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10"><Link href="/observatory/knowledge-base/standards-sources" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> AI Governance Standards</Link><div className="vigil-reference-state"><h2>Standard unavailable</h2><p>{state.message}</p></div></div></main></Shell>;
  if (!source) return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10"><Link href="/observatory/knowledge-base/standards-sources" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> AI Governance Standards</Link><div className="vigil-reference-state"><h2>Standard not found</h2><p>The requested source is not represented in the current standards library.</p></div></div></main></Shell>;

  const reviewEvent = currentReviewEvent(source);
  const reviewDate = reviewEvent?.review_date ?? source.last_substantive_reviewed;
  const reviewScope = reviewEvent?.review_scope?.trim() || scope?.extraction_scope_notes?.trim() || "A substantive source review is recorded, but the current public source record does not describe the analytical scope in greater detail.";
  const due = reviewIsDue(reviewDate);
  const reviewEvents = source.substantive_review_provenance?.review_events ?? [];
  const activeDefinition = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page vigil-standard-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10">
    <Link href="/observatory/knowledge-base/standards-sources" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> AI Governance Standards</Link>

    <header className="vigil-case-file-hero vigil-case-file-hero-v4">
      <div className="vigil-case-file-title-block">
        <p className="vigil-library-kicker">AI Governance Standards</p>
        <h1>{source.title}</h1>
        <p className="vigil-case-file-summary">{sourcePublicSummary(source)}</p>
      </div>
      <aside className="vigil-case-meta-panel" aria-label="Standard metadata">
        <dl>
          <CaseField label="Source" value={canonicalIdentifierLabel(source)} mono />
          <CaseField label="Jurisdiction" value={source.jurisdiction} />
          <CaseField label="Source type" value={clean(source.source_class)} />
          <CaseField label="Version" value={source.source_version} mono />
          <CaseField label="Clauses represented" value={String(clauses.length)} />
          <CaseField label="Reviewed" value={formatReviewDate(reviewDate)} mono />
        </dl>
        {source.official_locator ? <a href={source.official_locator} className="vigil-case-print-button" target="_blank" rel="noreferrer">Official source <ExternalLink aria-hidden="true" /></a> : null}
      </aside>
    </header>

    <nav className="vigil-case-stage-nav" aria-label={`${source.title} sections`}>
      <div className="vigil-case-stage-tabs vigil-standard-stage-tabs" role="tablist">
        {TABS.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "is-active" : undefined} onClick={() => setActiveTab(tab.id)}><span>{tab.number}</span>{tab.label}</button>)}
      </div>
    </nav>

    <div className="vigil-case-active-stage vigil-standard-active-stage" role="tabpanel" aria-label={`${activeDefinition.number} ${activeDefinition.label}`}>
      <section className="vigil-case-section vigil-standard-detail-section">
        <header className="vigil-standard-section-heading"><span>{activeDefinition.number}</span><div><p className="vigil-library-kicker">{activeDefinition.label}</p><h2>{activeDefinition.label}</h2></div></header>
        <div className="vigil-standard-section-body">
          {activeTab === "overview" && <div className="vigil-standards-reading">
            <div className="vigil-standards-reading-main"><p className="vigil-library-kicker">What this source is</p>{summaryParagraphs(sourcePublicSummary(source)).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
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
            <div className="vigil-standards-reading-main"><p className="vigil-library-kicker">Where it matters</p><p>{source.relevance_scope || "A separate relevance scope is not yet published for this source."}</p></div>
            <dl className="vigil-standards-facts"><Fact label="AI governance relevance" value={listLabel(source.ai_governance_relevance)} /><Fact label="Relevant lifecycle stages" value={listLabel(source.applicable_lifecycle_stages)} /></dl>
          </div>}

          {activeTab === "clauses" && <div className="vigil-standards-clauses vigil-standard-file-clauses">
            {clauses.length ? clauses.map((clause) => <details key={clause.requirement_id} className="vigil-standards-clause"><summary><span className="vigil-standards-clause-ref">{clause.clause_or_control}</span><span className="vigil-standards-clause-copy">{clause.requirement_summary}</span><span className="vigil-standards-clause-type">{clean(clause.expectation_type) ?? clean(clause.requirement_posture) ?? "Clause"}</span></summary><ClauseDetail requirement={clause} source={source} /></details>) : <ClauseCoverageCard scope={scope} />}
          </div>}

          {activeTab === "review" && <div className="vigil-standards-review">
            <div className="vigil-standards-reading">
              <div className="vigil-standards-reading-main vigil-standards-review-main">
                <div className="vigil-standards-review-heading"><div><p className="vigil-library-kicker">VIGIL review</p><p className="vigil-standards-review-date">{formatReviewDate(reviewDate)}</p></div>{due ? <span className="vigil-status-chip" data-tone="moderate">Review due</span> : null}</div>
                <div className="vigil-standards-review-method"><p className="vigil-library-kicker">What the review establishes</p>{reviewEvent ? <p><strong>{reviewEvent.review_system.provider} {reviewEvent.review_system.model}</strong> performed the substantive analytical review through {reviewEvent.review_system.platform}. {reviewScope}</p> : <p>{reviewScope}</p>}{scope?.extraction_scope_notes && comparable(scope.extraction_scope_notes) !== comparable(reviewScope) ? <p className="vigil-standards-review-boundary"><strong>Coverage boundary:</strong> {scope.extraction_scope_notes}</p> : null}</div>
              </div>
              <dl className="vigil-standards-facts">
                <Fact label="AI system" value={reviewSystemLabel(reviewEvent) ?? "Review provenance not yet published"} />
                <Fact label="Model" value={reviewEvent?.review_system.model ?? "Review provenance not yet published"} />
                <Fact label="Review role" value={clean(reviewEvent?.ai_role)} />
                <Fact label="Review method" value={reviewMethodLabel(reviewEvent)} />
                <Fact label="Production mode" value={clean(reviewEvent?.generation_mode)} />
                <Fact label="Reviewed" value={formatReviewDate(reviewDate)} />
                <Fact label="Next review" value={nextReviewDate(reviewDate)} />
                <Fact label="Source access" value={clean(scope?.source_access_status)} />
                <Fact label="Review coverage" value={clean(scope?.extraction_status)} />
                <Fact label="Human review" value={clean(reviewEvent?.human_review_status)} />
              </dl>
            </div>
            <ReviewHistory events={reviewEvents} />
            {previousVersions.length ? <section className="vigil-standards-versions"><p className="vigil-library-kicker">Previous versions</p><ul>{previousVersions.map((version) => <li key={externalSourceKey(version)}><span>{version.source_version}{version.source_lifecycle_state ? ` · ${clean(version.source_lifecycle_state)}` : ""}</span>{version.official_locator ? <a href={version.official_locator} target="_blank" rel="noreferrer" aria-label={`Open version ${version.source_version}`}><ExternalLink aria-hidden="true" /></a> : null}</li>)}</ul></section> : null}
          </div>}
        </div>
      </section>
    </div>
  </div></main></Shell>;
}
