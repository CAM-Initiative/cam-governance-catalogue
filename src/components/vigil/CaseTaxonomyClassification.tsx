import { useEffect, useMemo, useState } from "react";
import {
  loadFailureTaxonomy,
  type FailureTaxonomyClass,
  type FailureTaxonomyDataset,
  type FailureTaxonomyFamilyDocument,
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

type ClassificationRole = "failure-occurrence" | "successful-invariant";

type ParsedClassification = {
  status?: ClassificationStatus;
  role?: ClassificationRole;
  taxonomyVersion?: string;
  primary: ClassificationRef;
  secondary: ClassificationRef[];
};

type ResolvedClassification = ClassificationRef & {
  family?: FailureTaxonomyFamilyDocument;
  class?: FailureTaxonomyClass;
  sourceUrl?: string;
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
  const role = text(value.classification_role) as ClassificationRole | undefined;
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
    role,
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

function familySourceUrl(dataset: FailureTaxonomyDataset, familyId?: string) {
  if (!familyId) return undefined;
  const entry = dataset.index.families.find((item) => item.family_id === familyId);
  return entry ? `${dataset.sourceRoot}/${entry.file}` : undefined;
}

function resolveClassification(dataset: FailureTaxonomyDataset, reference: ClassificationRef): ResolvedClassification {
  const classResolution = classById(dataset, reference.classId);
  const family = classResolution?.family ?? familyById(dataset, reference.familyId);
  const resolvedFamilyId = family?.family.family_id ?? reference.familyId;
  return {
    ...reference,
    family,
    class: classResolution?.class,
    sourceUrl: familySourceUrl(dataset, resolvedFamilyId),
  };
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

function useTaxonomy(): TaxonomyState {
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

  return taxonomy;
}

function ClassificationCard({
  item,
  label,
  status,
  taxonomyVersion,
  relationship,
  exemplar = false,
}: {
  item: ResolvedClassification;
  label: string;
  status?: ClassificationStatus;
  taxonomyVersion?: string;
  relationship: string;
  exemplar?: boolean;
}) {
  const family = item.family?.family;
  const classificationClass = item.class;
  const unresolved = (item.classId && !classificationClass) || (item.familyId && !family);
  const title = classificationClass?.name ?? family?.name ?? "Canonical taxonomy mapping";
  const technicalDefinition = classificationClass?.definition ?? family?.definition;
  const plainEnglish = classificationClass?.plain_english ?? family?.plain_english;

  return <article className="vigil-classification-card">
    <header className="vigil-classification-card-header">
      <p className="vigil-evidence-kicker">{label}</p>
      <h3>{title}</h3>
    </header>

    <div className="vigil-classification-layout">
      <div className="vigil-classification-reading">
        {plainEnglish && <section>
          <h4 className="vigil-substantive-label">{exemplar ? "Failure boundary this exemplar tests" : "What this failure means"}</h4>
          <p>{plainEnglish}</p>
        </section>}
        {technicalDefinition && <section>
          <h4 className="vigil-substantive-label">Canonical definition</h4>
          <p>{technicalDefinition}</p>
        </section>}
        {item.basis && <section>
          <h4 className="vigil-substantive-label">{exemplar ? "Why this Case File is an exemplar" : "Why this Case File maps here"}</h4>
          <p>{item.basis}</p>
        </section>}
      </div>

      <aside className="vigil-classification-metadata" aria-label={`${label} classification metadata`}>
        <p className="vigil-diagnostic-meta-label">Classification metadata</p>
        <dl>
          <Meta label="Status" value={exemplar ? "Exemplar" : statusLabel(status)} />
          <Meta label="Relationship" value={exemplar ? "Successful invariant exemplar" : relationship} />
          <Meta label="Confidence" value={item.confidence} />
          <Meta label="Taxonomy version" value={taxonomyVersion} mono />
          <Meta label="Failure family" value={family?.name} />
          <Meta label="Family ID" value={family?.family_id ?? item.familyId} mono />
          <Meta label="Family code" value={family?.family_code} mono />
          <Meta label="Failure class" value={classificationClass?.name} />
          <Meta label="Class ID" value={classificationClass?.class_id ?? item.classId} mono />
          <Meta label="Class code" value={classificationClass?.class_code} mono />
        </dl>
      </aside>
    </div>

    {item.sourceUrl && <footer className="vigil-classification-source">
      <a href={item.sourceUrl} target="_blank" rel="noreferrer">View canonical taxonomy source →</a>
    </footer>}

    {unresolved && <p className="vigil-case-empty">The Incident contains an immutable taxonomy identifier that is not present in the current published VIGIL taxonomy. No legacy taxonomy fallback has been applied.</p>}
  </article>;
}

function ExplicitClassificationState({
  parsed,
  primary,
}: {
  parsed: ParsedClassification;
  primary?: ResolvedClassification;
}) {
  const familyDefinition = primary?.family?.family.definition;
  if (parsed.status === "family-only" && primary) return <>
    <ClassificationCard
      item={primary}
      label="Primary failure family"
      status={parsed.status}
      taxonomyVersion={parsed.taxonomyVersion}
      relationship="Family only"
    />
    <p className="vigil-case-empty">This Incident is classified to a canonical VIGIL failure family, but no canonical failure class has been assigned.</p>
  </>;
  if (parsed.status === "candidate-new-class") return <p className="vigil-case-empty">A new failure class has been identified as a candidate, but no immutable VIGIL class ID has been allocated. The Case File therefore does not present a provisional class as canonical.{familyDefinition ? ` The current family context is: ${familyDefinition}` : ""}</p>;
  if (parsed.status === "unmapped") return <p className="vigil-case-empty">No canonical VIGIL taxonomy mapping currently exists for this Incident. The record remains explicitly unmapped rather than being forced into a legacy or approximate class.</p>;
  if (parsed.status === "deferred") return <p className="vigil-case-empty">Taxonomy classification is explicitly deferred in the VIGIL record. No class is rendered until the structural classification review is completed.</p>;
  if (parsed.status === "requires-human-review") return <p className="vigil-case-empty">The Incident requires human taxonomy review. No canonical mechanism is presented until that review resolves the classification state.</p>;
  return <p className="vigil-case-empty">No VIGIL-native taxonomy classification is recorded for this Incident. Section 03 will populate when the Incident receives a canonical family/class mapping.</p>;
}

export function CaseTaxonomyClassification({ raw }: Props) {
  const parsed = useMemo(() => parseClassification(raw), [raw]);
  const taxonomy = useTaxonomy();

  if (!parsed.status) return <ExplicitClassificationState parsed={parsed} />;
  if (taxonomy.status === "loading") return <p className="vigil-case-empty">Resolving VIGIL taxonomy classification…</p>;
  if (taxonomy.status === "unavailable") return <p className="vigil-case-empty">The VIGIL taxonomy source is temporarily unavailable, so the canonical definition cannot be resolved. {taxonomy.message}</p>;

  const primary = resolveClassification(taxonomy.data, parsed.primary);
  const secondaries = parsed.secondary.map((item) => resolveClassification(taxonomy.data, item));
  const exemplar = parsed.role === "successful-invariant";
  const renderPrimary = parsed.status === "classified" || parsed.status === "provisionally-classified" || parsed.status === "classification-disputed";

  if (!renderPrimary) return <div className="vigil-taxonomy-classification-view">
    <ExplicitClassificationState parsed={parsed} primary={primary} />
  </div>;

  return <div className="vigil-taxonomy-classification-view">
    {parsed.status === "classification-disputed" && <p className="vigil-case-empty">This is the currently proposed taxonomy mapping for a disputed classification. It is shown for transparency and is not presented as settled.</p>}
    {exemplar && <p className="vigil-case-empty">This Case File is attached to the Failure Class as a successful invariant exemplar. It demonstrates the governing invariant holding under relevant failure pressure and is not failure evidence.</p>}

    <ClassificationCard
      item={primary}
      label={exemplar ? "Successful invariant exemplar" : parsed.status === "classification-disputed" ? "Proposed primary structural mechanism" : "Primary structural mechanism"}
      status={parsed.status}
      taxonomyVersion={parsed.taxonomyVersion}
      relationship={exemplar ? "Successful invariant" : "Primary"}
      exemplar={exemplar}
    />

    {secondaries.length > 0 && <section className="vigil-secondary-classifications">
      <div className="vigil-case-subheading">
        <p className="vigil-library-kicker">Secondary classifications</p>
        <h3>Additional independently evidenced structural mechanisms</h3>
        <p>These are separate structural mechanisms evidenced in the same Case File. They do not replace or dilute the primary mechanism.</p>
      </div>
      <div className="vigil-classification-secondary-list">
        {secondaries.map((item, index) => <ClassificationCard
          key={`${item.classId ?? item.familyId ?? index}`}
          item={item}
          label={`Secondary mechanism ${index + 1}`}
          status={parsed.status}
          taxonomyVersion={parsed.taxonomyVersion}
          relationship="Secondary"
        />)}
      </div>
    </section>}
  </div>;
}

type RepairInvariant = {
  family?: FailureTaxonomyFamilyDocument["family"];
  class: FailureTaxonomyClass;
  relationship: "Primary" | "Additional";
};

function governingClassInvariants(primary: ResolvedClassification, secondaries: ResolvedClassification[]): RepairInvariant[] {
  const result: RepairInvariant[] = [];
  const seen = new Set<string>();

  const add = (item: ResolvedClassification, relationship: RepairInvariant["relationship"]) => {
    const classificationClass = item.class;
    if (!classificationClass || seen.has(classificationClass.class_id)) return;
    seen.add(classificationClass.class_id);
    result.push({
      family: item.family?.family,
      class: classificationClass,
      relationship,
    });
  };

  add(primary, "Primary");
  for (const secondary of secondaries) add(secondary, "Additional");
  return result;
}

export function CaseTaxonomyRepair({ raw }: Props) {
  const parsed = useMemo(() => parseClassification(raw), [raw]);
  const taxonomy = useTaxonomy();

  if (!parsed.status) return <p className="vigil-case-empty">No class invariant can be resolved because this Incident has no canonical taxonomy classification.</p>;
  if (taxonomy.status === "loading") return <p className="vigil-case-empty">Resolving class invariant from the VIGIL Failure Taxonomy…</p>;
  if (taxonomy.status === "unavailable") return <p className="vigil-case-empty">The VIGIL taxonomy source is temporarily unavailable, so the class invariant cannot be resolved. {taxonomy.message}</p>;

  const primary = resolveClassification(taxonomy.data, parsed.primary);
  const secondaries = parsed.secondary.map((item) => resolveClassification(taxonomy.data, item));
  const invariants = governingClassInvariants(primary, secondaries);
  const exemplar = parsed.role === "successful-invariant";

  if (!invariants.length) return <p className="vigil-case-empty">No failure class can be resolved from the canonical classification for this Incident, so no class invariant can be shown.</p>;

  return <div className="vigil-taxonomy-repair-view">
    {invariants.map(({ family, class: classificationClass, relationship }) => <article key={classificationClass.class_id} className="vigil-repair-invariant-card">
      <div className="vigil-repair-reading">
        <p className="vigil-evidence-kicker">{exemplar ? "Invariant demonstrated" : relationship === "Primary" ? "Governing class invariant" : "Additional class invariant"}</p>
        <h3>{classificationClass.name}</h3>
        {classificationClass.invariant
          ? <p className="vigil-repair-invariant">{classificationClass.invariant}</p>
          : <p className="vigil-case-empty">A class-level invariant has not yet been published for this failure class. The broader family invariant is not substituted here.</p>}
      </div>
      <aside className="vigil-repair-metadata-panel" aria-label={`${classificationClass.name} invariant provenance`}>
        <p className="vigil-diagnostic-meta-label">Derived from</p>
        <dl>
          <Meta label="Relationship" value={relationship} />
          <Meta label="Failure class" value={classificationClass.name} />
          <Meta label="Class ID" value={classificationClass.class_id} mono />
          <Meta label="Class code" value={classificationClass.class_code} mono />
          <Meta label="Failure family" value={family?.name} />
          <Meta label="Family ID" value={family?.family_id} mono />
          <Meta label="Taxonomy version" value={parsed.taxonomyVersion} mono />
        </dl>
      </aside>
    </article>)}
    <p className="vigil-repair-boundary">{exemplar
      ? "This Case File demonstrates the class-level governing invariant holding under the evidenced pressure. No repair is inferred from the exemplar relationship. The class remains the relevant failure boundary, while this occurrence sits on the successful side of that boundary."
      : "This section identifies the class-level governing invariant that must be restored for each classified failure mechanism. Where a class invariant has not yet been published, this Case File does not substitute the broader family invariant. This Case File does not currently identify the specific CAELESTIS constitutional or run-time provision(s) through which a class invariant is instantiated or enforced."}</p>
  </div>;
}
