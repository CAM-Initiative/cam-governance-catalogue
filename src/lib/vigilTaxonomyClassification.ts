import { loadFailureTaxonomy, type FailureTaxonomyDataset } from "@/lib/vigilFailureTaxonomy";
import type { UnknownRecord } from "@/lib/vigilRegistry";

export type TaxonomyClassificationStatus = "classified" | "provisionally-classified" | "unclassified" | "family-only" | "candidate-new-class" | "unmapped" | "deferred";

export type TaxonomyReferenceTarget = {
  id: string;
  title: string;
  url: string;
  familyId: string;
  relationship: "primary" | "secondary" | "family-only";
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

function classLabel(value: unknown) {
  if (!isObject(value)) return undefined;
  return text(value.class_name) ?? text(value.name) ?? text(value.class_code) ?? text(value.class_id);
}

function familyLabel(value: unknown) {
  if (!isObject(value)) return undefined;
  return text(value.family_name) ?? text(value.name) ?? text(value.family_code) ?? text(value.family_id);
}

export function taxonomyFailureTypeLabel(record: UnknownRecord) {
  const classification = taxonomyClassification(record);
  if (classification) {
    const status = text(classification.classification_status) as TaxonomyClassificationStatus | undefined;
    if (record.record_type === "incident") {
      return status === "classified" || status === "provisionally-classified" ? "Classified" : "Unclassified";
    }
    const primaryClass = classLabel(classification.primary_class);
    if (primaryClass) return primaryClass;

    const primaryFamily = familyLabel(classification.primary_family);
    if (status === "family-only" && primaryFamily) return `${primaryFamily} · Family only`;
    if (status === "candidate-new-class") return primaryFamily ? `${primaryFamily} · Candidate new class` : "Candidate new class";
    if (status === "unmapped") return "Unmapped";
    if (status === "deferred") return "Deferred";
    if (status === "classified") return "Classified";
    return primaryFamily ?? "Not classified";
  }

  const summary = taxonomyClassificationSummary(record);
  const status = text(summary?.classification_status) as TaxonomyClassificationStatus | undefined;
  if (status === "classified") return "Classified";
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

function resolveClassTitle(dataset: FailureTaxonomyDataset, targetClassId: string) {
  for (const family of dataset.families) {
    const match = family.classes.find((entry) => entry.class_id === targetClassId);
    if (match) return match.name;
  }
  return undefined;
}

export function taxonomyReferenceTargets(record: UnknownRecord, dataset: FailureTaxonomyDataset): TaxonomyReferenceTarget[] {
  const classification = taxonomyClassification(record);
  if (!classification) return [];

  const references: TaxonomyReferenceTarget[] = [];
  const seen = new Set<string>();
  const add = (relationship: TaxonomyReferenceTarget["relationship"], familyValue: unknown, classValue?: unknown) => {
    const targetFamilyId = familyId(familyValue);
    const targetClassId = classId(classValue);
    const indexEntry = resolveFamilyFile(dataset, targetFamilyId);
    if (!targetFamilyId || !indexEntry) return;

    const id = targetClassId ?? targetFamilyId;
    const key = `${relationship}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);

    const title = targetClassId
      ? resolveClassTitle(dataset, targetClassId) ?? classLabel(classValue) ?? targetClassId
      : familyLabel(familyValue) ?? indexEntry.name;
    references.push({
      id,
      title,
      url: `${dataset.sourceRoot}/${indexEntry.file}`,
      familyId: targetFamilyId,
      relationship,
    });
  };

  const status = text(classification.classification_status) as TaxonomyClassificationStatus | undefined;
  const incidentPrimary = isObject(classification.primary_classification) ? classification.primary_classification : undefined;
  if ((status === "classified" || status === "provisionally-classified") && incidentPrimary) add("primary", incidentPrimary, incidentPrimary);
  else if (status === "classified") add("primary", classification.primary_family, classification.primary_class);
  else if (status === "family-only") add("family-only", classification.primary_family);

  if (Array.isArray(classification.secondary_classifications)) {
    for (const item of classification.secondary_classifications) {
      if (!isObject(item)) continue;
      if (item.family_id || item.class_id) add("secondary", item, item);
      else add("secondary", item.family, item.class);
    }
  }
  return references;
}

export async function loadTaxonomyReferenceTargets(record: UnknownRecord) {
  const result = await loadFailureTaxonomy();
  if (result.status !== "ready") return [];
  return taxonomyReferenceTargets(record, result.data);
}
