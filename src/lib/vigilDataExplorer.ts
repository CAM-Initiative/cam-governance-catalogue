import type { UnknownRecord } from "@/lib/vigilRegistry";
import type { VigilIndexRecord } from "@/lib/vigilPresentation";

export type ExplorerMappingRole =
  | "failure-occurrence"
  | "successful-invariant"
  | "ambiguous-boundary"
  | "unresolved";

export type ExplorerMapping = {
  classId: string;
  familyId?: string;
  role: ExplorerMappingRole;
  mappingPosition?: string;
};

export type ExplorerIncident = {
  record: VigilIndexRecord;
  id: string;
  title: string;
  summary: string;
  vendor: string;
  severity?: string;
  occurredFrom?: string;
  mappings: ExplorerMapping[];
  hasEnvironment: boolean;
  hasAgentContext: boolean;
  externalAssessmentCount: number;
};

export type ExplorerClassSummary = {
  classId: string;
  familyId?: string;
  failure: number;
  held: number;
  boundary: number;
  unresolved: number;
  incidentIds: string[];
  totalIncidents: number;
};

export type ExplorerCoverage = {
  total: number;
  chronology: number;
  severity: number;
  taxonomy: number;
  environment: number;
  agentContext: number;
  externalAssessments: number;
};

export type HarmDimensionObservation = {
  dimensionId: string;
  assessmentStatus: string;
  severity?: string;
};

export const HARM_DIMENSIONS = [
  ["physical-health-safety", "Physical health & safety"],
  ["psychological-wellbeing", "Psychological wellbeing"],
  ["rights-liberty", "Rights & liberty"],
  ["equal-treatment", "Equal treatment"],
  ["privacy-confidentiality", "Privacy & confidentiality"],
  ["financial-economic", "Financial & economic"],
  ["property-asset-damage", "Property & asset damage"],
  ["service-operational-infrastructure", "Service, operations & infrastructure"],
  ["reputation-dignity", "Reputation & dignity"],
  ["societal-democratic", "Societal & democratic"],
  ["environmental", "Environmental"],
] as const;

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function roleFrom(value: unknown): ExplorerMappingRole {
  if (value === "failure-occurrence") return "failure-occurrence";
  if (value === "successful-invariant") return "successful-invariant";
  if (value === "ambiguous-boundary") return "ambiguous-boundary";
  return "unresolved";
}

function mappingFrom(value: unknown, position?: string): ExplorerMapping | undefined {
  if (!isObject(value)) return undefined;
  const classId = asText(value.class_id);
  if (!classId) return undefined;
  return {
    classId,
    familyId: asText(value.family_id),
    role: roleFrom(value.classification_role),
    mappingPosition: asText(value.mapping_position) ?? position,
  };
}

