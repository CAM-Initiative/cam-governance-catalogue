import { useEffect, useMemo, useState } from "react";
import { ChevronsLeft, ChevronsRight, ExternalLink, Search, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilObservatoryMasthead } from "@/components/vigil/VigilObservatoryMasthead";
import {
  loadFailureTaxonomy,
  type FailureTaxonomyCaseFileExample,
  type FailureTaxonomyClass,
  type FailureTaxonomyDataset,
  type FailureTaxonomyExternalReference,
  type FailureTaxonomyFamilyDocument,
  type FailureTaxonomyRelationship,
} from "@/lib/vigilFailureTaxonomy";

type TaxonomyState =
  | { status: "loading" }
  | { status: "ready"; data: FailureTaxonomyDataset }
  | { status: "unavailable"; message: string };

function clean(value?: string) {
  return value?.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function relationshipLabel(type: string) {
  const labels: Record<string, string> = {
    child_of: "Child Of",
    distinguish_from: "Distinguish From",
    can_cooccur_with: "Can Co-occur With",
  };
  return labels[type] ?? clean(type) ?? type;
}

function familyHaystack(document: FailureTaxonomyFamilyDocument) {
  return [
    document.family.family_id,
    document.family.family_code,
    document.family.name,
    document.family.plain_english,
    document.family.definition,
    document.family.invariant,
    document.family.inclusion_rule,
    document.family.exclusion_rule,
    ...(document.family.scope ?? []),
  ].join(" ").toLowerCase();
}

function classHaystack(item: FailureTaxonomyClass) {
  const referenceText = (item.external_references ?? []).flatMap((reference) => [
    reference.title,
    reference.publisher,
    reference.reference_role,
    reference.evidence_note,
  ]).filter(Boolean);
  return [
    item.class_id,
    item.class_code,
    item.name,
    item.abstraction,
    item.plain_english,
    item.definition,
    ...(item.recognition?.required_conditions ?? []),
    ...(item.exclusions ?? []),
    ...(item.examples ?? []),
    ...(item.aliases ?? []),
    ...referenceText,
  ].join(" ").toLowerCase();
}

function relationshipTarget(
  relationship: FailureTaxonomyRelationship,
  classById: Map<string, FailureTaxonomyClass>,
) {
  return classById.get(relationship.target_id.toUpperCase())?.name ?? relationship.target_id;
}

type CaseFileExampleMap = Record<string, FailureTaxonomyCaseFileExample[]>;

function classificationRoleLabel(value?: string) {
  if (value === "primary") return "Primary classification";
  if (value === "secondary") return "Secondary classification";
  return clean(value) ?? "Classification";
}

function confidenceLabel(value?: string) {
  return value ? `${clean(value)} confidence` : undefined;
}

function caseMeta(example: FailureTaxonomyCaseFileExample) {
  return [classificationRoleLabel(example.classification_role), confidenceLabel(example.classification_confidence)]
    .filter(Boolean)
    .join(" · ");
}

function evidenceRoleLabel(value?: string) {
  return value ? clean(value) : undefined;
}

function evidenceMeta(reference: FailureTaxonomyExternalReference) {
  return [reference.publisher, reference.date, evidenceRoleLabel(reference.reference_role)]
    .filter(Boolean)
    .join(" · ");
}

function SupportingEvidence({ item }: { item: FailureTaxonomyClass }) {
  const references = item.external_references ?? [];
  if (!references.length) return null;

  return <section className="vigil-taxonomy-supporting-evidence" aria-label={`Supporting evidence for ${item.name}`}>
    <div className="vigil-taxonomy-supporting-evidence-head">
      <div>
        <h4>Supporting evidence <span>{references.length}</span></h4>
        <p>External sources supporting this Fidelity Class definition, boundary or recognition criteria.</p>
      </div>
    </div>
    <ul>
      {references.map((reference, index) => <li key={`${reference.url ?? reference.title}-${index}`}>
        <div className="vigil-taxonomy-supporting-evidence-source">
          <p>{evidenceMeta(reference)}</p>
          {reference.url
            ? <a href={reference.url} target="_blank" rel="noreferrer">
              <strong>{reference.title}</strong>
              <ExternalLink aria-hidden="true" />
            </a>
            : <strong>{reference.title}</strong>}
        </div>
        {reference.evidence_note ? <p className="vigil-taxonomy-supporting-evidence-note"><strong>Evidence note.</strong> {reference.evidence_note}</p> : null}
      </li>)}
    </ul>
  </section>;
}

function SearchControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="vigil-search-control vigil-taxonomy-manual-search">
    <Search aria-hidden="true" />
    <span className="sr-only">Search the VIGIL Observatory Alignment Taxonomy contents</span>
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Find a family or fidelity class…"
    />
    {value ? <button type="button" onClick={() => onChange("")} aria-label="Clear taxonomy search"><X /></button> : null}
  </label>;
}

