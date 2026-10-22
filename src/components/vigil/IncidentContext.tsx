import type { ReactNode } from "react";
import type { UnknownRecord } from "@/lib/vigilRegistry";
import type { AffectedSystem } from "@/lib/vigilAffectedSystems";
import "./IncidentContext.css";

/**
 * Stage 01 presentation of the canonical Incident Context.
 * This component only reads the Incident. It NEVER converts legacy jurisdiction
 * strings, platform/vendor names, or regulatory keywords into reviewed claims.
 */
type IncidentContextProps = {
  raw: UnknownRecord;
  systems: AffectedSystem[];
  sourceReferenceNumbers?: Record<string, number>;
  variant?: "case-file" | "report";
};

function object(value: unknown): UnknownRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : undefined;
}

function string(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function strings(value: unknown): string[] {
  return (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value])
    .flatMap((item) => string(item) ? [string(item)!] : []);
}

function readable(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const values = strings(value);
  return values.length
    ? values.map((item) => item.replace(/_/g, " ").replace(/-/g, " ").replace(/\b[a-z]/g, char => char.toUpperCase())).join(" · ")
    : undefined;
}

const geographicRoleLabels: Record<string, string> = {
  "occurrence-location": "Occurrence location",
  "affected-service-jurisdiction": "Affected service jurisdiction",
  "affected-organization-jurisdiction": "Affected institution jurisdiction",
  "affected-population-jurisdiction": "Affected population jurisdiction",
  "provider-location": "Provider location",
  "operator-location": "Operator location",
  "infrastructure-location": "Infrastructure location",
  "regulatory-context": "Regulatory context",
  other: "Other relationship",
};

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div className="vigil-incident-context__field">
    <dt>{label}</dt><dd>{value}</dd>
  </div>;
}

function ContextGroup({ title, caption, children, id }: {
  title: string; caption: string; children: ReactNode; id: string;
}) {
  return <section className="vigil-incident-context__group" aria-labelledby={id}>
    <header className="vigil-incident-context__group-heading">
      <h4 id={id}>{title}</h4><p>{caption}</p>
    </header>
    {children}
  </section>;
}

function EvidenceRefs({ refs, raw, numbers }: {
  refs: unknown; raw: UnknownRecord; numbers: Record<string, number>;
}) {
  const sources = Array.isArray(raw.source_records) ? raw.source_records : [];
  const items = [...new Set(strings(refs))].flatMap(ref => {
    const match = /^source_records\[(\d+)\]$/.exec(ref);
    if (!match) return [];
    const source = object(sources[Number(match[1])]);
    const title = string(source?.source_title) ?? "Source evidence";
    const number = numbers[ref];
    return [{ ref, title, number }];
  });
  if (!items.length) return null;
  return <div className="vigil-incident-context__evidence">
    <span>Evidence</span>
    {items.map(({ref, title, number}) => number
      ? <a href={`#vigil-evidence-reference-${number}`} key={ref} title={title} aria-label={`Evidence reference ${number}: ${title}`}>[{number}] {title}</a>
      : <span key={ref} title={title}>{title} (reference not linked)</span>
    )}
  </div>;
}

function EvidenceDetails({ basis, refs, raw, numbers, detail }: {
  basis: unknown; detail?: unknown; refs: unknown; raw: UnknownRecord; numbers: Record<string, number>;
}) {
  const description = string(detail);
  const explanation = string(basis);
  return <>
    {description && <p className="vigil-incident-context__detail">{description}</p>}
    {explanation && <div className="vigil-incident-context__basis"><strong>Evidence basis</strong><p>{explanation}</p></div>}
    <EvidenceRefs refs={refs} raw={raw} numbers={numbers}/>
  </>;
}

function Party({ entry, raw, numbers }: { entry: UnknownRecord; raw: UnknownRecord; numbers: Record<string, number> }) {
  return <article className="vigil-incident-context__relationship">
    <div className="vigil-incident-context__relationship-heading">
      <h5>{string(entry.name) ?? "Unnamed entity"}</h5>
      {string(entry.evidence_state) && <span className="vigil-incident-context__state">{readable(entry.evidence_state)}</span>}
    </div>
    <dl className="vigil-incident-context__fields">
      <Detail label="Entity type" value={readable(entry.kind)}/>
      <Detail label="Role in occurrence" value={readable(entry.roles)}/>
    </dl>
    <EvidenceDetails basis={entry.evidence_basis} refs={entry.source_record_refs} raw={raw} numbers={numbers}/>
  </article>;
}