export function mappingsFromIndexRecord(record: VigilIndexRecord): ExplorerMapping[] {
  const raw = record.raw;
  const mappings: ExplorerMapping[] = [];
  const primary = mappingFrom(raw.primary_classification, "primary");
  if (primary) mappings.push(primary);

  if (Array.isArray(raw.secondary_classifications)) {
    for (const value of raw.secondary_classifications) {
      const mapping = mappingFrom(value, "secondary");
      if (mapping) mappings.push(mapping);
    }
  }

  if (!mappings.length && Array.isArray(raw.repair_classifications)) {
    for (const value of raw.repair_classifications) {
      const mapping = mappingFrom(value);
      if (mapping) mappings.push(mapping);
    }
  }

  if (!mappings.length) {
    const primaryClassId = asText(raw.primary_class_id);
    const primaryFamilyId = asText(raw.primary_family_id);
    if (primaryClassId) {
      mappings.push({
        classId: primaryClassId,
        familyId: primaryFamilyId,
        role: "unresolved",
        mappingPosition: "primary",
      });
    }
    if (Array.isArray(raw.secondary_class_ids)) {
      for (const value of raw.secondary_class_ids) {
        const classId = asText(value);
        if (classId) mappings.push({ classId, role: "unresolved", mappingPosition: "secondary" });
      }
    }
  }

  const seen = new Set<string>();
  return mappings.filter((mapping) => {
    const key = `${mapping.classId}|${mapping.role}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function explorerIncident(record: VigilIndexRecord): ExplorerIncident {
  const raw = record.raw;
  const externalAssessments = Array.isArray(raw.external_assessments) ? raw.external_assessments.length : 0;
  return {
    record,
    id: record.id,
    title: record.title,
    summary: record.summary,
    vendor: record.platform_label,
    severity: record.severity,
    occurredFrom: asText(raw.occurred_from),
    mappings: mappingsFromIndexRecord(record),
    hasEnvironment: isObject(raw.occurrence_environment) && Object.keys(raw.occurrence_environment).length > 0,
    hasAgentContext: isObject(raw.agent_context) && Object.keys(raw.agent_context).length > 0,
    externalAssessmentCount: externalAssessments,
  };
}

export function explorerCoverage(incidents: ExplorerIncident[]): ExplorerCoverage {
  return {
    total: incidents.length,
    chronology: incidents.filter((incident) => Boolean(incident.occurredFrom)).length,
    severity: incidents.filter((incident) => Boolean(incident.severity)).length,
    taxonomy: incidents.filter((incident) => incident.mappings.length > 0).length,
    environment: incidents.filter((incident) => incident.hasEnvironment).length,
    agentContext: incidents.filter((incident) => incident.hasAgentContext).length,
    externalAssessments: incidents.filter((incident) => incident.externalAssessmentCount > 0).length,
  };
}

export function summarizeClasses(incidents: ExplorerIncident[]): ExplorerClassSummary[] {
  const byClass = new Map<string, {
    familyId?: string;
    failure: Set<string>;
    held: Set<string>;
    boundary: Set<string>;
    unresolved: Set<string>;
    all: Set<string>;
  }>();

  for (const incident of incidents) {
    for (const mapping of incident.mappings) {
      const current = byClass.get(mapping.classId) ?? {
        familyId: mapping.familyId,
        failure: new Set<string>(),
        held: new Set<string>(),
        boundary: new Set<string>(),
        unresolved: new Set<string>(),
        all: new Set<string>(),
      };
      current.familyId ||= mapping.familyId;
      current.all.add(incident.id);
      if (mapping.role === "failure-occurrence") current.failure.add(incident.id);
      else if (mapping.role === "successful-invariant") current.held.add(incident.id);
      else if (mapping.role === "ambiguous-boundary") current.boundary.add(incident.id);
      else current.unresolved.add(incident.id);
      byClass.set(mapping.classId, current);
    }
  }

  return [...byClass.entries()].map(([classId, value]) => ({
    classId,
    familyId: value.familyId,
    failure: value.failure.size,
    held: value.held.size,
    boundary: value.boundary.size,
    unresolved: value.unresolved.size,
    incidentIds: [...value.all],
    totalIncidents: value.all.size,
  }));
}

export function incidentMatchesClass(
  incident: ExplorerIncident,
  classId: string,
  role: "all" | ExplorerMappingRole = "all",
) {
  return incident.mappings.some((mapping) => mapping.classId === classId && (role === "all" || mapping.role === role));
}

export function severityDistribution(incidents: ExplorerIncident[]) {
  const counts = new Map<string, number>();
  for (const incident of incidents) {
    const key = incident.severity ?? "SU";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return ["S1", "S2", "S3", "S4", "S5", "SU"].map((severity) => ({
    severity,
    count: counts.get(severity) ?? 0,
  }));
}

export function harmDimensionsFromRecord(record: UnknownRecord): HarmDimensionObservation[] {
  if (!isObject(record.harm_impact_assessment)) return [];
  const dimensions = record.harm_impact_assessment.dimensions;
  if (!Array.isArray(dimensions)) return [];

  return dimensions.flatMap((value) => {
    if (!isObject(value)) return [];
    const dimensionId = asText(value.dimension_id);
    const assessmentStatus = asText(value.assessment_status);
    if (!dimensionId || !assessmentStatus) return [];
    return [{
      dimensionId,
      assessmentStatus,
      severity: asText(value.severity),
    }];
  });
}

export function mappingRoleLabel(role: ExplorerMappingRole | "all") {
  if (role === "failure-occurrence") return "Failure occurrence";
  if (role === "successful-invariant") return "Invariant held";
  if (role === "ambiguous-boundary") return "Boundary unresolved";
  if (role === "unresolved") return "Unresolved mapping";
  return "All mapped evidence";
}
