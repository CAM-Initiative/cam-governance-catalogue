import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Search, X } from "lucide-react";
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
  | {
      status: "ready";
      sources: ExternalSourceEntry[];
      requirements: ExternalRequirement[];
      details: ExternalRequirementDetail[];
      scopes: ExternalSourceScopeEntry[];
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

function requirementSourceKey(requirement: Pick<ExternalRequirement, "vigil_source_id" | "source_version">) {
  return `${requirement.vigil_source_id}|${requirement.source_version}`;
}

function sourceScopeKey(scope: Pick<ExternalSourceScopeEntry, "vigil_source_id" | "source_version">) {
  return `${scope.vigil_source_id}|${scope.source_version}`;
}

function sourceRoleLabel(role?: string) {
  const labels: Record<string, string> = {
    "primary-ai-governance": "Primary AI-governance source",
    "supporting-external-authority": "Supporting external authority",
    "context-or-discovery": "Context / discovery source",
    "excluded-from-current-scope": "Excluded from current scope",
  };
  return role ? labels[role] ?? clean(role) ?? role : "Role not specified";
}

function sourceRoleExplanation(role?: string) {
  if (role === "primary-ai-governance") {
    return "Included as a first-class authority because its principal subject directly governs AI systems or AI-specific governance and technical controls. Clause- and control-level requirements are extracted where lawful source access permits.";
  }
  if (role === "supporting-external-authority") {
    return "Included only where a broader law, standard or framework provides material authority for an AI-governance question. It is deliberately not expanded into a general-law corpus simply because it can apply to AI.";
  }
  if (role === "context-or-discovery") {
    return "Included for terminology, standards-landscape context or discovery. It informs interpretation but is not treated as a first-class source of extracted AI-governance requirements.";
  }
  if (role === "excluded-from-current-scope") {
    return "Registered for traceability but intentionally excluded from the current external-governance baseline.";
  }
  return "The source is retained in VIGIL's external-governance register. Its role in the curated baseline is not separately classified in the current public projection.";
}

function sourceSummaryMeta(source: ExternalSourceEntry, scope?: ExternalSourceScopeEntry) {
  const title = comparable(source.title);
  const issuer = comparable(source.issuer);
  const visibleIssuer = source.issuer && issuer && !title.includes(issuer) ? source.issuer : undefined;
  return uniqueText([
    visibleIssuer,
    source.jurisdiction,
    clean(source.source_class),
    sourceRoleLabel(scope?.source_role),
  ]);
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

function DatasetLink({ href, children }: { href: string; children: string }) {
  return <a className="vigil-dataset-link" href={href} target="_blank" rel="noreferrer" download>
    <Download aria-hidden="true" />
    {children}
  </a>;
}

function DetailList({ title, values }: { title: string; values?: string[] }) {
  if (!values?.length) return null;
  return <section className="vigil-requirement-detail-block">
    <h4>{title}</h4>
    {values.length === 1 ? <p>{values[0]}</p> : <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul>}
  </section>;
}

function RequirementDetail({ requirement, source }: { requirement: ExternalRequirementDetail; source: ExternalSourceEntry }) {
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

  return <details className="vigil-clause-record">
    <summary>
      <span className="vigil-clause-reference">{referenceFor(requirement, source)}</span>
      <strong>{requirement.requirement_summary}</strong>
    </summary>
    <div className="vigil-clause-body">
      <section className="vigil-requirement-lead">
        <h4>What this authority expects</h4>
        <p>{requirement.governance_expectation ?? requirement.requirement_summary}</p>
      </section>

      <div className="vigil-requirement-detail-grid">
        <DetailList title="Who it applies to" values={requirement.applicable_actor} />
        <DetailList title="What it governs" values={requirement.governed_object} />
        <DetailList title="Lifecycle stage" values={requirement.lifecycle_stage?.map((value) => clean(value) ?? value)} />
        <DetailList title="Evidence expected" values={requirement.evidence_expectation} />
        <DetailList title="Required artefacts" values={requirement.required_artefacts} />
        <DetailList title="How it can be verified" values={requirement.verification_method} />
        <DetailList title="When / how often" values={requirement.timing_or_frequency} />
        <DetailList title="Applicability conditions" values={requirement.applicability_conditions} />
        <DetailList title="Exceptions / qualifications" values={requirement.exceptions_or_qualifications} />
      </div>

      {!hasRichDetail && <p className="vigil-requirement-detail-unavailable">The compact public index contains this requirement, but no additional structured detail was available from the canonical requirement record at load time.</p>}

      <div className="vigil-requirement-meta vigil-requirement-meta-expanded">
        <span>Requirement: {clean(requirement.requirement_posture)}</span>
        {requirement.expectation_type && <span>Type: {clean(requirement.expectation_type)}</span>}
        {requirement.normative_force && <span>Authority: {clean(requirement.normative_force)}</span>}
        {requirement.interpretation_status && <span>Interpretation: {clean(requirement.interpretation_status)}</span>}
        {requirement.source_access_status && <span>Source access: {clean(requirement.source_access_status)}</span>}
      </div>

      {requirement.governance_concepts?.length ? <p className="vigil-requirement-concepts"><strong>Governance concepts:</strong> {requirement.governance_concepts.map(clean).join(" · ")}</p> : null}
      <div className="vigil-clause-links">
        {(requirement.authoritative_locator || source.official_locator) && <a href={requirement.authoritative_locator ?? source.official_locator} target="_blank" rel="noreferrer">Open authoritative source <ExternalLink aria-hidden="true" /></a>}
        <span>{requirement.requirement_id}</span>
      </div>
    </div>
  </details>;
}

function VigilExternalGovernanceBaseline() {
  const [state, setState] = useState<BaselineState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [sourceRole, setSourceRole] = useState("all");

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
        sourcesUrl: sources.attemptedUrl,
        requirementsUrl: details.status === "ready" ? details.attemptedUrl : requirements.status === "ready" ? requirements.attemptedUrl : undefined,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const scopeBySource = useMemo(() => state.status === "ready"
    ? new Map(state.scopes.map((scope) => [sourceScopeKey(scope), scope]))
    : new Map<string, ExternalSourceScopeEntry>(), [state]);

  const detailsById = useMemo(() => state.status === "ready"
    ? new Map(state.details.map((requirement) => [requirement.requirement_id, requirement]))
    : new Map<string, ExternalRequirementDetail>(), [state]);

  const requirementsBySource = useMemo(() => {
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

  const jurisdictions = useMemo(() => state.status === "ready"
    ? uniqueText(state.sources.map((source) => source.jurisdiction)).sort((a, b) => a.localeCompare(b))
    : [], [state]);

  const sourceRoles = useMemo(() => state.status === "ready"
    ? uniqueText(state.scopes.map((scope) => scope.source_role)).sort((a, b) => sourceRoleLabel(a).localeCompare(sourceRoleLabel(b)))
    : [], [state]);

  const filtered = useMemo(() => {
    if (state.status !== "ready") return [];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return state.sources.filter((source) => {
      const key = externalSourceKey(source);
      const scope = scopeBySource.get(key);
      const requirements = requirementsBySource.get(key) ?? [];
      if (jurisdiction !== "all" && source.jurisdiction !== jurisdiction) return false;
      if (sourceRole !== "all" && scope?.source_role !== sourceRole) return false;
      if (!terms.length) return true;
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
        scope?.review_priority_rationale,
        ...requirements.flatMap((requirement) => [
          requirement.clause_or_control,
          requirement.requirement_summary,
          requirement.governance_expectation,
          requirement.requirement_posture,
          requirement.expectation_type,
          requirement.normative_force,
          ...(requirement.applicable_actor ?? []),
          ...(requirement.governed_object ?? []),
          ...(requirement.lifecycle_stage ?? []),
          ...(requirement.governance_concepts ?? []),
        ]),
      ].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).sort((a, b) => a.title.localeCompare(b.title) || b.source_version.localeCompare(a.source_version));
  }, [jurisdiction, query, requirementsBySource, scopeBySource, sourceRole, state]);

  return <Shell><VigilObservatoryNav /><main className="vigil-reference-page"><div className="container mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
    <header className="vigil-simple-hero vigil-reference-hero">
      <p className="vigil-library-kicker">Curated external authority baseline</p>
      <h1>External Governance Baseline</h1>
      <p>VIGIL does not collect every law, standard or technical publication that can touch AI. This baseline selects sources because they directly govern AI systems, provide bounded authority for material AI-governance questions, or supply context needed to interpret the governance landscape. Open a source to see the role it plays and the clause- or control-level requirements extracted from it.</p>
    </header>

    {state.status === "loading" && <div className="vigil-reference-state">Loading external governance baseline…</div>}
    {state.status === "unavailable" && <div className="vigil-reference-state"><h2>External governance baseline unavailable</h2><p>{state.message}</p></div>}
    {state.status === "ready" && <>
      <div className="vigil-dataset-toolbar vigil-baseline-toolbar">
        <p><strong>{state.sources.length.toLocaleString()}</strong> source versions · <strong>{state.requirements.length.toLocaleString()}</strong> extracted governance requirements. {filtered.length !== state.sources.length ? <span>{filtered.length.toLocaleString()} source versions match the current filters.</span> : null}</p>
        <div className="vigil-dataset-actions">
          <DatasetLink href={state.sourcesUrl}>Download source register</DatasetLink>
          {state.requirementsUrl && <DatasetLink href={state.requirementsUrl}>Download full requirement records</DatasetLink>}
        </div>
      </div>

      <aside className="vigil-baseline-scope-note" aria-label="How sources enter the baseline">
        <strong>How the collection is curated</strong>
        <p><b>Primary AI-governance sources</b> are eligible for first-class requirement extraction. <b>Supporting authorities</b> are retained only for bounded questions rather than imported wholesale. <b>Context / discovery sources</b> support interpretation and standards discovery without being treated as requirement-bearing authority.</p>
      </aside>

      <div className="vigil-reference-controls vigil-baseline-controls">
        <SearchControl value={query} onChange={setQuery} placeholder="Search source, clause, duty, actor, lifecycle stage or governance concept…" />
        <label className="vigil-reference-filter"><span>Source role</span><select value={sourceRole} onChange={(event) => setSourceRole(event.target.value)}><option value="all">All source roles</option>{sourceRoles.map((value) => <option value={value} key={value}>{sourceRoleLabel(value)}</option>)}</select></label>
        <label className="vigil-reference-filter"><span>Jurisdiction</span><select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option value="all">All jurisdictions</option>{jurisdictions.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </div>

      <section className="vigil-governance-source-list" aria-label="Curated external governance sources and extracted requirements">
        {filtered.map((source) => {
          const key = externalSourceKey(source);
          const scope = scopeBySource.get(key);
          const requirements = requirementsBySource.get(key) ?? [];
          const summaryMeta = sourceSummaryMeta(source, scope);
          return <details key={key} className="vigil-governance-source">
            <summary>
              <div className="vigil-governance-source-title">
                <strong>{source.title}</strong>
                <span>{canonicalIdentifierLabel(source)} · Version {source.source_version}</span>
                {summaryMeta.length > 0 && <small>{summaryMeta.join(" · ")}</small>}
              </div>
              <div className="vigil-governance-source-count">
                <b>{requirements.length.toLocaleString()}</b>
                <span>extracted requirement{requirements.length === 1 ? "" : "s"}</span>
              </div>
            </summary>

            <div className="vigil-governance-source-body">
              <section className="vigil-source-purpose">
                <p className="vigil-library-kicker">Why this source is in the baseline</p>
                <p>{sourceRoleExplanation(scope?.source_role)}</p>
              </section>

              <dl className="vigil-source-facts">
                <div><dt>Source role</dt><dd>{sourceRoleLabel(scope?.source_role)}</dd></div>
                <div><dt>Extraction state</dt><dd>{clean(scope?.extraction_status) ?? "Not specified"}</dd></div>
                <div><dt>Source access</dt><dd>{clean(scope?.source_access_status) ?? "Not specified"}</dd></div>
                <div><dt>Lifecycle state</dt><dd>{clean(source.source_lifecycle_state) ?? "Not specified"}</dd></div>
              </dl>

              {(scope?.extraction_scope_notes || scope?.next_action) && <div className="vigil-source-review-note">
                {scope.extraction_scope_notes && <p><strong>Extraction boundary:</strong> {scope.extraction_scope_notes}</p>}
                {scope.next_action && <p><strong>Current review action:</strong> {scope.next_action}</p>}
              </div>}

              <div className="vigil-source-actions">
                {source.official_locator && <a href={source.official_locator} target="_blank" rel="noreferrer">Open official source <ExternalLink aria-hidden="true" /></a>}
                <span>VIGIL source identity: {source.vigil_source_id}</span>
              </div>

              <section className="vigil-source-requirements" aria-label={`Extracted requirements for ${source.title}`}>
                <div className="vigil-source-requirements-heading">
                  <p className="vigil-library-kicker">Extracted requirements</p>
                  <h3>Clauses and controls represented from this source</h3>
                </div>
                {requirements.length > 0
                  ? <div className="vigil-clause-list">{requirements.map((requirement) => <RequirementDetail key={requirement.requirement_id} requirement={requirement} source={source} />)}</div>
                  : <p className="vigil-empty-panel">No clause-level requirement records are asserted for this source/version. The source role, access basis and extraction state above explain why.</p>}
              </section>
            </div>
          </details>;
        })}
        {filtered.length === 0 && <div className="vigil-empty-panel">No external governance sources or extracted requirements match the current search and filters.</div>}
      </section>
    </>}
  </div></main></Shell>;
}

// Historical route retained for compatibility. Requirements now live inside the
// curated external-governance baseline rather than on a separate public surface.
export function VigilExternalRequirements() {
  return <VigilExternalGovernanceBaseline />;
}

export function VigilExternalSources() {
  return <VigilExternalGovernanceBaseline />;
}
