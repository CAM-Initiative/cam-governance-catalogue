import { Fragment, useEffect, useMemo, useState } from "react";
import { Check, CircleMinus, X } from "lucide-react";
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
  role?: ClassificationRole;
};

type ClassificationRole = "failure-occurrence" | "successful-invariant" | "ambiguous-boundary";

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

type ClassificationTableRow = {
  item: ResolvedClassification;
};

type Props = {
  raw: UnknownRecord;
  taxonomyReferenceNumber?: number;
  taxonomyReferenceHref?: string;
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
  const primaryRole = (text(primaryClassification?.classification_role) as ClassificationRole | undefined)
    ?? role
    ?? "failure-occurrence";
  const secondary = Array.isArray(value.secondary_classifications)
    ? value.secondary_classifications.flatMap((item) => {
        if (!isObject(item)) return [];
        const pair = parsePair(item);
        return [{
          ...pair,
          basis: text(item.classification_basis),
          confidence: text(item.classification_confidence),
          role: (text(item.classification_role) as ClassificationRole | undefined)
            ?? role
            ?? "failure-occurrence",
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
      role: primaryRole,
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

function mappingOutcome(role?: ClassificationRole) {
  if (role === "successful-invariant") return { label: "Invariant held", kind: "held" as const };
  if (role === "ambiguous-boundary") return { label: "Boundary unresolved", kind: "ambiguous" as const };
  return { label: "Failure occurred", kind: "failed" as const };
}

function MappingOutcome({ role }: { role?: ClassificationRole }) {
  const outcome = mappingOutcome(role);
  return <span className={`vigil-classification-outcome is-${outcome.kind}`} aria-label={outcome.label} title={outcome.label}>
    {outcome.kind === "held" ? <Check aria-hidden="true" /> : outcome.kind === "failed" ? <X aria-hidden="true" /> : <CircleMinus aria-hidden="true" />}
    <span className="sr-only">{outcome.label}</span>
  </span>;
}

const ALIGNMENT_LEGEND = [
  { role: "failure-occurrence" as const, label: "Failure occurred", description: "The available evidence supports the mapped failure mechanism in this occurrence." },
  { role: "successful-invariant" as const, label: "Invariant held", description: "The relevant governance boundary was tested and held; this mapping is not failure evidence." },
  { role: "ambiguous-boundary" as const, label: "Boundary unresolved", description: "The evidence engages the boundary but does not establish either a failure occurrence or successful invariant holding." },
];

export function VigilAlignmentLegend({ detailed = false }: { detailed?: boolean }) {
  return <div className={`vigil-alignment-legend${detailed ? " is-detailed" : ""}`} aria-label="Alignment legend">
    <strong className="vigil-alignment-legend-title">Legend</strong>
    {ALIGNMENT_LEGEND.map((entry) => <span className="vigil-alignment-legend-item" key={entry.role}>
      <MappingOutcome role={entry.role} />
      <span>
        <strong>{entry.label}</strong>
        {detailed && <small>{entry.description}</small>}
      </span>
    </span>)}
  </div>;
}

// Web UX shows alignment state directly; primary/secondary ordering remains in canonical data and report metadata.
function ClassificationTable({ rows, taxonomyReferenceNumber, taxonomyReferenceHref }: { rows: ClassificationTableRow[]; taxonomyReferenceNumber?: number; taxonomyReferenceHref?: string }) {
  const hasUnresolved = rows.some(({ item }) =>
    (item.classId && !item.class) || (item.familyId && !item.family)
  );

  const familyGroups = new Map<string, {
    familyId?: string;
    familyName: string;
    rows: ClassificationTableRow[];
  }>();
  rows.forEach((row, index) => {
    const family = row.item.family?.family;
    const familyId = family?.family_id ?? row.item.familyId;
    const key = familyId ?? `unassigned-${index}`;
    const existing = familyGroups.get(key);
    if (existing) {
      existing.rows.push(row);
      return;
    }
    familyGroups.set(key, {
      familyId,
      familyName: family?.name ?? (familyId ? "Unresolved failure family" : "Failure family not assigned"),
      rows: [row],
    });
  });

  return <>
    <div className="vigil-classification-web-table" role="region" aria-label="VIGIL Observatory taxonomy classifications" tabIndex={0}>
      <table className="vigil-classification-table">
        <caption className="sr-only">Canonical taxonomy mappings grouped by failure family. Successful-invariant and ambiguous-boundary mappings are not failure evidence.</caption>
        <thead>
          <tr>
            <th scope="col">Alignment</th>
            <th scope="col">Failure class</th>
            <th scope="col">Classification basis</th>
          </tr>
        </thead>
        <tbody>
          {[...familyGroups.entries()].map(([groupKey, group]) => <Fragment key={groupKey}>
            <tr key={`family-${groupKey}`} className="vigil-classification-family-row">
              <th colSpan={3} scope="rowgroup">
                {group.familyId && <span className="vigil-classification-family-id">{group.familyId}</span>}
                <strong>{group.familyName}</strong>
              </th>
            </tr>
            {group.rows.map(({ item }, index) => {
              const classificationClass = item.class;
              const classId = classificationClass?.class_id ?? item.classId;
              return <tr key={`${groupKey}-${classId ?? index}-${item.role ?? "failure-occurrence"}`}>
                <td data-label="Alignment" className="vigil-classification-outcome-cell"><MappingOutcome role={item.role} /></td>
                <td data-label="Failure class">
                  <strong>{classificationClass?.name ?? (classId ? "Unresolved failure class" : "No canonical class assigned")}</strong>
                  {classId && <span className="vigil-classification-id">{classId}</span>}
                </td>
                <td data-label="Classification basis" className="vigil-classification-basis">
                  {item.basis ?? "No separate classification basis is published for this mapping."}
                </td>
              </tr>;
            })}
          </Fragment>)}
        </tbody>
      </table>
    </div>
    {/* One bibliography-level taxonomy citation replaces repeated row-level source links. */}
    {taxonomyReferenceNumber && taxonomyReferenceHref ? <p className="vigil-taxonomy-reference-note">Failure classes and their governing invariants are defined in the <a href={taxonomyReferenceHref}>VIGIL Observatory Adjudication Taxonomy [{taxonomyReferenceNumber}]</a>.</p> : null}
    {hasUnresolved && <p className="vigil-case-empty">The Incident contains an immutable taxonomy identifier that is not present in the current published VIGIL Observatory taxonomy. No legacy taxonomy fallback has been applied.</p>}
    <VigilAlignmentLegend />
  </>;
}

/* Rich card projection retained for the deterministic report/PDF. The ordinary
   Case File WebUX uses the compact classification table above. */
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

    {unresolved && <p className="vigil-case-empty">The Incident contains an immutable taxonomy identifier that is not present in the current published VIGIL Observatory taxonomy. No legacy taxonomy fallback has been applied.</p>}
  </article>;
}

function ExplicitClassificationState({
  parsed,
  primary,
  taxonomyReferenceNumber,
  taxonomyReferenceHref,
}: {
  parsed: ParsedClassification;
  primary?: ResolvedClassification;
  taxonomyReferenceNumber?: number;
  taxonomyReferenceHref?: string;
}) {
  const familyDefinition = primary?.family?.family.definition;
  if (parsed.status === "family-only" && primary) return <>
    <ClassificationTable rows={[{ item: primary }]} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref={taxonomyReferenceHref} />
    <div className="vigil-classification-report-cards">
      <ClassificationCard
        item={primary}
        label="Primary failure family"
        status={parsed.status}
        taxonomyVersion={parsed.taxonomyVersion}
        relationship="Family only"
      />
    </div>
    <p className="vigil-case-empty">This Incident is classified to a canonical VIGIL Observatory failure family, but no canonical failure class has been assigned.</p>
  </>;
  if (parsed.status === "candidate-new-class") return <p className="vigil-case-empty">A new failure class has been identified as a candidate, but no immutable VIGIL Observatory class ID has been allocated. The Case File therefore does not present a provisional class as canonical.{familyDefinition ? ` The current family context is: ${familyDefinition}` : ""}</p>;
  if (parsed.status === "unmapped") return <p className="vigil-case-empty">No canonical VIGIL Observatory taxonomy mapping currently exists for this Incident. The record remains explicitly unmapped rather than being forced into a legacy or approximate class.</p>;
  if (parsed.status === "deferred") return <p className="vigil-case-empty">Taxonomy classification is explicitly deferred in the VIGIL Observatory record. No class is rendered until the structural classification review is completed.</p>;
  if (parsed.status === "requires-human-review") return <p className="vigil-case-empty">The Incident requires human taxonomy review. No canonical mechanism is presented until that review resolves the classification state.</p>;
  return <p className="vigil-case-empty">No VIGIL Observatory-native taxonomy classification is recorded for this Incident. Section 03 will populate when the Incident receives a canonical family/class mapping.</p>;
}

export function CaseTaxonomyClassification({ raw, taxonomyReferenceNumber, taxonomyReferenceHref }: Props) {
  const parsed = useMemo(() => parseClassification(raw), [raw]);
  const taxonomy = useTaxonomy();

  if (!parsed.status) return <ExplicitClassificationState parsed={parsed} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref={taxonomyReferenceHref} />;
  if (taxonomy.status === "loading") return <p className="vigil-case-empty">Resolving VIGIL Observatory taxonomy classification…</p>;
  if (taxonomy.status === "unavailable") return <p className="vigil-case-empty">The VIGIL Observatory taxonomy source is temporarily unavailable, so the canonical definition cannot be resolved. {taxonomy.message}</p>;

  const primary = resolveClassification(taxonomy.data, parsed.primary);
  const secondaries = parsed.secondary.map((item) => resolveClassification(taxonomy.data, item));
  const renderPrimary = parsed.status === "classified" || parsed.status === "provisionally-classified" || parsed.status === "classification-disputed";

  if (!renderPrimary) return <div className="vigil-taxonomy-classification-view">
    <ExplicitClassificationState parsed={parsed} primary={primary} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref={taxonomyReferenceHref} />
  </div>;

  const tableRows: ClassificationTableRow[] = [
    { item: primary },
    ...secondaries.map((item) => ({ item })),
  ];

  return <div className="vigil-taxonomy-classification-view">
    {parsed.status === "classification-disputed" && <p className="vigil-case-empty">This is the currently proposed taxonomy mapping for a disputed classification. It is shown for transparency and is not presented as settled.</p>}
    {parsed.status === "provisionally-classified" && <p className="vigil-case-empty">This taxonomy mapping is provisional. It is shown as the current structural assessment and may change after further review.</p>}

    <ClassificationTable rows={tableRows} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref={taxonomyReferenceHref} />

    <div className="vigil-classification-report-cards">
      <ClassificationCard
        item={primary}
        label={primary.role === "successful-invariant" ? "Primary successful invariant exemplar" : parsed.status === "classification-disputed" ? "Proposed primary structural mechanism" : "Primary structural mechanism"}
        status={parsed.status}
        taxonomyVersion={parsed.taxonomyVersion}
        relationship={primary.role === "successful-invariant" ? "Primary · successful invariant" : "Primary"}
        exemplar={primary.role === "successful-invariant"}
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
            label={item.role === "successful-invariant" ? `Secondary successful invariant exemplar ${index + 1}` : item.role === "ambiguous-boundary" ? `Secondary ambiguous boundary ${index + 1}` : `Secondary mechanism ${index + 1}`}
            status={parsed.status}
            taxonomyVersion={parsed.taxonomyVersion}
            relationship={item.role === "successful-invariant" ? "Secondary · successful invariant" : item.role === "ambiguous-boundary" ? "Secondary · ambiguous boundary" : "Secondary"}
            exemplar={item.role === "successful-invariant"}
          />)}
        </div>
      </section>}
    </div>
  </div>;
}

type RepairInvariant = {
  family?: FailureTaxonomyFamilyDocument["family"];
  class: FailureTaxonomyClass;
  relationship: "Primary" | "Secondary";
  role: "failure-occurrence" | "ambiguous-boundary";
  sourceUrl?: string;
};

// Repair surfaces both established failures and unresolved boundaries because both
// expose governing invariants that are decision-useful; successful invariants remain
// Classification evidence only and do not create repair work.
function governingClassInvariants(primary: ResolvedClassification, secondaries: ResolvedClassification[]): RepairInvariant[] {
  const result: RepairInvariant[] = [];
  const seen = new Set<string>();

  const add = (item: ResolvedClassification, relationship: RepairInvariant["relationship"]) => {
    if (item.role !== "failure-occurrence" && item.role !== "ambiguous-boundary") return;
    const classificationClass = item.class;
    if (!classificationClass || seen.has(classificationClass.class_id)) return;
    seen.add(classificationClass.class_id);
    result.push({
      family: item.family?.family,
      class: classificationClass,
      relationship,
      role: item.role,
      sourceUrl: item.sourceUrl,
    });
  };

  add(primary, "Primary");
  for (const secondary of secondaries) add(secondary, "Secondary");
  return result;
}

export function CaseTaxonomyRepair({ raw, taxonomyReferenceNumber, taxonomyReferenceHref }: Props) {
  const parsed = useMemo(() => parseClassification(raw), [raw]);
  const taxonomy = useTaxonomy();

  if (!parsed.status) return <p className="vigil-case-empty">No class invariant can be resolved because this Incident has no canonical taxonomy classification.</p>;
  if (taxonomy.status === "loading") return <p className="vigil-case-empty">Resolving class invariant from the VIGIL Observatory Adjudication Taxonomy…</p>;
  if (taxonomy.status === "unavailable") return <p className="vigil-case-empty">The VIGIL Observatory taxonomy source is temporarily unavailable, so the class invariant cannot be resolved. {taxonomy.message}</p>;

  const primary = resolveClassification(taxonomy.data, parsed.primary);
  const secondaries = parsed.secondary.map((item) => resolveClassification(taxonomy.data, item));
  const invariants = governingClassInvariants(primary, secondaries);

  if (!invariants.length) return <p className="vigil-case-empty">No repair invariant is available for this Case File.</p>;

  return <div className="vigil-taxonomy-repair-view">
    <div className="vigil-classification-web-table vigil-repair-web-table">
      <table className="vigil-classification-table vigil-repair-table">
        <thead>
          <tr>
            <th scope="col">Alignment</th>
            <th scope="col">Failure class</th>
            <th scope="col">Governing invariant</th>
          </tr>
        </thead>
        <tbody>
          {invariants.map(({ class: classificationClass, role }) => <tr key={classificationClass.class_id}>
            <td data-label="Alignment" className="vigil-classification-outcome-cell"><MappingOutcome role={role} /></td>
            <td data-label="Failure class">
              <strong>{classificationClass.name}</strong>
              <span className="vigil-classification-id">{classificationClass.class_id}</span>
            </td>
            <td data-label="Governing invariant" className="vigil-repair-invariant-cell">
              {classificationClass.invariant ?? "A class-level invariant has not yet been published for this failure class. The broader family invariant is not substituted here."}
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {taxonomyReferenceNumber && taxonomyReferenceHref ? <p className="vigil-taxonomy-reference-note">The governing invariants shown here are defined in the <a href={taxonomyReferenceHref}>VIGIL Observatory Adjudication Taxonomy [{taxonomyReferenceNumber}]</a>.</p> : null}
    <VigilAlignmentLegend />
  </div>;
}