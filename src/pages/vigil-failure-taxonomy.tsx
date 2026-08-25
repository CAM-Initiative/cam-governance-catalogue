import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
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

function SearchControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="vigil-search-control vigil-taxonomy-search">
    <Search aria-hidden="true" />
    <span className="sr-only">Search the VIGIL Failure Taxonomy</span>
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search failure family, class, identifier, mechanism or example…"
    />
    {value ? <button type="button" onClick={() => onChange("")} aria-label="Clear taxonomy search"><X /></button> : null}
  </label>;
}

function relationshipLabel(type: string) {
  const labels: Record<string, string> = {
    child_of: "Child of",
    distinguish_from: "Distinguish from",
    can_cooccur_with: "Can co-occur with",
  };
  return labels[type] ?? clean(type) ?? type;
}

function classHaystack(item: FailureTaxonomyClass, family: FailureTaxonomyFamilyDocument) {
  return [
    family.family.family_id,
    family.family.family_code,
    family.family.name,
    family.family.plain_english,
    family.family.definition,
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
  classById: Map<string, { item: FailureTaxonomyClass; family: FailureTaxonomyFamilyDocument }>,
) {
  const target = classById.get(relationship.target_id);
  return target?.item.name ?? relationship.target_id;
}

function ClassCard({
  item,
  family,
  classById,
  forceOpen = false,
}: {
  item: FailureTaxonomyClass;
  family: FailureTaxonomyFamilyDocument;
  classById: Map<string, { item: FailureTaxonomyClass; family: FailureTaxonomyFamilyDocument }>;
  forceOpen?: boolean;
}) {
  return <details className="vigil-taxonomy-class" id={item.class_id.toLowerCase()} open={forceOpen || undefined}>
    <summary>
      <span className="vigil-taxonomy-class-type">{clean(item.abstraction)}</span>
      <span className="vigil-taxonomy-class-heading">
        <strong>{item.name}</strong>
        <small>{item.class_id} · {item.class_code}</small>
      </span>
      <span className="vigil-taxonomy-class-plain">{item.plain_english}</span>
      <ChevronDown aria-hidden="true" />
    </summary>
    <div className="vigil-taxonomy-class-body">
      <section>
        <p className="vigil-library-kicker">Technical definition</p>
        <p>{item.definition}</p>
      </section>

      <div className="vigil-taxonomy-boundary-grid vigil-taxonomy-classification-grid">
        <section>
          <p className="vigil-library-kicker">Recognise when</p>
          <ul>{(item.recognition?.required_conditions ?? []).map((condition) => <li key={condition}>{condition}</li>)}</ul>
        </section>
        <section>
          <p className="vigil-library-kicker">Do not use when</p>
          <ul>{(item.exclusions ?? []).map((exclusion) => <li key={exclusion}>{exclusion}</li>)}</ul>
        </section>
      </div>

      {item.examples?.length ? <section className="vigil-taxonomy-examples">
        <p className="vigil-library-kicker">Illustrative examples</p>
        <ul>{item.examples.map((example) => <li key={example}>{example}</li>)}</ul>
      </section> : null}

      {item.relationships?.length ? <section className="vigil-taxonomy-relationships">
        <p className="vigil-library-kicker">Relationships</p>
        <ul>{item.relationships.map((relationship, index) => <li key={`${relationship.type}-${relationship.target_id}-${index}`}>
          <strong>{relationshipLabel(relationship.type)}:</strong>{" "}
          <Link href={`/observatory/knowledge-base/failure-taxonomy/${relationship.target_id}`}>{relationshipTarget(relationship, classById)}</Link>
          {relationship.note ? <span> — {relationship.note}</span> : null}
        </li>)}</ul>
      </section> : null}

      {item.aliases?.length ? <details className="vigil-taxonomy-aliases">
        <summary>Prior codes and aliases</summary>
        <ul>{item.aliases.map((alias) => <li key={alias}><code>{alias}</code></li>)}</ul>
      </details> : null}
    </div>
  </details>;
}

function FamilyNavigation({ families, activeFamilyId }: { families: FailureTaxonomyFamilyDocument[]; activeFamilyId?: string }) {
  return <nav className="vigil-taxonomy-family-nav" aria-label="Failure taxonomy families">
    <p className="vigil-library-kicker">Failure families</p>
    <ol>{families.map((document, index) => {
      const family = document.family;
      return <li key={family.family_id}>
        <Link
          href={`/observatory/knowledge-base/failure-taxonomy/${family.family_id}`}
          className={family.family_id === activeFamilyId ? "is-active" : undefined}
          aria-current={family.family_id === activeFamilyId ? "page" : undefined}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span><strong>{family.name}</strong><small>{document.classes.length} class{document.classes.length === 1 ? "" : "es"}</small></span>
        </Link>
      </li>;
    })}</ol>
  </nav>;
}

function FamilyReference({
  document,
  classById,
  requestedId,
}: {
  document: FailureTaxonomyFamilyDocument;
  classById: Map<string, { item: FailureTaxonomyClass; family: FailureTaxonomyFamilyDocument }>;
  requestedId?: string;
}) {
  const family = document.family;
  return <article className="vigil-taxonomy-family-reference">
    <header className="vigil-taxonomy-family-header">
      <div className="vigil-taxonomy-family-title-row">
        <div>
          <p className="vigil-library-kicker">{family.family_id} · {family.family_code}</p>
          <h2>{family.name}</h2>
        </div>
        <span className="cam-beta-chip">Beta</span>
      </div>
      <p className="vigil-taxonomy-plain">{family.plain_english}</p>
      <dl className="vigil-taxonomy-family-meta">
        <div><dt>Version</dt><dd>{family.version}</dd></div>
        <div><dt>Status</dt><dd>{clean(family.status)}</dd></div>
        <div><dt>Classes</dt><dd>{document.classes.length}</dd></div>
      </dl>
    </header>

    <section className="vigil-taxonomy-definition">
      <p className="vigil-library-kicker">Technical definition</p>
      <p>{family.definition}</p>
    </section>

    <section className="vigil-taxonomy-invariant">
      <p className="vigil-library-kicker">Governing invariant</p>
      <blockquote>{family.invariant}</blockquote>
    </section>

    <div className="vigil-taxonomy-boundary-grid">
      <section>
        <p className="vigil-library-kicker">Include when</p>
        <p>{family.inclusion_rule}</p>
      </section>
      <section>
        <p className="vigil-library-kicker">Exclude when</p>
        <p>{family.exclusion_rule}</p>
      </section>
    </div>

    {family.scope?.length ? <section className="vigil-taxonomy-scope">
      <p className="vigil-library-kicker">Scope</p>
      <ul>{family.scope.map((item) => <li key={item}>{item}</li>)}</ul>
    </section> : null}

    <section className="vigil-taxonomy-classes" aria-labelledby={`${family.family_id}-classes-heading`}>
      <div className="vigil-taxonomy-section-heading">
        <div><p className="vigil-library-kicker">Failure classes</p><h3 id={`${family.family_id}-classes-heading`}>Mechanisms in this family</h3></div>
        <span>{document.classes.length}</span>
      </div>
      <div className="vigil-taxonomy-class-list">
        {document.classes.map((item) => <ClassCard
          key={item.class_id}
          item={item}
          family={document}
          classById={classById}
          forceOpen={requestedId?.toUpperCase() === item.class_id.toUpperCase()}
        />)}
      </div>
    </section>
  </article>;
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
    const map = new Map<string, { item: FailureTaxonomyClass; family: FailureTaxonomyFamilyDocument }>();
    for (const family of families) for (const item of family.classes) map.set(item.class_id.toUpperCase(), { item, family });
    return map;
  }, [families]);

  const requestedFamily = useMemo(() => {
    if (!families.length) return undefined;
    if (requestedId) {
      const family = families.find((document) => document.family.family_id.toUpperCase() === requestedId.toUpperCase());
      if (family) return family;
      const classMatch = classById.get(requestedId.toUpperCase());
      if (classMatch) return classMatch.family;
    }
    return families[0];
  }, [classById, families, requestedId]);

  const searchResults = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return families.flatMap((family) => family.classes
      .filter((item) => {
        const haystack = classHaystack(item, family);
        return terms.every((term) => haystack.includes(term));
      })
      .map((item) => ({ item, family })));
  }, [families, query]);

  const familyCount = state.status === "ready" ? state.data.index.families.length : 0;
  const classCount = state.status === "ready" ? state.data.index.families.reduce((sum, family) => sum + family.class_count, 0) : 0;
  const standardVersion = state.status === "ready" ? state.data.index.standard.version : undefined;

  return <Shell><VigilObservatoryNav /><main className="vigil-taxonomy-page">
    <div className="container mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
      <header className="vigil-taxonomy-hero">
        <div className="vigil-taxonomy-title-row">
          <div>
            <p className="vigil-library-kicker">VIGIL Observatory · Knowledge Base</p>
            <h1>Governance Failure Taxonomy</h1>
          </div>
          <span className="cam-beta-chip">Beta</span>
        </div>
        <p>A structured classification standard for recurring AI governance failure mechanisms. Browse failure families, then open individual classes to compare recognition criteria, exclusions, examples and relationships.</p>
        {state.status === "ready" ? <dl className="vigil-taxonomy-stats">
          <div><dt>Families</dt><dd>{familyCount}</dd></div>
          <div><dt>Failure classes</dt><dd>{classCount}</dd></div>
          <div><dt>Standard version</dt><dd>{standardVersion}</dd></div>
        </dl> : null}
      </header>

      {state.status === "loading" ? <div className="vigil-reference-state">Loading Governance Failure Taxonomy…</div> : null}
      {state.status === "unavailable" ? <div className="vigil-reference-state"><h2>Governance Failure Taxonomy unavailable</h2><p>{state.message}</p></div> : null}

      {state.status === "ready" ? <>
        {state.data.previewSource ? <div className="vigil-taxonomy-preview-note" role="note"><strong>Development preview.</strong> This local build is reading the VIGIL taxonomy working branch because the canonical package is not yet on VIGIL main. Production builds do not use this fallback.</div> : null}

        <section className="vigil-taxonomy-toolbar" aria-label="Search taxonomy">
          <SearchControl value={query} onChange={setQuery} />
          <p>{query ? `${searchResults.length} matching failure ${searchResults.length === 1 ? "class" : "classes"}` : `${familyCount} families · ${classCount} failure classes`}</p>
        </section>

        {query ? <section className="vigil-taxonomy-search-results" aria-labelledby="taxonomy-search-heading">
          <div className="vigil-taxonomy-section-heading">
            <div><p className="vigil-library-kicker">Search results</p><h2 id="taxonomy-search-heading">Matching failure mechanisms</h2></div>
            <button type="button" onClick={() => setQuery("")}>Clear search</button>
          </div>
          {searchResults.length ? <div className="vigil-taxonomy-result-list">{searchResults.map(({ item, family }) => <article key={item.class_id}>
            <p className="vigil-library-kicker">{family.family.name}</p>
            <h3>{item.name}</h3>
            <p>{item.plain_english}</p>
            <div><code>{item.class_id}</code><code>{item.class_code}</code></div>
            <Link href={`/observatory/knowledge-base/failure-taxonomy/${item.class_id}`} onClick={() => setQuery("")}>Open class →</Link>
          </article>)}</div> : <div className="vigil-empty-panel">No failure classes match this search.</div>}
        </section> : <div className="vigil-taxonomy-browser">
          <FamilyNavigation families={families} activeFamilyId={requestedFamily?.family.family_id} />
          {requestedFamily ? <FamilyReference document={requestedFamily} classById={classById} requestedId={requestedId} /> : null}
        </div>}
      </> : null}
    </div>
  </main></Shell>;
}
