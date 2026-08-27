import { useEffect, useMemo, useState } from "react";
import {
  loadFailureTaxonomy,
  type FailureTaxonomyClass,
  type FailureTaxonomyDataset,
  type FailureTaxonomyFamilyDocument,
} from "@/lib/vigilFailureTaxonomy";
import type { UnknownRecord } from "@/lib/vigilRegistry";

type ClassificationStatus = "classified" | "family-only" | "candidate-new-class" | "unmapped" | "deferred";

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
  failureId: string;
  raw: UnknownRecord;
  severityLabel: string;
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
      familyId: text(primaryFamily?.family_id),
      classId: text(primaryClass?.class_id),
      basis: text(value.classification_basis),
      confidence: text(value.classification_confidence),
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
    case "family-only": return "Family only";
    case "candidate-new-class": return "Candidate new class";
    case "unmapped": return "Unmapped";
    case "deferred": return "Deferred";
    default: return "Not classified";
  }
}

function Meta({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return <div className="vigil-case-field"><dt>{label}</dt><dd className={mono ? "is-mono" : undefined}>{value}</dd></div>;
}

function CanonicalMechanism({ item, label }: { item: ResolvedClassification; label: string }) {
  const family = item.family?.family;
  const classificationClass = item.class;
  return <article className="vigil-classification-summary vigil-classification-summary-v6">
    <div className="vigil-classification-topline">
      <span>{label}</span>
      {item.confidence && <strong>Confidence <b>{item.confidence}</b></strong>}
    </div>
    <div className="vigil-classification-identity">
      <dl>
        <Meta label="Family ID" value={family?.family_id ?? item.familyId} mono />
        <Meta label="Family" value={family?.name} />
        <Meta label="Family code" value={family?.family_code} mono />
        <Meta label="Class ID" value={classificationClass?.class_id ?? item.classId} mono />
        <Meta label="Class" value={classificationClass?.name} />
        <Meta label="Class code" value={classificationClass?.class_code} mono />
        <Meta label="Abstraction" value={classificationClass?.abstraction} />
      </dl>
    </div>
    {(classificationClass?.definition || family?.definition) && <section className="vigil-diagnosis-definition">
      <p className="vigil-library-kicker">Canonical taxonomy definition</p>
      <p>{classificationClass?.definition ?? family?.definition}</p>
    </section>}
    {classificationClass?.plain_english && <section className="vigil-diagnosis-definition">
      <p className="vigil-library-kicker">Plain-English description</p>
      <p>{classificationClass.plain_english}</p>
    </section>}
    {item.basis && <section className="vigil-diagnosis-definition">
      <p className="vigil-library-kicker">Classification basis</p>
      <p>{item.basis}</p>
    </section>}
    {((item.classId && !classificationClass) || (item.familyId && !family)) && <p className="vigil-case-empty">The record contains an immutable taxonomy identifier that is not present in the current published VIGIL taxonomy. No legacy taxonomy fallback has been applied.</p>}
  </article>;
}

function ExplicitState({ status, family }: { status?: ClassificationStatus; family?: ResolvedClassification }) {
  const familyDefinition = family?.family?.family.definition;
  if (status === "family-only" && family) return <>
    <CanonicalMechanism item={family} label="Primary family" />
    <p className="vigil-case-empty">This Failure Mode is classified to a canonical VIGIL failure family, but no canonical failure class has been assigned.</p>
  </>;
  if (status === "candidate-new-class") return <p className="vigil-case-empty">A new failure class has been identified as a candidate, but no immutable VIGIL class ID has been allocated. The Case File therefore does not present a provisional class as canonical.{familyDefinition ? ` The current family context is: ${familyDefinition}` : ""}</p>;
  if (status === "unmapped") return <p className="vigil-case-empty">No canonical VIGIL taxonomy mapping currently exists for this Failure Mode. The record remains explicitly unmapped rather than being forced into a legacy or approximate class.</p>;
  if (status === "deferred") return <p className="vigil-case-empty">Taxonomy classification is explicitly deferred in the VIGIL record. No class is rendered until the structural classification review is completed.</p>;
  return <p className="vigil-case-empty">No VIGIL-native taxonomy classification is recorded for this Failure Mode. Section 03 will populate when the FM receives a canonical family/class mapping.</p>;
}

export function CaseTaxonomyClassification({ failureId, raw, severityLabel }: Props) {
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

  if (parsed.status !== "classified") return <>
    <div className="vigil-classification-topline"><span>{failureId.replace(/^VIGIL-\d{4}-/i, "")}</span><strong>Severity <b>{severityLabel}</b></strong></div>
    <div className="vigil-classification-topline"><span>Taxonomy state</span><strong><b>{statusLabel(parsed.status)}</b></strong></div>
    <ExplicitState status={parsed.status} family={primary} />
  </>;

  return <div className="vigil-taxonomy-classification-view">
    <div className="vigil-classification-topline"><span>{failureId.replace(/^VIGIL-\d{4}-/i, "")}</span><strong>Severity <b>{severityLabel}</b></strong></div>
    <div className="vigil-classification-topline"><span>Taxonomy state</span><strong><b>{statusLabel(parsed.status)}</b></strong></div>
    <CanonicalMechanism item={primary} label="Primary structural mechanism" />
    {secondaries.length > 0 && <section className="vigil-secondary-classifications">
      <div className="vigil-case-subheading">
        <p className="vigil-library-kicker">Secondary classifications</p>
        <h3>Additional independently evidenced structural mechanisms</h3>
      </div>
      <div className="vigil-observation-list">
        {secondaries.map((item, index) => <CanonicalMechanism key={`${item.classId ?? item.familyId ?? index}`} item={item} label={`Secondary mechanism ${index + 1}`} />)}
      </div>
    </section>}
    {parsed.taxonomyVersion && <p className="vigil-stage-source-line">VIGIL Failure Taxonomy {parsed.taxonomyVersion}</p>}
  </div>;
}