function ManualContents({
  families,
  query,
  setQuery,
  activeFamilyId,
  activeClassId,
  collapsed,
  setCollapsed,
}: {
  families: FailureTaxonomyFamilyDocument[];
  query: string;
  setQuery: (value: string) => void;
  activeFamilyId?: string;
  activeClassId?: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!activeFamilyId || !activeClassId) return;
    setExpandedFamilies((current) => {
      if (current.has(activeFamilyId)) return current;
      const next = new Set(current);
      next.add(activeFamilyId);
      return next;
    });
  }, [activeClassId, activeFamilyId]);

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visible = families.map((document) => {
    if (!terms.length) return { document, classes: document.classes };
    const familyMatches = terms.every((term) => familyHaystack(document).includes(term));
    const classes = document.classes.filter((item) => terms.every((term) => classHaystack(item).includes(term)));
    return { document, classes: familyMatches ? document.classes : classes };
  }).filter(({ classes }) => classes.length);

  function toggleFamily(familyId: string) {
    setExpandedFamilies((current) => {
      const next = new Set(current);
      if (next.has(familyId)) next.delete(familyId);
      else next.add(familyId);
      return next;
    });
  }

  return <nav
    id="taxonomy-contents"
    className={`vigil-taxonomy-manual-contents${collapsed ? " is-collapsed" : ""}`}
    aria-label="VIGIL Observatory Alignment Taxonomy contents"
  >
    <div className="vigil-taxonomy-manual-contents-head">
      {!collapsed ? <h2>Contents</h2> : null}
      <button
        type="button"
        className="vigil-taxonomy-manual-collapse"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand contents navigation" : "Collapse contents navigation"}
        title={collapsed ? "Expand contents" : "Collapse contents"}
      >
        {collapsed ? <ChevronsRight aria-hidden="true" /> : <ChevronsLeft aria-hidden="true" />}
      </button>
    </div>

    {!collapsed ? <>
      <SearchControl value={query} onChange={setQuery} />
      <ol>
        {visible.map(({ document, classes }) => {
          const familyId = document.family.family_id;
          const expanded = expandedFamilies.has(familyId);
          const active = familyId === activeFamilyId;
          return <li key={familyId} className={active ? "is-active" : undefined}>
            <div className="vigil-taxonomy-manual-family-link-row">
              <button
                type="button"
                className="vigil-taxonomy-manual-expand"
                onClick={() => toggleFamily(familyId)}
                aria-expanded={expanded}
                aria-controls={`${familyId}-contents-classes`}
                aria-label={`${expanded ? "Collapse" : "Expand"} ${document.family.name}`}
              >
                <span aria-hidden="true">{expanded ? "−" : "+"}</span>
              </button>
              <Link href={`/observatory/knowledge-base/failure-taxonomy/${familyId}/`} onClick={() => setQuery("")}>
                {document.family.name}
              </Link>
            </div>
            {expanded ? <ul id={`${familyId}-contents-classes`}>
              {classes.map((item) => <li key={item.class_id} className={item.class_id === activeClassId ? "is-active-class" : undefined}>
                <Link href={`/observatory/knowledge-base/failure-taxonomy/${item.class_id}/`} onClick={() => setQuery("")}>
                  {item.name}
                </Link>
              </li>)}
            </ul> : null}
          </li>;
        })}
      </ol>
      {!visible.length ? <p className="vigil-taxonomy-manual-no-match">No taxonomy entries match this search.</p> : null}
    </> : null}
  </nav>;
}

