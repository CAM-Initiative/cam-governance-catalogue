import type { UnknownRecord } from "@/lib/vigilRegistry";

export type ExternalClassificationOrRating = {
  scheme: string;
  value: string;
  verbatimLabel?: string;
};

export type ExternalAssessment = {
  id: string;
  assessor: string;
  title: string;
  date: string;
  url: string;
  type: string;
  relationship: "same-occurrence" | "partial-occurrence" | "broader-cluster" | "related-occurrence";
  summary: string;
  reviewedOn: string;
  scopeNote?: string;
  comparisonNote?: string;
  publicationOrInstitution?: string;
  version?: string;
  status?: string;
  supersedesAssessmentId?: string;
  sourceRecordRefs: string[];
  classificationOrRating?: ExternalClassificationOrRating;
};

export type ExternalIncidentReference = {
  registry: string;
  externalId?: string;
  relationship?: string;
  reviewedOn?: string;
  url?: string;
};

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.flatMap((item) => text(item) ?? []) : [];
}

const relationships = new Set<ExternalAssessment["relationship"]>([
  "same-occurrence",
  "partial-occurrence",
  "broader-cluster",
  "related-occurrence",
]);

export function externalAssessmentsFrom(raw: UnknownRecord): ExternalAssessment[] {
  if (!Array.isArray(raw.external_assessments)) return [];
  return raw.external_assessments.flatMap((value) => {
    if (!isObject(value)) return [];
    const id = text(value.assessment_id);
    const assessor = text(value.assessor);
    const title = text(value.assessment_title);
    const date = text(value.assessment_date);
    const url = text(value.assessment_url);
    const type = text(value.assessment_type);
    const relationshipValue = text(value.relationship_to_incident);
    const summary = text(value.assessment_summary);
    const reviewedOn = text(value.reviewed_on);
    if (!id || !assessor || !title || !date || !url || !type || !summary || !reviewedOn || !relationships.has(relationshipValue as ExternalAssessment["relationship"])) return [];

    const rating = isObject(value.classification_or_rating) ? value.classification_or_rating : undefined;
    const scheme = text(rating?.scheme);
    const ratingValue = text(rating?.value);
    return [{
      id,
      assessor,
      title,
      date,
      url,
      type,
      relationship: relationshipValue as ExternalAssessment["relationship"],
      summary,
      reviewedOn,
      scopeNote: text(value.scope_note),
      comparisonNote: text(value.vigil_comparison_note),
      publicationOrInstitution: text(value.publication_or_institution),
      version: text(value.assessment_version),
      status: text(value.assessment_status),
      supersedesAssessmentId: text(value.supersedes_assessment_id),
      sourceRecordRefs: stringList(value.source_record_refs),
      classificationOrRating: scheme && ratingValue ? {
        scheme,
        value: ratingValue,
        verbatimLabel: text(rating?.verbatim_label),
      } : undefined,
    }];
  });
}

export function externalIncidentReferencesFrom(raw: UnknownRecord): ExternalIncidentReference[] {
  if (!Array.isArray(raw.external_incident_references)) return [];
  return raw.external_incident_references.flatMap((value) => {
    if (!isObject(value)) return [];
    const registry = text(value.registry);
    if (!registry) return [];
    return [{
      registry,
      externalId: text(value.external_id),
      relationship: text(value.relationship),
      reviewedOn: text(value.reviewed_on),
      url: text(value.url),
    }];
  });
}

export function externalAssessmentRelationshipLabel(value: ExternalAssessment["relationship"]) {
  return ({
    "same-occurrence": "Same occurrence",
    "partial-occurrence": "Partial occurrence",
    "broader-cluster": "Broader cluster",
    "related-occurrence": "Related occurrence",
  } as const)[value];
}

export function externalAssessmentTypeLabel(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

export function externalAssessmentDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
