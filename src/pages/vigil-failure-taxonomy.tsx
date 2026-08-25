import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import {
  loadFailureTaxonomy,
  type FailureTaxonomyClass,
  type FailureTaxonomyDataset,
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
  ].join(" ").toLowerCase();
}

function relationshipTarget(
  relationship: FailureTaxonomyRelationship,
  classById: Map<string, FailureTaxonomyClass>,
) {
  return classById.get(relationship.target_id.toUpperCase())?.name ?? relationship.target_id;
}

function SearchControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="vigil-search-control vigil-taxonomy-manual-search">
    <Search aria-hidden="true" />
    <span className="sr-only">Search the VIGIL Failure Taxonomy contents</span>
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Find a family or failure class…"
    />
    {value ? <button type="button" onClick={() => onChange("")} aria-label="Clear taxonomy search"><X /></button> : null}
  </label>;
}

function ManualContents({
  families,
  query,
  setQuery,
  activeFamilyId,
}: {
  families: FailureTaxonomyFamilyDocument[];
  query: string;
  setQuery: (value: string) => void;
  activeFamilyId?: string;
}) {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(() => new Set());
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

  return <nav id="taxonomy-contents" className="vigil-taxonomy-manual-contents" aria-label="VIGIL Failure Taxonomy contents">
    <div className="vigil-taxonomy-manual-contents-head">
      <p className="vigil-library-kicker">Reference navigation</p>
      <h2>Contents</h2>
    </div>
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
            <Link href={`/observatory/knowledge-base/failure-taxonomy/${familyId}`} onClick={() => setQuery("")}>
              {document.family.name}
            </Link>
          </div>
          {expanded ? <ul id={`${familyId}-contents-classes`}>
            {classes.map((item) => <li key={item.class_id}>
              <Link href={`/observatory/knowledge-base/failure-taxonomy/${item.class_id}`} onClick={() => setQuery("")}>
                {item.name}
              </Link>
            </li>)}
          </ul> : null}
        </li>;
      })}
    </ol>
    {!visible.length ? <p className="vigil-taxonomy-manual-no-match">No taxonomy entries match this search.</p> : null}
  </nav>;
}

function ClassManualCard({ item, classById }: { item: FailureTaxonomyClass; classById: Map<string, FailureTaxonomyClass> }) {
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

    {item.examples?.length ? <>
      <h4>Illustrative examples</h4>
      <ul>{item.examples.map((example) => <li key={example}>{example}</li>)}</ul>
    </> : null}

    {item.aliases?.length ? <>
      <h4>Prior codes and aliases</h4>
      <ul>{item.aliases.map((alias) => <li key={alias}><code>{alias}</code></li>)}</ul>
    </> : null}

    {item.relationships?.length ? <>
      <h4>Relationships</h4>
      <ul>{item.relationships.map((relationship, index) => <li key={`${relationship.type}-${relationship.target_id}-${index}`}>
        <strong>{relationshipLabel(relationship.type)}:</strong>{" "}
        <Link href={`/observatory/knowledge-base/failure-taxonomy/${relationship.target_id}`}>
          <code>{relationship.target_id}</code> — {relationshipTarget(relationship, classById)}
        </Link>
        {relationship.note ? <span> — {relationship.note}</span> : null}
      </li>)}</ul>
    </> : null}
  </article>;
}

function FamilyManualSection({
  document,
  classById,
}: {
  document: FailureTaxonomyFamilyDocument;
  classById: Map<string, FailureTaxonomyClass>;
}) {
  const family = document.family;
  return <section className="vigil-taxonomy-manual-family" id={family.family_id.toLowerCase()}>
    <header className="vigil-taxonomy-manual-family-hero">
      <p className="vigil-taxonomy-manual-eyebrow">VIGIL Failure Taxonomy · Technical Standard</p>
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

      {family.aliases?.length ? <details>
        <summary><strong>Prior codes and aliases</strong></summary>
        <ul>{family.aliases.map((alias) => <li key={alias}><code>{alias}</code></li>)}</ul>
      </details> : null}
    </header>

    <h2 className="vigil-taxonomy-manual-classes-heading">Failure classes</h2>
    <div className="vigil-taxonomy-manual-class-list">
      {document.classes.map((item) => <ClassManualCard key={item.class_id} item={item} classById={classById} />)}
    </div>
  </section>;
}

export default function VigilFailureTaxonomy() {
  const [, params] = useRoute("/observatory/knowledge-base/failure-taxonomy/:taxonomyId");
  const requestedId = decodeURIComponent(params?.taxonomyId ?? "").trim();
  const [state, setState] = useState<TaxonomyState>({ status: "loading" });
  const [query, setQuery] = useState("");

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
  const description = state.status === "ready" ? state.data.families[0]?.standard.description : undefined;

  return <Shell><VigilObservatoryNav /><main className="vigil-library-page vigil-taxonomy-manual-page">
    <div className="container mx-auto max-w-[1500px] px-4 py-7 sm:px-6 md:px-10 md:py-9">
      <section className="vigil-library-shell vigil-taxonomy-shell" aria-labelledby="taxonomy-heading">
        <header className="vigil-library-header vigil-taxonomy-header">
          <div>
            <p className="vigil-library-kicker">VIGIL Observatory</p>
            <div className="vigil-taxonomy-header-title-row">
              <h1 id="taxonomy-heading">{state.status === "ready" ? state.data.index.standard.name : "VIGIL Failure Taxonomy"}</h1>
              <span className="cam-beta-chip">Beta</span>
            </div>
            <p className="vigil-library-description">{description ?? "A structured classification standard for recurring AI governance failure mechanisms."}</p>
            {state.status === "ready" ? <p className="vigil-taxonomy-header-meta">
              Version {state.data.index.standard.version} · {state.data.index.families.length} families · {classCount} failure classes
            </p> : null}
          </div>
        </header>

        {state.status === "loading" ? <div className="vigil-reference-state">Loading VIGIL Failure Taxonomy…</div> : null}
        {state.status === "unavailable" ? <div className="vigil-reference-state"><h2>VIGIL Failure Taxonomy unavailable</h2><p>{state.message}</p></div> : null}

        {state.status === "ready" && selectedFamily ? <div className="vigil-taxonomy-manual-layout">
          <ManualContents
            families={families}
            query={query}
            setQuery={setQuery}
            activeFamilyId={selectedFamily.family.family_id}
          />
          <div className="vigil-taxonomy-manual-document" aria-live="polite">
            <FamilyManualSection document={selectedFamily} classById={classById} />
          </div>
        </div> : null}
      </section>
    </div>
  </main></Shell>;
}