import type { UnknownRecord } from "@/lib/vigilRegistry";

export type IncidentPublicDisplay = {
  finding?: string;
  dates: {
    firstObserved?: string;
    published?: string;
    lastUpdated?: string;
  };
  searchTokens: string[];
};

export type PublicEvidenceCard = {
  title: string;
  publisher?: string;
  date?: string;
  sourceType?: string;
  sourceResidence?: string;
  sourceRole?: string;
  sourceUrl?: string;
  archiveUrl?: string;
  directReviewStatus?: string;
  evidenceModalities: string[];
  whatHappened?: string;
  confirmedEvidence?: string;
  interpretiveConclusion?: string;
  evidenceBoundary: string[];
  evidenceStatus?: string;
  evidenceStatusBasis?: string;
  reviewer?: string;
  reviewDate?: string;
  sourceAccess?: string;
};

export type IncidentPublicDetail = {
  evidence: PublicEvidenceCard[];
};

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAt(record: UnknownRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
    return isObject(current) ? current[part] : undefined;
  }, record);
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function firstText(record: UnknownRecord, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = text(valueAt(record, path));
    if (value) return value;
  }
  return undefined;
}

function textList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const seen = new Set<string>();
  return values.flatMap((item) => {
    const value = text(item);
    return value ? [value] : [];
  }).filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectText(value: unknown, depth = 0): string[] {
  if (depth > 5 || value === undefined || value === null) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap((item) => collectText(item, depth + 1));
  if (isObject(value)) return Object.values(value).flatMap((item) => collectText(item, depth + 1));
  return [];
}

export function deriveIncidentPublicDisplay(record: UnknownRecord): IncidentPublicDisplay {
  return {
    finding: firstText(record, [
      "public_finding",
      "vigil_assessment.governance_interpretation",
      "vigil_assessment.factual_basis",
      "summary",
    ]),
    dates: {
      firstObserved: firstText(record, ["occurred_from", "date_recorded", "source_records.0.source_date"]),
      published: firstText(record, ["record_identity.created", "date_recorded"]),
      lastUpdated: firstText(record, ["record_identity.updated", "record_last_updated", "date_recorded"]),
    },
    searchTokens: collectText({
      title: record.title,
      summary: record.summary,
      system: record.system_context,
      jurisdiction: record.jurisdictional_context,
      taxonomy: record.taxonomy_classification_summary ?? record.taxonomy_classification,
      severity: record.severity_assessment,
      sources: record.source_records,
    }),
  };
}

export function deriveIncidentPublicDetail(record: UnknownRecord): IncidentPublicDetail {
  const sources = Array.isArray(record.source_records) ? record.source_records.filter(isObject) : [];
  const recordReviewDate = firstText(record, [
    "interpretive_provenance.current_ai_review.review_date",
    "interpretive_provenance.review_history.0.review_date",
  ]);
  const recordReviewer = firstText(record, [
    "interpretive_provenance.current_ai_review.reviewer_model",
    "interpretive_provenance.current_ai_review.reviewer_platform",
  ]);
  const incidentSummary = firstText(record, ["summary"]);
  const incidentFactualBasis = firstText(record, ["vigil_assessment.factual_basis"]);

  return {
    evidence: sources.map((source, index) => ({
      title: firstText(source, ["source_title", "title", "name"]) ?? `Evidence source ${index + 1}`,
      publisher: firstText(source, ["author_or_publisher", "publisher", "source_platform", "author"]),
      date: firstText(source, ["source_date", "published_date", "date", "retrieved_date"]),
      sourceType: firstText(source, ["source_type", "type"]),
      sourceResidence: firstText(source, ["source_residence"]),
      sourceRole: firstText(source, ["source_role", "evidence_role"]),
      sourceUrl: firstText(source, ["source_url", "url"]),
      archiveUrl: firstText(source, ["archive_url"]),
      directReviewStatus: firstText(source, ["primary_artefact_access.direct_primary_artefact_review", "direct_review_status", "direct_review"]),
      evidenceModalities: textList(source.evidence_modality ?? source.source_modality ?? source.modalities),
      whatHappened: index === 0 ? incidentSummary : undefined,
      confirmedEvidence: firstText(source, ["confirmed_evidence", "source_context", "description", "finding"])
        ?? (index === 0 ? incidentFactualBasis : undefined),
      interpretiveConclusion: firstText(source, ["interpretive_reliance", "interpretive_conclusion", "relevance_note", "interpretation"]),
      evidenceBoundary: textList(source.source_limitations ?? source.limitations ?? valueAt(source, "primary_artefact_access.limitations") ?? source.known_limitations),
      evidenceStatus: firstText(source, ["evidence_status"]),
      evidenceStatusBasis: firstText(source, ["evidence_status_basis"]),
      reviewer: firstText(source, ["primary_artefact_access.reviewing_system", "reviewer", "reviewer_model", "reviewing_system"]) ?? recordReviewer,
      reviewDate: firstText(source, ["primary_artefact_access.review_date", "review_date", "retrieved_date"]) ?? recordReviewDate,
      sourceAccess: firstText(source, ["primary_artefact_access.access_method", "source_access_method", "access_method"]),
    })),
  };
}

export function matchesVigilSearch(searchText: string, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((term) => searchText.includes(term));
}