function ClassManualCard({
  item,
  classById,
  caseFileExamples,
  caseFileExamplesAvailable,
  showSupportingEvidence = false,
}: {
  item: FailureTaxonomyClass;
  classById: Map<string, FailureTaxonomyClass>;
  caseFileExamples: CaseFileExampleMap;
  caseFileExamplesAvailable: boolean;
  showSupportingEvidence?: boolean;
}) {
  const linkedCases = caseFileExamples[item.class_id] ?? [];
  const invariantExemplars = item.invariant_exemplars ?? [];

  return <article className="vigil-taxonomy-manual-class" id={item.class_id.toLowerCase()}>
    <div className="vigil-taxonomy-manual-class-top">
      <div>
        <span className="vigil-taxonomy-manual-pill">{item.abstraction}</span>
        <h3>{item.name}</h3>
        <p><code>{item.class_id}</code> · <code>{item.class_code}</code></p>
      </div>
      <span className="vigil-taxonomy-manual-pill">{item.status}</span>
    </div>

    <p className="vigil-taxonomy-manual-plain"><strong>Plain English:</strong> {item.plain_english}</p>

    <h4>Technical definition</h4>
    <p>{item.definition}</p>

    <div className="vigil-taxonomy-manual-grid">
      <section>
        <h4>Recognition criteria</h4>
        <ul>{(item.recognition?.required_conditions ?? []).map((condition) => <li key={condition}>{condition}</li>)}</ul>
      </section>
      <section>
        <h4>Exclusions</h4>
        <ul>{(item.exclusions ?? []).map((exclusion) => <li key={exclusion}>{exclusion}</li>)}</ul>
      </section>
    </div>

    <section className="vigil-taxonomy-linked-cases" aria-label={`Linked Case Files for ${item.name}`}>
      <h4>Linked Case Files {caseFileExamplesAvailable ? <span>{linkedCases.length}</span> : null}</h4>
      {!caseFileExamplesAvailable
        ? <p className="vigil-taxonomy-linked-cases-empty">Case File links are temporarily unavailable. The Fidelity Class definition remains current.</p>
        : linkedCases.length ? <ul>
          {linkedCases.map((example) => <li key={example.incident_id}>
            <Link href={`/observatory/cases/${example.incident_id}/`}>
              <code>{example.incident_id}</code>
              <strong>{example.incident_title}</strong>
            </Link>
            <p>{caseMeta(example)}</p>
          </li>)}
        </ul> : <p className="vigil-taxonomy-linked-cases-empty">No Case Files currently evidence failure for this class.</p>}
    </section>

    {invariantExemplars.length ? <section className="vigil-taxonomy-invariant-exemplars" aria-label={`Alignment exemplars for ${item.name}`}>
      <h4>Alignment exemplars <span>{invariantExemplars.length}</span></h4>
      <ul>
        {invariantExemplars.map((exemplar) => <li key={exemplar.linked_incident_id}>
          <Link href={`/observatory/cases/${exemplar.linked_incident_id}/`}>
            <code>{exemplar.linked_incident_id}</code>
            <strong>{exemplar.title}</strong>
          </Link>
          <p>Successful invariant{exemplar.exemplar_status ? ` · ${clean(exemplar.exemplar_status)}` : ""}</p>
          {exemplar.invariant_demonstrated ? <p className="vigil-taxonomy-exemplar-basis">{exemplar.invariant_demonstrated}</p> : null}
        </li>)}
      </ul>
    </section> : null}

    {item.examples?.length ? <>
      <h4>Illustrative examples</h4>
      <ul>{item.examples.map((example) => <li key={example}>{example}</li>)}</ul>
    </> : null}

    {item.relationships?.length ? <>
      <h4>Relationships</h4>
      <ul>{item.relationships.map((relationship, index) => <li key={`${relationship.type}-${relationship.target_id}-${index}`}>
        <strong>{relationshipLabel(relationship.type)}:</strong>{" "}
        <Link href={`/observatory/knowledge-base/failure-taxonomy/${relationship.target_id}/`}>
          <code>{relationship.target_id}</code> — {relationshipTarget(relationship, classById)}
        </Link>
        {relationship.note ? <span> — {relationship.note}</span> : null}
      </li>)}</ul>
    </> : null}

    {showSupportingEvidence
      ? <SupportingEvidence item={item} />
      : item.external_references?.length ? <p className="vigil-taxonomy-supporting-evidence-link">
        <Link href={`/observatory/knowledge-base/failure-taxonomy/${item.class_id}/`}>
          Supporting evidence · {item.external_references.length} {item.external_references.length === 1 ? "source" : "sources"}
        </Link>
      </p> : null}
  </article>;
}