function GeographyRelation({ relation, parties, raw, numbers }: {
  relation: UnknownRecord; parties: UnknownRecord[]; raw: UnknownRecord; numbers: Record<string, number>;
}) {
  const locations = Array.isArray(relation.locations) ? relation.locations.flatMap(x => object(x) ? [object(x)!] : []) : [];
  const names = locations.map(loc => [string(loc.locality),string(loc.subdivision_code),string(loc.country_code)].filter(Boolean).join(" · ")).filter(Boolean);
  const partyNames = strings(relation.party_refs).flatMap(ref => {
    const found = parties.find(p => p.party_id === ref);
    return found && string(found.name) ? [string(found.name)!] : [];
  });
  return <article className="vigil-incident-context__relationship">
    <div className="vigil-incident-context__relationship-heading">
      <h5>{geographicRoleLabels[string(relation.role) ?? ""] ?? readable(relation.role) ?? "Geographic relationship"}</h5>
      {string(relation.evidence_state) && <span className="vigil-incident-context__state">{readable(relation.evidence_state)}</span>}
    </div>
    <dl className="vigil-incident-context__fields">
      <Detail label="Recorded jurisdiction(s)" value={names.join(" · ") || "Location not established"}/>
      <Detail label="Related entities" value={partyNames.join(" · ")}/>
    </dl>
    <EvidenceDetails basis={relation.evidence_basis} refs={relation.source_record_refs} raw={raw} numbers={numbers}/>
  </article>;
}

