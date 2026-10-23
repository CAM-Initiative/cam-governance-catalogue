import type { ReactNode } from "react";
import type { UnknownRecord } from "@/lib/vigilRegistry";
import type { AffectedSystem } from "@/lib/vigilAffectedSystems";

type Props = {
  raw: UnknownRecord;
  affectedSystems: AffectedSystem[];
  sourceReferenceNumbers: Record<string, number>;
};

function object(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function words(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function join(value: unknown): string | undefined {
  const values = (Array.isArray(value) ? value : value == null ? [] : [value])
    .map(words).filter((value): value is string => Boolean(value));
  return values.length ? values.join(" · ") : undefined;
}

function label(value: unknown): string | undefined {
  const source = words(value);
  if (!source) return undefined;
  return source.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Field({ title, value, wide = false, citationRefs, citationNumbers }: {
  title: string; value?: string; wide?: boolean;
  citationRefs?: unknown; citationNumbers?: Record<string, number>;
}) {
  if (!value) return null;
  return <div className={"vigil-context-field" + (wide ? " is-wide" : "")}>
    <dt>{title}</dt><dd>{value}<SourceCitations refs={citationRefs} numbers={citationNumbers ?? {}} /></dd>
  </div>;
}

function Group({ id, title, children }: {
  id: string; title: string; children: ReactNode;
}) {
  return <section className="vigil-context-group" aria-labelledby={id}>
    <h4 id={id} className="vigil-context-group-title">{title}</h4>
    <div className="vigil-context-group-body">{children}</div>
  </section>;
}

/**
 * Case File citation presentation contract:
 * citation markers are inline, bracketed, linked to 06 References, and never
 * prefixed by "Evidence" or "Source". This mirrors 02 Assessment.
 * De-duplicate by resolved bibliography number; never invent one for a
 * source record that is not present in the published bibliography.
 */
function SourceCitations({ refs, numbers }: { refs: unknown; numbers: Record<string, number> }) {
  const sourceRefs = list(refs).filter((ref): ref is string =>
    typeof ref === "string" && /^source_records\[\d+\]$/.test(ref));
  const unique = [...new Set(sourceRefs)];
  const numbersFound = [...new Set(unique.map(ref => numbers[ref]).filter((n): n is number =>
    Number.isInteger(n) && n > 0))];
  const unavailable = unique.filter(ref => !numbers[ref]);
  if (!numbersFound.length && !unavailable.length) return null;
  return <span className="vigil-context-citations" aria-label="Evidence references">
    {" "}
    {numbersFound.map((n) => <a key={n}
      href={`#vigil-evidence-reference-${n}`}
      aria-label={`Evidence reference ${n}`}
      title={`View reference ${n}`}>[{n}]</a>)}
    {unavailable.map(ref => <span key={ref} className="vigil-context-citation-unlinked"
      title={`Referenced source is absent from the published bibliography: ${ref}`}>
      [source reference unavailable]
    </span>)}
  </span>;
}

/** A record-local evidence note may contain an explicit uncertainty statement.
 * Preserve it verbatim and present that limit with the other Section 06 limits;
 * factual relationship bases remain beside the relationship being described.
 */
function isEvidenceLimit(value: unknown): boolean {
  const text = words(value);
  return Boolean(text && /\b(?:not (?:disclosed|established|known|verified|confirmed|documented|available|identified|reported)|unknown|uncertain|insufficient|undisclosed|unverified|unresolved|cannot (?:confirm|infer|establish|determine)|does not (?:establish|confirm|identify)|no (?:evidence|information|identified|confirmed|recorded)|lack of (?:evidence|information))\b/i.test(text));
}

type ContextLimit = { label?: string; text: string; refs?: unknown };

function limitsForContext(raw: UnknownRecord): ContextLimit[] {
  const system = object(raw.system_context);
  const agent = object(system.agent_context);
  const environment = object(system.occurrence_environment);
  const jurisdiction = object(raw.jurisdictional_context);
  const parties = list(object(raw.affected_party_context).entities).map(object);
  const structured = Object.prototype.hasOwnProperty.call(jurisdiction, "normalized_geography");
  const relationships = list(object(jurisdiction.normalized_geography).relations).map(object);
  const result: ContextLimit[] = [];
  const add = (text?: string, label?: string, refs?: unknown) => {
    if (text && !result.some(item => item.text === text)) result.push({ text, label, refs });
  };
  if (!Object.keys(system).length) add("System metadata has not been recorded for this case.");
  // Full canonical bases are preserved as written, whether they describe
  // supporting evidence or a reporting limit. They no longer interrupt §01.
  add(words(agent.evidence_basis), "Agent configuration — evidence scope", agent.source_record_refs);
  add(words(environment.evidence_basis), "Operational environment — evidence scope", environment.source_record_refs);
  if (Object.keys(environment).length) {
    add("Deployment state and external reach describe different conditions; interaction with a live service does not by itself mean the model was publicly deployed.");
  }
  if (!parties.length) add("Structured institutional and affected-party relationships have not yet been reviewed for this Incident. The narrative and cited evidence may identify parties without establishing a canonical relationship.");
  for (const party of parties) {
    if (isEvidenceLimit(party.evidence_basis)) add(words(party.evidence_basis), "Affected party — evidence limit", party.source_record_refs);
  }
  if (!structured) {
    add("Geographic roles have not yet been structurally assessed. Legacy jurisdiction descriptions must not be treated as verified occurrence locations.");
  } else if (!relationships.some(relation => relation.role !== "regulatory-context")) {
    add("No country-specific non-regulatory geographic relationship is asserted in the reviewed structured metadata.");
  }
  for (const relation of relationships) {
    if (isEvidenceLimit(relation.evidence_basis)) add(words(relation.evidence_basis), "Geographic relationship — evidence limit", relation.source_record_refs);
    if (!list(relation.locations).length) {
      add("No confirmed geographic location is recorded for this relationship.");
    }
  }
  if (words(jurisdiction.regulatory_surface) || list(jurisdiction.regulatory_surface).length ||
    relationships.some(relation => relation.role === "regulatory-context")) {
    add("A jurisdictional association does not establish whether a regulation applies, whether an obligation was breached, or what any authority has determined. Consult 04 Compliance for separately adjudicated requirements.");
  }
  return result;
}

/** Reuse identical limitations in the interactive Case File and the print report. */
export function IncidentContextLimitations({ raw, sourceReferenceNumbers }: Pick<Props, "raw" | "sourceReferenceNumbers">) {
  const items = limitsForContext(raw);
  if (!items.length) return null;
  return <div className="vigil-context-limitations" aria-label="Incident Context evidence limits">
    <h5>Incident Context — evidence scope and limitations</h5>
    <ul>{items.map((item, i) => <li key={i}>
      {item.label && <strong>{item.label}: </strong>}
      <span>{item.text}<SourceCitations refs={item.refs} numbers={sourceReferenceNumbers} /></span>
    </li>)}</ul>
  </div>;
}

const COUNTRY_NAMES: Record<string, string> = {
  AU: "Australia", US: "United States", GB: "United Kingdom", CA: "Canada",
  FR: "France", DE: "Germany", IN: "India", JP: "Japan", CN: "China",
  KR: "South Korea", NZ: "New Zealand", NL: "Netherlands", ES: "Spain",
  BR: "Brazil", IE: "Ireland", SG: "Singapore", IL: "Israel", RU: "Russia",
  UA: "Ukraine", HK: "Hong Kong", TW: "Taiwan", CH: "Switzerland",
  SE: "Sweden", AE: "United Arab Emirates",
};

function locationText(value: unknown): string {
  const location = object(value);
  const countryCode = words(location.country_code);
  const country = countryCode ? (COUNTRY_NAMES[countryCode] ?? countryCode) : "Location not established";
  const subdivision = words(location.subdivision_code);
  const locality = words(location.locality);
  return [locality, subdivision, country].filter(Boolean).join(" · ");
}

function RelationshipCard({ relation, index, numbers, knownParties }: {
  relation: UnknownRecord; index: number; numbers: Record<string, number>; knownParties: UnknownRecord[];
}) {
  const status = words(relation.evidence_state);
  const places = list(relation.locations);
  const parties = list(relation.party_refs).map(words).filter((value): value is string => Boolean(value))
    .map((partyId) => words(knownParties.find((party) => party.party_id === partyId)?.name) ?? partyId);
  return <article className="vigil-context-relationship">
    <div className="vigil-context-relationship-top">
      <strong>{label(relation.role) ?? "Geographic relationship"}</strong>
      {status && <span className="vigil-context-state">{label(status)}</span>}
    </div>
    {places.length > 0
      ? <ul className="vigil-context-locations">{places.map((place, i) =>
          <li key={i}>{locationText(place)}</li>
        )}</ul>
      : <p className="vigil-context-muted" aria-label="Location not recorded">—</p>}
    {parties.length > 0 && <p className="vigil-context-association">Linked entities: {parties.join(", ")}</p>}
    {words(relation.evidence_basis) && !isEvidenceLimit(relation.evidence_basis)
      ? <p className="vigil-context-basis">{words(relation.evidence_basis)}
          <SourceCitations refs={relation.source_record_refs} numbers={numbers} />
        </p>
      : <p className="vigil-context-citation-fallback">
          <SourceCitations refs={relation.source_record_refs} numbers={numbers} />
        </p>}
  </article>;
}

/**
 * Public Stage 01 projection. Do not interpret the absence of reviewed
 * structured geography as a finding that an incident has no location.
 * Legacy jurisdiction text is not incident-location or legal applicability.
 */
export function IncidentContextSection({ raw, affectedSystems, sourceReferenceNumbers }: Props) {
  const system = object(raw.system_context);
  const agent = object(system.agent_context);
  const environment = object(system.occurrence_environment);
  const jurisdiction = object(raw.jurisdictional_context);
  const parties = list(object(raw.affected_party_context).entities)
    .filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  const hasStructuredGeography = Object.prototype.hasOwnProperty.call(jurisdiction, "normalized_geography");
  const geography = object(jurisdiction.normalized_geography);
  const relationships = list(geography.relations)
    .filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  const regulatoryRelationships = relationships.filter((relation) => relation.role === "regulatory-context");
  const otherRelationships = relationships.filter((relation) => relation.role !== "regulatory-context");
  const legacyPrimary = words(jurisdiction.primary_jurisdiction);
  const legacySecondary = join(jurisdiction.secondary_jurisdictions);
  const legacyCrossBorder = words(jurisdiction.cross_border_relevance);
  const regulatoryTopics = join(jurisdiction.regulatory_surface);
  const primarySystem = affectedSystems[0];
  // Agent configuration and operating-environment refs frequently resolve to
  // the same bibliography item. One citation set avoids the duplicate [1] [1].
  const operationalSourceRefs = [...new Set([
    ...list(agent.source_record_refs),
    ...list(environment.source_record_refs),
  ].filter((value): value is string => typeof value === "string"))];
  const environmentDescription = words(environment.environment_detail);
  const operationalCitationField = environmentDescription ? "Occurrence environment"
    : (primarySystem?.externalReach ?? label(environment.external_reach)) ? "External reach"
    : (primarySystem?.deploymentState ?? label(environment.deployment_state)) ? "Deployment state"
    : (primarySystem?.agentConfiguration ?? label(agent.agentic_status)) ? "Agent configuration"
    : undefined;

  return <section className="vigil-incident-context" aria-labelledby="vigil-incident-context-heading">
    <header className="vigil-incident-context-heading">
      <h3 id="vigil-incident-context-heading">Incident Context</h3>
    </header>

    <Group id="vigil-context-systems" title="Systems & Technology">
      <dl className="vigil-context-fields">
        <Field title="Provider / platform" value={primarySystem?.provider ?? words(system.platform_or_vendor)} />
        <Field title="Product / service" value={primarySystem?.product ?? words(system.product_or_service)} />
        <Field title="Model / runtime" value={primarySystem?.model ?? words(system.specific_model_or_runtime)} wide />
        <Field title="System type" value={primarySystem?.systemType ?? words(system.system_type)} />
        <Field title="Interface surfaces" value={primarySystem?.interfaceSurface ?? join(system.interface_surface)} wide />
        <Field title="Architectural component roles" value={join(system.component_role)} wide />
        <Field title="Deployment context" value={primarySystem?.deploymentContext ?? words(system.deployment_context)} wide />
      </dl>
      {!Object.keys(system).length && <p className="vigil-context-muted" aria-label="System identity not recorded">—</p>}
    </Group>

    <Group id="vigil-context-operational" title="Operational Environment">
      <dl className="vigil-context-fields">
        <Field title="Agent configuration" value={primarySystem?.agentConfiguration ?? label(agent.agentic_status)} citationRefs={operationalCitationField === "Agent configuration" ? operationalSourceRefs : undefined} citationNumbers={sourceReferenceNumbers} />
        <Field title="Agent count" value={primarySystem?.agentCount} />
        <Field title="Deployment state" value={primarySystem?.deploymentState ?? label(environment.deployment_state)} citationRefs={operationalCitationField === "Deployment state" ? operationalSourceRefs : undefined} citationNumbers={sourceReferenceNumbers} />
        <Field title="Activity context" value={primarySystem?.activityContexts ?? join(list(environment.activity_contexts).map(label))} />
        <Field title="External reach" value={primarySystem?.externalReach ?? label(environment.external_reach)} citationRefs={operationalCitationField === "External reach" ? operationalSourceRefs : undefined} citationNumbers={sourceReferenceNumbers} />
        <Field title="Activity actor" value={primarySystem?.activityActor ?? label(environment.activity_actor)} />
        <Field title="Occurrence setting (legacy)" value={primarySystem?.occurrenceSetting} />
        <Field title="Testing actor (legacy)" value={primarySystem?.testingActor} />
        <Field title="Occurrence environment" value={words(environment.environment_detail)} citationRefs={operationalCitationField === "Occurrence environment" ? operationalSourceRefs : undefined} citationNumbers={sourceReferenceNumbers} wide />
      </dl>
      {!operationalCitationField && operationalSourceRefs.length > 0 &&
        <p className="vigil-context-citation-fallback">
          <SourceCitations refs={operationalSourceRefs} numbers={sourceReferenceNumbers} />
        </p>}
    </Group>

    <Group id="vigil-context-parties" title="Affected Parties & Institutions">
      {parties.length > 0
        ? <div className="vigil-context-entity-list">{parties.map((party, index) =>
            <article className="vigil-context-entity" key={words(party.party_id) ?? String(index)}>
              <div className="vigil-context-relationship-top">
                <strong>{words(party.name) ?? "Unnamed entity"}</strong>
                {words(party.evidence_state) && <span className="vigil-context-state">{label(party.evidence_state)}</span>}
              </div>
              <dl className="vigil-context-fields">
                <Field title="Entity type" value={label(party.kind)} />
                <Field title="Relationship roles" value={join(list(party.roles).map(label))} />
              </dl>
              {words(party.evidence_basis) && !isEvidenceLimit(party.evidence_basis)
                ? <p className="vigil-context-basis">{words(party.evidence_basis)}
                    <SourceCitations refs={party.source_record_refs} numbers={sourceReferenceNumbers} />
                  </p>
                : <p className="vigil-context-citation-fallback">
                    <SourceCitations refs={party.source_record_refs} numbers={sourceReferenceNumbers} />
                  </p>}
            </article>
          )}</div>
        : <p className="vigil-context-muted" aria-label="Affected parties not reviewed">—</p>}
    </Group>

    <Group id="vigil-context-geography" title="Geographic & Jurisdictional Context">
      <dl className="vigil-context-fields">
        <Field title="Recorded primary jurisdiction (legacy)" value={legacyPrimary} wide />
        <Field title="Other recorded jurisdictions (legacy)" value={legacySecondary} wide />
        <Field title="Cross-border relevance" value={legacyCrossBorder} wide />
        {hasStructuredGeography && <Field title="Reviewed geographic scope" value={label(geography.scope)} />}
        <Field title="Jurisdiction notes" value={words(jurisdiction.notes)} wide />
      </dl>
      {hasStructuredGeography && otherRelationships.length === 0 &&
        <p className="vigil-context-muted" aria-label="No further geographic relationship">—</p>}
      {otherRelationships.length > 0 && <div className="vigil-context-relationship-list">
        {otherRelationships.map((relation, index) =>
          <RelationshipCard key={words(relation.relationship_id) ?? String(index)}
            relation={relation} index={index} numbers={sourceReferenceNumbers} knownParties={parties} />)}
      </div>}
    </Group>

    <Group id="vigil-context-regulatory" title="Regulatory Context">
      <dl className="vigil-context-fields">
        <Field title="Sector / institutional context" value={words(jurisdiction.sector)} wide />
        <Field title="Governance topics recorded" value={regulatoryTopics} wide />
        <Field title="Public-interest relevance" value={words(jurisdiction.public_interest_relevance)} />
      </dl>
      {regulatoryRelationships.length > 0 && <div className="vigil-context-relationship-list">
        {regulatoryRelationships.map((relation, index) =>
          <RelationshipCard key={words(relation.relationship_id) ?? String(index)}
            relation={relation} index={index} numbers={sourceReferenceNumbers} knownParties={parties} />)}
      </div>}
      {!regulatoryTopics && !words(jurisdiction.sector) && !regulatoryRelationships.length &&
        <p className="vigil-context-muted" aria-label="Regulatory context not recorded">—</p>}
    </Group>
  </section>;
}