function ClassManualSection({
  item,
  parent,
  classById,
  caseFileExamples,
  caseFileExamplesAvailable,
}: {
  item: FailureTaxonomyClass;
  parent: FailureTaxonomyFamilyDocument;
  classById: Map<string, FailureTaxonomyClass>;
  caseFileExamples: CaseFileExampleMap;
  caseFileExamplesAvailable: boolean;
}) {
  return <section className="vigil-taxonomy-single-class-view" aria-labelledby={`${item.class_id.toLowerCase()}-view-heading`}>
    <div className="vigil-taxonomy-single-class-context">
      <p>Fidelity class</p>
      <Link href={`/observatory/knowledge-base/failure-taxonomy/${parent.family.family_id}/`}>
        View whole family · {parent.family.name}
      </Link>
    </div>
    <h2 id={`${item.class_id.toLowerCase()}-view-heading`} className="sr-only">{item.name}</h2>
    <ClassManualCard item={item} classById={classById} caseFileExamples={caseFileExamples} caseFileExamplesAvailable={caseFileExamplesAvailable} showSupportingEvidence />
  </section>;
}

function FamilyManualSection({
  document,
  classById,
  caseFileExamples,
  caseFileExamplesAvailable,
}: {
  document: FailureTaxonomyFamilyDocument;
  classById: Map<string, FailureTaxonomyClass>;
  caseFileExamples: CaseFileExampleMap;
  caseFileExamplesAvailable: boolean;
}) {
  const family = document.family;

  return <section className="vigil-taxonomy-manual-family" id={family.family_id.toLowerCase()}>
    <header className="vigil-taxonomy-manual-family-hero">
      <h2>{family.name}</h2>
      <p className="vigil-taxonomy-manual-plain">{family.plain_english}</p>
      <p className="vigil-taxonomy-manual-meta">
        <strong>Immutable ID:</strong> <code>{family.family_id}</code>
        <span>·</span>
        <strong>Semantic code:</strong> <code>{family.family_code}</code>
        <span>·</span>
        <strong>Version:</strong> {family.version}
        <span>·</span>
        <strong>Status:</strong> {family.status}
      </p>

      <h3>Technical definition</h3>
      <p>{family.definition}</p>

      <h3>Governing invariant</h3>
      <blockquote>{family.invariant}</blockquote>

      <h3>Classification boundary</h3>
      <div className="vigil-taxonomy-manual-grid">
        <section><h4>Include when</h4><p>{family.inclusion_rule}</p></section>
        <section><h4>Exclude when</h4><p>{family.exclusion_rule}</p></section>
      </div>

      {family.scope?.length ? <>
        <h3>Scope</h3>
        <ul>{family.scope.map((scope) => <li key={scope}>{scope}</li>)}</ul>
      </> : null}

      {family.allowed_class_ids?.length ? <details>
        <summary><strong>Allowed identifiers</strong></summary>
        <ul>{family.allowed_class_ids.map((id, index) => <li key={id}>
          <code>{id}</code>{family.allowed_class_codes?.[index] ? <> — <code>{family.allowed_class_codes[index]}</code></> : null}
        </li>)}</ul>
      </details> : null}

    </header>

    <h2 className="vigil-taxonomy-manual-classes-heading">Fidelity classes</h2>
    <div className="vigil-taxonomy-manual-class-list">
      {document.classes.map((item) => <ClassManualCard
        key={item.class_id}
        item={item}
        classById={classById}
        caseFileExamples={caseFileExamples}
        caseFileExamplesAvailable={caseFileExamplesAvailable}
      />)}
    </div>
  </section>;
}