export function IncidentContext({ raw, systems, sourceReferenceNumbers = {}, variant = "case-file" }: IncidentContextProps) {
  const system = object(raw.system_context);
  const agent = object(system?.agent_context);
  const environment = object(system?.occurrence_environment);
  const jurisdiction = object(raw.jurisdictional_context);
  const partyContainer = object(raw.affected_party_context);
  const parties = Array.isArray(partyContainer?.entities)
    ? partyContainer.entities.flatMap(x => object(x) ? [object(x)!] : [])
    : [];
  const geography = object(jurisdiction?.normalized_geography);
  const relations = Array.isArray(geography?.relations)
    ? geography.relations.flatMap(x => object(x) ? [object(x)!] : [])
    : [];
  const geographicRelations = relations.filter(x => x.role !== "regulatory-context");
  const regulatoryRelations = relations.filter(x => x.role === "regulatory-context");
  const regulatorySurfaces = strings(jurisdiction?.regulatory_surface);
  const primary = string(jurisdiction?.primary_jurisdiction);
  const secondaries = strings(jurisdiction?.secondary_jurisdictions);
  const crossBorder = string(jurisdiction?.cross_border_relevance);
  const systemEvidence = systems.length ? systems : [];
  const hasLegacyGeography = Boolean(primary || secondaries.length || crossBorder);

  return <section className={`vigil-incident-context vigil-incident-context--${variant}`} aria-labelledby="vigil-incident-context-heading">
    <header className="vigil-incident-context__intro">
      <h3 id="vigil-incident-context-heading">Incident Context</h3>
      <p>Systems, operating conditions, participating or affected parties, and jurisdictional relationships recorded in the evidence.</p>
    </header>

    <ContextGroup id="vigil-context-technology" title="Systems & Technology" caption="The technology, interfaces and components identified in the occurrence.">
      {systemEvidence.length
        ? systemEvidence.map((item, index) => <div key={`${item.recordId}-technology-${index}`} className="vigil-incident-context__item">
            <dl className="vigil-incident-context__fields">
              <Detail label="Provider / platform" value={item.provider}/>
              <Detail label="Product / service" value={item.product}/>
              <Detail label="Model / runtime" value={item.model}/>
              <Detail label="System type" value={item.systemType}/>
              <Detail label="Interface" value={item.interfaceSurface}/>
              <Detail label="Component functions" value={readable(system?.component_role)}/>
              <Detail label="Deployment context" value={item.deploymentContext}/>
            </dl>
          </div>)
        : <p className="vigil-incident-context__empty">No detailed system identity is available in the current public record.</p>}
    </ContextGroup>

    <ContextGroup id="vigil-context-operation" title="Operational Environment" caption="How the system operated, whether it was deployed, and what the evidence establishes about external reach.">
      {systemEvidence.length
        ? systemEvidence.map((item,index) => <div key={`${item.recordId}-operational-${index}`} className="vigil-incident-context__item">
            <dl className="vigil-incident-context__fields">
              <Detail label="Agent configuration" value={item.agentConfiguration}/>
              <Detail label="Agent count" value={item.agentCount}/>
              <Detail label="Deployment state" value={item.deploymentState}/>
              <Detail label="Activity context" value={item.activityContexts}/>
              <Detail label="External reach" value={item.externalReach}/>
              <Detail label="Activity actor" value={item.activityActor}/>
              <Detail label="Occurrence setting (legacy)" value={item.occurrenceSetting}/>
              <Detail label="Testing conducted by (legacy)" value={item.testingActor}/>
            </dl>
          </div>)
        : <p className="vigil-incident-context__empty">No structured operational description is available.</p>}
      <EvidenceDetails detail={environment?.environment_detail} basis={environment?.evidence_basis} refs={environment?.source_record_refs} raw={raw} numbers={sourceReferenceNumbers}/>
      {string(agent?.evidence_basis) && <div className="vigil-incident-context__indented">
        <h5>Agent-configuration evidence</h5>
        <EvidenceDetails basis={agent?.evidence_basis} refs={agent?.source_record_refs} raw={raw} numbers={sourceReferenceNumbers}/>
      </div>}
    </ContextGroup>

    <ContextGroup id="vigil-context-parties" title="Affected Parties & Institutions" caption="Entities and populations participating in or affected by the occurrence; a recorded role does not itself establish harm.">
      {parties.length
        ? <div className="vigil-incident-context__relationships">{parties.map((party,index) =>
            <Party entry={party} raw={raw} numbers={sourceReferenceNumbers} key={string(party.party_id) ?? index}/>
          )}</div>
        : <p className="vigil-incident-context__empty">Affected-party relationships have not yet been structurally reviewed for this record. Provider names alone do not establish who was affected.</p>}
    </ContextGroup>

    <ContextGroup id="vigil-context-geography" title="Geographic & Jurisdictional Context" caption="Where a source-supported relationship applies, rather than an assumed physical incident location.">
      {geography && <>
        <dl className="vigil-incident-context__fields"><Detail label="Geographic scope" value={readable(geography.scope)}/></dl>
        {geographicRelations.length > 0
          ? <div className="vigil-incident-context__relationships">{geographicRelations.map((relation,index) =>
              <GeographyRelation key={string(relation.relationship_id) ?? index} relation={relation} parties={parties} raw={raw} numbers={sourceReferenceNumbers}/>
            )}</div>
          : <p className="vigil-incident-context__empty">No country-specific non-regulatory relationship is established in the structured context.</p>}
      </>}
      {hasLegacyGeography && <div className="vigil-incident-context__legacy">
        <p className="vigil-incident-context__note"><strong>Recorded jurisdiction description</strong> — historical contextual text, not independently reviewed occurrence coordinates or legal applicability.</p>
        <dl className="vigil-incident-context__fields">
          <Detail label="Primary jurisdiction (legacy)" value={primary}/>
          <Detail label="Additional jurisdictions (legacy)" value={secondaries.join(" · ")}/>
          <Detail label="Cross-border relevance (legacy)" value={crossBorder}/>
        </dl>
      </div>}
      {!geography && !hasLegacyGeography && <p className="vigil-incident-context__empty">Geography is not established in the current public record. No location is inferred from provider identity.</p>}
      {!geography && hasLegacyGeography && <p className="vigil-incident-context__empty">Geographic relationships have not yet been structurally assessed; the descriptions above should not be interpreted as incident-location findings.</p>}
    </ContextGroup>

    <ContextGroup id="vigil-context-regulatory" title="Regulatory Context" caption="Potential governance surfaces for consideration, not findings of legal applicability or compliance.">
      {regulatorySurfaces.length > 0 && <div className="vigil-incident-context__regulatory">
        <h5>Governance surfaces named in the record</h5>
        <ul>{regulatorySurfaces.map((surface,index) => <li key={`${surface}-${index}`}>{surface}</li>)}</ul>
      </div>}
      {regulatoryRelations.length > 0 && <div className="vigil-incident-context__relationships">{regulatoryRelations.map((relation,index) =>
        <GeographyRelation key={string(relation.relationship_id) ?? index} relation={relation} parties={parties} raw={raw} numbers={sourceReferenceNumbers}/>
      )}</div>}
      {!regulatorySurfaces.length && !regulatoryRelations.length && <p className="vigil-incident-context__empty">No structured regulatory-context relationships are recorded.</p>}
      <p className="vigil-incident-context__legal-note">Geographic association or an identified governance topic does not establish that a specific law applies or was breached. See Section 04 for VIGIL’s separate external-requirements assessments.</p>
    </ContextGroup>
  </section>;
}
