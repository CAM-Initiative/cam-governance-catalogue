import { loadFailureTaxonomy, type FailureTaxonomyDataset, type FailureTaxonomyExternalReference } from "@/lib/vigilFailureTaxonomy";
import type { UnknownRecord } from "@/lib/vigilRegistry";

export type TaxonomyClassificationStatus =
  | "classified"
  | "provisionally-classified"
  | "classification-disputed"
  | "requires-human-review"
  | "unclassified"
  | "family-only"
  | "candidate-new-class"
  | "unmapped"
  | "deferred";

export type TaxonomyClassificationRole =
  | "failure-occurrence"
  | "successful-invariant"
  | "ambiguous-boundary";

export type AdjudicationCoverageStatus = "complete" | "partial";

export type TaxonomyReferenceTarget = {
  id: string;
  title: string;
  url: string;
  familyId: string;
  relationship: "primary" | "secondary" | "family-only";
  role?: TaxonomyClassificationRole;
  taxonomyVersion?: string;
  referenceVersion?: string;
  referencePublicationDate?: string;
  externalReferences: FailureTaxonomyExternalReference[];
};

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function taxonomyClassification(record: UnknownRecord) {
  return isObject(record.taxonomy_classification) ? record.taxonomy_classification : undefined;
}

function taxonomyClassificationSummary(record: UnknownRecord) {
  return isObject(record.taxonomy_classification_summary) ? record.taxonomy_classification_summary : undefined;
}

export function taxonomyAdjudicationCoverageStatus(record: UnknownRecord): AdjudicationCoverageStatus | undefined {
  const directCoverage = isObject(record.adjudication_coverage) ? record.adjudication_coverage : undefined;
  const classification = taxonomyClassification(record);
  const nestedCoverage = classification && isObject(classification.adjudication_coverage)
    ? classification.adjudication_coverage
    : undefined;
  const status = text(directCoverage?.status ?? nestedCoverage?.status);
  return status === "complete" || status === "partial" ? status : undefined;
}

export function taxonomyAlignmentExemplarEligible(record: UnknownRecord): boolean | undefined {
  if (typeof record.alignment_exemplar_eligible === "boolean") return record.alignment_exemplar_eligible;
  const coverage = taxonomyAdjudicationCoverageStatus(record);
  if (!coverage) return undefined;
  const roles = incidentMappingRoles(record);
  return coverage === "complete"
    && roles.includes("successful-invariant")
    && !roles.includes("failure-occurrence")
    && !roles.includes("ambiguous-boundary");
}


function mappingRole(value: unknown, fallback?: TaxonomyClassificationRole) {
  if (!isObject(value)) return fallback;
  return (text(value.classification_role) as TaxonomyClassificationRole | undefined) ?? fallback;
}

function mappingRoles(container: UnknownRecord, fallback?: TaxonomyClassificationRole) {
  const roles: TaxonomyClassificationRole[] = [];
  const primary = isObject(container.primary_classification) ? container.primary_classification : undefined;
  if (primary) roles.push(mappingRole(primary, fallback ?? "failure-occurrence") ?? "failure-occurrence");
  if (Array.isArray(container.secondary_classifications)) {
    for (const item of container.secondary_classifications) {
      if (!isObject(item)) continue;
      roles.push(mappingRole(item, fallback ?? "failure-occurrence") ?? "failure-occurrence");
    }
  }
  return roles;
}

function incidentMappingRoles(record: UnknownRecord) {
  const directFallback = text(record.classification_role) as TaxonomyClassificationRole | undefined;
  const hasDirectPrimary = isObject(record.primary_classification);
  const hasDirectSecondary = Array.isArray(record.secondary_classifications)
    && record.secondary_classifications.some((item) => isObject(item));

  if (hasDirectPrimary || hasDirectSecondary) {
    return mappingRoles(record, directFallback ?? "failure-occurrence");
  }

  const classification = taxonomyClassification(record);
  if (classification) {
    const fallback = text(classification.classification_role) as TaxonomyClassificationRole | undefined;
    return mappingRoles(classification, fallback ?? "failure-occurrence");
  }

  return directFallback ? [directFallback] : [];
}

const ADJUDICATION_INCOMPLETE_SUFFIX = " · adjudication incomplete";

function withAdjudicationCoverage(label: string, coverage?: AdjudicationCoverageStatus) {
  return coverage === "partial" ? `${label}${ADJUDICATION_INCOMPLETE_SUFFIX}` : label;
}

