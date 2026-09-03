import { useEffect, useMemo, useState } from "react";
import {
  loadFailureTaxonomy,
  type FailureTaxonomyClass,
  type FailureTaxonomyDataset,
  type FailureTaxonomyFamilyDocument,
  type FailureTaxonomySubtype,
} from "@/lib/vigilFailureTaxonomy";
import type { UnknownRecord } from "@/lib/vigilRegistry";

type ClassificationStatus =
  | "classified"
  | "provisionally-classified"
  | "classification-disputed"
  | "requires-human-review"
  | "unclassified"
  | "family-only"
  | "candidate-new-class"
  | "unmapped"
  | "deferred";

type ClassificationRef = {
  familyId?: string;
  classId?: string;
  basis?: string;
  confidence?: string;
};

type ParsedClassification = {
  status?: ClassificationStatus;
  taxonomyVersion?: string;
  primary: ClassificationRef;
  secondary: ClassificationRef[];
};

type ResolvedClassification = ClassificationRef & {
  family?: FailureTaxonomyFamilyDocument;
  class?: FailureTaxonomyClass;
};

type Props = {
  raw: UnknownRecord;
};

type TaxonomyState =
  | { status: "loading" }
  | { status: "ready"; data: FailureTaxonomyDataset }
  | { status: "unavailable"; message: string };

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parsePair(value: unknown): Pick<ClassificationRef, "familyId" | "classId"> {
  if (!isObject(value)) return {};
  const family = isObject(value.family) ? value.family : undefined;
  const classificationClass = isObject(value.class) ? value.class : undefined;
  return {
    familyId: text(family?.family_id ?? value.family_id),
    classId: text(classificationClass?.class_id ?? value.class_id),
  };
}

function parseClassification(raw: UnknownRecord): ParsedClassification {
  const value = isObject(raw.taxonomy_classification) ? raw.taxonomy_classification : undefined;
  if (!value) return { primary: {}, secondary: [] };

  const primaryClassification = isObject(value.primary_classification) ? value.primary_classification : undefined;
  const primaryFamily = isObject(value.primary_family) ? value.primary_family : undefined;
  const primaryClass = isObject(value.primary_class) ? value.primary_class : undefined;
  const status = text(value.classification_status) as ClassificationStatus | undefined;
  const secondary = Array.isArray(value.secondary_classifications)
    ? value.secondary_classifications.flatMap((item) => {
        if (!isObject(item)) return [];
        const pair = parsePair(item);
        return [{
          ...pair,
          basis: text(item.classification_basis),
          confidence: text(item.classification_confidence),
        }];
      })
    : [];

  return {
    status,
    taxonomyVersion: text(value.taxonomy_version),
    primary: {
      familyId: text(primaryClassification?.family_id ?? primaryFamily?.family_id),
      classId: text(primaryClassification?.class_id ?? primaryClass?.class_id),
      basis: text(primaryClassification?.classification_basis ?? value.classification_basis),
      confidence: text(primaryClassification?.classification_confidence ?? value.classification_confidence),
    },
    secondary,
  };
}

function familyById(dataset: FailureTaxonomyDataset, familyId?: string) {
  if (!familyId || !dataset.index.families.some((entry) => entry.family_id === familyId)) return undefined;
  return dataset.families.find((entry) => entry.family.family_id === familyId);
}

function classById(dataset: FailureTaxonomyDataset, classId?: string) {
  if (!classId) return undefined;
  for (const family of dataset.families) {
    const match = family.classes.find((entry) => entry.class_id === classId);
    if (match) return { family, class: match };
  }
  return undefined;
}

function resolveClassification(dataset: FailureTaxonomyDataset, reference: ClassificationRef): ResolvedClassification {
  const classResolution = classById(dataset, reference.classId);
  const family = classResolution?.family ?? familyById(dataset, reference.familyId);
  return { ...reference, family, class: classResolution?.class };
}

function statusLabel(status?: ClassificationStatus) {
  switch (status) {
    case "classified": return "Classified";
    case "provisionally-classified": return "Provisionally classified";
    case "classification-disputed": return "Classification disputed";
    case "requires-human-review": return "Requires human review";
    case "unclassified": return "Unclassified";
    case "family-only": return "Family only";
    case "candidate-new-class": return "Candidate new class";
    case "unmapped": return "Unmapped";
    case "deferred": return "Deferred";
    default: return "Not classified";
  }
}