export default function VigilFailureTaxonomy() {
  const [, params] = useRoute("/observatory/knowledge-base/failure-taxonomy/:taxonomyId");
  const requestedId = decodeURIComponent(params?.taxonomyId ?? "").trim();
  const [state, setState] = useState<TaxonomyState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [contentsCollapsed, setContentsCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFailureTaxonomy()
      .then((result) => {
        if (cancelled) return;
        if (result.status === "ready") setState({ status: "ready", data: result.data });
        else setState({ status: "unavailable", message: result.message });
      })
      .catch((error) => !cancelled && setState({ status: "unavailable", message: (error as Error).message }));
    return () => { cancelled = true; };
  }, []);

  const families = state.status === "ready" ? state.data.families : [];
  const classById = useMemo(() => {
    const map = new Map<string, FailureTaxonomyClass>();
    for (const document of families) for (const item of document.classes) map.set(item.class_id.toUpperCase(), item);
    return map;
  }, [families]);
  const familyByClassId = useMemo(() => {
    const map = new Map<string, FailureTaxonomyFamilyDocument>();
    for (const document of families) for (const item of document.classes) map.set(item.class_id.toUpperCase(), document);
    return map;
  }, [families]);
  const selectedClass = useMemo(() => {
    if (!requestedId.toUpperCase().startsWith("VIGIL-FC-")) return undefined;
    return classById.get(requestedId.toUpperCase());
  }, [classById, requestedId]);

  const selectedFamily = useMemo(() => {
    if (!families.length) return undefined;
    if (requestedId) {
      const directFamily = families.find((document) => document.family.family_id.toUpperCase() === requestedId.toUpperCase());
      if (directFamily) return directFamily;
      const classFamily = familyByClassId.get(requestedId.toUpperCase());
      if (classFamily) return classFamily;
    }
    return families[0];
  }, [families, familyByClassId, requestedId]);

  useEffect(() => {
    if (state.status !== "ready" || !requestedId || !selectedFamily) return;
    const targetId = requestedId.toUpperCase().startsWith("VIGIL-FC-") ? requestedId : selectedFamily.family.family_id;
    const target = document.getElementById(targetId.toLowerCase());
    if (!target) return;
    window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }, [requestedId, selectedFamily, state.status]);

  const classCount = state.status === "ready"
    ? state.data.index.families.reduce((sum, family) => sum + family.class_count, 0)
    : 0;

  return <Shell><VigilObservatoryNav /><main className="vigil-library-page vigil-taxonomy-manual-page">
    <div className="container mx-auto max-w-[1500px] px-4 py-7 sm:px-6 md:px-10 md:py-9">
      <section className="vigil-library-shell vigil-taxonomy-shell" aria-labelledby="taxonomy-heading">
        <VigilObservatoryMasthead
          titleId="taxonomy-heading"
          kicker="VIGIL Observatory"
          title="Alignment Taxonomy"
          description="The maintained VIGIL Observatory Alignment Taxonomy provides governance boundaries against which Case File evidence is classified. In VIGIL, alignment is evidence-relative to a governing invariant: a mapping can record failure, invariant held, or an unresolved boundary. Established Fidelity Families and Fidelity Classes retain their stable FF/FC identifiers, recognition criteria, exclusions and governing invariants."
          contextLabel="Taxonomy context"
          mode="reference"
          visual="taxonomy"
          artworkSrc="https://raw.githubusercontent.com/CAM-Initiative/Registry/main/Images/Website/VIGIL/vigil-fascia-taxonomy.png"
          metadata={[
            { label: "Version", value: state.status === "ready" ? state.data.index.standard.version : "—" },
            { label: "Status", value: "Beta" },
            { label: "Families", value: state.status === "ready" ? state.data.index.families.length : "—" },
            { label: "Fidelity classes", value: state.status === "ready" ? classCount : "—" },
          ]}
        />

        {state.status === "loading" ? <div className="vigil-reference-state">Loading VIGIL Observatory Alignment Taxonomy…</div> : null}
        {state.status === "unavailable" ? <div className="vigil-reference-state"><h2>VIGIL Observatory Alignment Taxonomy unavailable</h2><p>{state.message}</p></div> : null}

        {state.status === "ready" && selectedFamily ? <div className={`vigil-taxonomy-manual-layout${contentsCollapsed ? " is-contents-collapsed" : ""}`}>
          <ManualContents
            families={families}
            query={query}
            setQuery={setQuery}
            activeFamilyId={selectedFamily.family.family_id}
            activeClassId={selectedClass?.class_id}
            collapsed={contentsCollapsed}
            setCollapsed={setContentsCollapsed}
          />
          <div className="vigil-taxonomy-manual-document" aria-live="polite">
            {selectedClass ? <ClassManualSection
              item={selectedClass}
              parent={selectedFamily}
              classById={classById}
              caseFileExamples={state.data.caseFileExamples.classes}
              caseFileExamplesAvailable={state.data.caseFileExamplesAvailable}
            /> : <FamilyManualSection
              document={selectedFamily}
              classById={classById}
              caseFileExamples={state.data.caseFileExamples.classes}
              caseFileExamplesAvailable={state.data.caseFileExamplesAvailable}
            />}
          </div>
        </div> : null}
      </section>
    </div>
  </main></Shell>;
}