function incidentClassificationLabel(
  status: TaxonomyClassificationStatus | undefined,
  roles: TaxonomyClassificationRole[],
  fallbackRole?: TaxonomyClassificationRole,
  coverage?: AdjudicationCoverageStatus,
  exemplarEligible?: boolean,
) {
  if (status === "classification-disputed") return withAdjudicationCoverage("Disputed", coverage);
  if (status === "requires-human-review") return withAdjudicationCoverage("Under review", coverage);
  if (status === "unclassified") return withAdjudicationCoverage("Unclassified", coverage);

  const hasFailure = roles.includes("failure-occurrence");
  const hasInvariantHeld = roles.includes("successful-invariant");
  const hasAmbiguousBoundary = roles.includes("ambiguous-boundary");
  if (hasAmbiguousBoundary || (hasFailure && hasInvariantHeld)) return withAdjudicationCoverage("Combination", coverage);
  if (hasInvariantHeld && !hasFailure) {
    if (coverage === "partial") return withAdjudicationCoverage("Invariant held", coverage);
    if (exemplarEligible === true) return "Exemplar";
    return "Invariant held";
  }
  if (hasFailure && !hasInvariantHeld) return withAdjudicationCoverage("Classified", coverage);

  if (fallbackRole === "successful-invariant") {
    if (coverage === "partial") return withAdjudicationCoverage("Invariant held", coverage);
    if (exemplarEligible === true) return "Exemplar";
    return "Invariant held";
  }
  if (status === "classified" || status === "provisionally-classified") return withAdjudicationCoverage("Classified", coverage);
  return withAdjudicationCoverage("Unclassified", coverage);
}

function classLabel(value: unknown) {
  if (!isObject(value)) return undefined;
  return text(value.class_name) ?? text(value.name) ?? text(value.class_code) ?? text(value.class_id);
}

function familyLabel(value: unknown) {
  if (!isObject(value)) return undefined;
  return text(value.family_name) ?? text(value.name) ?? text(value.family_code) ?? text(value.family_id);
}

export function taxonomyAlignmentOutcomeLabel(record: UnknownRecord) {
  const status = taxonomyFailureTypeLabel(record);
  const incomplete = status.endsWith(ADJUDICATION_INCOMPLETE_SUFFIX);
  const baseStatus = incomplete ? status.slice(0, -ADJUDICATION_INCOMPLETE_SUFFIX.length) : status;
  const publicLabel = baseStatus === "Classified"
    ? "Failure evidenced"
    : baseStatus === "Exemplar"
      ? "Invariant held"
      : baseStatus === "Combination"
        ? "Mixed alignment"
        : baseStatus;
  return incomplete ? `${publicLabel}${ADJUDICATION_INCOMPLETE_SUFFIX}` : publicLabel;
}

export function taxonomyFailureTypeLabel(record: UnknownRecord) {
  const directStatus = text(record.classification_status) as TaxonomyClassificationStatus | undefined;
  const directRole = text(record.classification_role) as TaxonomyClassificationRole | undefined;
  if (record.record_type === "incident" && directStatus) {
    return incidentClassificationLabel(
      directStatus,
      incidentMappingRoles(record),
      directRole,
      taxonomyAdjudicationCoverageStatus(record),
      taxonomyAlignmentExemplarEligible(record),
    );
  }

  const classification = taxonomyClassification(record);
  if (classification) {
    const status = text(classification.classification_status) as TaxonomyClassificationStatus | undefined;
    const role = text(classification.classification_role) as TaxonomyClassificationRole | undefined;
    if (record.record_type === "incident") {
      return incidentClassificationLabel(
        status,
        incidentMappingRoles(record),
        role,
        taxonomyAdjudicationCoverageStatus(record),
        taxonomyAlignmentExemplarEligible(record),
      );
    }
    const primaryClass = classLabel(classification.primary_class);
    if (primaryClass) return primaryClass;

    const primaryFamily = familyLabel(classification.primary_family);
    if (status === "family-only" && primaryFamily) return `${primaryFamily} · Family only`;
    if (status === "candidate-new-class") return primaryFamily ? `${primaryFamily} · Candidate new class` : "Candidate new class";
    if (status === "unmapped") return "Unmapped";
    if (status === "deferred") return "Deferred";
    if (status === "classification-disputed") return "Classification disputed";
    if (status === "requires-human-review") return "Requires human review";
    if (status === "classified") return "Classified";
    return primaryFamily ?? "Not classified";
  }

  const summary = taxonomyClassificationSummary(record);
  const status = text(summary?.classification_status) as TaxonomyClassificationStatus | undefined;
  const role = text(summary?.classification_role) as TaxonomyClassificationRole | undefined;
  if (record.record_type === "incident") {
    return incidentClassificationLabel(
      status,
      [],
      role,
      taxonomyAdjudicationCoverageStatus(record),
      taxonomyAlignmentExemplarEligible(record),
    );
  }
  if (role === "successful-invariant") return "Invariant held";
  if (status === "classified" || status === "provisionally-classified") return "Classified";
  if (status === "classification-disputed") return "Classification disputed";
  if (status === "requires-human-review") return "Requires human review";
  if (status === "family-only") return "Family only";
  if (status === "candidate-new-class") return "Candidate new class";
  if (status === "unmapped") return "Unmapped";
  if (status === "deferred") return "Deferred";
  return "Not classified";
}