function Meta({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return <div className="vigil-evidence-meta-field"><dt>{label}</dt><dd className={mono ? "is-mono" : undefined}>{value}</dd></div>;
}

function BulletList({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return <ul className="vigil-taxonomy-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function RelationshipList({ items }: { items?: { type: string; target_id: string; note?: string }[] }) {
  if (!items?.length) return null;
  return <ul className="vigil-taxonomy-list">{items.map((item, index) => <li key={`${item.type}-${item.target_id}-${index}`}><strong>{item.type.replaceAll("_", " ")}</strong> · <span className="is-mono">{item.target_id}</span>{item.note ? ` — ${item.note}` : ""}</li>)}</ul>;
}

function Subtype({ subtype }: { subtype: FailureTaxonomySubtype }) {
  return <article className="vigil-evidence-card vigil-taxonomy-subtype-card">
    <header className="vigil-evidence-header">
      <div>
        <p className="vigil-evidence-kicker">Recognition subtype</p>
        <h4>{subtype.name}</h4>
      </div>
      <dl className="vigil-evidence-source-meta">
        <Meta label="Historical class ID" value={subtype.historical_class_id} mono />
        <Meta label="Historical class code" value={subtype.historical_class_code} mono />
      </dl>
    </header>
    {subtype.plain_english && <p><strong>Plain English.</strong> {subtype.plain_english}</p>}
    {subtype.definition && <p><strong>Definition.</strong> {subtype.definition}</p>}
    {subtype.recognition?.required_conditions?.length ? <section><p className="vigil-library-kicker">Recognition conditions</p><BulletList items={subtype.recognition.required_conditions} /></section> : null}
    {subtype.exclusions?.length ? <section><p className="vigil-library-kicker">Exclusions</p><BulletList items={subtype.exclusions} /></section> : null}
    {subtype.examples?.length ? <section><p className="vigil-library-kicker">Examples</p><BulletList items={subtype.examples} /></section> : null}
  </article>;
}

function CanonicalMechanism({ item, label }: { item: ResolvedClassification; label: string }) {
  const family = item.family?.family;
  const classificationClass = item.class;
  const unresolved = (item.classId && !classificationClass) || (item.familyId && !family);
  const title = classificationClass?.name ?? family?.name ?? "Canonical taxonomy mapping";
  const technicalDefinition = classificationClass?.definition ?? family?.definition;
  const plainEnglish = classificationClass?.plain_english ?? family?.plain_english;

  return <article className="vigil-evidence-card vigil-taxonomy-record-card">
    <header className="vigil-evidence-header">
      <div className="vigil-evidence-title-row">
        <div>
          <p className="vigil-evidence-kicker">{label}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <dl className="vigil-evidence-source-meta" aria-label={`${label} taxonomy identity`}>
        <Meta label="Family ID" value={family?.family_id ?? item.familyId} mono />
        <Meta label="Family code" value={family?.family_code} mono />
        <Meta label="Class ID" value={classificationClass?.class_id ?? item.classId} mono />
        <Meta label="Class code" value={classificationClass?.class_code} mono />
        <Meta label="Abstraction" value={classificationClass?.abstraction ?? family?.abstraction} />
        <Meta label="Classification confidence" value={item.confidence} />
      </dl>
    </header>

    {(plainEnglish || technicalDefinition) && <div className="vigil-evidence-grid">
      {plainEnglish && <section className="vigil-evidence-column">
        <h4>Plain-English description</h4>
        <p>{plainEnglish}</p>
      </section>}
      {technicalDefinition && <section className="vigil-evidence-column vigil-evidence-interpretation">
        <h4>Canonical technical definition</h4>
        <p>{technicalDefinition}</p>
      </section>}
    </div>}

    {item.basis && <div className="vigil-evidence-grid">
      <section className="vigil-evidence-column">
        <h4>Why this Case File maps here</h4>
        <p>{item.basis}</p>
      </section>
      {family?.invariant && <section className="vigil-evidence-column vigil-evidence-interpretation">
        <h4>Governing family invariant</h4>
        <p>{family.invariant}</p>
      </section>}
    </div>}

    {(classificationClass || family) && <details className="vigil-evidence-limitations" open>
      <summary>Technical taxonomy record</summary>
      <div className="vigil-evidence-boundary-list">
        {family && <>
          <p><strong>Family.</strong> {family.name} <span className="is-mono">({family.family_id})</span></p>
          <p><strong>Family definition.</strong> {family.definition}</p>
          <p><strong>Inclusion rule.</strong> {family.inclusion_rule}</p>
          <p><strong>Exclusion rule.</strong> {family.exclusion_rule}</p>
          {family.scope?.length ? <section><p className="vigil-library-kicker">Family scope</p><BulletList items={family.scope} /></section> : null}
        </>}

        {classificationClass && <>
          {classificationClass.recognition?.required_conditions?.length ? <section><p className="vigil-library-kicker">Recognition conditions</p><BulletList items={classificationClass.recognition.required_conditions} /></section> : null}
          {classificationClass.exclusions?.length ? <section><p className="vigil-library-kicker">Class exclusions</p><BulletList items={classificationClass.exclusions} /></section> : null}
          {classificationClass.examples?.length ? <section><p className="vigil-library-kicker">Canonical examples</p><BulletList items={classificationClass.examples} /></section> : null}
          {classificationClass.relationships?.length ? <section><p className="vigil-library-kicker">Taxonomy relationships</p><RelationshipList items={classificationClass.relationships} /></section> : null}
          {classificationClass.aliases?.length ? <section><p className="vigil-library-kicker">Aliases</p><BulletList items={classificationClass.aliases} /></section> : null}
          {classificationClass.subtypes?.length ? <section>
            <p className="vigil-library-kicker">Recognition subtypes and historical folded classes</p>
            <p>These refine the canonical mechanism but are not independently selectable Failure Classes.</p>
            <div className="vigil-evidence-list">{classificationClass.subtypes.map((subtype) => <Subtype key={`${subtype.historical_class_id ?? subtype.name}`} subtype={subtype} />)}</div>
          </section> : null}
        </>}
      </div>
    </details>}

    {unresolved && <p className="vigil-case-empty">The Incident contains an immutable taxonomy identifier that is not present in the current published VIGIL taxonomy. No legacy taxonomy fallback has been applied.</p>}
  </article>;
}

function ExplicitState({ status, family }: { status?: ClassificationStatus; family?: ResolvedClassification }) {
  const familyDefinition = family?.family?.definition;
  if (status === "family-only" && family) return <>
    <CanonicalMechanism item={family} label="Primary family" />
    <p className="vigil-case-empty">This Incident is classified to a canonical VIGIL failure family, but no canonical failure class has been assigned.</p>
  </>;
  if (status === "candidate-new-class") return <p className="vigil-case-empty">A new failure class has been identified as a candidate, but no immutable VIGIL class ID has been allocated. The Case File therefore does not present a provisional class as canonical.{familyDefinition ? ` The current family context is: ${familyDefinition}` : ""}</p>;
  if (status === "unmapped") return <p className="vigil-case-empty">No canonical VIGIL taxonomy mapping currently exists for this Incident. The record remains explicitly unmapped rather than being forced into a legacy or approximate class.</p>;
  if (status === "deferred") return <p className="vigil-case-empty">Taxonomy classification is explicitly deferred in the VIGIL record. No class is rendered until the structural classification review is completed.</p>;
  if (status === "requires-human-review") return <p className="vigil-case-empty">The Incident requires human taxonomy review. No canonical mechanism is presented until that review resolves the classification state.</p>;
  return <p className="vigil-case-empty">No VIGIL-native taxonomy classification is recorded for this Incident. Section 03 will populate when the Incident receives a canonical family/class mapping.</p>;
}

export function CaseTaxonomyClassification({ raw }: Props) {
  const parsed = useMemo(() => parseClassification(raw), [raw]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void loadFailureTaxonomy().then((result) => {
      if (cancelled) return;
      if (result.status === "ready") setTaxonomy({ status: "ready", data: result.data });
      else setTaxonomy({ status: "unavailable", message: result.message });
    });
    return () => { cancelled = true; };
  }, []);

  if (!parsed.status) return <ExplicitState />;
  if (taxonomy.status === "loading") return <p className="vigil-case-empty">Resolving VIGIL taxonomy classification…</p>;
  if (taxonomy.status === "unavailable") return <p className="vigil-case-empty">The VIGIL taxonomy source is temporarily unavailable, so the canonical definition cannot be resolved. {taxonomy.message}</p>;

  const primary = resolveClassification(taxonomy.data, parsed.primary);
  const secondaries = parsed.secondary.map((item) => resolveClassification(taxonomy.data, item));
  const renderPrimary = parsed.status === "classified" || parsed.status === "provisionally-classified" || parsed.status === "classification-disputed";

  if (!renderPrimary) return <div className="vigil-taxonomy-classification-view">
    <div className="vigil-classification-topline"><span>Taxonomy state</span><strong><b>{statusLabel(parsed.status)}</b></strong></div>
    <ExplicitState status={parsed.status} family={primary} />
  </div>;

  return <div className="vigil-taxonomy-classification-view">
    <div className="vigil-classification-topline"><span>Taxonomy state</span><strong><b>{statusLabel(parsed.status)}</b></strong></div>

    {parsed.status === "classification-disputed" && <p className="vigil-case-empty">This is the currently proposed taxonomy mapping for a disputed classification. It is shown for transparency and is not presented as settled.</p>}
    <CanonicalMechanism item={primary} label={parsed.status === "classification-disputed" ? "Proposed primary structural mechanism" : "Primary structural mechanism"} />

    {secondaries.length > 0 && <section className="vigil-secondary-classifications">
      <div className="vigil-case-subheading">
        <p className="vigil-library-kicker">Secondary classifications</p>
        <h3>Additional independently evidenced structural mechanisms</h3>
        <p>These are separate structural mechanisms evidenced in the same Case File. They do not replace or dilute the primary mechanism.</p>
      </div>
      <div className="vigil-evidence-list">
        {secondaries.map((item, index) => <CanonicalMechanism key={`${item.classId ?? item.familyId ?? index}`} item={item} label={`Secondary mechanism ${index + 1}`} />)}
      </div>
    </section>}

    {parsed.taxonomyVersion && <p className="vigil-stage-source-line">VIGIL Failure Taxonomy {parsed.taxonomyVersion}</p>}
  </div>;
}
