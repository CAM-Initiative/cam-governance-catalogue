import { useEffect, useMemo, useState } from "react";
import { Check, CircleMinus, X } from "lucide-react";
import {
  loadFailureTaxonomy,
  type FailureTaxonomyClass,
  type FailureTaxonomyDataset,
  type FailureTaxonomyFamilyDocument,
} from "@/lib/vigilFailureTaxonomy";
import type { UnknownRecord } from "@/lib/vigilRegistry";
import type { ExternalAssessment } from "@/lib/vigilExternalAssessments";

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

type ClassificationEvidence = {
  sourceAnchor?: string;
  sourceParaphrase?: string;
  recoveredInvariant?: string;
  relationship?: string;
  canonical: boolean;
  rationale?: string;
};

type ClassificationTableRow = {
  item: ResolvedClassification;
  mapping: "Primary" | "Secondary";
  evidence: ClassificationEvidence[];
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

function classificationEvidenceByClass(raw: UnknownRecord) {
  const result = new Map<string, ClassificationEvidence[]>();
  const vigilAssessment = isObject(raw.vigil_assessment) ? raw.vigil_assessment : undefined;
  const sourceClauseAnalysis = vigilAssessment && isObject(vigilAssessment.source_clause_analysis)
    ? vigilAssessment.source_clause_analysis
    : undefined;
  const clauses = sourceClauseAnalysis && Array.isArray(sourceClauseAnalysis.clauses)
    ? sourceClauseAnalysis.clauses
    : [];

  for (const clause of clauses) {
    if (!isObject(clause)) continue;
    const sourceAnchor = text(clause.source_anchor);
    const sourceParaphrase = text(clause.source_paraphrase);
    const recoveredInvariant = text(clause.recovered_invariant_interpretation);
    const relationships = Array.isArray(clause.taxonomy_relationships) ? clause.taxonomy_relationships : [];

    for (const value of relationships) {
      if (!isObject(value)) continue;
      const classId = text(value.class_id);
      if (!classId) continue;
      const evidence: ClassificationEvidence = {
        sourceAnchor,
        sourceParaphrase,
        recoveredInvariant,
        relationship: text(value.relationship),
        canonical: value.canonical_taxonomy_mapping === true,
        rationale: text(value.rationale),
      };
      const existing = result.get(classId);
      if (existing) existing.push(evidence);
      else result.set(classId, [evidence]);
    }
  }
  return result;
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
  { role: "failure-occurrence" as const, label: "Failure occurred", description: "The available evidence supports failure at the mapped governance boundary in this occurrence." },
  { role: "successful-invariant" as const, label: "Invariant held", description: "The relevant governance boundary was tested and held; this mapping records an invariant-held alignment outcome." },
  { role: "ambiguous-boundary" as const, label: "Boundary unresolved", description: "The evidence engages the boundary but does not establish either failure or invariant holding." },
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

export function ExternalAlignmentClassification({ assessments }: { assessments: ExternalAssessment[] }) {
  const classified = assessments.filter((assessment) => assessment.classificationOrRating);
  if (!classified.length) return null;

  return <section className="vigil-external-alignment-classification" aria-labelledby="external-alignment-classification-heading">
    <div className="vigil-case-subheading">
      <h3 className="vigil-case-editorial-subheading" id="external-alignment-classification-heading">External Alignment Classification</h3>
      <p>Published external classifications are shown in the assessor's own terminology. They are not VIGIL taxonomy mappings and are not translated into VIGIL alignment roles.</p>
    </div>
    <div className="vigil-classification-web-table vigil-external-alignment-classification-table" role="region" aria-label="External alignment classifications" tabIndex={0}>
      <table className="vigil-classification-table">
        <caption className="sr-only">External assessor classifications shown in their original schemes and terminology.</caption>
        <thead>
          <tr>
            <th scope="col">Assessor</th>
            <th scope="col">External classification</th>
            <th scope="col">Scheme</th>
            <th scope="col">Published basis / conclusion</th>
          </tr>
        </thead>
        <tbody>
          {classified.map((assessment) => {
            const classification = assessment.classificationOrRating!;
            return <tr key={assessment.id}>
              <td data-label="Assessor"><a href={assessment.url} target="_blank" rel="noreferrer"><strong>{assessment.assessor}</strong></a></td>
              <td data-label="External classification"><strong>{classification.verbatimLabel ?? classification.value}</strong></td>
              <td data-label="Scheme">
                {classification.scheme}
                {classification.schemeVersion ? <span className="vigil-classification-id">Version {classification.schemeVersion}</span> : null}
              </td>
              <td data-label="Published basis / conclusion" className="vigil-classification-basis">
                {classification.basis ?? assessment.summary}
                {classification.sourceLocator ? <span className="vigil-classification-id">{classification.sourceLocator}</span> : null}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </section>;
}

// Web UX shows the alignment state, the meaning of the mapped class, and the
// occurrence-specific reason for applying it. Primary/secondary ordering remains
// in canonical data and report metadata.
function ClassificationEvidenceStack({
  values,
  empty,
}: {
  values: Array<string | undefined>;
  empty: string;
}) {
  const cleaned = values.flatMap((value) => value ? [value] : []);
  if (!cleaned.length) return <span>{empty}</span>;
  return <div className="vigil-classification-evidence-stack">
    {cleaned.map((value, index) => <div className="vigil-classification-evidence-item" key={`${index}-${value.slice(0, 40)}`}>{value}</div>)}
  </div>;
}

function classificationEvidenceSource(entry: ClassificationEvidence) {
  if (entry.sourceAnchor && entry.sourceParaphrase) return `${entry.sourceAnchor} — ${entry.sourceParaphrase}`;
  return entry.sourceAnchor ?? entry.sourceParaphrase;
}

function ClassificationTable({
  rows,
  taxonomyReferenceNumber,
  taxonomyReferenceHref,
}: {
  rows: ClassificationTableRow[];
  taxonomyReferenceNumber?: number;
  taxonomyReferenceHref?: string;
}) {
  const hasUnresolved = rows.some(({ item }) =>
    (item.classId && !item.class) || (item.familyId && !item.family)
  );

  return <>
    <div className="vigil-classification-web-table vigil-primary-classification-table-wrap" role="region" aria-label="VIGIL Observatory alignment classifications" tabIndex={0}>
      <table className="vigil-classification-table vigil-primary-classification-table">
        <caption className="sr-only">Canonical Alignment Taxonomy mappings with the occurrence-specific evidence bridge repeated from the Incident breakdown.</caption>
        <thead>
          <tr>
            <th scope="col">Alignment</th>
            <th scope="col">Fidelity family</th>
            <th scope="col">Fidelity class</th>
            <th scope="col">Source clause(s)</th>
            <th scope="col">Recovered governance principle(s)</th>
            <th scope="col">Incident analysis</th>
            <th scope="col">Classification basis</th>
            <th scope="col">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item, mapping, evidence }, index) => {
            const family = item.family?.family;
            const classificationClass = item.class;
            const classId = classificationClass?.class_id ?? item.classId;
            const outcome = mappingOutcome(item.role);
            const sourceClauses = evidence.map(classificationEvidenceSource);
            const recoveredPrinciples = evidence.map((entry) => entry.recoveredInvariant);
            const incidentAnalysis = evidence.map((entry) => entry.rationale);

            return <tr key={`${mapping}-${classId ?? index}-${item.role ?? "failure-occurrence"}`}>
              <td data-label="Alignment" className="vigil-classification-outcome-cell">
                <span className="vigil-classification-outcome-detail">
                  <MappingOutcome role={item.role} />
                  <strong>{outcome.label}</strong>
                </span>
              </td>
              <td data-label="Fidelity family">
                <strong>{family?.name ?? (item.familyId ? "Unresolved fidelity family" : "No fidelity family assigned")}</strong>
                {(family?.family_id ?? item.familyId) ? <span className="vigil-classification-id">{family?.family_id ?? item.familyId}</span> : null}
              </td>
              <td data-label="Fidelity class">
                <strong>{classificationClass?.name ?? (classId ? "Unresolved fidelity class" : "No canonical class assigned")}</strong>
                {classId && <span className="vigil-classification-id">{classId}</span>}
              </td>
              <td data-label="Source clause(s)">
                <ClassificationEvidenceStack values={sourceClauses} empty="No clause-level source wording is linked to this mapping." />
              </td>
              <td data-label="Recovered governance principle(s)">
                <ClassificationEvidenceStack values={recoveredPrinciples} empty="No clause-level recovered governance principle is linked to this mapping." />
              </td>
              <td data-label="Incident analysis" className="vigil-classification-incident-analysis">
                <ClassificationEvidenceStack values={incidentAnalysis} empty={item.basis ?? "No separate occurrence-specific incident analysis is linked to this mapping."} />
              </td>
              <td data-label="Classification basis" className="vigil-classification-basis">
                {item.basis ?? "No separate alignment-classification basis is published for this mapping."}
              </td>
              <td data-label="Confidence">{item.confidence ?? "Not separately stated"}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    <VigilAlignmentLegend />
    {taxonomyReferenceNumber && taxonomyReferenceHref ? <p className="vigil-taxonomy-reference-note">Fidelity families and classes are defined in the <a href={taxonomyReferenceHref}>VIGIL Observatory Alignment Taxonomy [{taxonomyReferenceNumber}]</a>. Source clauses, recovered governance principles and Incident analysis are repeated here from the Section 02 Incident breakdown so the evidence-to-classification bridge remains visible.</p> : null}
    {hasUnresolved && <p className="vigil-case-empty">The Incident contains an immutable taxonomy identifier that is not present in the current published VIGIL Observatory taxonomy. No legacy taxonomy fallback has been applied.</p>}
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
          <h4 className="vigil-substantive-label">{exemplar ? "Governance boundary this exemplar tests" : "What this failure means"}</h4>
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
          <Meta label="Fidelity family" value={family?.name} />
          <Meta label="Family ID" value={family?.family_id ?? item.familyId} mono />
          <Meta label="Family code" value={family?.family_code} mono />
          <Meta label="Fidelity class" value={classificationClass?.name} />
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
    <ClassificationTable rows={[{ item: primary, mapping: "Primary", evidence: [] }]} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref={taxonomyReferenceHref} />
    <div className="vigil-classification-report-cards">
      <ClassificationCard
        item={primary}
        label="Primary fidelity family"
        status={parsed.status}
        taxonomyVersion={parsed.taxonomyVersion}
        relationship="Family only"
      />
    </div>
    <p className="vigil-case-empty">This Incident is classified to a canonical VIGIL Observatory fidelity family, but no canonical fidelity class has been assigned.</p>
  </>;
  if (parsed.status === "candidate-new-class") return <p className="vigil-case-empty">A new fidelity class has been identified as a candidate, but no immutable VIGIL Observatory class ID has been allocated. The Case File therefore does not present a provisional class as canonical.{familyDefinition ? ` The current family context is: ${familyDefinition}` : ""}</p>;
  if (parsed.status === "unmapped") return <p className="vigil-case-empty">No canonical VIGIL Observatory taxonomy mapping currently exists for this Incident. The record remains explicitly unmapped rather than being forced into a legacy or approximate class.</p>;
  if (parsed.status === "deferred") return <p className="vigil-case-empty">Alignment classification is explicitly deferred in the VIGIL Observatory record. No class is rendered until the structural classification review is completed.</p>;
  if (parsed.status === "requires-human-review") return <p className="vigil-case-empty">The Incident requires human taxonomy review. No canonical mechanism is presented until that review resolves the classification state.</p>;
  return <p className="vigil-case-empty">No VIGIL Observatory Alignment Taxonomy classification is recorded for this Incident. Section 03 will populate when the Incident receives a canonical family/class mapping.</p>;
}

export function CaseTaxonomyClassification({ raw, taxonomyReferenceNumber, taxonomyReferenceHref }: Props) {
  const parsed = useMemo(() => parseClassification(raw), [raw]);
  const evidenceByClass = useMemo(() => classificationEvidenceByClass(raw), [raw]);
  const taxonomy = useTaxonomy();

  if (!parsed.status) return <ExplicitClassificationState parsed={parsed} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref={taxonomyReferenceHref} />;
  if (taxonomy.status === "loading") return <p className="vigil-case-empty">Resolving VIGIL Observatory alignment classification…</p>;
  if (taxonomy.status === "unavailable") return <p className="vigil-case-empty">The VIGIL Observatory taxonomy source is temporarily unavailable, so the canonical definition cannot be resolved. {taxonomy.message}</p>;

  const primary = resolveClassification(taxonomy.data, parsed.primary);
  const secondaries = parsed.secondary.map((item) => resolveClassification(taxonomy.data, item));
  const renderPrimary = parsed.status === "classified" || parsed.status === "provisionally-classified" || parsed.status === "classification-disputed";

  if (!renderPrimary) return <div className="vigil-taxonomy-classification-view">
    <ExplicitClassificationState parsed={parsed} primary={primary} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref={taxonomyReferenceHref} />
  </div>;

  const tableRows: ClassificationTableRow[] = [
    { item: primary, mapping: "Primary", evidence: primary.classId ? evidenceByClass.get(primary.classId) ?? [] : [] },
    ...secondaries.map((item) => ({
      item,
      mapping: "Secondary" as const,
      evidence: item.classId ? evidenceByClass.get(item.classId) ?? [] : [],
    })),
  ];

  return <div className="vigil-taxonomy-classification-view">
    {parsed.status === "classification-disputed" && <p className="vigil-case-empty">This is the currently proposed taxonomy mapping for a disputed classification. It is shown for transparency and is not presented as settled.</p>}
    {parsed.status === "provisionally-classified" && <p className="vigil-case-empty">This taxonomy mapping is provisional. It is shown as the current structural assessment and may change after further review.</p>}

    <ClassificationTable rows={tableRows} taxonomyReferenceNumber={taxonomyReferenceNumber} taxonomyReferenceHref={taxonomyReferenceHref} />

    <div className="vigil-classification-report-cards">
      <ClassificationCard
        item={primary}
        label={primary.role === "successful-invariant" ? "Primary alignment exemplar · invariant held" : parsed.status === "classification-disputed" ? "Proposed primary structural mechanism" : "Primary structural mechanism"}
        status={parsed.status}
        taxonomyVersion={parsed.taxonomyVersion}
        relationship={primary.role === "successful-invariant" ? "Primary · invariant held" : "Primary"}
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
            label={item.role === "successful-invariant" ? `Secondary alignment exemplar · invariant held ${index + 1}` : item.role === "ambiguous-boundary" ? `Secondary unresolved boundary ${index + 1}` : `Secondary mechanism ${index + 1}`}
            status={parsed.status}
            taxonomyVersion={parsed.taxonomyVersion}
            relationship={item.role === "successful-invariant" ? "Secondary · invariant held" : item.role === "ambiguous-boundary" ? "Secondary · boundary unresolved" : "Secondary"}
            exemplar={item.role === "successful-invariant"}
          />)}
        </div>
      </section>}
    </div>
  </div>;
}

type ComplianceReference = NonNullable<FailureTaxonomyClass["external_references"]>[number];

type ComplianceMapping = {
  class: FailureTaxonomyClass;
  role: "failure-occurrence" | "ambiguous-boundary";
  references: ComplianceReference[];
};

function complianceReference(reference: ComplianceReference) {
  const role = reference.reference_role ?? "";
  return Boolean(reference.requirement_id)
    || role === "regulatory-evidence"
    || role === "standards-evidence"
    || role === "authoritative-guidance";
}

function complianceMappings(primary: ResolvedClassification, secondaries: ResolvedClassification[]): ComplianceMapping[] {
  const result: ComplianceMapping[] = [];
  const seen = new Set<string>();

  const add = (item: ResolvedClassification) => {
    if (item.role !== "failure-occurrence" && item.role !== "ambiguous-boundary") return;
    const classificationClass = item.class;
    if (!classificationClass || seen.has(classificationClass.class_id)) return;
    seen.add(classificationClass.class_id);
    result.push({
      class: classificationClass,
      role: item.role,
      references: (classificationClass.external_references ?? []).filter(complianceReference),
    });
  };

  add(primary);
  for (const secondary of secondaries) add(secondary);
  return result;
}

function referenceRoleLabel(role?: string) {
  if (!role) return undefined;
  return role
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function CaseTaxonomyCompliance({ raw, taxonomyReferenceNumber, taxonomyReferenceHref }: Props) {
  const parsed = useMemo(() => parseClassification(raw), [raw]);
  const taxonomy = useTaxonomy();

  if (!parsed.status) return <p className="vigil-case-empty">No compliance crosswalk can be resolved because this Incident has no canonical alignment classification.</p>;
  if (taxonomy.status === "loading") return <p className="vigil-case-empty">Resolving external requirement cross-references from the VIGIL Observatory Alignment Taxonomy…</p>;
  if (taxonomy.status === "unavailable") return <p className="vigil-case-empty">The VIGIL Observatory taxonomy source is temporarily unavailable, so its external requirement cross-references cannot be resolved. {taxonomy.message}</p>;

  const primary = resolveClassification(taxonomy.data, parsed.primary);
  const secondaries = parsed.secondary.map((item) => resolveClassification(taxonomy.data, item));
  const mappings = complianceMappings(primary, secondaries);

  if (!mappings.length) return <p className="vigil-case-empty">No failed or unresolved Fidelity Class is available for external requirement cross-reference in this Case File.</p>;

  return <div className="vigil-taxonomy-compliance-view">
    <p className="vigil-compliance-intro">The mappings below project the failed or unresolved Fidelity Classes from Classification into the standards, regulatory requirements and authoritative governance guidance already cross-referenced by the VIGIL Alignment Taxonomy.</p>
    <div className="vigil-classification-web-table vigil-compliance-web-table" role="region" aria-label="External compliance crosswalk" tabIndex={0}>
      <table className="vigil-classification-table vigil-compliance-table">
        <caption className="sr-only">External standards, regulatory requirements and authoritative guidance cross-referenced from the mapped VIGIL Fidelity Classes.</caption>
        <thead>
          <tr>
            <th scope="col">Alignment</th>
            <th scope="col">Fidelity class</th>
            <th scope="col">Mapped external requirements</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map(({ class: classificationClass, role, references }) => <tr key={classificationClass.class_id}>
            <td data-label="Alignment" className="vigil-classification-outcome-cell"><MappingOutcome role={role} /></td>
            <td data-label="Fidelity class">
              <strong>{classificationClass.name}</strong>
              <span className="vigil-classification-id">{classificationClass.class_id}</span>
            </td>
            <td data-label="Mapped external requirements" className="vigil-compliance-references-cell">
              {references.length ? <div className="vigil-compliance-reference-list">
                {references.map((reference, index) => {
                  const meta = [
                    reference.publisher,
                    reference.date,
                    reference.clause_or_control,
                    referenceRoleLabel(reference.reference_role),
                  ].filter(Boolean);
                  return <article className="vigil-compliance-reference" key={reference.requirement_id ?? `${reference.title}-${reference.url ?? index}`}>
                    <strong className="vigil-compliance-reference-title">
                      {reference.url ? <a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a> : reference.title}
                    </strong>
                    {meta.length ? <span className="vigil-compliance-reference-meta">{meta.join(" · ")}</span> : null}
                    {reference.requirement_id ? <span className="vigil-compliance-requirement-id">{reference.requirement_id}</span> : null}
                    {reference.evidence_note ? <p>{reference.evidence_note}</p> : null}
                  </article>;
                })}
              </div> : <span className="vigil-compliance-gap">No structured standards, regulatory or authoritative-guidance cross-reference is currently published for this Fidelity Class.</span>}
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {taxonomyReferenceNumber && taxonomyReferenceHref ? <p className="vigil-taxonomy-reference-note">These external requirement mappings are maintained with the relevant Fidelity Classes in the <a href={taxonomyReferenceHref}>VIGIL Observatory Alignment Taxonomy [{taxonomyReferenceNumber}]</a>. This section is a cross-reference of the Classification findings above, not a second Incident adjudication.</p> : null}
  </div>;
}