function familyId(value: unknown) {
  return isObject(value) ? text(value.family_id) : undefined;
}

function classId(value: unknown) {
  return isObject(value) ? text(value.class_id) : undefined;
}

function resolveFamilyFile(dataset: FailureTaxonomyDataset, targetFamilyId?: string) {
  if (!targetFamilyId) return undefined;
  return dataset.index.families.find((entry) => entry.family_id === targetFamilyId);
}

function resolveClass(dataset: FailureTaxonomyDataset, targetClassId: string) {
  for (const family of dataset.families) {
    const match = family.classes.find((entry) => entry.class_id === targetClassId);
    if (match) return match;
  }
  return undefined;
}

export function taxonomyReferenceTargets(record: UnknownRecord, dataset: FailureTaxonomyDataset): TaxonomyReferenceTarget[] {
  const classification = taxonomyClassification(record);
  if (!classification) return [];

  const references: TaxonomyReferenceTarget[] = [];
  const taxonomyVersion = text(classification.taxonomy_version);
  const seen = new Set<string>();
  const add = (relationship: TaxonomyReferenceTarget["relationship"], familyValue: unknown, classValue?: unknown, role?: TaxonomyClassificationRole) => {
    const targetFamilyId = familyId(familyValue);
    const targetClassId = classId(classValue);
    const indexEntry = resolveFamilyFile(dataset, targetFamilyId);
    if (!targetFamilyId || !indexEntry) return;

    const id = targetClassId ?? targetFamilyId;
    const key = `${relationship}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);

    const resolvedClass = targetClassId ? resolveClass(dataset, targetClassId) : undefined;
    const title = targetClassId
      ? resolvedClass?.name ?? classLabel(classValue) ?? targetClassId
      : familyLabel(familyValue) ?? indexEntry.name;
    references.push({
      id,
      title,
      url: `${dataset.sourceRoot}/${indexEntry.file}`,
      familyId: targetFamilyId,
      relationship,
      role,
      taxonomyVersion,
      referenceVersion: dataset.index.standard.version,
      referencePublicationDate: dataset.index.standard.publication_date ?? undefined,
      externalReferences: resolvedClass?.external_references ?? [],
    });
  };

  const status = text(classification.classification_status) as TaxonomyClassificationStatus | undefined;
  const role = text(classification.classification_role) as TaxonomyClassificationRole | undefined;
  const incidentPrimary = isObject(classification.primary_classification) ? classification.primary_classification : undefined;
  const primaryRole = mappingRole(incidentPrimary, role ?? "failure-occurrence") ?? "failure-occurrence";
  if (["classified", "provisionally-classified", "classification-disputed"].includes(status ?? "") && incidentPrimary) {
    add("primary", incidentPrimary, incidentPrimary, primaryRole);
  } else if (status === "classified") {
    add("primary", classification.primary_family, classification.primary_class, role ?? "failure-occurrence");
  } else if (status === "family-only") {
    add("family-only", classification.primary_family, undefined, role);
  }

  if (Array.isArray(classification.secondary_classifications)) {
    for (const item of classification.secondary_classifications) {
      if (!isObject(item)) continue;
      const secondaryRole = mappingRole(item, role ?? "failure-occurrence") ?? "failure-occurrence";
      if (item.family_id || item.class_id) add("secondary", item, item, secondaryRole);
      else add("secondary", item.family, item.class, secondaryRole);
    }
  }
  return references;
}

export async function loadTaxonomyReferenceTargets(record: UnknownRecord) {
  const result = await loadFailureTaxonomy();
  if (result.status !== "ready") return [];
  return taxonomyReferenceTargets(record, result.data);
}
